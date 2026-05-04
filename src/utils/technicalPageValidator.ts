import * as cheerio from 'cheerio';

export interface TechnicalSeoValidationInput {
  expectedPhone?: string;
  expectedCanonicalBase?: string;
  pageType?: string;
  requireFaq?: boolean;
  expectedBusinessName?: string;
  expectedAddress?: string;
  pagePlan?: any;
  mission?: any;
  renderedSeo?: any;
}

function extractDefinedCssVars(styles: string): Set<string> {
  return new Set(Array.from(styles.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)).map((m) => m[1]));
}

function extractUsedCssVars(styles: string): Set<string> {
  return new Set(Array.from(styles.matchAll(/var\((--[A-Za-z0-9_-]+)/g)).map((m) => m[1]));
}

function hasRealFaq($: cheerio.CheerioAPI): boolean {
  return (
    $('.faq-item').length > 0 ||
    $('.faq-item-refined').length > 0 ||
    $('.faq-entry').length > 0 ||
    $('.faq-block__editorial-list').length > 0 ||
    $('.faq-block details').length > 0 ||
    $('.faq-block [data-faq-item]').length > 0
  );
}

function normalizeSpace(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string): string {
  return normalizeSpace(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?]/g, '');
}

function normalizePath(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('#')) return raw;
  if (/^(mailto:|tel:|https?:|data:)/i.test(raw)) return raw;

  const cleaned = raw
    .replace(/^\.{1,2}\//g, '/')
    .replace(/^(?:\.\.\/)+/g, '/')
    .replace(/^\.(?=\/)/, '')
    .replace(/\/+/g, '/');

  const withSlash = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return withSlash.replace(/\/$/, '') || '/';
}

function extractInternalHrefs($: cheerio.CheerioAPI): Array<{ href: string; text: string }> {
  return $('a[href]')
    .map((_i: any, el: any) => {
      const href = $(el).attr('href')?.trim() || '';
      const text = normalizeSpace($(el).text());
      return { href, text };
    })
    .get()
    .filter((item: any) => {
      if (!item.href) return false;
      if (item.href.startsWith('#')) return true;
      return /^(\/|\.\/|\.\.\/)/.test(item.href);
    });
}

function getVisibleFaqQuestions($: cheerio.CheerioAPI): string[] {
  const set = new Set<string>();

  $('.faq-item summary, .faq-summary-refined, .faq-entry h3, .faq-item h3, .faq-item h4, [data-faq-question], .faq-block details summary').each((_i: any, el: any) => {
    const text = normalizeSpace($(el).text());
    if (text && text.length > 5) set.add(text);
  });

  return Array.from(set);
}

function getVisibleTestimonialCards($: cheerio.CheerioAPI): Array<{ name: string; text: string; meta: string; sectionMode: string; source: string }> {
  return $('.testimonial-card')
    .map((_i: any, el: any) => {
      const card = $(el);
      const sectionMode = card.closest('[data-proof-mode]').attr('data-proof-mode') || '';
      return {
        name: normalizeSpace(card.find('.testimonial-name').first().text()),
        text: normalizeSpace(card.find('.testimonial-text').first().text()),
        meta: normalizeSpace(card.find('.testimonial-date').first().text()),
        source: normalizeSpace(card.attr('data-review-source') || card.find('[data-review-source]').attr('data-review-source') || ''),
        sectionMode,
      };
    })
    .get()
    .filter((item: any) => item.name || item.text || item.meta);
}

function hasVerifiedReviewMarkup($: cheerio.CheerioAPI): boolean {
  if ($('[data-proof-mode="verified_reviews"]').length > 0) return true;
  if ($('[data-review-source]').length > 0) return true;
  if ($('.testimonial-source').length > 0) return true;
  return false;
}

function getGraphNodesByType(nodes: any[], type: string): any[] {
  return nodes.filter((node: any) => {
    const rawType = node?.['@type'];
    if (Array.isArray(rawType)) return rawType.includes(type);
    return rawType === type;
  });
}

