import * as cheerio from 'cheerio';

export interface PageCoherenceContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
  canonical?: string;
  facts?: Record<string, unknown>;
}

export interface PageCoherenceIssue {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  evidence?: string[];
}

export interface PageCoherenceResult {
  html: string;
  issues: PageCoherenceIssue[];
}

const UI_FAQ_LABELS = new Set([
  'menu', 'menú', 'inicio', 'servicios', 'areas', 'áreas', 'dudas', 'contacto', 'llamar ahora',
  'ver servicios', 'privacidad', 'cookies', 'aviso legal', 'navegacion', 'navegación'
]);

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: unknown): string {
  return normalizeText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isElectrician(niche?: string): boolean {
  return /electric|eléctric/i.test(String(niche || ''));
}

function isForbiddenFaqQuestion(question: string): boolean {
  const normalized = normalizeKey(question);
  if (!normalized || normalized.length < 12) return true;
  if (UI_FAQ_LABELS.has(normalized)) return true;
  if (/^(menu|inicio|servicios|areas|dudas|contacto)\b/i.test(normalized)) return true;
  if (!/[?¿]/.test(question)) return true;
  if (/📞|\b\d{6,}\b/.test(question)) return true;
  return false;
}

function cleanTextValue(value: string, context: PageCoherenceContext): string {
  let output = value;
  const electrician = isElectrician(context.niche);

  // Claims no verificados: años, garantías absolutas, gratuidad y certificaciones sin facts.
  output = output.replace(/\bcon\s+m[aá]s\s+de\s+\d{1,2}\s+años\s+de\s+experiencia,?\s*/gi, 'Con un proceso de revisión claro, ');
  output = output.replace(/\bm[aá]s\s+de\s+\d{1,2}\s+años\s+de\s+experiencia\b/gi, 'experiencia práctica en el servicio');
  output = output.replace(/\b\d{1,2}\s+años\s+de\s+experiencia\b/gi, 'experiencia práctica en el servicio');
  output = output.replace(/\bevaluaci[oó]n\s+gratuita\b/gi, 'valoración inicial');
  output = output.replace(/\bcotizaci[oó]n\s+gratuita\b/gi, 'orientación inicial');
  output = output.replace(/\bconsulta\s+gratuita\b/gi, 'consulta inicial');
  output = output.replace(/\bt[eé]cnicos\s+certificados\b/gi, 'personal técnico');
  output = output.replace(/\bprofesionales\s+certificados\b/gi, 'personal técnico');
  output = output.replace(/\bgarantizamos\s+la\s+seguridad\s+de\s+tus\s+instalaciones\b/gi, 'comprobamos los puntos críticos de tu instalación');
  output = output.replace(/\bgarantizamos\s+que\s+nuestros\s+trabajos\s+sean\s+completos\s+y\s+seguros\b/gi, 'revisamos el trabajo terminado con criterios de seguridad');
  output = output.replace(/\bgarantizar\s+que\s+tu\s+reparaci[oó]n\s+sea\s+eficiente\s+y\s+duradera\b/gi, 'comprobar que la reparación queda bien delimitada y revisada');
  output = output.replace(/\bgarantiza\s+que\s+tu\s+sistema\s+el[eé]ctrico\s+est[eé]\s+en\s+perfecto\s+estado\b/gi, 'ayuda a revisar el estado real de tu instalación eléctrica');
  output = output.replace(/\bgarantiza\s+un\s+servicio\s+a\s+la\s+medida\s+que\s+cumple\s+con\s+las\s+normativas\s+vigentes\b/gi, 'orienta la intervención según el alcance real y la normativa aplicable');
  output = output.replace(/\bcumple\s+con\s+todas\s+las\s+normativas\s+vigentes\b/gi, 'se revisa según la normativa aplicable');

  // Tono: preferimos tuteo consistente para páginas locales de conversión.
  output = output.replace(/\bPara resolver su problema\b/g, 'Para resolver tu problema');
  output = output.replace(/\bsu problema\b/g, 'tu problema');
  output = output.replace(/\bsus necesidades\b/g, 'tus necesidades');
  output = output.replace(/\bsu hogar\b/g, 'tu hogar');
  output = output.replace(/\bsu vivienda\b/g, 'tu vivienda');
  output = output.replace(/\ble ayudamos\b/gi, 'te ayudamos');
  output = output.replace(/\bpueda afectar a\s+su\b/gi, 'pueda afectar a tu');

  // Electricistas: evitar desviación hacia electrodomésticos/aparatos.
  if (electrician) {
    output = output.replace(/\baparatos\s+el[eé]ctricos\b/gi, 'instalaciones eléctricas');
    output = output.replace(/\baparato\s+el[eé]ctrico\b/gi, 'punto de la instalación eléctrica');
    output = output.replace(/\bequipos\s+el[eé]ctricos\b/gi, 'elementos de la instalación eléctrica');
    output = output.replace(/\breparaci[oó]n\s+y\s+mantenimiento\s+de\s+equipos\s+el[eé]ctricos\b/gi, 'revisión y reparación de instalaciones eléctricas');
    output = output.replace(/\bLocalizaci[oó]n\s+y\s+Reparaci[oó]n\s+de\s+Instalaciones\s+El[eé]ctricas\b/gi, 'Localización de averías e instalaciones eléctricas');
    output = output.replace(/\bLocalizaci[oó]n\s+y\s+Reparaci[oó]n\s+de\s+Aparatos\s+El[eé]ctricos\b/gi, 'Localización de averías e instalaciones eléctricas');
  }

  // No volcar criterios técnicos crudos como si fueran acciones.
  output = output.replace(/Se priorizan\s+protecci[oó]n\s+que\s+salta\s+y\s+l[ií]nea\s+afectada\s+antes\s+de\s+recomendar\s+una\s+soluci[oó]n\.?/gi,
    'Si salta una protección, se revisa qué línea queda afectada antes de proponer cambios de material.');
  output = output.replace(/\bSe priorizan\s+([^\.]{8,80})\s+antes\s+de\s+recomendar\s+una\s+soluci[oó]n\.?/gi,
    'Se revisa el síntoma principal y el alcance real antes de recomendar una solución.');

  // Limpieza menor de duplicados textuales provocados por sustituciones.
  output = output.replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ');
  return output;
}

function walkTextNodes($: cheerio.CheerioAPI, context: PageCoherenceContext): void {
  $('body *').contents().each((_i, node) => {
    if (node.type !== 'text') return;
    const parent = node.parent as any;
    const parentName = String(parent?.name || '').toLowerCase();
    if (parentName === 'script' || parentName === 'style' || parentName === 'noscript') return;
    const current = (node as any).data || '';
    const cleaned = cleanTextValue(current, context);
    if (cleaned !== current) (node as any).data = cleaned;
  });
}

function sanitizeVisibleBreadcrumbs($: cheerio.CheerioAPI, issues: PageCoherenceIssue[]): void {
  const links = $('.el-breadcrumbs__list a');
  if (!links.length) return;
  links.each((_i: any, el: any) => {
    const $link = $(el);
    const text = normalizeText($link.text());
    const span = `<span class="el-breadcrumbs__text" itemprop="name">${escapeHtml(text)}</span>`;
    $link.replaceWith(span);
  });
  issues.push({ code: 'BREADCRUMBS_VISIBLE_LINKS_REMOVED', message: 'Breadcrumbs visibles convertidos a texto para evitar enlaces rotos.', severity: 'info' });
}

function removeDuplicateTerminalUrgency($: cheerio.CheerioAPI, issues: PageCoherenceIssue[]): void {
  if ($('[data-block-type="urgency_panel"]').length === 0) return;
  const candidates = $('section.el-section.vibe-premium, section.el-section.vibe-local, section.el-section.vibe-minimal').filter((_i: any, el: any) => {
    const $el = $(el);
    return $el.find('.urgency-banner').length > 0 && $el.closest('[data-block-type]').length === 0;
  });
  candidates.each((_i: any, el: any) => $(el).remove());
  if (candidates.length) {
    issues.push({ code: 'DUPLICATE_TERMINAL_URGENCY_REMOVED', message: 'Se eliminó el CTA final tipo urgencia porque ya existe urgency_panel.', severity: 'warning' });
  }
}

function localProofScenario(context: PageCoherenceContext): { title: string; intro: string; items: Array<{ title: string; body: string; meta: string[] }> } {
  const city = context.city || 'tu zona';
  if (isElectrician(context.niche)) {
    return {
      title: `Situaciones eléctricas habituales en ${city}`,
      intro: `No se presentan reseñas inventadas: este bloque resume situaciones técnicas habituales y cómo se revisan antes de proponer una actuación.`,
      items: [
        {
          title: 'Diferencial que salta al conectar una zona',
          body: 'Se separan circuitos, se identifica si el fallo aparece en una línea concreta y se revisan protecciones antes de cambiar piezas.',
          meta: ['diferencial', 'línea afectada']
        },
        {
          title: 'Cuadro eléctrico con protecciones antiguas',
          body: 'Se comprueba el estado del cuadro, la compatibilidad de magnetotérmicos y el alcance real de la actualización necesaria.',
          meta: ['cuadro eléctrico', 'magnetotérmico']
        },
        {
          title: 'Puntos de luz o enchufes sin servicio',
          body: 'Se revisa si hay corte en el circuito, falso contacto o sobrecarga antes de confirmar materiales y tiempos de intervención.',
          meta: ['puntos de luz', 'enchufes']
        }
      ]
    };
  }

  return {
    title: `Situaciones habituales en ${city}`,
    intro: `No se presentan reseñas inventadas: este bloque resume casos habituales y criterios de revisión que ayudan a decidir la actuación.`,
    items: [
      { title: 'Revisión inicial del problema', body: 'Se delimita el síntoma, el acceso y el estado previo antes de proponer reparación, ajuste o sustitución.', meta: ['diagnóstico previo'] },
      { title: 'Decisión técnica antes de cambiar piezas', body: 'Se comprueba si el problema puede resolverse con ajuste o reparación antes de plantear materiales nuevos.', meta: ['criterio técnico'] },
      { title: 'Comprobación final del servicio', body: 'Se revisa el resultado de la actuación y se explica qué se ha hecho para evitar dudas posteriores.', meta: ['verificación'] }
    ]
  };
}

function sanitizeLocalProof($: cheerio.CheerioAPI, context: PageCoherenceContext, issues: PageCoherenceIssue[]): void {
  const localProof = $('[data-block-type="local_proof"]').first();
  if (!localProof.length) return;
  const text = normalizeText(localProof.text());
  const promisesTestimonials = /testimonio|reseñ|cliente satisfech|opiniones reales|verificad[ao]s/i.test(text);
  const hasRealTestimonials = localProof.find('.testimonial-card, blockquote, [data-review], [itemtype*="Review"]').length > 0;

  if (!promisesTestimonials || hasRealTestimonials) return;

  const scenario = localProofScenario(context);
  const h2 = localProof.find('h2').first();
  if (h2.length) h2.text(scenario.title);
  localProof.find('.block__eyebrow').first().text('Criterio técnico local');

  const intro = localProof.find('.local-proof__intro p, .local-proof__intro, .local-proof__lead p').first();
  if (intro.length) intro.text(scenario.intro);

  const cards = localProof.find('.proof-card, .proof-row, .proof-card-minimal, .local-proof__signal').slice(0, scenario.items.length);
  cards.each((idx: any, el: any) => {
    const item = scenario.items[idx];
    const $el = $(el);
    const title = $el.find('h3, .proof-card__label, strong').first();
    const body = $el.find('p, span').not('.proof-row__ordinal, .local-proof__signal-index, .service-card__kicker, .block__pill').last();
    if (title.length) title.text(item.title); else $el.prepend(`<h3>${escapeHtml(item.title)}</h3>`);
    if (body.length) body.text(item.body); else $el.append(`<p>${escapeHtml(item.body)}</p>`);
    const meta = $el.find('.proof-row__meta, .service-card__meta').first();
    if (meta.length) meta.html(item.meta.map(m => `<li>${escapeHtml(m)}</li>`).join(''));
  });

  issues.push({ code: 'LOCAL_PROOF_TESTIMONIAL_PROMISE_REWRITTEN', message: 'local_proof prometía testimonios sin mostrarlos; se reescribió como situaciones técnicas habituales.', severity: 'warning' });
}

function dedupePillsAndCtas($: cheerio.CheerioAPI, issues: PageCoherenceIssue[]): void {
  const seenPills = new Set<string>();
  let removedPills = 0;
  $('.block__pill, .trust-pill-refined').each((_i: any, el: any) => {
    const key = normalizeKey($(el).text());
    if (!key) return;
    if (seenPills.has(key)) {
      $(el).remove();
      removedPills += 1;
    } else {
      seenPills.add(key);
    }
  });

  let normalizedCtas = 0;
  $('a.cta-primary, [data-cta="primary"]').each((_i: any, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (text.length > 42 || /gratuita|ahora mismo|contactanos hoy mismo/i.test(text)) {
      $el.text(/urgencia|llamar/i.test(text) ? 'Llamar para explicar la avería' : 'Pedir diagnóstico previo');
      normalizedCtas += 1;
    }
  });

  if (removedPills) issues.push({ code: 'REPEATED_PILLS_DEDUPED', message: `Se eliminaron ${removedPills} pills repetidas.`, severity: 'info' });
  if (normalizedCtas) issues.push({ code: 'CTA_TEXT_NORMALIZED', message: `Se normalizaron ${normalizedCtas} CTAs largos o débiles.`, severity: 'info' });
}

function limitServicesGridLabels($: cheerio.CheerioAPI, issues: PageCoherenceIssue[]): void {
  const grids = $('[data-block-type="services_grid"]');
  if (grids.length <= 2) return;
  grids.slice(2).each((_i: any, el: any) => {
    const $el = $(el);
    $el.attr('data-block-type', 'technical_scenarios');
    $el.removeClass('block--services_grid services-grid--clean services-grid').addClass('block--technical_scenarios technical-scenarios');
    $el.find('.block__eyebrow').first().text('Escenario técnico');
  });
  issues.push({ code: 'EXCESS_SERVICES_GRID_RELABELED', message: `Se reclasificaron ${grids.length - 2} bloques services_grid excedentes como escenarios técnicos.`, severity: 'warning' });
}

function extractVisibleFaq($: cheerio.CheerioAPI): Array<{ question: string; answer: string }> {
  const results: Array<{ question: string; answer: string }> = [];
  const faqRoot = $('[data-block-type="faq"]').first();
  if (!faqRoot.length) return results;

  faqRoot.find('details').each((_i: any, el: any) => {
    const $el = $(el);
    const q = normalizeText($el.find('summary .faq-question-text, summary').first().text());
    const a = normalizeText($el.find('.faq-content-refined, .faq-content, p').last().text());
    if (!isForbiddenFaqQuestion(q) && a.length >= 20) results.push({ question: q, answer: a });
  });

  faqRoot.find('.faq-entry').each((_i: any, el: any) => {
    const $el = $(el);
    const q = normalizeText($el.find('h3').first().text());
    const a = normalizeText($el.find('p').first().text());
    if (!isForbiddenFaqQuestion(q) && a.length >= 20) results.push({ question: q, answer: a });
  });

  const seen = new Set<string>();
  return results.filter((item: any) => {
    const key = normalizeKey(item.question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function cleanFaqNode(node: any, visibleFaq: Array<{ question: string; answer: string }>): boolean {
  if (!node || typeof node !== 'object') return false;
  const type = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (!type.includes('FAQPage')) return false;

  const existing = Array.isArray(node.mainEntity) ? node.mainEntity : [];
  const filtered = existing.filter((q: any) => {
    const name = normalizeText(q?.name);
    const answer = normalizeText(q?.acceptedAnswer?.text);
    return !isForbiddenFaqQuestion(name) && answer.length >= 20;
  });

  const source = visibleFaq.length ? visibleFaq.map((item: any) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer }
  })) : filtered;

  node.mainEntity = source;
  return true;
}

function sanitizeFaqSchema($: cheerio.CheerioAPI, issues: PageCoherenceIssue[]): void {
  const visibleFaq = extractVisibleFaq($);
  let touched = false;

  $('script[type="application/ld+json"]').each((_i: any, el: any) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw) as any;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed['@graph'])) {
          for (const node of parsed['@graph']) touched = cleanFaqNode(node, visibleFaq) || touched;
        } else {
          touched = cleanFaqNode(parsed, visibleFaq) || touched;
        }
        $(el).text(JSON.stringify(parsed));
      }
    } catch {
      // schema guard handles invalid JSON elsewhere
    }
  });

  if (touched) issues.push({ code: 'FAQ_SCHEMA_SCOPED_AND_CLEANED', message: 'FAQ schema limpiado con preguntas visibles válidas del bloque FAQ.', severity: 'warning' });
}

