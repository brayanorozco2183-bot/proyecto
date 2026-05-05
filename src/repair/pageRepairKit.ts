import * as cheerio from 'cheerio';
import { analyzeTechnicalIntegrity, enforceTechnicalIntegrityPolish } from '../quality/technicalIntegrityGate.js';
import { finalHtmlPolish } from '../utils/finalHtmlPolish.js';
import { applyPremiumContentDepth } from '../utils/premiumContentDepth.js';
import { applyFinalUxDeliveryGuard } from '../utils/finalUxDeliveryGuard.js';
import { normalizeFaqQuestionText, normalizeFaqAnswerText } from '../utils/faqSanitizer.js';
import type { PhaseValidationResult, PhaseValidationIssue } from './phaseRepairOrchestrator.js';

export interface RenderedPageLike {
  html: string;
  metadata?: any;
}

export type RepairablePagePhase =
  | 'assembly'
  | 'images'
  | 'completeness'
  | 'technical-validation'
  | 'ux-validation'
  | 'quality-gate'
  | 'editorial-validation'
  | 'delivery'
  | string;

export interface PageRepairOptions {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
  canonical?: string;
}

function clean(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function ensureHtmlShell($: cheerio.CheerioAPI): void {
  if (!$('html').length) {
    const html = $.root().html() || '';
    $.root().empty().append(`<html><head></head><body>${html}</body></html>`);
  }
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
}

function ensureViewport($: cheerio.CheerioAPI): void {
  const wanted = 'width=device-width, initial-scale=1.0';
  const existing = $('meta[name="viewport"]');
  if (existing.length) {
    existing.first().attr('content', wanted);
    existing.slice(1).remove();
  } else {
    $('head').prepend(`<meta name="viewport" content="${wanted}">`);
  }
}

function normalizeLinks($: cheerio.CheerioAPI): void {
  $('a[href]').each((_i, el) => {
    const $el = $(el);
    const href = clean($el.attr('href'));
    if (!href) return;
    if (href === '/index.html' || href === 'index.html') {
      $el.attr('href', './');
      return;
    }
    const absoluteRootIndex = href.match(/^(https?:\/\/[^/]+)\/index\.html([#?].*)?$/i);
    if (absoluteRootIndex) {
      $el.attr('href', `${absoluteRootIndex[1]}/${absoluteRootIndex[2] || ''}`);
      return;
    }
    $el.attr('href', href.replace(/\/index\.html(?=\?|#|$)/i, '/'));
  });
}

function deterministicSvgDataUri(label: string): string {
  const safe = label.replace(/[<>&"']/g, '').slice(0, 80) || 'Servicio local';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-label="${safe}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#eef2f7"/><stop offset="1" stop-color="#dbe7f3"/></linearGradient></defs><rect width="1200" height="760" fill="url(#g)"/><circle cx="940" cy="120" r="180" fill="#ffffff" opacity="0.38"/><rect x="90" y="120" width="1020" height="520" rx="42" fill="#ffffff" opacity="0.62"/><text x="110" y="398" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#1f2937">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function repairImages($: cheerio.CheerioAPI, options: PageRepairOptions): void {
  const label = `${options.niche || 'Servicio local'} ${options.city || ''}`.trim();
  $('img').each((_i, el) => {
    const $el = $(el);
    const src = clean($el.attr('src') || $el.attr('data-src') || '');
    const bad = !src || /placeholder|placehold\.co|dummyimage|loremflickr|via\.placeholder|image-not-found|\/assets\/placeholder|\/placeholder\./i.test(src);
    if (bad) {
      $el.attr('src', deterministicSvgDataUri(label));
      $el.removeAttr('data-src');
      if (!$el.attr('alt')) $el.attr('alt', `${label} - imagen editorial`);
      if (!$el.attr('width')) $el.attr('width', '1200');
      if (!$el.attr('height')) $el.attr('height', '760');
      $el.attr('loading', $el.attr('loading') || 'lazy');
      $el.attr('decoding', $el.attr('decoding') || 'async');
    }
  });
  $('source').each((_i, el) => {
    const $el = $(el);
    const srcset = clean($el.attr('srcset'));
    if (!srcset || /placeholder|placehold\.co|dummyimage|image-not-found/i.test(srcset)) {
      $el.attr('srcset', deterministicSvgDataUri(label));
    }
  });
}

function sanitizeVisibleText($: cheerio.CheerioAPI, options: PageRepairOptions): void {
  const city = clean(options.city || 'tu zona');
  $('body *').contents().each((_i, node) => {
    if (node.type !== 'text') return;
    const original = (node as any).data || '';
    let next = original
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\{\{[^}]+\}\}/g, '')
      .replace(/\bEn\s*([,.;:])/g, `En ${city}$1`)
      .replace(/\b(undefined|null|object object)\b/gi, '')
      .replace(/AI Response:|Writing Phase:|Block Index:/gi, '')
      .replace(/\s{2,}/g, ' ');
    if (next !== original) $(node).replaceWith(next);
  });
}

function isInsideNonContentChrome($: cheerio.CheerioAPI, el: any): boolean {
  return $(el).closest('nav, header, footer, .nav-mobile, .site-header, .site-footer, .site-navigation, .mobile-menu, [role="navigation"]').length > 0;
}

function isLikelyFaqContainer($: cheerio.CheerioAPI, el: any): boolean {
  const $el = $(el);
  if (isInsideNonContentChrome($, el)) return false;
  if ($el.closest('#faq, [data-block="faq"], .semantic-section--faq, .faq-section, .faq, .faq-list, .faq-grid').length > 0) return true;
  const className = String($el.attr('class') || '');
  if (/\bfaq(?:[-_\s]|$)/i.test(className)) return true;
  if ($el.attr('data-faq-item') !== undefined) return true;
  return false;
}

function extractVisibleFaqPairs($: cheerio.CheerioAPI): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];
  const selector = [
    '#faq details',
    '[data-block="faq"] details',
    '.semantic-section--faq details',
    '.faq-section details',
    '.faq details',
    '.faq-item',
    '.faq-card',
    '.faq-entry',
    '[data-faq-item]',
    '.faq-list > li',
    '.faq-grid > article'
  ].join(', ');

  $(selector).each((_i, el) => {
    if (!isLikelyFaqContainer($, el)) return;
    const $el = $(el);
    const qNode = $el.find('summary, .faq-question, .faq-card__question, .faq-summary-refined, h3, h4, strong').first();
    if (!qNode.length) return;

    const question = normalizeFaqQuestionText(qNode.text());
    let answer = normalizeFaqAnswerText($el.find('.faq-answer, .faq-card__answer, .faq-content, p').first().text());
    if (!answer) {
      const clone = $el.clone();
      clone.find('summary, .faq-question, .faq-card__question, .faq-summary-refined, h3, h4, strong').first().remove();
      answer = normalizeFaqAnswerText(clone.text());
    }

    const questionKey = question.toLowerCase().replace(/[¿?]/g, '').trim();
    const looksLikeNavigation = /^(men[uú]|servicios|[aá]reas|dudas|urgencia|contactar|inicio)$/i.test(questionKey);
    if (question && answer && !looksLikeNavigation) out.push({ question, answer });
    if (question && !looksLikeNavigation) qNode.text(question);
  });

  const seen = new Set<string>();
  return out.filter((item) => {
    const key = item.question.toLowerCase().replace(/[¿?]/g, '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function graphNodes(parsed: any): any[] {
  if (Array.isArray(parsed?.['@graph'])) return parsed['@graph'];
  if (Array.isArray(parsed)) return parsed;
  return parsed && typeof parsed === 'object' ? [parsed] : [];
}

function isType(node: any, typeName: string): boolean {
  const raw = node?.['@type'];
  const types = Array.isArray(raw) ? raw : [raw];
  return types.includes(typeName);
}

function syncFaqSchema($: cheerio.CheerioAPI): void {
  const visibleFaqs = extractVisibleFaqPairs($);
  if (!visibleFaqs.length) return;
  const mainEntity = visibleFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  }));

  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const nodes = graphNodes(parsed);
      let touched = false;

      for (const node of nodes) {
        if (isType(node, 'FAQPage')) {
          node.mainEntity = mainEntity;
          touched = true;
        }
      }

      if (!touched) {
        const faqNode = { '@type': 'FAQPage', mainEntity };
        if (Array.isArray(parsed?.['@graph'])) {
          parsed['@graph'].push(faqNode);
          touched = true;
        } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const base = { ...parsed };
          Object.keys(parsed).forEach((key) => delete parsed[key]);
          parsed['@context'] = base['@context'] || 'https://schema.org';
          parsed['@graph'] = [base, faqNode];
          touched = true;
        }
      }

      if (touched) $(el).text(JSON.stringify(parsed));
    } catch {
      // Invalid JSON-LD is repaired by ensureMinimumJsonLd before this pass.
    }
  });
}

function ensureCanonical($: cheerio.CheerioAPI, options: PageRepairOptions): void {
  if (!options.canonical) return;
  const existing = $('link[rel="canonical"]');
  if (existing.length) {
    existing.first().attr('href', options.canonical);
    existing.slice(1).remove();
  } else {
    $('head').append(`<link rel="canonical" href="${options.canonical}">`);
  }
}
function buildFallbackLocalBusinessSchema(options: PageRepairOptions): Record<string, unknown> {
  const fallbackName = String((options.niche || 'Servicio local') + ' ' + (options.city || '')).trim();
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: clean(options.businessName || fallbackName || 'Servicio local'),
    areaServed: options.city ? { '@type': 'City', name: clean(options.city) } : undefined,
    telephone: options.phone ? clean(options.phone) : undefined,
    url: options.canonical ? clean(options.canonical) : undefined,
  };
  Object.keys(schema).forEach((key) => schema[key] === undefined && delete schema[key]);
  return schema;
}