function getJsonLdGraphNodes($: cheerio.CheerioAPI): any[] {
  const graphNodes: any[] = [];

  $('script[type="application/ld+json"]').each((_i: any, el: any) => {
    try {
      const raw = $(el).contents().text();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.['@graph'])) {
        graphNodes.push(...parsed['@graph']);
      } else if (parsed && typeof parsed === 'object') {
        graphNodes.push(parsed);
      }
    } catch {
      // handled elsewhere by JSON_LD_PARSE_ERROR
    }
  });

  return graphNodes;
}

function looksTruncated(value: string): boolean {
  const text = String(value || '').trim();
  if (!text) return false;
  return text.includes('…') || /\.\.\.$/.test(text) || /\bSeg…\b/.test(text) || (!/[.!?]$/.test(text) && text.length > 120);
}

function getCrossNicheLeakPatterns(niche?: string): RegExp[] {
  const normalized = normalizeText(niche || '');

  if (/fontaner/.test(normalized)) {
    return [
      /\bcerrajeros?\b/i,
      /\bcerraduras?\b/i,
      /\bbomb[ií]n(?:es)?\b/i,
      /\bcilindros?\b/i,
      /\bantibumping\b/i,
      /\bamaestramiento\b/i,
      /\bcontrol\s+de\s+acceso\b/i,
      /\bcierres?\s+met[aá]licos?\b/i,
      /suavidad\s+de\s+giro/i,
      /asentamiento\s+de\s+la\s+puerta/i,
      /desalineaci[oó]n/i,
      /descamisados/i
    ];
  }

  if (/cerraj/.test(normalized)) {
    return [
      /\bfontaneros?\b/i,
      /\bfugas?\b/i,
      /\bgrifos?\b/i,
      /\blatiguillos?\b/i,
      /\bcisternas?\b/i,
      /\bdesatascos?\b/i,
      /\bsif[oó]n(?:es)?\b/i,
      /\btuber[ií]as?\b/i,
      /\bbajantes?\b/i,
      /\barquetas?\b/i,
      /\bcaudal\b/i
    ];
  }

  return [];
}

function buildAllowedInternalPaths(context: TechnicalSeoValidationInput, canonical: string): Set<string> {
  const allowed = new Set<string>(['/', '/aviso-legal', '/privacidad', '/cookies']);

  const canonicalPath = canonical
    ? normalizePath(new URL(canonical, context.expectedCanonicalBase || 'https://serviciosprofesionales.pro').pathname)
    : '';
  if (canonicalPath) allowed.add(canonicalPath);

  const linkPlan = context.pagePlan?.internalLinking?.linkPlan;
  const candidates = [
    ...(Array.isArray(linkPlan?.all) ? linkPlan.all : []),
    ...(Array.isArray(linkPlan?.selected) ? linkPlan.selected : []),
    ...(Array.isArray(linkPlan?.supporting) ? linkPlan.supporting : []),
    linkPlan?.upward,
    linkPlan?.lateral,
    linkPlan?.bofu,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizePath(String((candidate as any)?.targetSlug || ''));
    if (normalized && normalized !== '#') allowed.add(normalized);
  }

  return allowed;
}

function validateInternalLinkTargets($: cheerio.CheerioAPI, context: TechnicalSeoValidationInput, canonical: string): string[] {
  const issues: string[] = [];
  const links = extractInternalHrefs($);
  if (!links.length) return issues;

  const allowed = buildAllowedInternalPaths(context, canonical);
  const unexpected = new Set<string>();
  const duplicatedCityText = new Set<string>();
  const missionCity = normalizeText(String(context.mission?.city || ''));

  for (const link of links) {
    const href = link.href;
    if (href.startsWith('#')) continue;

    const normalizedHref = normalizePath(href);
    if (normalizedHref && !allowed.has(normalizedHref)) {
      unexpected.add(normalizedHref);
    }

    if (missionCity) {
      const cityPattern = new RegExp(`\\ben\\s+${missionCity}\\s+en\\s+${missionCity}\\b`, 'i');
      if (cityPattern.test(normalizeText(link.text))) {
        duplicatedCityText.add(link.text);
      }
    }
  }

  if (unexpected.size > 0) issues.push(`UNEXPECTED_INTERNAL_LINK_TARGETS:${Array.from(unexpected).slice(0, 8).join(',')}`);
  if (duplicatedCityText.size > 0) issues.push(`DUPLICATED_CITY_IN_LINK_TEXT:${Array.from(duplicatedCityText).slice(0, 5).join(' | ')}`);

  return issues;
}



