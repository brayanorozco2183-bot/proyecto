import { buildSeoMetaFallback } from './index.js';

export function exampleSeoFallbackUsage(): void {
  const seo = buildSeoMetaFallback({
    niche: 'cerrajeros',
    city: 'Madrid',
    neighborhood: 'Chamberí',
    intent: 'urgent',
    pageType: 'neighborhood',
    seedHint: 'demo',
  });

  console.log(seo.title, seo.description, seo.h1);
}