function ensureMinimumJsonLd($: cheerio.CheerioAPI, options: PageRepairOptions): void {
  const scripts = $('script[type="application/ld+json"]');
  if (scripts.length === 0) {
    $('head').append(`<script type="application/ld+json">${JSON.stringify(buildFallbackLocalBusinessSchema(options))}</script>`);
    return;
  }

  scripts.each((_i, el) => {
    const raw = $(el).text();
    try {
      JSON.parse(raw);
    } catch {
      // A broken JSON-LD script keeps the page permanently blocked by the final gate.
      // Replace only the invalid script with a minimal deterministic LocalBusiness schema.
      $(el).text(JSON.stringify(buildFallbackLocalBusinessSchema(options)));
    }
  });
}


export function repairRenderedHtmlForPhase(html: string, phase: RepairablePagePhase, options: PageRepairOptions = {}): string {
  let polished = String(html || '');
  if (phase !== 'assembly') {
    try { polished = finalHtmlPolish(polished, { city: options.city, niche: options.niche }); } catch { /* keep original */ }
  }
  try { polished = enforceTechnicalIntegrityPolish(polished, { city: options.city, niche: options.niche }); } catch { /* continue with DOM pass */ }

  const $ = cheerio.load(polished, { decodeEntities: false });
  ensureHtmlShell($);
  ensureViewport($);
  ensureCanonical($, options);
  ensureMinimumJsonLd($, options);
  normalizeLinks($);
  sanitizeVisibleText($, options);
  repairImages($, options);
  syncFaqSchema($);
  const repaired = $.html({ decodeEntities: false }).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  return applyFinalUxDeliveryGuard(applyPremiumContentDepth(repaired, options), options);
}

