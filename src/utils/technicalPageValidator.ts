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

  if (corruptionMarkers.some((rx) => rx.test(html))) {
    issues.push('CRITICAL_RENDER_CORRUPTION');
  }


  // SEO base
  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
  const h1s = $('h1');

  if (!title || title.length < 30 || title.length > 65) issues.push('TITLE_INVALID');
  if (!metaDescription || metaDescription.length < 110 || metaDescription.length > 170) issues.push('META_DESCRIPTION_INVALID');
  if (!canonical) issues.push('MISSING_CANONICAL');
  if (context.expectedCanonicalBase && canonical && !canonical.startsWith(context.expectedCanonicalBase)) issues.push('CANONICAL_BASE_MISMATCH');
  if (h1s.length !== 1) issues.push('H1_COUNT_INVALID');

  // Breadcrumbs visuales
  $('.el-breadcrumbs [itemprop="name"]').each((_ignored: any, el: any) => {
    const value = $(el).text().trim();
    if (!value) issues.push('BREADCRUMB_EMPTY_NAME');
  });

  // JSON-LD parseable + sanity
  const jsonLdNodes = $('script[type="application/ld+json"]');
  if (jsonLdNodes.length === 0) {
    issues.push('MISSING_JSON_LD');
  } else {
    jsonLdNodes.each((_ignored: any, el: any) => {
      try {
        const raw = $(el).contents().text();
        const parsed = JSON.parse(raw);
        const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [];
        const breadcrumbNode = graph.find((n: any) => n?.['@type'] === 'BreadcrumbList');
        const localBusiness = graph.find((n: any) => n?.['@type'] === 'LocalBusiness');

        if (breadcrumbNode?.itemListElement?.some((x: any) => typeof x?.name !== 'string' || !x.name.trim())) {
          issues.push('SCHEMA_BREADCRUMB_EMPTY_NAME');
        }
        if (breadcrumbNode?.itemListElement?.some((x: any) => /\/madrid\/madrid\/?$/i.test(String(x?.item || '')))) {
          issues.push('SCHEMA_BREADCRUMB_BAD_URL');
        }
        const streetAddress = localBusiness?.address?.streetAddress;
        if (streetAddress && context.mission?.city && String(streetAddress).trim().toLowerCase() === String(context.mission.city).trim().toLowerCase()) {
          issues.push('SCHEMA_STREETADDRESS_IS_CITY');
        }
      } catch {
        issues.push('JSON_LD_PARSE_ERROR');
      }
    });
  }

  // FAQ real
  if (context.requireFaq && !hasRealFaq($)) {
    issues.push('FAQ_REQUIRED_BUT_EMPTY');
  }

  // Empty premium shells
  const emptySelectors = [
    '.services-grid__cards:empty',
    '.process-steps__timeline:empty',
    '.local-proof__grid:empty',
    '.faq-block__editorial-list:empty'
  ];
  for (const selector of emptySelectors) {
    if ($(selector).length > 0) issues.push(`EMPTY_BLOCK:${selector}`);
  }

  // Placeholder leakage
  const placeholderPatterns = [
    /Inserta aquí el embed controlado/i,
    /pendiente de hidratar/i
  ];
  if (placeholderPatterns.some((p) => p.test(html))) issues.push('PRODUCTION_PLACEHOLDER_FOUND');

  // CSS variable integrity
  const styles = $('style').map((_ignored: any, el: any) => $(el).text()).get().join('\n');
  const defined = extractDefinedCssVars(styles);
  const used = extractUsedCssVars(styles);
  const missingVars = Array.from(used).filter((v) => !defined.has(v));
  if (missingVars.length > 0) issues.push(`UNDEFINED_CSS_VARS:${missingVars.join(',')}`);

  const expectedBEM = ['hero__subtitle', 'block__header', 'block__title', 'faq-block__editorial-list', 'process-steps__timeline'];
  const collapsedBEM = expectedBEM.filter((cls) => html.includes(cls.replace(/__/g, '').replace(/--/g, '')) && !html.includes(cls));
  if (collapsedBEM.length > 0) issues.push(`BEM_COLLAPSE:${collapsedBEM.join(',')}`);


  // Footer basics (Robust check)
  const rawFooterText = $('footer').text() || '';
  const footerText = rawFooterText.replace(/\s+/g, ' ').toLowerCase();
  
  if (context.expectedBusinessName) {
    const expected = context.expectedBusinessName.toLowerCase();
    // Use partial match and allow for minor noise/formatting
    if (!footerText.includes(expected) && !footerText.includes(expected.replace(/\s+/g, ''))) {
      // Re-scan with closer distance if needed, but for now just warn if basic includes fails
      // However, the pipeline is strict, so we keep the issue but check for common substrings
      const words = expected.split(' ');
      const hasSignificantPortion = words.filter(w => w.length > 3 && footerText.includes(w)).length / words.length > 0.6;
      if (!hasSignificantPortion) issues.push('FOOTER_MISSING_BUSINESS');
    }
  }
  if (context.mission?.city) {
    const expectedCity = String(context.mission.city).toLowerCase();
    if (!footerText.includes(expectedCity)) issues.push('FOOTER_MISSING_CITY');
  }

  // Visible content floor (Relaxed for sandbox/procedural edge cases)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').length;
  if (wordCount < 350) issues.push(`VISIBLE_BODY_TOO_SHORT:${wordCount}`);

  return issues;
}