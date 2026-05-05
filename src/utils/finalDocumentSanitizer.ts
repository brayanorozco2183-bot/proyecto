import * as cheerio from 'cheerio';
import { resolveBlockPlaybookPayload } from '../niches/blockContent.js';
import { sanitizeBrandName, buildCanonicalBrandName, repairBrokenLocalFragments as repairBrandLocalFragments } from './brandGuard.js';
import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';
import { normalizeFaqQuestionText, normalizeFaqAnswerText } from './faqSanitizer.js';
import { sanitizeLegalRiskClaims } from './legalClaimSanitizer.js';
import { applyPremiumContentDepth } from './premiumContentDepth.js';
import { applyFinalTransmissionGuard } from './finalTransmissionGuard.js';

function escapeHtml(value = ''): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface FinalDocumentSanitizerContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

interface PlaybookServiceItem {
  title?: string;
  body?: string;
  meta?: string[];
}

interface PlaybookBlockPayload {
  services?: PlaybookServiceItem[];
  trustBullets?: string[];
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlaybookBlockPayload(value: unknown): value is PlaybookBlockPayload {
  return typeof value === 'object' && value !== null;
}

function normalizeText(value: string): string {
  return String(value || '')
    .replace(/[…]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function normalizeComparable(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}


function ensureSpanishPunctuation(value: string): string {
  let out = normalizeText(value);
  if (!out) return out;
  const questionStarters = /^(?:que|qué|como|cómo|cuando|cuándo|donde|dónde|cuanto|cuánto|por qué|por que|puedo|conviene|es mejor|hace falta|necesito|cuál|cual)\b/i;
  if (questionStarters.test(out) && !out.startsWith('¿')) {
    out = `¿${out.replace(/^[¿?\s]+|[?\s]+$/g, '')}?`;
  }
  return normalizeText(out)
    .replace(/^Que\b/, 'Qué')
    .replace(/^Como\b/, 'Cómo')
    .replace(/^Cuando\b/, 'Cuándo')
    .replace(/^Donde\b/, 'Dónde')
    .replace(/^Cuanto\b/, 'Cuánto')
    .replace(/^Por que\b/i, 'Por qué');
}

function ensureHeadBaseline($: any): void {
  const html = $('html').first();
  if (html.length) html.attr('lang', 'es-ES');
  if ($('meta[charset]').length === 0) $('head').prepend('<meta charset="utf-8">');
  if ($('meta[name="format-detection"]').length === 0) $('head').append('<meta name="format-detection" content="telephone=yes">');
  if ($('meta[property="og:locale"]').length === 0) $('head').append('<meta property="og:locale" content="es_ES">');
  else $('meta[property="og:locale"]').attr('content', 'es_ES');
  if ($('meta[name="robots"]').length === 0) $('head').append('<meta name="robots" content="index,follow,max-image-preview:large">');
}

function ensureContactAnchor($: cheerio.CheerioAPI): void {
  if ($('#contacto').length) return;
  const footer = $('footer').first();
  if (footer.length) footer.attr('id', 'contacto');
}

function addExternalLinkSafety($: cheerio.CheerioAPI): void {
  $('a[href]').each((_i: number, el: any) => {
    const $el = $(el);
    const href = String($el.attr('href') || '').trim();
    if (!/^https?:\/\//i.test(href)) return;
    const rel = new Set(String($el.attr('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    $el.attr('rel', Array.from(rel).join(' '));
  });
}

function normalizePremiumSpanishHeadings($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const city = normalizeText(context.city || 'tu zona');
  const service = canonicalServiceLabel(context.niche).toLowerCase();
  const replacements: Array<[RegExp, string]> = [
    [/^contratar\s+ahora$/i, `Solicita orientación profesional en ${city}`],
    [/^panel\s+de\s+urgencia$/i, `Respuesta prioritaria con diagnóstico claro en ${city}`],
    [/^gu[ií]a\s+de\s+precios$/i, `Qué condiciona el presupuesto de ${service} en ${city}`],
    [/^bandera\s+de\s+confianza$/i, 'Señales reales de un servicio bien planteado'],
    [/^p[aá]gina\s+principal\s+y\s+navegaci[oó]n\s+relacionada$/i, `Más información sobre ${service} en ${city}`]
  ];
  $('h1, h2, h3, summary').each((_i: number, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (!text) return;
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(text)) {
        $el.text(replacement);
        return;
      }
    }
    if ($el.is('summary') || $el.closest('[data-block-type="faq"], #faq').length) {
      const punctuated = ensureSpanishPunctuation(text);
      if (punctuated !== text) $el.text(punctuated);
    }
  });
}

function removeLowValueTemplateResidue($: cheerio.CheerioAPI): void {
  const residuePatterns = [
    /fallback\s+can[oó]nico\s+seguro/i,
    /tel[eé]fono\s+pendiente\s+de\s+validaci[oó]n/i,
    /no\s+se\s+inventan\s+reseñas/i,
    /bloque\s+generado/i,
    /respaldo\s+controlado/i,
    /versi[oó]n\s+segura/i,
    /contenido\s+pendiente\s+de\s+completar/i,
    /fallback\s+determinista/i,
    /emergency\s+fallback/i
  ];
  $('p, li, span, small').each((_i: number, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (text && residuePatterns.some((rx) => rx.test(text))) $el.remove();
  });
}

function dedupeRepeatedBlocks($: cheerio.CheerioAPI): void {
  const seen = new Set<string>();
  $('section, article').each((_i: number, el: any) => {
    const $el = $(el);
    const id = normalizeText($el.attr('id') || '');
    const heading = normalizeComparable($el.find('h2, h3').first().text());
    const body = normalizeComparable($el.text()).slice(0, 220);
    const key = `${id || heading}::${body}`;
    if (!(id || heading) || body.length < 80) return;
    if (seen.has(key)) $el.remove();
    else seen.add(key);
  });
}

function ensureInternalLinksBeforeFooter($: cheerio.CheerioAPI): void {
  const footer = $('footer').first();
  if (!footer.length) return;
  $('.internal-links-hub, #internal-links-contextual').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.nextAll('footer').length === 0) $el.insertBefore(footer);
  });
}

function ensureCoreStructuredData($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const canonical = normalizeText($('link[rel="canonical"]').attr('href') || './');
  const businessName = buildBusinessName(context);
  const title = sanitizeTitle($('title').first().text() || $('h1').first().text(), context.city, context.niche);
  const description = sanitizeDescription($('meta[name="description"]').attr('content') || '', context.niche, context.city);
  let script = $('script[type="application/ld+json"]').first();
  let root: JsonObject = { '@context': 'https://schema.org', '@graph': [] as unknown as JsonValue };
  if (script.length) {
    try {
      const parsed = JSON.parse(script.text() || '{}') as JsonValue;
      if (isJsonObject(parsed)) root = parsed;
    } catch {
      script.remove();
      script = $();
    }
  }
  const graphRaw = Array.isArray(root['@graph']) ? root['@graph'] : [];
  const graph = graphRaw.filter(isJsonObject);
  const hasType = (wanted: string): boolean => graph.some((node) => {
    const rawType = node['@type'];
    return Array.isArray(rawType) ? rawType.map(String).includes(wanted) : String(rawType || '') === wanted;
  });
  if (!hasType('WebSite')) graph.push({ '@type': 'WebSite', '@id': '#website', name: businessName, url: canonical.startsWith('http') ? new URL(canonical).origin : '/', inLanguage: 'es-ES' });
  if (!hasType('WebPage')) graph.push({ '@type': 'WebPage', '@id': '#webpage', name: title, description, url: canonical, inLanguage: 'es-ES', isPartOf: { '@id': '#website' } as unknown as JsonValue });
  if (!hasType('BreadcrumbList')) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: '/' },
        { '@type': 'ListItem', position: 2, name: title.replace(/\s+\|\s+.+$/, ''), item: canonical }
      ] as unknown as JsonValue
    });
  }
  root['@context'] = 'https://schema.org';
  root['@graph'] = graph as unknown as JsonValue;
  if (!script.length) $('head').append(`<script type="application/ld+json">${JSON.stringify(root)}</script>`);
  else script.text(JSON.stringify(root));
}