function countMatches(source: string, pattern: RegExp): number {
  return (String(source || '').match(pattern) || []).length;
}


function isSeoNameAligned(a: string, b: string): boolean {
  const left = normalizeText(a || '');
  const right = normalizeText(b || '');
  if (!left || !right) return true;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = new Set(left.split(/\s+/).filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(/\s+/).filter((token) => token.length > 2));
  if (!leftTokens.size || !rightTokens.size) return false;

  const shared = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const overlap = shared / Math.max(Math.min(leftTokens.size, rightTokens.size), 1);
  return overlap >= 0.5;
}


function detectPerformanceIssues($: cheerio.CheerioAPI, html: string, styles: string): string[] {
  const issues: string[] = [];
  const styleBytes = Buffer.byteLength(String(styles || ''), 'utf8');
  const blurCount = countMatches(styles, /backdrop-filter\s*:/gi);
  const shadowCount = countMatches(styles, /box-shadow\s*:/gi);
  const remoteFonts = $('link[href*="fonts.googleapis.com"]').length;
  const missingDimensions = $('img').filter((_i: any, el: any) => !$(el).attr('width') || !$(el).attr('height')).length;
  const eagerNonHero = $('img[loading="eager"]').filter((_i: any, el: any) => $(el).closest('.hero-immersive__media, .hero-visual__frame').length === 0).length;
  const nonLazyIframes = $('iframe').filter((_i: any, el: any) => String($(el).attr('loading') || '').toLowerCase() !== 'lazy').length;

  if (styleBytes > 100000) issues.push(`PERFORMANCE_HEAVY_INLINE_CSS:${styleBytes}`);
  if (blurCount > 14) issues.push(`PERFORMANCE_EXCESSIVE_BLUR_EFFECTS:${blurCount}`);
  if (shadowCount > 70) issues.push(`PERFORMANCE_EXCESSIVE_SHADOWS:${shadowCount}`);
  if (remoteFonts > 1) issues.push(`PERFORMANCE_MULTIPLE_REMOTE_FONT_STYLESHEETS:${remoteFonts}`);
  if (missingDimensions > 0) issues.push(`PERFORMANCE_MEDIA_DIMENSIONS_MISSING:${missingDimensions}`);
  if (eagerNonHero > 0) issues.push(`PERFORMANCE_EAGER_NON_HERO_IMAGES:${eagerNonHero}`);
  if (nonLazyIframes > 0) issues.push(`PERFORMANCE_IFRAME_NOT_LAZY:${nonLazyIframes}`);

  return issues;
}

function getGraphNodeByType(nodes: any[], type: string): any | undefined {
  return nodes.find((node: any) => {
    const rawType = node?.['@type'];
    if (Array.isArray(rawType)) return rawType.includes(type);
    return rawType === type;
  });
}

