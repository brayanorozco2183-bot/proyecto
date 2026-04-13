import * as cheerio from 'cheerio';

export interface RenderOutputGuardResult {
  html: string;
  reverted: boolean;
  reason?: string;
  issues: string[];
}

const ROGUE_CLASS_PATTERNS = [
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
  /\bmap-blockheader\b/i,
  /\bmap-blockactions\b/i,
  /\bblockframe\b/i,
  /\bservices-gridlead\b/i,
  /\bservices-gridcta-group\b/i,
  /\blocal-prooflead\b/i,
  /\blocal-proofdetails\b/i,
  /\btrust-bandmarquee\b/i,
];

const BROKEN_TAG_PATTERNS = [
  /<span[^>]*>[^<]*<\/h[1-6]>/i,
  /<div[^>]*>[^<]*<\/span>\s*<\/a>/i,
  /<figcaption[^>]*>[^<]*<\/span>/i,
  /<style[^>]*>[^<]*<\/a>/i,
  /<a[^>]*>\s*<li\b/i,
  /<li[^>]*>\s*<a[^>]*>\s*<meta/i,
];

const EXPECTED_BEM_SELECTORS = [
  'hero__subtitle',
  'hero-visual__caption',
  'block__header',
  'block__title',
  'faq-block__editorial-list',
  'process-steps__timeline',
  'local-proof__grid',
  'trust-strip__pills',
  'nav__link',
  'brand__name',
];

function fingerprint(html: string) {
  const $ = cheerio.load(html);
  const classes = new Set<string>();
  $('[class]').each((_ignored: any, el: any) => {
    const raw = $(el).attr('class') || '';
    raw.split(/\s+/).filter(Boolean).forEach((c: string) => classes.add(c));
  });

  return {
    h1s: $('h1').length,
    h2s: $('h2').length,
    headers: $('header').length,
    footers: $('footer').length,
    navs: $('nav').length,
    anchors: $('a').length,
    styles: $('style').length,
    classes,
    textLength: $('body').text().replace(/\s+/g, ' ').trim().length,
  };
}

function countProblems(html: string): { issues: string[]; count: number } {
  const issues: string[] = [];

  for (const rx of ROGUE_CLASS_PATTERNS) {
    if (rx.test(html)) issues.push(`ROGUE_CLASS:${rx.source}`);
  }
  for (const rx of BROKEN_TAG_PATTERNS) {
    if (rx.test(html)) issues.push(`BROKEN_TAG:${rx.source}`);
  }

  for (const selector of EXPECTED_BEM_SELECTORS) {
    const collapsed = selector.replace(/__/g, '').replace(/--/g, '');
    if (html.includes(collapsed) && !html.includes(selector)) {
      issues.push(`BEM_COLLAPSE:${selector}->${collapsed}`);
    }
  }

  return { issues, count: issues.length };
}

export function guardRenderedHtml(originalHtml: string, candidateHtml: string): RenderOutputGuardResult {
  const before = fingerprint(originalHtml);
  const after = fingerprint(candidateHtml);
  const beforeProblems = countProblems(originalHtml);
  const afterProblems = countProblems(candidateHtml);
  const issues: string[] = [...afterProblems.issues];

  const requiredClassLoss = EXPECTED_BEM_SELECTORS.filter((cls) => before.classes.has(cls) && !after.classes.has(cls));
  
  const criticalMetricRegression = 
    (after.h1s !== 1 && after.h1s !== before.h1s) ||
    after.headers < before.headers ||
    after.footers < before.footers ||
    after.navs < before.navs ||
    after.textLength < before.textLength * 0.78 ||
    requiredClassLoss.length > 0;

  if (afterProblems.count > beforeProblems.count || criticalMetricRegression) {
    if (after.h1s !== 1 && after.h1s !== before.h1s) issues.push(`H1_COUNT_INVALID:${after.h1s}`);
    if (afterProblems.count > beforeProblems.count) issues.push('REGRESSION_MORE_CORRUPTION_MARKERS');
    
    return {
      html: originalHtml,
      reverted: true,
      reason: 'Sanitizer regression detected; preserving original rendered HTML.',
      issues,
    };
  }

  return { html: candidateHtml, reverted: false, issues: [] };
}