function titleCase(value: string): string {
  return normalizeText(value)
    .split(' ')
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ')
    .trim();
}

function buildServiceLabel(niche?: string): string {
  const base = normalizeText(niche || '').toLowerCase();
  if (!base) return 'el servicio';
  if (/(?:eros|istas|ores|ales)$/i.test(base)) return `servicios de ${base}`;
  if (/^servicio\b/i.test(base)) return base;
  return `servicio de ${base}`;
}

function buildBusinessName(context: FinalDocumentSanitizerContext): string {
  return sanitizeBrandName(context.businessName || buildCanonicalBrandName({ niche: context.niche, city: context.city, fallbackSuffix: 'Pro' }), { niche: context.niche, city: context.city, fallbackSuffix: 'Pro' });
}

function canonicalServiceLabel(niche?: string): string {
  return titleCase(String(getCanonicalNicheLabel(niche || 'Servicio profesional') || 'Servicio profesional').replace(/^de\s+/i, '').trim() || 'Servicio profesional');
}

function looksOverloadedCommercialTitle(value: string): boolean {
  const text = normalizeComparable(value);
  if (!text) return false;
  const intentHits = [
    /urgente|24h|24 horas|inmediat/.test(text),
    /apertura|abrir puerta/.test(text),
    /cambio|sustitucion/.test(text),
    /cerradura|bombin|cilindro/.test(text),
    /persiana|cierre metalico|comercio/.test(text)
  ].filter(Boolean).length;
  const separatorHits = (String(value || '').match(/[|\-–—]/g) || []).length;
  return intentHits >= 3 || (intentHits >= 2 && separatorHits >= 1);
}


function buildFallbackMapUrl(city?: string, address?: string): string {
  const query = encodeURIComponent(normalizeText(address || city || 'España'));
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function truncateSmart(value: string, max: number, fallbackMinBoundary = 90): string {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;

  const clipped = normalized.slice(0, max);
  const sentenceBoundary = Math.max(
    clipped.lastIndexOf('. '),
    clipped.lastIndexOf('? '),
    clipped.lastIndexOf('! '),
    clipped.lastIndexOf('; ')
  );
  if (sentenceBoundary >= fallbackMinBoundary) {
    return clipped.slice(0, sentenceBoundary + 1).trim();
  }

  const lastSpace = clipped.lastIndexOf(' ');
  return (lastSpace >= fallbackMinBoundary ? clipped.slice(0, lastSpace) : clipped).trim();
}

function looksBrokenSeoCopy(value: string): boolean {
  const text = normalizeComparable(value);
  if (!text) return true;
  return (
    text.includes('descamisados') ||
    text.includes('soluciones personalizadas') ||
    text.includes('protege tu propiedad') ||
    text.includes('profesionales cualificados') ||
    text.includes('resolver') && !/[.!?]$/.test(normalizeText(value)) ||
    text.includes('…')
  );
}

function sanitizeTitle(value: string, city?: string, niche?: string): string {
  let out = normalizeText(value);
  out = out.replace(/^Expertos en\s+/i, '');
  out = out.replace(/\bde confianza\b/gi, '');
  out = out.replace(/soluciones\s+personalizadas\s+para\s+tu\s+seguridad/gi, 'atención local y criterio técnico');
  out = out.replace(/descamisados/gi, 'averías y reparaciones');
  out = out.replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito');
  out = out.replace(/\s{2,}/g, ' ').trim();

  if (!out || looksOverloadedCommercialTitle(out)) {
    const service = canonicalServiceLabel(niche);
    out = `${service} en ${city || 'tu zona'} con diagnóstico claro y cobertura real`;
  }

  return truncateSmart(repairBrokenLocalFragments(out, { city }), 65, 30);
}

function buildMetaFallback(niche?: string, city?: string): string {
  const service = titleCase(niche || 'Servicio profesional');
  const place = normalizeText(city || 'tu zona');
  return `${service} en ${place} con diagnóstico claro, proceso explicado y contacto directo para valorar el caso sin improvisaciones.`;
}

function sanitizeDescription(value: string, niche?: string, city?: string): string {
  let out = normalizeText(value);
  out = out.replace(/^Expertos en\s+/i, 'Atendemos ');
  out = out.replace(/servicio especializado de/gi, 'Atendemos');
  out = out.replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito');
  out = out.replace(/\bde confianza\b/gi, '');
  out = out.replace(/descamisados/gi, 'averías');
  out = out.replace(/contamos\s+con\s+profesionales\s+cualificados[^.]*\.?/gi, '');
  out = out.replace(/nuestros?\s+[^.]*expertos?\s+te\s+ayudan[^.]*\.?/gi, '');
  out = removeCrossNicheSentences(out, niche);

  if (!out || out.length < 90 || looksBrokenSeoCopy(out)) {
    out = buildMetaFallback(niche, city);
  }

  return truncateSmart(repairBrokenLocalFragments(out, { city }), 165, 100);
}

function sanitizeAnswerText(value: string, niche?: string, city?: string): string {
  let out = removeCrossNicheSentences(normalizeText(value), niche);
  out = out
    .replace(/en\s+trabajos\s+de\s+[^.]+?\s+no\s+solemos\s+recomendar\s+respuestas\s+gen[eé]ricas\.?/gi, '')
    .replace(/depende\s+de\s+si\s+hablamos\s+de\s+una\s+actuaci[oó]n\s+puntual[^.]*\.?/gi, '')
    .replace(/la\s+respuesta\s+depende\s+del\s+punto\s+exacto\s+a\s+revisar[^.]*\.?/gi, '')
    .replace(/en\s+general,?\s+se\s+recomienda[^.]*\.?/gi, '')
    .replace(/siempre\s+se\s+prioriza\s+la\s+seguridad\s+real\s+sin\s+alarmismo\.?/gi, '')
    .trim();

  if (out.length < 100) {
    out = `${out} En ${city || 'la zona'}, conviene valorar el alcance real, el acceso a la incidencia y la solución proporcional antes de intervenir.`.trim();
  }

  return truncateSmart(repairBrokenLocalFragments(out, { city }), 320, 140);
}

function sanitizeStructuredDataNode(value: JsonValue, context: FinalDocumentSanitizerContext): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeStructuredDataNode(item, context));
  }

  if (isJsonObject(value)) {
    const output: JsonObject = {};

    for (const [key, raw] of Object.entries(value)) {
      if (typeof raw === 'string') {
        if (key === '@id' || key === 'url' || key === 'item') {
          output[key] = normalizeText(raw);
        } else if (key === 'description') {
          output[key] = sanitizeDescription(raw, context.niche, context.city);
        } else if (key === 'text' && value['@type'] === 'Answer') {
          output[key] = sanitizeAnswerText(raw, context.niche, context.city);
        } else if (key === 'text') {
          output[key] = cleanVisibleText(raw, context);
        } else if (key === 'name' && value['@type'] === 'WebPage') {
          output[key] = sanitizeTitle(raw, context.city, context.niche);
          const val = cleanVisibleText(raw, context);
          const cityNormalized = (context.city || '').trim().toLowerCase();
          // Si el valor es igual a la ciudad o es muy genérico, NO inventar calle
          if (val.trim().toLowerCase() === cityNormalized || /centro de/i.test(val)) {
            delete output[key]; // El informe pide QUITAR streetAddress si no es verificado
          } else {
            output[key] = val;
          }
        } else {
          output[key] = cleanVisibleText(raw, context);
        }
      } else {
        output[key] = sanitizeStructuredDataNode(raw, context);
      }
    }

    return output;
  }

  return value;
}