export function repairRenderedPageForPhase<T extends RenderedPageLike>(page: T, phase: RepairablePagePhase, options: PageRepairOptions = {}): T {
  const html = repairRenderedHtmlForPhase(page.html, phase, options);
  const metadata = page.metadata || {};
  metadata.phaseRepair = metadata.phaseRepair || [];
  metadata.phaseRepair.push({ phase, at: new Date().toISOString() });
  return { ...page, html, metadata };
}

export function validateRenderedHtmlForPhase(html: string, phase: RepairablePagePhase): PhaseValidationResult {
  const report = analyzeTechnicalIntegrity(html);
  const issues: PhaseValidationIssue[] = report.issues.map((issue) => ({
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
    evidence: issue.evidence,
  }));

  const phaseHardCodes = new Set<string>([
    'HTML_STRUCTURE_INCOMPLETE',
    'MOBILE_VIEWPORT_MISSING',
    'PLACEHOLDER_OR_BROKEN_COPY',
    'SYSTEM_LEAK_VISIBLE',
    'SCHEMA_JSON_INVALID',
    'SCHEMA_MISSING',
    'FAQ_SCHEMA_CONTENT_MISMATCH',
    'BROKEN_INTERNAL_INDEX_LINK',
    'PRODUCTION_PLACEHOLDER_VISUAL',
  ]);
  const hardBlock = issues.some((issue) => issue.severity === 'critical' || phaseHardCodes.has(issue.code));
  return {
    passed: !hardBlock,
    hardBlock,
    issues,
    summary: `phase=${phase} technical=${report.passed ? 'passed' : 'failed'} visibleFaq=${report.visibleFaqCount} schemaFaq=${report.schemaFaqCount}`,
  };
}

export function validateRenderedPageForPhase(page: RenderedPageLike, phase: RepairablePagePhase): PhaseValidationResult {
  return validateRenderedHtmlForPhase(page.html, phase);
}

export function assertFinalPageReady(page: RenderedPageLike): void {
  const result = validateRenderedPageForPhase(page, 'delivery');
  if (!result.passed || result.hardBlock) {
    const codes = (result.issues || []).map((issue) => issue.code).join(', ') || 'UNKNOWN_FINAL_PAGE_FAILURE';
    throw new Error(`Final page is not production-ready: ${codes}`);
  }
}