function removeEmptyGeneratedContainers($: cheerio.CheerioAPI, issues: PageCoherenceIssue[]): void {
  const selectors = [
    '.cta-panel__intro', '.cta-panel__trust',
    '.services-grid__intro', '.services-grid__trust', '.services-grid__pills',
    '.urgency-banner__pills', '.urgency-layout__intro',
    '.trust-band__intro', '.trust-band__pills',
    '.process-steps__intro', '.faq-block__intro', '.local-proof__intro',
    '.price-guidance__intro', '.map-block__intro', '.map-block__pills'
  ];
  let removed = 0;
  selectors.forEach((selector) => {
    $(selector).each((_i: any, el: any) => {
      const $el = $(el);
      if (!normalizeText($el.text()) && !$el.find('img,svg,video,iframe,a,button,input,textarea,select').length) {
        $el.remove();
        removed += 1;
      }
    });
  });
  if (removed) issues.push({ code: 'EMPTY_GENERATED_CONTAINERS_REMOVED', message: 'Se eliminaron ' + removed + ' contenedores generados sin contenido visible.', severity: 'info' });
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function applyPageCoherenceCleanup(html: string, context: PageCoherenceContext = {}): PageCoherenceResult {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  const issues: PageCoherenceIssue[] = [];

  sanitizeVisibleBreadcrumbs($, issues);
  removeDuplicateTerminalUrgency($, issues);
  sanitizeLocalProof($, context, issues);
  limitServicesGridLabels($, issues);
  walkTextNodes($, context);
  dedupePillsAndCtas($, issues);
  sanitizeFaqSchema($, issues);
  removeEmptyGeneratedContainers($, issues);

  return { html: $.html(), issues };
}