function isLocksmithLikeNiche(niche?: string): boolean {
  return /cerraj|cerradur|bomb[ií]n|cilindr|cerroj|ganzu|antibumping|llave|candado|cierrapuertas|control\s+de\s+acceso/.test(String(niche || '').toLowerCase());
}

function getCrossNichePatterns(niche?: string): RegExp[] {
  const normalized = normalizeComparable(niche || '');

  if (isLocksmithLikeNiche(niche)) {
    return [
      /\bfugas?\b/gi,
      /\bgrifos?\b/gi,
      /\blatiguillos?\b/gi,
      /\bcisternas?\b/gi,
      /\bdesatascos?\b/gi,
      /\bsif[oó]n(?:es)?\b/gi,
      /\btuber[ií]as?\b/gi,
      /\bbajantes?\b/gi,
      /\barquetas?\b/gi,
      /\bcaudal\b/gi,
      /\bfontaner[oa]s?\b/gi,
      /\bbarniz(?:ado|es)?\b/gi,
      /\blija(?:do|s)?\b/gi,
      /\bmuebles?\b/gi,
      /\bebanist(?:a|ería)?\b/gi,
      /\brestauración\s+decorativa\b/gi,
      /\bmaderas?\s+macizas?\b/gi,
      /\bvestidores?\b/gi,
      /\barmarios?\b/gi,
      /\bcocinas?\b/gi,
      /\bbaño\b/gi,
      /\bacabados?\s+de\s+madera\b/gi,
      /\bmuebles?\s+a\s+medida\b/gi,
      /\bcarpinteros?\b/gi,
      /\bcarpinter[ií]a\b/gi,
      /\bebanister[ií]a\b/gi
    ];
  }

  if (/fontaner/.test(normalized)) {
    return [
      /\bcerraduras?\b/gi,
      /\bbomb[ií]n(?:es)?\b/gi,
      /\bcilindros?\b/gi,
      /\bantibumping\b/gi,
      /\bganzu(?:a|á)s?\b/gi,
      /\bamaestramiento\b/gi,
      /\bcontrol\s+de\s+acceso\b/gi,
      /\bsistemas?\s+de\s+acceso\b/gi,
      /\bmirillas?\s+digitales?\b/gi,
      /\bescudos?\s+magn[eé]ticos?\b/gi,
      /\bextractores?\s+de\s+cilindros?\b/gi,
      /\bcierrapuertas\b/gi,
      /\bmuelles?\s+cierrapuertas\b/gi,
      /\bblindajes?\b/gi,
      /\bpuertas?\s+de\s+trastero\b/gi,
      /\bpuertas?\s+autom[aá]ticas\b/gi,
      /\bcancelas?\b/gi,
      /\bpomos?\b/gi,
      /\bmanillas?\b/gi,
      /\bmecanismos?\s+de\s+seguridad\b/gi,
      /\bauditor[ií]as?\s+de\s+seguridad\b/gi,
      /\bcierres?\s+met[aá]licos?\b/gi,
      /\bbomb[ií]n\b/gi,
      /\bcerrajer[ií]a\b/gi,
      /\bcerrajeros?\b/gi,
      /\bdescamisados\b/gi,
      /suavidad\s+de\s+giro/gi,
      /desalineaci[oó]n/gi
    ];
  }

  return [];
}

const LOCKSMITH_H3_PATTERNS = [
  /^aperturas?$/i,
  /^an[aá]lisis\s+de\s+seguridad$/i,
  /^emergencias?\s+de\s+seguridad$/i,
  /^sistemas?\s+de\s+acceso$/i,
  /^cierres?\s+de\s+seguridad$/i,
  /^control\s+de\s+acceso$/i,
];

function sanitizeLocksmithHeadings($: cheerio.CheerioAPI, niche?: string): void {
  if (isLocksmithLikeNiche(niche)) return;
  $('h3').each((_: any, el: any) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (LOCKSMITH_H3_PATTERNS.some((rx) => rx.test(text))) {
      $el.remove();
    }
  });
}

