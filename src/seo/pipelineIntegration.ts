import { buildRenderedSeo } from './pageSeoContract.js';
import type { RenderedSeoContract } from './types.js';

export function attachRenderedSeoToDraft(draft: any, renderedSeo: RenderedSeoContract): any {
  return {
    ...draft,
    metadata: {
      ...(draft?.metadata || {}),
      seo: renderedSeo,
    },
  };
}

export function attachRenderedSeoToPage(page: any, renderedSeo: RenderedSeoContract): any {
  return {
    ...page,
    metadata: {
      ...(page?.metadata || {}),
      seo: renderedSeo,
    },
  };
}

export function buildSeoForPipeline(pagePlan: any, mission: any, faqs: Array<{ question: string; answer: string }> = []): {
  seoBrief: any;
  renderedSeo: RenderedSeoContract;
} {
  return buildRenderedSeo({
    pagePlan,
    mission,
    faqs,
    baseUrl: mission?.siteConfig?.baseUrl,
    siteName: mission?.siteConfig?.brandName || mission?.local_nap?.business_name,
    ogImage: mission?.siteConfig?.defaultOgImage,
  });
}