export function validateRenderedPageTechnically(renderedPage: { html: string }, context: TechnicalSeoValidationInput): string[] {
  const issues: string[] = [];
  const html = renderedPage?.html || '';
  const $ = cheerio.load(html);

  const corruptionMarkers = [
    /\bsite-headername\b/i,
    /\bblock-sectionheader\b/i,
    /\bblocktitle\b/i,
    /\bel-breadcrumbslink\b/i,
    /\bel-breadcrumbsseparator\b/i,
    /\bel-breadcrumbsitem\b/i,
    /\bherotitle\b/i,
    /\bherosubtitle\b/i,
    /\bfaq-blockeditorial-list\b/i,
    /\bhero-visualeyebrow\b/i,
    /\bcardtext-compact\b/i,
    /\bprocess-stepstimeline\b/i,
    /<span[^>]*>[^<]*<\/h[1-6]>/i,
    /<a[^>]*>\s*<li\b/i,
    /<style[^>]*>[^<]*<\/a>/i,
  ];
  if (corruptionMarkers.some((rx) => rx.test(html))) issues.push('CRITICAL_RENDER_CORRUPTION');

  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
  const h1 = normalizeSpace($('h1').first().text());
  const h1s = $('h1');
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
  const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim() || '';
  const twitterDescription = $('meta[name="twitter:description"]').attr('content')?.trim() || '';

  if (!title || title.length < 30 || title.length > 65) issues.push('TITLE_INVALID');
  if (!metaDescription || metaDescription.length < 110 || metaDescription.length > 170) issues.push('META_DESCRIPTION_INVALID');
  if (!canonical) issues.push('MISSING_CANONICAL');
  if (context.expectedCanonicalBase && canonical && !canonical.startsWith(context.expectedCanonicalBase)) issues.push('CANONICAL_BASE_MISMATCH');
  if (h1s.length !== 1) issues.push('H1_COUNT_INVALID');

  if ([title, ogTitle, twitterTitle, metaDescription, ogDescription, twitterDescription].some(looksTruncated)) {
    issues.push('TRUNCATED_SEO_COPY');
  }

  if (ogTitle && title && normalizeText(ogTitle) !== normalizeText(title)) issues.push('OG_TITLE_MISMATCH');
  if (twitterTitle && title && normalizeText(twitterTitle) !== normalizeText(title)) issues.push('TWITTER_TITLE_MISMATCH');
  if (ogDescription && metaDescription && normalizeText(ogDescription) !== normalizeText(metaDescription)) issues.push('OG_DESCRIPTION_MISMATCH');
  if (twitterDescription && metaDescription && normalizeText(twitterDescription) !== normalizeText(metaDescription)) issues.push('TWITTER_DESCRIPTION_MISMATCH');

  if (h1 && title && !isSeoNameAligned(title, h1)) {
    issues.push('TITLE_H1_MISMATCH');
  }

  if (/profesionales\s+cualificados|soluciones\s+personalizadas|protege\s+tu\s+propiedad|descamisados/i.test(`${title} ${metaDescription}`)) {
    issues.push('GENERIC_OR_BROKEN_SEO_COPY');
  }

  if ($('.el-breadcrumbs [itemprop="name"]').filter((_i: any, el: any) => !normalizeSpace($(el).text())).length > 0) {
    issues.push('BREADCRUMB_EMPTY_NAME');
  }
  if ($('.el-breadcrumbs__list > .el-breadcrumbs__separator').length > 0) {
    issues.push('BREADCRUMB_INVALID_LIST_STRUCTURE');
  }

  if (
    /Imagen base de referencia lista para sustituirse por una fotografía real del servicio\./i.test(html) ||
    /Sustituible por imagen real cuando exista material propio\./i.test(html) ||
    /imagen provisional/i.test(html) ||
    /ilustraci[oó]n provisional/i.test(html) ||
    /postprocesado/i.test(html)
  ) {
    issues.push('PRODUCTION_PLACEHOLDER_VISUAL');
  }

  const robots = $('meta[name="robots"]').attr('content')?.trim().toLowerCase() || '';
  const explicitlyNoindex = context.mission?.contextual_data?.noindex || context.pagePlan?.degraded;
  if (!explicitlyNoindex && /\bnoindex\b/.test(robots) && ['service', 'urgent', 'service_area', 'home_local', 'category', 'comparison'].includes(context.pageType || '')) {
    issues.push('UNEXPECTED_NOINDEX');
  }

  const jsonLdNodes = $('script[type="application/ld+json"]');
  if (jsonLdNodes.length === 0) {
    issues.push('MISSING_JSON_LD');
  } else {
    jsonLdNodes.each((_ignored: any, el: any) => {
      try {
        JSON.parse($(el).contents().text());
      } catch {
        issues.push('JSON_LD_PARSE_ERROR');
      }
    });
  }


  if (/\bEn\s+,|\ben\s+compensa\b|identidad visible de\s+,|nivel\s+de\s*,|visible\s+en\s+y\s+evita|se\s+parece\s+a\s*,|Comarca\s+de\s+la\s+Vega\s+de(?:\s+y)?|para\s+garant\s*(?:[<.!,;:]|$)/i.test(html)) issues.push('BROKEN_LOCAL_FRAGMENT');
  if (/class="internal-links-item__anchor"[^>]+href="#top"/i.test(html)) issues.push('INTERNAL_LINKS_TOP_FALLBACK');
  if (/class="internal-links-item__anchor"[^>]+href="(?!https?:|mailto:|tel:|#)(?![^"]*index\.html)[^"]+"/i.test(html)) issues.push('INTERNAL_LINKS_NON_LOCAL_FILE');
  if (/<meta[^>]+property="og:site_name"[^>]+content="(?:Servicio local|Empresa local|Servicio profesional)"/i.test(html)) issues.push('BRAND_GENERIC_SITE_NAME');
  // if (/\b(?:Carpinteros|Cerrajeros|Fontaneros|Electricistas|Pintores)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+En\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i.test(html)) issues.push('BRAND_DOUBLE_CITY');

  const graphNodes = getJsonLdGraphNodes($);
  const faqSchema = getGraphNodeByType(graphNodes, 'FAQPage');
  const webpageNode = getGraphNodeByType(graphNodes, 'WebPage');
  const breadcrumbNode = getGraphNodeByType(graphNodes, 'BreadcrumbList');
  const localBusiness = getGraphNodeByType(graphNodes, 'LocalBusiness');

  if (webpageNode?.name && title && normalizeText(webpageNode.name) !== normalizeText(title)) {
    issues.push('SCHEMA_WEBPAGE_TITLE_MISMATCH');
  }
  if (webpageNode?.name && h1 && !isSeoNameAligned(webpageNode.name, h1)) {
    issues.push('SCHEMA_WEBPAGE_H1_MISMATCH');
  }
  if (webpageNode?.description && metaDescription && normalizeText(webpageNode.description) !== normalizeText(metaDescription)) {
    issues.push('SCHEMA_WEBPAGE_DESCRIPTION_MISMATCH');
  }
  if (Array.isArray(breadcrumbNode?.itemListElement) && breadcrumbNode.itemListElement.length > 0) {
    const last = breadcrumbNode.itemListElement[breadcrumbNode.itemListElement.length - 1];
    if (last?.name && title && normalizeText(last.name) !== normalizeText(title)) {
      issues.push('SCHEMA_BREADCRUMB_TITLE_MISMATCH');
    }
  }
  if (localBusiness?.address?.streetAddress && context.mission?.city) {
    const streetAddress = String(localBusiness.address.streetAddress).trim().toLowerCase();
    if (streetAddress === String(context.mission.city).trim().toLowerCase()) {
      issues.push('SCHEMA_STREETADDRESS_IS_CITY');
    }
  }

  const schemaQuestions = Array.isArray(faqSchema?.mainEntity)
    ? faqSchema.mainEntity.map((item: any) => normalizeSpace(String(item?.name || ''))).filter(Boolean)
    : [];
  const visibleQuestions = getVisibleFaqQuestions($);

  if (context.requireFaq && !hasRealFaq($)) issues.push('FAQ_REQUIRED_BUT_EMPTY');
  if (visibleQuestions.length > 0 && schemaQuestions.length === 0) issues.push('FAQ_VISIBLE_BUT_SCHEMA_MISSING');
  if (visibleQuestions.length > 0 && schemaQuestions.length > 0) {
    const visibleSet = new Set(visibleQuestions.map(normalizeText));
    const schemaSet = new Set(schemaQuestions.map(normalizeText));
    const missingInSchema = visibleQuestions.filter((q: any) => !schemaSet.has(normalizeText(q)));
    const missingInVisible = schemaQuestions.filter((q: any) => !visibleSet.has(normalizeText(q)));
    if (Math.abs(visibleQuestions.length - schemaQuestions.length) >= 2) issues.push('FAQ_SCHEMA_COUNT_MISMATCH');
    if (missingInSchema.length > 0 || missingInVisible.length > 0) issues.push('FAQ_SCHEMA_CONTENT_MISMATCH');
  }

  const testimonialCards = getVisibleTestimonialCards($);
  const reviewNodes = getGraphNodesByType(graphNodes, 'Review');
  const aggregateRatings = getGraphNodesByType(graphNodes, 'AggregateRating');
  const verifiedReviewMarkup = hasVerifiedReviewMarkup($);

  if (testimonialCards.some((card) => card.sectionMode !== 'documentary_trust')) {
    const suspiciousMeta = testimonialCards.some((card) => /reseña reciente|cliente local|valoración verificada|resena verificada/i.test(normalizeText(card.meta)));
    const defaultNames = testimonialCards.filter((card) => /^(marta r\.?|juan p\.?|elena c\.?)$/i.test(card.name)).length;
    const missingSources = testimonialCards.filter((card) => card.sectionMode !== 'documentary_trust' && !card.source).length;

    if (!verifiedReviewMarkup && suspiciousMeta) issues.push('UNVERIFIED_TESTIMONIAL_CLAIMS');
    if (!verifiedReviewMarkup && defaultNames >= 2) issues.push('DEFAULT_TESTIMONIALS_DETECTED');
    if (!verifiedReviewMarkup && missingSources >= 2) issues.push('TESTIMONIALS_WITHOUT_SOURCE');
  }

  if ((reviewNodes.length > 0 || aggregateRatings.length > 0) && !verifiedReviewMarkup) {
    issues.push('REVIEW_SCHEMA_WITHOUT_VISIBLE_PROOF');
  }

  const emptySelectors = [
    '.services-grid__cards:empty',
    '.process-steps__timeline:empty',
    '.local-proof__grid:empty',
    '.faq-block__editorial-list:empty',
    '.service-card h3:empty',
    '.step-card h3:empty',
    'h2:empty',
    'h3:empty'
  ];
  for (const selector of emptySelectors) {
    if ($(selector).length > 0) issues.push(`EMPTY_BLOCK:${selector}`);
  }

  const placeholderPatterns = [
    /\ben\s+[\.,!?;:]/i,
    /\bidentity\s*,/i,
    /Inserta aquí el embed controlado/i,
    /pendiente de hidratar/i,
    /\{\{.*?\}\}|\[\[.*?\]\]|__([A-Z0-9]{3,})__|\$\{.*?\}/i,
    /\bundefined\b|\bnull\b|\[object Object\]/i
  ];
  const bodyAndAttrs = `${$('body').text()} ${$('[alt], [title], [aria-label], [placeholder]').map((_i: any, el: any) => $(el).attr('alt') || $(el).attr('title') || $(el).attr('aria-label') || $(el).attr('placeholder') || '').get().join(' ')}`;
  if (placeholderPatterns.some((p) => p.test(bodyAndAttrs))) issues.push('PRODUCTION_PLACEHOLDER_FOUND');

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  if (getCrossNicheLeakPatterns(context.mission?.niche || context.pagePlan?.niche || '').some((rx) => rx.test(bodyText))) {
    issues.push('CROSS_NICHE_LEAKAGE');
  }
  if (/Atenci[oó]n\s+para\s+[A-ZÁÉÍÓÚÑ]/.test(bodyText)) issues.push('BROKEN_CTA_MICROCOPY');
  const mapIframes = $('iframe[src*="google.com/maps"], iframe[src*="maps.google.com/maps"]');
  if (mapIframes.length > 0) {
    const srcs = mapIframes.map((_i: any, el: any) => String($(el).attr('src') || '')).get().join(' ');
    if (/q=Espa%C3%B1a|q=Espana|q=España/i.test(srcs)) issues.push('MAP_EMBED_FALLBACK_COUNTRY');
    if (context.mission?.city && !new RegExp(context.mission.city, 'i').test(decodeURIComponent(srcs))) issues.push('MAP_EMBED_CITY_MISMATCH');
  }

  const normalizedBody = bodyText.toLowerCase();
  for (const signal of ['garantía por escrito', 'diagnóstico técnico', 'diagnóstico claro', 'cobertura real']) {
    const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (normalizedBody.match(new RegExp(escaped, 'g')) || []).length;
    if (count >= 15) issues.push(`TRUST_SIGNAL_REPETITION:${signal}:${count}`);
  }
  if (/\bcomponentes homologados\b/i.test(bodyText) && !/electr|industrial|maquinaria/i.test(bodyText)) issues.push('GENERIC_TRUST_SIGNAL');
  if (/\bcomo nos diferenciamos\b/i.test(bodyText)) issues.push('GENERIC_EDITORIAL_INTRO');
  if (/\bservicios de [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+s\b/.test(bodyText)) issues.push('GENERIC_SERVICE_CARD_HEADING');
  if (/\bcasos frecuentes\b/.test(bodyText) && /\bcriterios tecnicos\b|\bcriterios técnicos\b/i.test(bodyText)) issues.push('GENERIC_SECTION_SUBHEADS');

  const styles = $('style').map((_ignored: any, el: any) => $(el).text()).get().join('\n');
  issues.push(...detectPerformanceIssues($, html, styles));
  const defined = extractDefinedCssVars(styles);
  const used = extractUsedCssVars(styles);
  const missingVars = Array.from(used).filter((v) => !defined.has(v));
  if (missingVars.length > 0) issues.push(`UNDEFINED_CSS_VARS:${missingVars.join(',')}`);

  const expectedBEM = ['hero__subtitle', 'block__header', 'block__title', 'faq-block__editorial-list', 'process-steps__timeline'];
  const collapsedBEM = expectedBEM.filter((cls) => html.includes(cls.replace(/__/g, '').replace(/--/g, '')) && !html.includes(cls));
  if (collapsedBEM.length > 0) issues.push(`BEM_COLLAPSE:${collapsedBEM.join(',')}`);

  issues.push(...validateInternalLinkTargets($, context, canonical));

  const rawFooterText = $('footer').text() || '';
  const footerText = rawFooterText.replace(/\s+/g, ' ').toLowerCase();
  if (context.expectedBusinessName) {
    if (!isSeoNameAligned(rawFooterText, context.expectedBusinessName)) {
      issues.push('FOOTER_MISSING_BUSINESS');
    }
  }
  if (context.mission?.city) {
    const expectedCity = String(context.mission.city).toLowerCase();
    if (!footerText.includes(expectedCity)) issues.push('FOOTER_MISSING_CITY');
  }

  if (context.expectedPhone) {
    const normalizedPhone = String(context.expectedPhone).replace(/\D+/g, '');
    const bodyDigits = $('body').text().replace(/\D+/g, '');
    const telLinks = $('a[href^="tel:"]').map((_i: any, el: any) => ($(el).attr('href') || '').replace(/\D+/g, '')).get();
    const phoneFound = normalizedPhone && (bodyDigits.includes(normalizedPhone) || telLinks.some((value: any) => value.includes(normalizedPhone)));
    if (normalizedPhone && !phoneFound) issues.push('PHONE_NOT_RENDERED');
  }

  const wordCount = bodyText.split(' ').length;
  if (wordCount < 350) issues.push(`VISIBLE_BODY_TOO_SHORT:${wordCount}`);

  return Array.from(new Set(issues));
}