function splitSentences(value: string): string[] {
  return String(value || '')
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function removeCrossNicheSentences(value: string, niche?: string): string {
  const patterns = getCrossNichePatterns(niche);
  if (!patterns.length) return normalizeText(value);

  const detectors = patterns.map((rx) => new RegExp(rx.source, rx.flags.replace(/g/g, '')));
  const sentences = splitSentences(value);
  if (!sentences.length) return normalizeText(value);

  return normalizeText(sentences.filter((sentence) => !detectors.some((rx) => rx.test(sentence))).join(' '));
}

function getSanitizerReplacements(context: FinalDocumentSanitizerContext): Array<[RegExp, string]> {
  return [
    [/20\s*minutos/gi, 'tiempo récord'],
    [/15\s*minutos/gi, 'tiempo récord'],
    [/en\s+menos\s+de\s+20/gi, 'en tiempo récord'],
    [/en\s+menos\s+de\s+15/gi, 'en tiempo récord'],
    [/mejor\s+precio\s+de\s+la\s+ciudad/gi, 'presupuesto claro'],
    [/garant[ií]a\s+de\s+\d+\s*a[nñ]os/gi, 'garantía por escrito'],
    [/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito'],
    [/seguridad\s+certificada/gi, 'criterio técnico'],
    [/respuesta\s+inmediata/gi, 'respuesta prioritaria'],
    [/materiales\s+certificados/gi, 'materiales adecuados al trabajo'],
    [/Atenci[oó]n\s+para\s+[^<.,;:!?]+/gi, `Atención directa en ${context.city || 'tu zona'}`],
    [new RegExp(`En\\s+${normalizeText(context.city || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},\\s+el\\s+servicio\\s+de\\s+[^.,;:!?]+\\s+se\\s+explica\\s+con\\s+alcance\\s+claro,\\s+criterios?\\s+t[eé]cnicos\\s+y\\s+una\\s+expectativa\\s+realista\\s+de\\s+intervenci[oó]n\\.?`, 'gi'), ''],
    [new RegExp(`En\\s+${normalizeText(context.city || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},\\s+este\\s+trabajo\\s+de\\s+[^.,;:!?]+\\s+conviene\\s+resolverlo\\s+con\\s+una\\s+valoraci[oó]n\\s+previa\\s+y\\s+una\\s+propuesta\\s+ajustada\\s+al\\s+alcance\\s+real\\.?`, 'gi'), ''],
    [/descamisados/gi, 'averías']
  ];
}

function stableIndex(seed: string, size: number): number {
  const input = String(seed || 'default');
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return size > 0 ? hash % size : 0;
}

function pickVariant(seed: string, variants: string[]): string {
  if (!variants.length) return '';
  return variants[stableIndex(seed, variants.length)];
}


function ensureFontPreconnects($: cheerio.CheerioAPI): void {
  const fontSheets = $('link[href*="fonts.googleapis.com"]');
  const hasGoogleFonts = fontSheets.length > 0;
  if (!hasGoogleFonts) return;

  fontSheets.each((index: number, el: any) => {
    if (index > 0) $(el).remove();
  });

  if ($('link[rel="preconnect"][href="https://fonts.googleapis.com"]').length === 0) {
    $('head').prepend('<link rel="preconnect" href="https://fonts.googleapis.com">');
  }
  if ($('link[rel="preconnect"][href="https://fonts.gstatic.com"]').length === 0) {
    $('head').prepend('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  }
}

function ensurePerformanceGuards($: cheerio.CheerioAPI): void {
  if ($('#layout-hotfix-performance').length) return;

  $('head').append(`
    <style id="layout-hotfix-performance">
      :root {
        --shadow-soft: 0 4px 16px rgba(15,23,42,0.05);
        --shadow-lift: 0 10px 26px rgba(15,23,42,0.08);
        --shadow-dramatic: 0 16px 38px rgba(15,23,42,0.12);
        --hero-text: var(--text-on-bg, #ffffff);
      }
      .site-header,
      .site-header__inner,
      .hero__minimal,
      .semantic-section__container,
      .block-section > .el-container,
      .el-section.vibe-premium > .el-container,
      .map-block__overlay-badge,
      .map-block__overlay-city,
      .hero__eyebrow,
      .hero__eyebrow--luxury {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .hero-immersive__media {
        min-height: clamp(420px, 60vh, 680px) !important;
        box-shadow: 0 18px 40px rgba(15,23,42,0.16) !important;
      }
      .hero-immersive__media img,
      .hero-visual__frame img,
      .editorial-visual-card__frame img {
        transform: none !important;
      }
      .hero-immersive__title { text-shadow: none !important; }
      .hero-highlight,
      .hero-card--floating,
      .map-block__frame,
      .map-wrapper,
      .map-boxed-wrapper,
      .map-directory__visual,
      .shell-panel,
      .service-card,
      .proof-card,
      .step-card,
      .faq-item,
      .faq-entry,
      .trust-strip,
      .urgency-layout__copy,
      .cta-panel__bar,
      .urgency-banner,
      .section-cta--terminal,
      .semantic-card {
        box-shadow: var(--shadow-soft) !important;
      }
      main > section:not(:first-of-type),
      main > .el-section-wrapper:not(:first-of-type),
      main > .semantic-section:not(:first-of-type),
      main > .block-section:not(:first-of-type) {
        content-visibility: auto;
        contain-intrinsic-size: 1px 900px;
      }
      img[loading="lazy"],
      iframe[loading="lazy"] {
        content-visibility: auto;
      }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto !important; }
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    </style>
  `);
}

function assignPredictableMediaDimensions($: cheerio.CheerioAPI): void {
  $('img').each((_ignored: any, el: any) => {
    const $el = $(el);
    if (!$el.attr('width')) $el.attr('width', '1600');
    if (!$el.attr('height')) $el.attr('height', '1100');
    if (!$el.attr('sizes')) {
      const isHero = $el.closest('.hero-immersive__media, .hero-visual__frame').length > 0;
      $el.attr('sizes', isHero ? '100vw' : '(max-width: 768px) 100vw, 720px');
    }
  });
}

function optimizeMediaLoading($: cheerio.CheerioAPI): void {
  let heroImageAssigned = false;

  $('img').each((_ignored: any, el: any) => {
    const $el = $(el);
    const isHero = $el.closest('.hero-immersive__media, .hero-visual__frame').length > 0 && !heroImageAssigned;

    if (isHero) {
      heroImageAssigned = true;
      $el.attr('loading', 'eager');
      $el.attr('fetchpriority', 'high');
      $el.attr('decoding', 'async');
    } else {
      $el.attr('loading', 'lazy');
      $el.attr('fetchpriority', 'low');
      $el.attr('decoding', 'async');
    }
  });

  $('iframe').each((_ignored: any, el: any) => {
    const $el = $(el);
    $el.attr('loading', 'lazy');
    if (!$el.attr('fetchpriority')) $el.attr('fetchpriority', 'low');
  });
}

function ensureResponsiveGuards($: cheerio.CheerioAPI): void {
  if ($('#layout-hotfix-max-gravity').length) return;

  $('head').append(`
    <style id="layout-hotfix-max-gravity">
      html, body { 
        max-width: 100%; 
        overflow-x: clip; 
        margin: 0 auto !important; 
        display: block !important;
      }
      *, *::before, *::after { box-sizing: border-box; }
      body, main, header, footer, section, article, nav, aside, div { 
        max-width: 100%; 
      }
      main, .site-header, .site-footer {
        width: 100%;
        margin: 0 auto;
      }
      .table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .table-wrap > table,
      .semantic-table { min-width: 640px; width: 100%; table-layout: fixed; }
      .semantic-section,
      .semantic-items,
      .semantic-card,
      .semantic-directory,
      .semantic-mosaic,
      .internal-links-hub,
      .internal-links-grid,
      .map-block,
      .map-block__split,
      .map-directory,
      .map-grid,
      .map-directory__content,
      .map-info,
      .service-card,
      .step-card,
      .faq-entry,
      .faq-item,
      .trust-band__signal-card { min-width: 0; max-width: 100%; }
      img, iframe, svg, video, canvas { max-width: 100%; height: auto; }
      pre, code { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; white-space: pre-wrap; }
      .semantic-card, .service-card, .internal-links-item a, th, td { overflow-wrap: anywhere; word-break: break-word; }
      .internal-links-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
      h1:empty, h2:empty, h3:empty, p:empty, li:empty { display: none !important; }
      .service-card:empty, .step-card:empty, .faq-entry:empty { display: none !important; }
      .editorial-visual-strip { padding-top: 0; }
      .block__header + .services-grid__intro,
      .block__header + .faq-block__intro,
      .block__header + .trust-band__intro,
      .block__header + .process-steps__intro { margin-top: 0.35rem; }
      @media (max-width: 767px) {
        .map-block__split, .map-directory, .map-grid { grid-template-columns: minmax(0, 1fr) !important; }
        .site-header__inner { flex-wrap: nowrap; }
        .nav--desktop { display: none !important; }
        .nav-mobile { display: block !important; width: min(100%, 22rem); margin-left: auto; }
        .nav-mobile__panel { width: 100%; }
      }
    </style>
  `);
}

function rewriteGenericSectionHeadings($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const city = context.city || 'tu zona';
  const niche = context.niche || 'el servicio';

  const variantsById: Record<string, string[]> = {
    servicios: [
      `Trabajos de ${niche} que resolvemos con más frecuencia`,
      `Intervenciones habituales de ${niche} según el tipo de incidencia`,
      `Qué actuaciones de ${niche} requieren diagnóstico previo`
    ],
    urgencia: [
      `Qué hacemos cuando la incidencia no puede esperar`,
      `Respuesta rápida con criterio técnico en ${city}`,
      `Actuación inmediata sin improvisar el diagnóstico`
    ],
    zonas: [
      `Cómo organizamos la cobertura según la zona`,
      `Desplazamientos y radios de atención en ${city}`,
      `Áreas donde solemos intervenir en ${city}`
    ],
    faq: [
      `Dudas que conviene resolver antes de decidir`,
      `Respuestas útiles sobre ${niche} y tiempos de actuación`,
      `Preguntas que ayudan a valorar la incidencia con criterio`
    ],
    contacto: [
      `Cuéntanos la incidencia y te orientamos con claridad`,
      `Habla con un profesional y valora la mejor vía de actuación`,
      `Siguiente paso para resolver la incidencia sin rodeos`
    ],
    'senales-confianza': [
      `Señales prácticas para valorar un servicio bien ejecutado`,
      `Qué transmite confianza real antes de intervenir`,
      `Criterios que ayudan a comparar opciones con sentido técnico`
    ]
  };

  const genericPatterns = [/^por qu[eé]\s+confiar/i, /^preguntas\s+sobre/i, /^cobertura\s+en/i, /^pide\s+tu/i, /^servicio\s+local\s+de/i, /^motivos\s+para\s+contar/i, /^contratar\s+ahora/i, /^panel\s+de\s+urgencia/i, /^gu[ií]a\s+de\s+precios/i, /^bandera\s+de\s+confianza/i];

  $('section[id]').each((_ignored: any, el: any) => {
    const section = $(el);
    const sectionId = String(section.attr('id') || '').trim();
    const h2 = section.find('h2').first();
    if (!sectionId || !h2.length) return;

    const current = normalizeText(h2.text());
    const variants = variantsById[sectionId];
    if (!variants || !genericPatterns.some((pattern) => pattern.test(current))) return;

    h2.text(pickVariant(`${city}::${niche}::${sectionId}`, variants));
  });
}

function repairBrokenLocalFragments(value: string, context: FinalDocumentSanitizerContext): string {
  const city = normalizeText(context.city || '');
  let out = String(value || '');
  if (!out.trim()) return out.trim();
  if (!city) return normalizeText(out);

  const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  out = out
    .replace(/\bEn\s*,/gi, `En ${city},`)
    .replace(/\ben\s+compensa\b/gi, `en ${city} compensa`)
    .replace(/\ben\s+conviene\b/gi, `en ${city} conviene`)
    .replace(/\bcobertura\s+en\s*[,.;:!?]?\s*$/gi, `cobertura en ${city}`)
    .replace(/\bLa presencia se comunica a nivel de\s+sin\s+inventar\b/gi, `La presencia se comunica a nivel de ${city}, sin inventar`)
    .replace(/\ba nivel de\s*[,.;:!?]?\s*$/gi, `en ${city}`)
    .replace(/\bcomunica a nivel de\s*[,.;:!?]?\s*$/gi, `ofrece en ${city}`)
    .replace(/\brevisar alta con contexto real\b/gi, `valorar el caso de forma directa`)
    .replace(/\bEscudos Protectors\b/gi, 'Escudos protectores')
    .replace(/\bc[uó]mo puedo asegurarme de que mi cuadro el[eé]ctrico en est[eé] protegido/gi, 'Cómo puedo asegurarme de que mi cuadro eléctrico esté protegido')
    .replace(/\ben\s*$/i, `en ${city}`);

  // Dedupe city repetitions in short spans.
  out = out
    .replace(new RegExp(`\\ben\\s+${escapedCity}\\s+en\\s+${escapedCity}\\b`, 'gi'), `en ${city}`)
    .replace(new RegExp(`\\b${escapedCity}\\s+en\\s+${escapedCity}\\b`, 'gi'), city)
    .replace(new RegExp(`\\b${escapedCity}\\s+${escapedCity}\\b`, 'gi'), city)
    .replace(new RegExp(`\\b(${escapedCity})\\s+(?:de|para|sobre|a)\\s+${escapedCity}\\b`, 'gi'), '$1')
    .replace(new RegExp(`\\b(Carpinteros|Cerrajeros|Fontaneros|Electricistas|Pintores)\\s+${escapedCity}\\s+en\\s+${escapedCity}\\b`, 'gi'), `$1 en ${city}`);

  out = repairBrandLocalFragments(out, city);

  return normalizeText(out)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,(\s*,)+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanVisibleText(value: string, context: FinalDocumentSanitizerContext): string {
  let out = String(value || '');

  for (const [pattern, replacement] of getSanitizerReplacements(context)) {
    out = out.replace(pattern, replacement);
  }

  out = sanitizeLegalRiskClaims(out, context.niche).html;
  out = removeCrossNicheSentences(out, context.niche);
  out = repairBrokenLocalFragments(out, context);

  out = out
    .replace(/\bbrechas\s+de\s+por\b/gi, '')
    .replace(/\bseg[uú]n\s+el,\s+el\b/gi, '')
    .replace(/\btipo\s+de,\s+el\b/gi, '')
    .replace(/\bauditor[ií]as?\s+de\s+gratuitas\b/gi, 'auditorías gratuitas')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/(?:\bde\s+)+(?=[,.;:!?]|$)/gi, '')
    .trim();

  out = repairBrokenLocalFragments(out, context);
  return out;
}

function removeSystemEyebrows($: cheerio.CheerioAPI): void {
  const systemLabels = new Set([
    'faq',
    'services_grid',
    'process_steps',
    'trust_band',
    'local_proof',
    'price_guidance',
    'urgency_panel',
    'cta_panel',
    'map'
  ]);

  $('.block__eyebrow').each((_ignored: any, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.text()).toLowerCase();
    if (systemLabels.has(text)) $el.remove();
  });

  $('style').each((_ignored: any, el: any) => {
    const $el = $(el);
    const cleaned = String($el.html() || '')
      .replace(/\/\*\s*Point\s+\d+[^*]*\*\//gi, '')
      .replace(/\/\*\s*AIRE\s+Update\s*\*\//gi, '')
      .trim();
    $el.html(cleaned);
  });
}

function fixTextNodes($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  $('body *').contents().each((_ignored: any, node: any) => {
    if (node.type !== 'text') return;
    const parent = (node.parent && node.parent.tagName) ? String(node.parent.tagName).toLowerCase() : '';
    if (['script', 'style', 'title', 'meta'].includes(parent)) return;

    const current = String(node.data || '');
    const cleaned = cleanVisibleText(current, context);
    if (cleaned !== current.trim()) {
      node.data = cleaned ? ` ${cleaned} ` : ' ';
    }
  });
}

function getFirstMeaningfulParagraph($scope: any, $: any): string {
  const texts = $scope.find('p').map((_i, el) => normalizeText($(el).text())).get().filter((text) => text.length >= 60);
  return texts[0] || '';
}

function getPrimaryHeading($: cheerio.CheerioAPI): string {
  const h1 = normalizeText($('h1').first().text());
  if (h1) return h1;
  const title = normalizeText($('title').first().text());
  return title;
}

function buildSectionIntroParagraphs(niche?: string, city?: string): string[] {
  const service = titleCase(niche || 'Servicio profesional');
  const place = normalizeText(city || 'tu zona');
  return [
    `${service} en ${place} requiere diagnóstico claro, explicación del alcance y una intervención proporcional al problema real.`,
    `Antes de actuar conviene revisar el acceso a la incidencia, los condicionantes del trabajo y la solución que compensa de verdad en ${place}.`
  ];
}

function resolvePayloadSafe(niche: string | undefined, blockType: string, city?: string): PlaybookBlockPayload | null {
  if (!niche) return null;
  try {
    const payload: unknown = resolveBlockPlaybookPayload(niche, blockType, city || '');
    return isPlaybookBlockPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

function sectionHasCrossNicheLeakage(text: string, niche?: string): boolean {
  const detectors = getCrossNichePatterns(niche).map((rx) => new RegExp(rx.source, rx.flags.replace(/g/g, '')));
  const comparable = normalizeText(text);
  return detectors.some((rx) => rx.test(comparable));
}

function repairServicesGridSection($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const section = $('[data-block-type="services_grid"], section#servicios').first();
  if (!section.length || !context.niche) return;

  const payload = resolvePayloadSafe(context.niche, 'services_grid', context.city);
  if (!payload?.services?.length) return;

  const sectionText = normalizeText(section.text());
  const emptyTitles = section.find('.service-card h3').filter((_i, el) => !normalizeText($(el).text())).length;
  const needsRepair = emptyTitles > 0 || sectionHasCrossNicheLeakage(sectionText, context.niche) || /descamisados/i.test(sectionText);
  if (!needsRepair) return;

  const introContainer = section.find('.services-grid__intro').first();
  if (introContainer.length) {
    const paragraphs = buildSectionIntroParagraphs(context.niche, context.city)
      .map((text) => `<p>${text}</p>`)
      .join('');
    introContainer.html(paragraphs);
  }

  let cardsContainer = section.find('.services-grid__cards').first();
  if (!cardsContainer.length) {
    cardsContainer = section.find('.semantic-items').first();
  }
  if (!cardsContainer.length) return;

  const cardsHtml = payload.services.slice(0, 4).map((item: PlaybookServiceItem) => {
    const title = normalizeText(item?.title || 'Servicio especializado');
    const body = cleanVisibleText(normalizeText(item?.body || ''), context);
    const metas = Array.isArray(item?.meta) ? item.meta.map((meta: string) => normalizeText(meta)).filter(Boolean) : [];
    const metaHtml = metas.length
      ? `<ul class="service-card__meta">${metas.map((meta: string) => `<li>${meta}</li>`).join('')}</ul>`
      : '';
    return `<article class="service-card"><h3>${title}</h3><p>${body}</p>${metaHtml}</article>`;
  }).join('');

  cardsContainer.html(cardsHtml);

  const trustContainer = section.find('.services-grid__trust, .services-grid__pills, .block__pills').first();
  if (trustContainer.length && Array.isArray(payload.trustBullets)) {
    trustContainer.html(payload.trustBullets.slice(0, 3).map((item: string) => `<span class="block__pill">${normalizeText(item)}</span>`).join(''));
  }
}

function repairProcessStepsSection($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const section = $('[data-block-type="process_steps"], section#como-trabajamos').first();
  if (!section.length || !context.niche) return;

  const payload = resolvePayloadSafe(context.niche, 'process_steps', context.city);
  if (!payload?.services?.length) return;

  const text = normalizeText(section.text());
  const suspiciousMechanicalResidue = /(suavidad\s+de\s+giro|asentamiento\s+de\s+la\s+puerta|desalineaci[oó]n|estado\s+real\s+del\s+cierre)/i.test(text);
  const needsRepair = suspiciousMechanicalResidue || sectionHasCrossNicheLeakage(text, context.niche);
  if (!needsRepair) return;

  const intro = section.find('.process-steps__intro').first();
  if (intro.length) {
    intro.html(`<p>${titleCase(context.niche || 'Servicio profesional')} en ${context.city || 'tu zona'} conviene organizarlo por fases: localizar el origen, aislar el riesgo, intervenir con criterio y comprobar el resultado antes de cerrar el trabajo.</p>`);
  }

  const timeline = section.find('.process-steps__timeline').first();
  if (!timeline.length) return;

  const stepsHtml = payload.services.slice(0, 4).map((item: PlaybookServiceItem, index: number) => {
    const title = normalizeText(item?.title || `Paso ${index + 1}`);
    const body = cleanVisibleText(normalizeText(item?.body || ''), context);
    return `<article class="step-card"><span class="step-card__index">${index + 1}</span><div class="step-card__body"><h3>${title}</h3><p>${body}</p></div></article>`;
  }).join('');

  timeline.html(stepsHtml);
}

function polishFaqSection($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const section = $('[data-block-type="faq"], section#faq').first();
  if (!section.length) return;

  const intro = section.find('.faq-block__intro').first();
  if (intro.length) {
    const introText = normalizeText(intro.text());
    if (/problema\s+con\s+agua|est[aá]s\s+en\s+el\s+lugar\s+adecuado|servicio\s+profesional\s+para\s+tu\s+problema/i.test(introText)) {
      intro.html([
        `<p>Estas preguntas ayudan a valorar la incidencia, entender qué condiciona el trabajo y decidir el siguiente paso con más criterio.</p>`,
        `<p>La respuesta útil suele depender del acceso a la avería, del estado previo de la instalación y de si compensa reparar, ajustar o sustituir una pieza.</p>`
      ].join(''));
    }
  }

  // Deduplicación y enriquecimiento de respuestas
  const seenAnswers = new Set<string>();
  const city = context.city || 'tu ciudad';
  const niche = context.niche || 'servicio';

  $('.faq-entry, .faq-item').each((_i, el) => {
    const $el = $(el);
    const $answer = $el.find('p, .faq-content-refined, div').filter((_j, node) => $(node).text().trim().length > 0).first();
    if (!$answer.length) return;

    const originalText = $answer.text().trim();
    const normalized = originalText.toLowerCase().replace(/\s+/g, '');

    if (seenAnswers.has(normalized) || originalText.length < 15) {
      if (originalText.toLowerCase().includes('visita técnica') || originalText.length < 15) {
        $answer.text(`En ${city}, la solución técnica de ${niche} se decide tras una comprobación del estado real de la instalación, materiales y nivel de seguridad requerido.`);
      } else {
        $answer.text(`Coordinamos la asistencia en ${city} evaluando el desgaste, la compatibilidad de los componentes y la urgencia del caso para ofrecer una respuesta profesional.`);
      }
    } else {
      seenAnswers.add(normalized);
    }
  });
}

function buildFallbackFaqs(context: FinalDocumentSanitizerContext): Array<{ question: string; answer: string }> {
  const city = normalizeText(context.city || 'tu zona');
  const niche = canonicalServiceLabel(context.niche).toLowerCase();
  return [
    { question: `¿Cómo se valora un servicio de ${niche} antes de intervenir?`, answer: `En ${city}, lo razonable es revisar el alcance real, el acceso y el estado previo antes de decidir si conviene ajustar, reparar o sustituir.` },
    { question: `¿Qué influye de verdad en el presupuesto de ${niche}?`, answer: `En ${city}, el presupuesto cambia por la complejidad técnica, el tiempo real de trabajo, los materiales implicados y si hace falta sustituir piezas o rematar la intervención.` },
    { question: `¿Qué conviene confirmar antes de aceptar la actuación?`, answer: `Antes de cerrar fecha en ${city}, conviene confirmar alcance, materiales previstos, tiempos razonables y cómo se verificará el resultado al terminar.` },
    { question: `¿Cuándo compensa reparar y cuándo sustituir?`, answer: `En ${city}, compensa reparar cuando el conjunto sigue siendo fiable; conviene sustituir cuando el desgaste, la incompatibilidad o la seguridad hacen poco útil seguir acumulando ajustes parciales.` }
  ];
}

function ensureFaqFloor($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const section = $('[data-block-type="faq"], section#faq').first();
  if (!section.length) return;
  const visibleFaqs = getVisibleFaqEntities($, context);
  if (visibleFaqs.length >= 4) return;
  const fallbackFaqs = buildFallbackFaqs(context).filter((faq) => !visibleFaqs.some((existing) => normalizeComparable(existing.question) === normalizeComparable(faq.question))).slice(0, 4 - visibleFaqs.length);
  let list = section.find('.faq-block__accordion, .faq-block__editorial-list').first();
  if (!list.length) {
    list = $('<div class="faq-block__accordion faq-block__accordion--refined"></div>');
    section.append(list);
  }
  fallbackFaqs.forEach((faq, index) => {
    list.append(`<details class="faq-item-refined faq-item"><summary class="faq-summary-refined"><span class="faq-summary-refined__count">${visibleFaqs.length + index + 1}</span><span class="faq-summary-refined__text">${escapeHtml(faq.question)}</span><span class="faq-icon-arrow" aria-hidden="true"></span></summary><div class="faq-content-refined"><p>${escapeHtml(faq.answer)}</p></div></details>`);
  });
}


function canonicalPathDepth(canonical: string): number {
  try {
    const url = new URL(canonical);
    return url.pathname.split('/').filter(Boolean).length;
  } catch {
    return String(canonical || '').split('/').filter(Boolean).length;
  }
}

function isGenericMoneyPage(canonical: string, context: FinalDocumentSanitizerContext): boolean {
  const depth = canonicalPathDepth(canonical);
  return depth <= 2;
}

function normalizeLocalHrefForPublish(href: string, isInternalCard = false): string {
  let normalized = String(href || '').trim().replace(/\\/g, '/').replace(/([^:])\/\/+?/g, '$1/');
  if (!normalized) return isInternalCard ? './index.html' : '/';
  if (/^https?:\/\//i.test(normalized) || /^mailto:/i.test(normalized) || /^tel:/i.test(normalized)) return normalized;
  if (normalized === '#top') return isInternalCard ? './index.html' : '/';
  normalized = normalized.replace(/\/index\.html\/+$/i, '/index.html');
  if (isInternalCard && !/\.html?(?:[#?]|$)/i.test(normalized)) {
    normalized = normalized.endsWith('/') ? `${normalized}index.html` : `${normalized}/index.html`;
  }
  if (!normalized.startsWith('/') && !normalized.startsWith('.') && !normalized.startsWith('#')) {
    normalized = `/${normalized}`;
  }
  return normalized;
}

function syncPrimaryHeadingWithSeo($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const h1 = $('h1').first();
  if (!h1.length) return;
  const currentTitle = normalizeText($('title').first().text());
  const currentH1 = normalizeText(h1.text());
  const canonical = normalizeText($('link[rel="canonical"]').attr('href') || '');
  const genericRoot = isGenericMoneyPage(canonical, context);
  const deterministicGenericTitle = `${canonicalServiceLabel(context.niche)} en ${context.city || 'tu zona'} con diagnóstico claro y cobertura real`;
  const shouldReset = genericRoot || looksOverloadedCommercialTitle(currentTitle) || looksOverloadedCommercialTitle(currentH1);
  if (!shouldReset) return;
  const sanitizedTitle = sanitizeTitle(genericRoot ? deterministicGenericTitle : (currentTitle || currentH1), context.city, context.niche);
  const displayHeading = sanitizedTitle.replace(/\s+\|\s+.+$/, '').trim();
  h1.text(displayHeading);
  $('title').first().text(sanitizedTitle);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', sanitizedTitle);
}

function removeEmptyArtifacts($: cheerio.CheerioAPI): void {
  $('h1, h2, h3, p, li, span, strong').each((_i, el) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    const hasMedia = $el.find('img, iframe, svg, video, canvas').length > 0;
    if (!text && !hasMedia) {
      $el.remove();
    }
  });

  $('.service-card, .step-card, .faq-entry, .proof-card, .trust-band__signal-card').each((_i, el) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (!text) {
      $el.remove();
    }
  });
}

function getVisibleFaqEntities($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];

  $('.faq-item, .faq-item-refined').each((_i, el) => {
    const $el = $(el);
    const question = normalizeFaqQuestionText($el.find('summary, .faq-summary-refined').first().text());
    const answer = normalizeText($el.find('.faq-content-refined, div').last().text());
    if (question && answer) {
      items.push({ question: question.startsWith('¿') ? question : `¿${question.replace(/^[¿?\s]+|[?\s]+$/g, '')}?`, answer: sanitizeAnswerText(answer, context.niche, context.city) });
    }
  });

  $('.faq-entry').each((_i, el) => {
    const $el = $(el);
    const question = normalizeText($el.find('h3').first().text());
    const answer = normalizeText($el.find('p').first().text());
    if (question && answer) {
      items.push({ question: question.startsWith('¿') ? question : `¿${question.replace(/^[¿?\s]+|[?\s]+$/g, '')}?`, answer: sanitizeAnswerText(answer, context.niche, context.city) });
    }
  });

  return items;
}

function syncSeoAndStructuredData($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const h1 = getPrimaryHeading($);
  const currentTitle = normalizeText($('title').first().text());
  const bestTitle = sanitizeTitle(h1 || currentTitle, context.city, context.niche);

  const leadParagraph = getFirstMeaningfulParagraph($('main, body').first(), $) || getFirstMeaningfulParagraph($('body').first(), $);
  const bestDescription = sanitizeDescription(leadParagraph || $('meta[name="description"]').attr('content') || '', context.niche, context.city);

  if ($('title').length === 0) $('head').append('<title></title>');
  $('title').first().text(bestTitle);

  if ($('meta[name="description"]').length === 0) {
    $('head').append(`<meta name="description" content="${bestDescription}">`);
  } else {
    $('meta[name="description"]').attr('content', bestDescription);
  }

  $('meta[property="og:title"], meta[name="twitter:title"]').each((_i, el) => $(el).attr('content', bestTitle));
  $('meta[property="og:description"], meta[name="twitter:description"]').each((_i, el) => $(el).attr('content', bestDescription));

  const canonical = normalizeText($('link[rel="canonical"]').attr('href') || '');
  const businessName = buildBusinessName(context);
  const visibleFaq = getVisibleFaqEntities($, context);
  const genericMoney = isGenericMoneyPage(canonical, context);
  const canonicalTitle = genericMoney ? sanitizeTitle(`${canonicalServiceLabel(context.niche)} en ${context.city || 'tu zona'} con diagnóstico claro y cobertura real`, context.city, context.niche) : bestTitle;
  const canonicalHeading = canonicalTitle.replace(/\s+\|\s+.+$/, '').trim();

  // Branding synchronization
  $('.footer__brand-name, .site-header__brand-name, .brand__name').text(businessName);
  $('meta[property="og:site_name"]').attr('content', businessName);

  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text() || '';
    try {
      const parsed = JSON.parse(raw) as JsonValue;
      const parsedObject = isJsonObject(parsed) ? parsed : undefined;
      const graphRaw = Array.isArray(parsedObject?.['@graph']) ? parsedObject['@graph'] : [parsed];
      const graph = Array.isArray(graphRaw) ? graphRaw : [parsed];
      const sanitizedGraph = graph
        .map((node) => sanitizeStructuredDataNode(node, context))
        .filter(isJsonObject);

      for (const node of sanitizedGraph) {
        const rawType = node['@type'];
        const type = Array.isArray(rawType) ? rawType[0] : rawType;
        if (type === 'Organization' || type === 'LocalBusiness') {
          node.name = businessName;
          if (canonical) node.url = canonical;
          if (type === 'LocalBusiness' && context.city) {
            node.areaServed = { '@type': 'City', name: normalizeText(context.city) };
          }
        }
        if (type === 'Service') {
          node.name = canonicalServiceLabel(context.niche);
          node.serviceType = canonicalServiceLabel(context.niche);
          if (context.city) node.areaServed = { '@type': 'City', name: normalizeText(context.city) };
        }
        if (type === 'WebPage') {
          node.name = canonicalTitle;
          node.description = bestDescription;
          if (canonical) node.url = canonical;
          node.inLanguage = 'es-ES';
        }
        if (type === 'BreadcrumbList' && Array.isArray(node.itemListElement) && node.itemListElement.length > 0) {
          const last = node.itemListElement[node.itemListElement.length - 1];
          if (isJsonObject(last)) {
            last.name = canonicalHeading;
            if (canonical) last.item = canonical;
          }
        }
        if (type === 'FAQPage' && visibleFaq.length > 0) {
          node.mainEntity = visibleFaq.slice(0, 6).map((faq) => ({
            '@type': 'Question',
            name: normalizeFaqQuestionText(faq.question),
            acceptedAnswer: {
              '@type': 'Answer',
              text: normalizeFaqAnswerText(faq.answer)
            }
          }));
        }
      }

      const output = parsedObject && Array.isArray(parsedObject['@graph']) ? { ...parsedObject, '@graph': sanitizedGraph } : sanitizedGraph[0];
      $(el).text(JSON.stringify(output));
    } catch {
      // leave handled by upstream validator; best effort only
    }
  });
}

export function sanitizeFinalRenderedHtml(html: string, context: FinalDocumentSanitizerContext): string {
  const source = String(html || '').normalize('NFC');
  const $ = cheerio.load(source, { decodeEntities: false });

  ensureHeadBaseline($);
  ensureResponsiveGuards($);
  ensurePerformanceGuards($);
  ensureFontPreconnects($);

  if ($('meta[name="viewport"]').length === 0) {
    $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  fixTextNodes($, context);
  normalizePremiumSpanishHeadings($, context);
  removeLowValueTemplateResidue($);
  ensureContactAnchor($);

  // SANITIZACIÓN DEL HEAD (Title y Meta Tags)
  const titleTag = $('title');
  if (titleTag.length) {
    titleTag.text(cleanVisibleText(titleTag.text(), context));
  }
  $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').each((_i, el) => {
    const $el = $(el);
    const content = $el.attr('content');
    if (content) $el.attr('content', cleanVisibleText(content, context));
  });
  $('meta[property="og:title"], meta[name="twitter:title"]').each((_i, el) => {
    const $el = $(el);
    const content = $el.attr('content');
    if (content) $el.attr('content', cleanVisibleText(content, context));
  });

  sanitizeLocksmithHeadings($, context.niche);
  rewriteGenericSectionHeadings($, context);
  repairServicesGridSection($, context);
  repairProcessStepsSection($, context);
  polishFaqSection($, context);
  ensureFaqFloor($, context);
  syncPrimaryHeadingWithSeo($, context);
  removeSystemEyebrows($);
  removeEmptyArtifacts($);

  $('img').each((_ignored: any, el: any) => {
    const $el = $(el);
    if (!$el.attr('alt')) {
      $el.attr('alt', `${context.niche || 'Servicio profesional'} en ${context.city || 'tu zona'}`);
    }
  });

  assignPredictableMediaDimensions($);
  optimizeMediaLoading($);

  $('iframe').each((_ignored: any, el: any) => {
    const $el = $(el);
    if (!$el.attr('referrerpolicy')) $el.attr('referrerpolicy', 'no-referrer-when-downgrade');

    const src = String($el.attr('src') || '').trim();
    if (/google\.[^/]+\/maps\/embed\?pb=/i.test(src) && context.city) {
      $el.attr('src', buildFallbackMapUrl(context.city));
    }

    const ariaLabel = normalizeText($el.attr('aria-label') || '');
    if (!ariaLabel && context.city) {
      $el.attr('aria-label', `Mapa de cobertura en ${context.city}`);
    }
  });

  const knownAnchors = new Set($('[id]').map((_: any, node: any) => String($(node).attr('id') || '').trim()).get().filter(Boolean));

  $('a').each((_ignored: any, el: any) => {
    const $el = $(el);
    const href = String($el.attr('href') || '').trim();
    const label = normalizeText($el.text()).toLowerCase();

    if (href.startsWith('tel:')) {
      const digits = href.replace(/^tel:/i, '').replace(/\D/g, '');
      if (digits.length >= 9) $el.attr('href', `tel:${digits}`);
      else $el.attr('href', '#contacto');
      return;
    }

    if (!href || href === '#') {
      if ($el.closest('.internal-links-item').length) $el.attr('href', './index.html');
      else if (label.includes('aviso legal')) $el.attr('href', '/aviso-legal/');
      else if (label.includes('privacidad')) $el.attr('href', '/privacidad/');
      else if (label.includes('cookies')) $el.attr('href', '/cookies/');
      else $el.attr('href', '/');
      return;
    }

    if (href === '#top') {
      $el.attr('href', $el.closest('.internal-links-item').length ? './index.html' : '/');
      return;
    }

    if (href.startsWith('#')) {
      const target = href.slice(1).trim();
      if (!target || !knownAnchors.has(target)) {
        $el.attr('href', '/');
      }
      return;
    }

    if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return;

    let normalized = href.replace(/\s+/g, '');
    if (normalized.startsWith('/../') || normalized.startsWith('/./')) {
      normalized = normalized.slice(1);
    }
    normalized = normalizeLocalHrefForPublish(normalized, $el.closest('.internal-links-item').length > 0 || $el.hasClass('internal-links-item__anchor'));
    $el.attr('href', normalized);
  });

  if ($('#el-utility-fixes').length === 0) {
    $('head').append(`
      <style id="el-utility-fixes">
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      </style>
    `);
  }

  $('body').find('*').contents().each((_ignored: any, node: any) => {
    if (node.type !== 'text') return;
    node.data = String(node.data || '')
      .replace(/\{\{.*?\}\}|\[\[.*?\]\]|__[\w.-]+__|\$\{.*?\}|\[object Object\]|undefined|null/gi, ' ')
      .replace(/\s{2,}/g, ' ');
  });

  $('[alt], [title], [aria-label], [placeholder]').each((_ignored: any, el: any) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
      const current = String($el.attr(attr) || '');
      if (!current) continue;
      const cleaned = current
        .replace(/\{\{.*?\}\}|\[\[.*?\]\]|__[\w.-]+__|\$\{.*?\}|\[object Object\]|undefined|null/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      $el.attr(attr, cleaned);
    }
  });

  $('[class]').each((_ignored: any, el: any) => {
    const $el = $(el);
    const current = String($el.attr('class') || '');
    if (!current) return;
    const cleaned = current
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !/\b(?:undefined|null)\b/i.test(token))
      .join(' ')
      .trim();

    if (cleaned) $el.attr('class', cleaned);
    else $el.removeAttr('class');
  });

  dedupeRepeatedBlocks($);
  ensureInternalLinksBeforeFooter($);
  addExternalLinkSafety($);
  syncSeoAndStructuredData($, context);
  ensureCoreStructuredData($, context);
  removeEmptyArtifacts($);

  const sanitized = sanitizeLegalRiskClaims($.html().replace(/\s{2,}/g, ' ').replace(/\n{2,}/g, '\n').trim(), context.niche).html;
  return applyFinalTransmissionGuard(applyPremiumContentDepth(sanitized, context), context);
}
