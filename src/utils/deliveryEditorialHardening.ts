import * as cheerio from 'cheerio';

export interface DeliveryEditorialHardeningContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

export interface DeliveryEditorialIssue {
  code: string;
  severity: 'warning' | 'critical';
  message: string;
  sample?: string;
}

export interface DeliveryEditorialAuditResult {
  passed: boolean;
  issues: DeliveryEditorialIssue[];
}

function normalizeText(value: string): string {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function escapeHtml(value = ''): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(value: string): string {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();
}

function serviceLabel(context: DeliveryEditorialHardeningContext): string {
  const raw = normalizeText(context.niche || 'servicio profesional');
  return raw || 'servicio profesional';
}

function cityLabel(context: DeliveryEditorialHardeningContext): string {
  return normalizeText(context.city || 'tu zona') || 'tu zona';
}

function hasVerifiedReviewEvidence($scope: any): boolean {
  const text = normalizeText($scope.text()).toLowerCase();
  return (
    /review|ratingvalue|aggregaterating|author|datepublished/.test(String($scope.html() || '').toLowerCase()) ||
    /reseña\s+verificada|opinión\s+verificada|valoración\s+real|fuente\s+verificada/.test(text)
  );
}

function repairSentence(value: string, context: DeliveryEditorialHardeningContext): string {
  const city = cityLabel(context);
  const service = serviceLabel(context).toLowerCase();
  let out = normalizeText(value);
  if (!out) return out;

  out = out
    .replace(/^[:;,\.\s]+este\s+bloque\s+resume\s*/i, 'Este apartado resume ')
    .replace(/^[:;,\.\s]+/g, '')
    .replace(/\beste\s+bloque\s+resume\b/gi, 'este apartado resume')
    .replace(/\bbloque\s+generado\b/gi, 'apartado')
    .replace(/\bcontenido\s+generado\b/gi, 'contenido')
    .replace(/\bfallback\s+(?:determinista|seguro|can[oó]nico)\b/gi, 'criterio de seguridad')
    .replace(/\bwireframe\b/gi, 'diseño')
    .replace(/\bplaceholder\b/gi, 'referencia')
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\ben\s+conviene\b/gi, `en ${city} conviene`)
    .replace(/\ben\s+compensa\b/gi, `en ${city} compensa`)
    .replace(/\ben\s+depende\b/gi, `en ${city} depende`)
    .replace(/\bde\s+en\s+([A-ZÁÉÍÓÚÑ])/g, 'de $1')
    .replace(/\bservicio\s+de\s+servicios\s+de\b/gi, 'servicios de')
    .replace(/\btrabajo\s+de\s+servicios\s+de\b/gi, 'trabajo de')
    .replace(/\bnuestros\s+clientes\s+dicen\b/gi, 'criterios que conviene revisar')
    .replace(/\blo\s+que\s+dicen\s+nuestros\s+clientes\b/gi, 'criterios de confianza antes de decidir')
    .replace(/\btestimonios?\s+de\s+clientes\b/gi, 'señales de confianza del servicio')
    .replace(/\breseñas?\s+de\s+clientes\b/gi, 'criterios de comprobación')
    .replace(/\bclientes\s+satisfechos\b/gi, 'criterios de satisfacción esperada')
    .replace(/\bgratis\b/gi, 'sin compromiso')
    .replace(/\bgratuito\b/gi, 'sin compromiso')
    .replace(/\bgratuita\b/gi, 'sin compromiso')
    .replace(/\bgarantizado\b/gi, 'planteado con criterio')
    .replace(/\bgarantizada\b/gi, 'planteada con criterio')
    .replace(/\b100\s*%\s+garantizad[oa]s?\b/gi, 'planteado con criterio')
    .replace(/\b(?:las\s+)?24\s*h(?:oras)?\b/gi, 'con prioridad según disponibilidad')
    .replace(/\brespuesta\s+inmediata\b/gi, 'respuesta prioritaria')
    .replace(/\bintervenci[oó]n\s+inmediata\b/gi, 'intervención prioritaria')
    .replace(/\ben\s*,/gi, `en ${city},`)
    .replace(/\ben\s*([.;:!?])/gi, `en ${city}$1`)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Repara patrones de ciudad ausente en textos comerciales cortos.
  if (/\b(cu[aá]nto\s+cuesta|precios?|presupuesto|cobertura|servicio)\b/i.test(out)) {
    out = out
      .replace(/\b(en|para|sobre)\s+\?/gi, `$1 ${city}?`)
      .replace(/\b(en|para|sobre)\s*$/gi, `$1 ${city}`)
      .replace(/\b(en|para|sobre)\s+[,.;:]/gi, `$1 ${city}`);
  }

  // Si una frase queda demasiado rota, sustituye por una alternativa segura.
  const comparable = out.toLowerCase();
  if (
    /\ben\s+(?:y|puede|conviene|compensa|depende)\b/.test(comparable) ||
    /\bde\s+[,.!?;:]/.test(comparable) ||
    /\b(?:undefined|null|\[object object\])\b/.test(comparable)
  ) {
    return `${titleCase(service)} en ${city} se valora con diagnóstico previo, explicación del alcance y una propuesta proporcional al caso.`;
  }

  return out;
}

