import { sanitizeFinalRenderedHtml } from '../utils/finalDocumentSanitizer.js';

const html = `<!doctype html><html><head><title>Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio</title><meta property="og:title" content="Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio"><meta property="og:site_name" content="Cerrajeros Getafe Pro"><link rel="canonical" href="https://serviciosprofesionales.pro/cerrajeros/getafe/"></head><body><header class="site-header"><div class="brand"><span class="brand__name">Cerrajeros Pro</span></div></header><main><h1>Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio</h1><section id="faq" data-block-type="faq"><div class="faq-block__accordion"></div></section></main><footer><h3 class="footer__brand-name">Cerrajeros Pro</h3></footer></body></html>`;
const out = sanitizeFinalRenderedHtml(html, { city: 'Getafe', niche: 'cerrajeros', businessName: 'Cerrajeros Getafe Pro' });
if (!out.includes('Cerrajeros Getafe Pro')) throw new Error('Brand sync failed.');
if ((out.match(/<details class="faq-item-refined faq-item"/g) || []).length < 4) throw new Error('FAQ floor not enforced.');
if (/Urgentes en Getafe - Apertura Puertas/.test(out)) throw new Error('Overloaded SEO title/H1 was not normalized.');
console.log('OK test_brand_sync_and_seo_alignment');
