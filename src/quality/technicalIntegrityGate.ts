import * as cheerio from 'cheerio';
import { normalizeFaqQuestionText, normalizeFaqAnswerText, hasFaqNumberingArtifact } from '../utils/faqSanitizer.js';

export type TechnicalIntegritySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface TechnicalIntegrityIssue {
  code: string;
  severity: TechnicalIntegritySeverity;
  message: string;
  evidence?: string;
}

export interface TechnicalIntegrityReport {
  passed: boolean;
  hardBlock: boolean;
  issues: TechnicalIntegrityIssue[];
  issueCodes: string[];
  visibleFaqCount: number;
  schemaFaqCount: number;
}

interface FaqPair {
  question: string;
  answer: string;
}

function cleanText(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function visibleText($: cheerio.CheerioAPI): string {
  const clone = $.root().clone();
  clone.find('script,style,noscript,template,svg').remove();
  return cleanText(clone.find('body').text() || clone.text());
}

function normalizeQuestion(value: any): string {
  return normalizeFaqQuestionText(String(value ?? ''))
    .replace(/^¿\s*\d+\s*¿/g, '¿')
    .replace(/^\s*\d+[\).\-\s]+(?=¿)/g, '')
    .replace(/^¿\s*\d+[\).\-\s]+/g, '¿')
    .replace(/^\s*\d+[\).\-\s]+/g, '')
    .replace(/[¿?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAnswer(value: any): string {
  return normalizeFaqAnswerText(String(value ?? '')).replace(/\s+/g, ' ').trim();
}

function uniqueFaqPairs(items: FaqPair[]): FaqPair[] {
  const out: FaqPair[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const question = normalizeQuestion(item.question);
    const answer = normalizeAnswer(item.answer);
    if (!question || !answer) continue;
    const key = question.toLowerCase().replace(/[¿?]/g, '').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ question, answer });
  }
  return out;
}

export function extractVisibleFaqPairs($: cheerio.CheerioAPI): FaqPair[] {
  const candidates: FaqPair[] = [];
  // Excluir explícitamente contenedores de navegación para evitar "Menú" contaminado
  const faqSelectors = [
    '.faq-item', '.faq-card', '.faq-entry', '[data-faq-item]',
    '.faq-section details', '.faq-list > li', '.faq-grid > article',
    '#faq details', '.semantic-section--faq details', '.faq-item summary', '.faq-summary-refined'
  ].join(', ');

  $(faqSelectors).each((_i, el) => {
    const $el = $(el);
    // Ignorar elementos dentro de navegación
    if ($el.closest('nav, header, .nav-mobile, .site-header, .site-navigation').length > 0) return;

    const q = cleanText($el.find('summary, .faq-question, .faq-card__question, .faq-summary-refined, h3, h4, strong').first().text());
    let a = cleanText($el.find('.faq-answer, .faq-card__answer, .faq-content, p').first().text());
    if (!a) {
      const clone = $el.clone();
      clone.find('summary, .faq-question, .faq-card__question, .faq-summary-refined, h3, h4, strong').first().remove();
      a = cleanText(clone.text());
    }
    if (q && a && q.length > 5 && a.length > 10) candidates.push({ question: q, answer: a });
  });
  return uniqueFaqPairs(candidates);
}

function schemaGraph(parsed: any): any[] {
  if (Array.isArray(parsed?.['@graph'])) return parsed['@graph'];
  if (Array.isArray(parsed)) return parsed;
  return parsed && typeof parsed === 'object' ? [parsed] : [];
}

function isType(node: any, typeName: string): boolean {
  const type = node?.['@type'];
  const types = Array.isArray(type) ? type : [type];
  return types.includes(typeName);
}

export function extractSchemaFaqPairs($: cheerio.CheerioAPI): FaqPair[] {
  const items: FaqPair[] = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      for (const node of schemaGraph(parsed)) {
        if (!isType(node, 'FAQPage') || !Array.isArray(node.mainEntity)) continue;
        for (const entity of node.mainEntity) {
          items.push({
            question: entity?.name || '',
            answer: entity?.acceptedAnswer?.text || '',
          });
        }
      }
    } catch {
      // reported by analyzer
    }
  });
  return uniqueFaqPairs(items);
}

function pushIssue(issues: TechnicalIntegrityIssue[], code: string, severity: TechnicalIntegritySeverity, message: string, evidence?: string): void {
  issues.push({ code, severity, message, evidence: evidence ? evidence.slice(0, 180) : undefined });
}