function hardenVisibleText($: cheerio.CheerioAPI, context: DeliveryEditorialHardeningContext): void {
  $('body *').contents().each((_i: number, node: any) => {
    if (node.type !== 'text') return;
    const parent = node.parent?.tagName ? String(node.parent.tagName).toLowerCase() : '';
    if (['script', 'style', 'noscript', 'title'].includes(parent)) return;
    const current = String(node.data || '');
    const cleaned = repairSentence(current, context);
    if (normalizeText(current) !== cleaned) node.data = current.startsWith(' ') || current.endsWith(' ') ? ` ${cleaned} ` : cleaned;
  });

  $('[alt], [title], [aria-label], [placeholder], [content]').each((_i: number, el: any) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const current = String($el.attr(attr) || '');
      if (!current) continue;
      $el.attr(attr, repairSentence(current, context));
    }
  });
}

function removeEmptyStructuralNoise($: cheerio.CheerioAPI): void {
  $('ul, ol').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.children('li').length === 0 || normalizeText($el.text()).length === 0) $el.remove();
  });

  $('li').each((_i: number, el: any) => {
    const $el = $(el);
    if (!normalizeText($el.text()) && !$el.find('img, svg, iframe').length) $el.remove();
  });

  $('.block__pill, .service-card__kicker, .conversion-proof-item__text, .block__cta-note').each((_i: number, el: any) => {
    const $el = $(el);
    if (!normalizeText($el.text())) $el.remove();
  });
}

function neutralizeUnverifiedSocialProof($: cheerio.CheerioAPI, context: DeliveryEditorialHardeningContext): void {
  const city = cityLabel(context);
  const service = serviceLabel(context).toLowerCase();

  $('section, article, div').each((_i: number, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.find('h2, h3').first().text() || $el.text()).toLowerCase();
    if (!/(testimonios?|reseñas?|clientes\s+dicen|lo\s+que\s+dicen\s+nuestros\s+clientes|opiniones)/i.test(text)) return;
    if (hasVerifiedReviewEvidence($el)) return;

    const heading = $el.find('h2, h3').first();
    if (heading.length) heading.text('Criterios de confianza antes de decidir');

    $el.find('.testimonial-card__stars, .stars, [class*="star"], [aria-label*="estrellas" i]').remove();
    $el.find('blockquote').each((_j: number, quote: any) => {
      $(quote).replaceWith(`<p>Antes de contratar ${escapeHtml(service)} en ${escapeHtml(city)}, conviene revisar alcance, materiales previstos, forma de verificación y condiciones explicadas por escrito.</p>`);
    });

    $el.find('p').each((_j: number, p: any) => {
      const $p = $(p);
      const pText = normalizeText($p.text());
      if (/cliente|reseña|opini[oó]n|valoraci[oó]n|estrellas/i.test(pText)) {
        $p.text(`En ${city}, la confianza debe basarse en un diagnóstico claro, explicación del alcance y una intervención proporcional al problema real.`);
      }
    });
  });
}

