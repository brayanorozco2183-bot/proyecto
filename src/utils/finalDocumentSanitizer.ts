import * as cheerio from 'cheerio';

export interface FinalDocumentSanitizerContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

function normalizeText(value: string): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function buildServiceLabel(niche?: string): string {
  const base = normalizeText(niche || '').toLowerCase();
  if (!base) return 'el servicio';
  if (/(?:eros|istas|ores|ales)$/i.test(base)) return `servicios de ${base}`;
  if (/^servicio\b/i.test(base)) return base;
  return `servicio de ${base}`;
}

function buildFallbackMapUrl(city?: string): string {
  const query = encodeURIComponent(normalizeText(city || 'España'));
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function sanitizeTitle(value: string, city?: string): string {
  let out = normalizeText(value);
  out = out.replace(/^Expertos en\s+/i, '');
  out = out.replace(/\bde confianza\b/gi, '');
  out = out.replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito');
  out = out.replace(/\s{2,}/g, ' ').trim();
  if (!out) out = `Servicio profesional en ${city || 'tu zona'}`;
  return out.slice(0, 65);
}

function sanitizeDescription(value: string, niche?: string, city?: string): string {
  let out = normalizeText(value);
  out = out.replace(/^Expertos en\s+/i, 'Atendemos ');
  out = out.replace(/servicio especializado de/gi, 'Atendemos');
  out = out.replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito');
  out = out.replace(/\bde confianza\b/gi, '');

  if (out.length < 110) {
    const filler = ` Contamos con profesionales cualificados en ${city || 'la zona'} para resolver ${buildServiceLabel(niche)} con criterio técnico, atención local y presupuesto claro.`;
    out = normalizeText(`${out}${filler}`);
  }

  if (!out || out.length < 80) {
    out = `Atendemos ${buildServiceLabel(niche)} en ${city || 'tu zona'} con criterio técnico, atención local y garantía por escrito cuando corresponde.`;
  }

  return out.slice(0, 170);
}

function sanitizeStructuredDataNode(value: any, context: FinalDocumentSanitizerContext): any {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeStructuredDataNode(item, context));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, any> = {};

    for (const [key, raw] of Object.entries(value)) {
      if (typeof raw === 'string') {
        if (key === 'description' || key === 'text') {
          output[key] = sanitizeDescription(raw, context.niche, context.city);
        } else if (key === 'name' && value['@type'] === 'WebPage') {
          output[key] = sanitizeTitle(raw, context.city);
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
  if (isLocksmithLikeNiche(niche)) return [];

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
    /\bcopias?\s+no\s+autorizadas?\b/gi,
    /\brealizar\s+duplicados?\b/gi,
    /vulnerabilidades?\s+en\s+sistemas?\s+de/gi,
    /\bdesahucios?\b/gi,
    /\bveh[ií]culos?\b/gi,
    /\bcierrapuertas\b/gi,
    /\bmuelles?\s+cierrapuertas\b/gi,
    /\bblindajes?\b/gi,
    /\bpuertas?\s+de\s+trastero\b/gi,
    /\bpuertas?\s+autom[aá]ticas\b/gi,
    /\bcancelas?\b/gi,
    /\bpomos?\b/gi,
    /\bmanillas?\b/gi,
    /\brepuestos?\s+originales?\b/gi,
    /\bmecanismos?\s+de\s+seguridad\b/gi,
    /\bauditor[ií]as?\s+de\s+seguridad\b/gi,
    /\bpuertas?\s+de\s+acceso\b/gi,
    /\btrasteros?\b/gi,
    /\bcierres?\s+de\s+seguridad\b/gi,
    /\bnivel\s+de\s+riesgo\b/gi,
    /protecci[oó]n\s+de\s+su\s+propiedad/gi,
    /an[aá]lisis\s+de\s+seguridad/gi,
    /emergencia\s+de\s+seguridad/gi,
    /t[eé]cnicas?\s+avanzadas?\s+de\s+seguridad/gi,
    /actos?\s+vand[aá]licos?/gi,
    /robos?\s+nocturnos?/gi,
    /prevenir\s+robos?/gi,
    /cumplimiento\s+normativo\s+en\s+sus\s+accesos?/gi,
    /necesidades?\s+de\s+seguridad\s+locales?/gi,
  ];
}

// Locksmith heading terms that should never be H3 in non-locksmith pages
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
    if (LOCKSMITH_H3_PATTERNS.some(rx => rx.test(text))) {
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

  return normalizeText(
    sentences.filter((sentence) => !detectors.some((rx) => rx.test(sentence))).join(' ')
  );
}

function getSanitizerReplacements(context: FinalDocumentSanitizerContext): Array<[RegExp, string]> {
  const common: Array<[RegExp, string]> = [
    [/20\s*minutos/gi, 'tiempo récord'],
    [/15\s*minutos/gi, 'tiempo récord'],
    [/en menos de 20/gi, 'en tiempo récord'],
    [/en menos de 15/gi, 'en tiempo récord'],
    [/mejor precio de la ciudad/gi, 'presupuesto claro'],
    [/garant[ií]a de \d+ años/gi, 'garantía por escrito'],
    [/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito'],
    [/seguridad certificada/gi, 'criterio técnico'],
    [/uso de sistemas avanzados/gi, 'materiales adecuados al servicio'],
    [/compromiso profesional directo/gi, 'atención profesional'],
    [/calidad verificada/gi, 'acabado cuidado'],
    [/certificada\b/gi, 'comprobada'],
    [/de forma de confianza/gi, 'de forma clara'],
    [/and profesionalidad/gi, 'y profesionalidad'],
    [/referente de seguridad\b[^.]*\./gi, 'referente técnico en el que confían las familias y empresas locales, aportando valor a través del conocimiento profesional y la honestidad.'],

    [/\bEfectivamente,\s*/gi, ''],
    [/\bDe manera integral,\s*/gi, ''],
    [/\bTécnicamente,\s*/gi, ''],
    [/\bíntegramente\b\.?\s*/gi, ''],
    [/La transparencia en el proceso es fundamental para nuestros clientes(?: en [^.,;:!?]+)?/gi, 'Explicamos el alcance del trabajo y las opciones disponibles desde el inicio'],
    [/\bmuelles?\s+cierrapuertas\b/gi, 'cierres hidráulicos'],
    [/\brepuestos?\s+originales?\b/gi, 'materiales adecuados al servicio'],
    [/\bmecanismos?\s+de\s+seguridad\b/gi, 'mecanismos del sistema'],
    [/\bauditor[ií]as?\s+de\s+seguridad\b/gi, 'revisiones técnicas'],
    [/Imagen base de apoyo lista para reemplazarse manualmente por una fotografía real del servicio\./gi, 'Apoyo visual del servicio y de la zona de cobertura.'],
    [/Excelencia en Servicios Públicos/gi, 'Servicio local con atención técnica y seguimiento claro'],
    [/\b60000000\b/g, context.phone || ''],
  ];

  if (!isLocksmithLikeNiche(context.niche)) {
    return common;
  }

  return [
    ...common,
    [/cada especialista de nuestro equipo cuenta con una certificaci[oó]n t[eé]cnica rigurosa y a[nñ]os de experiencia pr[aá]ctica/gi, 'Cada intervención se asigna según el tipo de acceso, el herraje y la urgencia real del caso'],
    [/atendemos cada solicitud de [a-záéíóúñ\s]+ con un criterio de trabajo claro y profesional/gi, 'Valoramos cada aviso según el acceso, el material y el margen de actuación disponible'],
    [/instalamos mirillas digitales de alta resoluci[oó]n que permiten ver con claridad qui[eé]n llama a la puerta/gi, 'La instalación de mirillas digitales exige revisar visor, espesor de la hoja y ángulo útil antes de mecanizar'],
    [/nuestra trayectoria nos avala/gi, 'La experiencia acumulada se nota en el diagnóstico y en la elección del herraje adecuado'],
    [/la rapidez no est[aá] re[nñ]ida con la calidad/gi, 'La urgencia no debe comprometer el ajuste, la comprobación y el remate final'],
    [/Nuestra trayectoria(?: como [^.,;:!?]{0,80})? nos avala(?: como [^.,;:!?]{0,80})?/gi, 'Aportamos criterio técnico y continuidad de servicio'],
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

function ensureResponsiveGuards($: cheerio.CheerioAPI): void {
  if ($('#layout-hotfix-responsive').length) return;

  $('head').append(`
    <style id="layout-hotfix-responsive">
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
      .service-card {
        min-width: 0;
        max-width: 100%;
      }
      img,
      iframe,
      svg,
      video,
      canvas { max-width: 100%; height: auto; }
      .semantic-card,
      .service-card,
      .internal-links-item a,
      th,
      td { overflow-wrap: anywhere; word-break: break-word; }
      .internal-links-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
      @media (max-width: 767px) {
        .map-block__split,
        .map-directory,
        .map-grid { grid-template-columns: minmax(0, 1fr) !important; }
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

  const genericPatterns = [
    /^por qu[eé]\s+confiar/i,
    /^preguntas\s+sobre/i,
    /^cobertura\s+en/i,
    /^pide\s+tu/i,
    /^servicio\s+local\s+de/i,
    /^motivos\s+para\s+contar/i
  ];

  $('section[id]').each((_ignored: any, el: any) => {
    const section = $(el);
    const sectionId = String(section.attr('id') || '').trim();
    const h2 = section.find('h2').first();
    if (!sectionId || !h2.length) return;

    const current = normalizeText(h2.text());
    const variants = variantsById[sectionId];
    if (!variants || !genericPatterns.some(pattern => pattern.test(current))) return;

    h2.text(pickVariant(`${city}::${niche}::${sectionId}`, variants));
  });
}

function cleanVisibleText(value: string, context: FinalDocumentSanitizerContext): string {
  let out = String(value || '');

  for (const [pattern, replacement] of getSanitizerReplacements(context)) {
    out = out.replace(pattern, replacement);
  }

  out = removeCrossNicheSentences(out, context.niche);

  out = out
    .replace(/\bbrechas\s+de\s+por\b/gi, '')
    .replace(/\bseg[uú]n\s+el,\s+el\b/gi, '')
    .replace(/\btipo\s+de,\s+el\b/gi, '')
    .replace(/\brealizamos\s+y\s+con\s+la\s+m[aá]xima\s+discreci[oó]n\b/gi, '')
    .replace(/\bauditor[ií]as\s+de\s+gratuitas\b/gi, 'auditorías gratuitas')
    .replace(/\sintegran\s+la\s+[uú]ltima\s+tecnolog[ií]a\s+en\s+profesional\b/gi, '');

  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s+([,.;:!?])/g, '$1');
  out = out.replace(/(?:\bde\s+)+(?=[,.;:!?]|$)/gi, '');
  return out.trim();
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

export function sanitizeFinalRenderedHtml(html: string, context: FinalDocumentSanitizerContext): string {
  const source = String(html || '').normalize('NFC');
  const $ = cheerio.load(source, { decodeEntities: false });

  ensureResponsiveGuards($);

  if ($('meta[name="viewport"]').length === 0) {
    $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  const rawTitle = $('title').first().text();
  $('title').first().text(sanitizeTitle(rawTitle, context.city));

  const metaDescription = $('meta[name="description"]');
  const safeDescription = sanitizeDescription(metaDescription.attr('content') || '', context.niche, context.city);
  if (metaDescription.length === 0) {
    $('head').append(`<meta name="description" content="${safeDescription}">`);
  } else {
    metaDescription.attr('content', safeDescription);
  }

  $('meta[property="og:title"], meta[name="twitter:title"]').each((_ignored: any, el: any) => {
    $(el).attr('content', sanitizeTitle($(el).attr('content') || rawTitle, context.city));
  });
  $('meta[property="og:description"], meta[name="twitter:description"]').each((_ignored: any, el: any) => {
    $(el).attr('content', sanitizeDescription($(el).attr('content') || safeDescription, context.niche, context.city));
  });

  fixTextNodes($, context);

  $('img').each((_ignored: any, el: any) => {
    const $el = $(el);
    if (!$el.attr('alt')) {
      $el.attr('alt', `${context.niche || 'Servicio profesional'} en ${context.city || 'tu zona'}`);
    }
    if (!$el.attr('loading')) $el.attr('loading', 'lazy');
    if (!$el.attr('decoding')) $el.attr('decoding', 'async');
  });

  $('iframe').each((_ignored: any, el: any) => {
    const $el = $(el);
    if (!$el.attr('loading')) $el.attr('loading', 'lazy');
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

  $('script[type="application/ld+json"]').each((_ignored: any, el: any) => {
    const raw = $(el).html() || '';
    try {
      const parsed = JSON.parse(raw);
      const sanitized = sanitizeStructuredDataNode(parsed, context);
      $(el).text(JSON.stringify(sanitized));
    } catch {
      const softened = raw
        .replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito')
        .replace(/Expertos en\s+/gi, 'Atendemos ');
      $(el).text(softened);
    }
  });

  const knownAnchors = new Set($('[id]').map((_: any, node: any) => String($(node).attr('id') || '').trim()).get().filter(Boolean));

  $('a').each((_ignored: any, el: any) => {
    const $el = $(el);
    const href = String($el.attr('href') || '').trim();
    const label = normalizeText($el.text()).toLowerCase();

    if (href.startsWith('tel:')) {
      const digits = href.replace(/^tel:/i, '').replace(/\D/g, '');
      if (digits) $el.attr('href', `tel:${digits}`);
      return;
    }

    if (!href || href === '#') {
      if (label.includes('aviso legal')) $el.attr('href', '/aviso-legal/');
      else if (label.includes('privacidad')) $el.attr('href', '/privacidad/');
      else if (label.includes('cookies')) $el.attr('href', '/cookies/');
      else $el.attr('href', '/');
      return;
    }

    if (href === '#top') {
      $el.attr('href', '/');
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

    let normalized = href
      .replace(/\/index\.html\/?$/i, '/')
      .replace(/([^:])\/\/+?/g, '$1/')
      .replace(/\s+/g, '');

    if (normalized.startsWith('./')) normalized = normalized.slice(1);
    if (!normalized.startsWith('/')) normalized = `/${normalized}`;
    $el.attr('href', normalized);
  });

  if ($('#el-utility-fixes').length === 0) {
    $('head').append(`
      <style id="el-utility-fixes">
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      </style>
    `);
  }

  // Placeholder cleanup limited to visible text, never raw structural surgery.
  sanitizeLocksmithHeadings($, context.niche);
  rewriteGenericSectionHeadings($, context);


  $('body').find('*').contents().each((_ignored: any, node: any) => {
    if (node.type !== 'text') return;
    node.data = String(node.data || '')
      .replace(/\{\{.*?\}\}|\[\[.*?\]\]|\[object Object\]|undefined|null/gi, ' ')
      .replace(/\s{2,}/g, ' ');
  });

  return $.html().replace(/\s{2,}/g, ' ').trim();
}