function detectVisualPlaceholders($: cheerio.CheerioAPI): string[] {
  const bad: string[] = [];
  $('img, source').each((_i, el) => {
    const $el = $(el);
    const src = cleanText($el.attr('src') || $el.attr('srcset') || $el.attr('data-src') || '');
    if (!src) {
      bad.push('empty-src');
      return;
    }
    if (/placeholder|placehold\.co|dummyimage|loremflickr|via\.placeholder|image-not-found|\/assets\/placeholder|\/placeholder\./i.test(src)) {
      bad.push(src);
    }
  });
  $('[style]').each((_i, el) => {
    const style = String($(el).attr('style') || '');
    if (/placeholder|placehold\.co|dummyimage|image-not-found/i.test(style)) bad.push(style);
  });
  return bad;
}

export function analyzeTechnicalIntegrity(html: string): TechnicalIntegrityReport {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  const issues: TechnicalIntegrityIssue[] = [];
  const text = visibleText($);
  const visibleFaq = extractVisibleFaqPairs($);
  const schemaFaq = extractSchemaFaqPairs($);

  if (!$('head').length || !$('body').length) pushIssue(issues, 'HTML_STRUCTURE_INCOMPLETE', 'critical', 'El documento no contiene head/body completos.');
  if ($('meta[name="viewport"]').length !== 1 || !/width\s*=\s*device-width/i.test(String($('meta[name="viewport"]').attr('content') || ''))) {
    pushIssue(issues, 'MOBILE_VIEWPORT_MISSING', 'critical', 'Falta meta viewport válido en el head.');
  }

  const placeholderRx = /\[[^\]]+\]|\{\{[^}]+\}\}|\b(?:placeholder|undefined|null|object object)\b|\bEn\s*[,.;:]|\bFactor\s*\d+\b|\bCriterio\s*\d+\b/gi;
  const placeholderHits = text.match(placeholderRx) || [];
  if (placeholderHits.length) pushIssue(issues, 'PLACEHOLDER_OR_BROKEN_COPY', 'critical', 'Hay placeholders o fragmentos rotos visibles.', placeholderHits.join(' | '));

  const systemRx = /AI Response:|Writing Phase:|Block Index:|contract-|skeleton-|layout-hotfix-|generic-layout/gi;
  const systemHits = text.match(systemRx) || [];
  if (systemHits.length) pushIssue(issues, 'SYSTEM_LEAK_VISIBLE', 'critical', 'Hay rastros internos visibles.', systemHits.join(' | '));

  let schemaInvalid = false;
  $('script[type="application/ld+json"]').each((_i, el) => {
    try { JSON.parse($(el).text()); } catch { schemaInvalid = true; }
  });
  if (schemaInvalid) pushIssue(issues, 'SCHEMA_JSON_INVALID', 'critical', 'JSON-LD inválido.');
  if ($('script[type="application/ld+json"]').length < 1) pushIssue(issues, 'SCHEMA_MISSING', 'critical', 'No hay JSON-LD.');

  const visibleKeys = new Set(visibleFaq.map(f => f.question.toLowerCase().replace(/[¿?]/g, '').trim()));
  const schemaKeys = new Set(schemaFaq.map(f => f.question.toLowerCase().replace(/[¿?]/g, '').trim()));
  if (schemaFaq.length > 0 && visibleFaq.length > 0) {
    const invisibleSchemaQuestions = [...schemaKeys].filter(key => !visibleKeys.has(key));
    if (schemaFaq.length !== visibleFaq.length || invisibleSchemaQuestions.length > 0) {
      pushIssue(issues, 'FAQ_SCHEMA_CONTENT_MISMATCH', 'critical', `FAQ visible (${visibleFaq.length}) no coincide con FAQ schema (${schemaFaq.length}).`, invisibleSchemaQuestions.join(' | '));
    }
  }
  if (hasFaqNumberingArtifact(text) || schemaFaq.some(f => hasFaqNumberingArtifact(f.question))) {
    pushIssue(issues, 'FAQ_NUMBERING_ARTIFACT', 'error', 'Hay numeración artificial en preguntas FAQ.');
  }

  const badIndexLinks: string[] = [];
  $('a[href]').each((_i, el) => {
    const href = cleanText($(el).attr('href') || '');
    if (href === '/index.html' || /^https?:\/\/[^/]+\/index\.html(?:[#?]|$)/i.test(href)) badIndexLinks.push(href);
  });
  if (badIndexLinks.length) pushIssue(issues, 'BROKEN_INTERNAL_INDEX_LINK', 'critical', 'Hay enlaces de entorno local /index.html.', badIndexLinks.join(' | '));

  const badVisuals = detectVisualPlaceholders($);
  if (badVisuals.length) pushIssue(issues, 'PRODUCTION_PLACEHOLDER_VISUAL', 'critical', 'Hay imágenes placeholder, vacías o rotas.', badVisuals.join(' | '));

  const hardCodes = new Set([
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
  const issueCodes = Array.from(new Set(issues.map(i => i.code)));
  const hardBlock = issueCodes.some(code => hardCodes.has(code));
  return {
    passed: !hardBlock,
    hardBlock,
    issues,
    issueCodes,
    visibleFaqCount: visibleFaq.length,
    schemaFaqCount: schemaFaq.length,
  };
}

function ensureViewport($: cheerio.CheerioAPI): void {
  const wanted = 'width=device-width, initial-scale=1.0';
  const existing = $('meta[name="viewport"]');
  if (existing.length) {
    existing.first().attr('content', wanted);
    existing.slice(1).remove();
  } else {
    if (!$('head').length) $('html').prepend('<head></head>');
    $('head').prepend(`<meta name="viewport" content="${wanted}">`);
  }
}

function normalizeProductionLinks($: cheerio.CheerioAPI): void {
  $('a[href]').each((_i, el) => {
    const $el = $(el);
    const href = cleanText($el.attr('href') || '');
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

function syncFaqSchemaFromVisible($: cheerio.CheerioAPI): void {
  const visibleFaq = extractVisibleFaqPairs($);
  if (visibleFaq.length < 1) return;
  const mainEntity = visibleFaq.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }));

  let jsonScripts = $('script[type="application/ld+json"]');
  
  if (jsonScripts.length === 0) {
    const basicSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'LocalBusiness',
          '@id': '#localbusiness'
        }
      ]
    };
    $('head').append(`<script type="application/ld+json">${JSON.stringify(basicSchema)}</script>`);
    jsonScripts = $('script[type="application/ld+json"]');
  }

  jsonScripts.each((_i, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = schemaGraph(parsed);
      let touched = false;

      for (const node of graph) {
        if (isType(node, 'FAQPage')) {
          node.mainEntity = mainEntity;
          touched = true;
        }
      }
      
      if (!touched) {
        const faqNode = {
          '@type': 'FAQPage',
          mainEntity,
        };
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
      // The repair kit can replace invalid JSON-LD; this generic polish keeps unknown schema untouched.
    }
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

function sanitizeVisibleFaqText($: cheerio.CheerioAPI): void {
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
    const q = $el.find('summary, .faq-question, .faq-card__question, .faq-summary-refined, h3, h4, strong').first();
    if (q.length) q.text(normalizeQuestion(q.text()));
    const a = $el.find('.faq-answer, .faq-card__answer, .faq-content, p').first();
    if (a.length) a.text(normalizeAnswer(a.text()));
  });
}

function removeVisiblePlaceholders($: cheerio.CheerioAPI, city?: string): void {
  const safeCity = cleanText(city || 'tu zona');
  $('body *').contents().each((_i, node) => {
    if (node.type !== 'text') return;
    const original = (node as any).data || '';
    let next = original
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\{\{[^}]+\}\}/g, '')
      .replace(/\bEn\s*([,.;:])/g, `En ${safeCity}$1`)
      .replace(/\b(undefined|null|object object)\b/gi, '')
      .replace(/\b(?:Factor|Criterio)\s*\d+\b/gi, '')
      .replace(/\s{2,}/g, ' ');
    if (next !== original) $(node).replaceWith(next);
  });
}

export function enforceTechnicalIntegrityPolish(html: string, options: { city?: string; niche?: string } = {}): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  ensureViewport($);
  sanitizeVisibleFaqText($);
  syncFaqSchemaFromVisible($);
  normalizeProductionLinks($);
  removeVisiblePlaceholders($, options.city);
  return $.html({ decodeEntities: false }).replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
}

export function formatTechnicalIntegrityIssues(report: TechnicalIntegrityReport): string {
  if (!report.issues.length) return 'none';
  return report.issues.map(issue => `${issue.code}: ${issue.message}${issue.evidence ? ` (${issue.evidence})` : ''}`).join(' | ');
}