function normalizeDuplicatedCtas($: cheerio.CheerioAPI): void {
  const seen = new Map<string, number>();
  $('a, button').each((_i: number, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (!text) return;
    const key = text.toLowerCase();
    const count = seen.get(key) || 0;
    seen.set(key, count + 1);
    if (count >= 2 && /presupuesto\s+sin\s+compromiso|contactar\s+ahora|solicitar\s+contacto/i.test(text)) {
      $el.text(count % 2 === 0 ? 'Hablar con un profesional' : 'Valorar mi caso');
    }
  });
}

function ensureDeliveryEditorialCss($: cheerio.CheerioAPI): void {
  const css = `
    body.gravity-editorial-hardened .testimonial-card__stars:empty,
    body.gravity-editorial-hardened ul:empty,
    body.gravity-editorial-hardened ol:empty { display: none !important; }
    body.gravity-editorial-hardened .block__cta-note,
    body.gravity-editorial-hardened .service-card__meta li,
    body.gravity-editorial-hardened .price-card__facts li {
      overflow-wrap: anywhere;
    }
  `.trim();

  if ($('#gravity-delivery-editorial-hardening').length) {
    $('#gravity-delivery-editorial-hardening').text(css);
  } else {
    $('head').append(`<style id="gravity-delivery-editorial-hardening">${css}</style>`);
  }
  $('body').addClass('gravity-editorial-hardened');
}

export function auditDeliveryEditorialHtml(html: string): DeliveryEditorialAuditResult {
  const source = String(html || '');
  const issues: DeliveryEditorialIssue[] = [];
  const lower = source.toLowerCase();
  const textOnly = normalizeText(source.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));

  const checks: Array<[RegExp, string, string]> = [
    [/[:;,\.\s]+este\s+bloque\s+resume/i, 'TEMPLATE_RESIDUE_BLOCK_INTRO', 'Residuo visible de plantilla: “este bloque resume”.'],
    [/\ben\s+y\b/i, 'BROKEN_LOCAL_FRAGMENT_EN_Y', 'Fragmento local incompleto: “en y”.'],
    [/\ben\s+puede\s+variar\b/i, 'BROKEN_LOCAL_FRAGMENT_EN_PUEDE', 'Fragmento local incompleto: “en puede variar”.'],
    [/\bundefined\b|\bnull\b|\[object object\]/i, 'RAW_PROGRAMMING_TOKEN', 'Token técnico visible en la página.'],
    [/<ul[^>]*>\s*<\/ul>|<ol[^>]*>\s*<\/ol>/i, 'EMPTY_LIST', 'Lista vacía en HTML final.'],
    [/lo\s+que\s+dicen\s+nuestros\s+clientes/i, 'UNVERIFIED_SOCIAL_PROOF_COPY', 'Lenguaje de clientes/reseñas sin evidencia explícita.']
  ];

  for (const [pattern, code, message] of checks) {
    const match = source.match(pattern) || textOnly.match(pattern);
    if (match) issues.push({ code, severity: 'critical', message, sample: match[0] });
  }

  if (/\b(?:gratis|gratuito|gratuita)\b/i.test(textOnly)) {
    issues.push({ code: 'RISKY_FREE_CLAIM', severity: 'warning', message: 'Claim de gratuidad detectado; conviene probarlo o sustituirlo por “sin compromiso”.' });
  }

  if (/\b24\s*h(?:oras)?\b/i.test(textOnly) && !/disponibilidad|seg[uú]n\s+agenda|prioridad/i.test(textOnly)) {
    issues.push({ code: 'RISKY_24H_CLAIM', severity: 'warning', message: 'Claim 24h detectado sin matiz de disponibilidad.' });
  }

  return { passed: !issues.some((issue) => issue.severity === 'critical'), issues };
}

export function hardenDeliveryEditorialHtml(html: string, context: DeliveryEditorialHardeningContext = {}): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });

  hardenVisibleText($, context);
  neutralizeUnverifiedSocialProof($, context);
  normalizeDuplicatedCtas($);
  removeEmptyStructuralNoise($);
  ensureDeliveryEditorialCss($);

  // Segunda pasada para limpiar texto generado por reparaciones internas.
  hardenVisibleText($, context);
  removeEmptyStructuralNoise($);

  return $.html()
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}
