import { sanitizeFinalRenderedHtml } from '../utils/finalDocumentSanitizer.js';
import * as cheerio from 'cheerio';

const input = `<!DOCTYPE html><html><head>
<title>Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio</title>
<meta name="description" content="Cerrajeros urgentes y aperturas en Getafe con cambio de cerraduras y apertura de puertas.">
<meta property="og:site_name" content="Cerrajeros Getafe 24h">
</head><body>
<h1>Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio Cerraduras</h1>
<section id="faq" data-block-type="faq"><div class="faq-block__accordion faq-block__accordion--refined">
<details class="faq-item faq-item-refined" data-faq-item="true"><summary class="faq-summary-refined"><span class="faq-summary-refined__text">¿Atendéis cierres metálicos?</span></summary><div class="faq-content-refined"><p>En , estos casos se resuelven mejor tras revisar el acceso y el estado del cierre.</p></div></details>
</div></section>
<section class="internal-links-hub"><a class="internal-links-item__anchor" href="/cerrajeros/getafe/">Abrir página</a></section>
<footer><h3 class="footer__brand-name">Cerrajeros 24h</h3></footer>
</body></html>`;

const output = sanitizeFinalRenderedHtml(input, {
  city: 'Getafe',
  niche: 'cerrajeros',
  businessName: 'Cerrajeros Getafe Pro',
  phone: '910112233'
});

const $ = cheerio.load(output);
const h1 = $('h1').first().text().trim();
const footerBrand = $('.footer__brand-name').first().text().trim();
const faqCount = $('.faq-item, .faq-entry').length;
const href = $('.internal-links-item__anchor').first().attr('href') || '';
const faqText = $('#faq').text();

if (h1 !== 'Cerrajeros en Getafe con diagnóstico claro y cobertura real') {
  throw new Error(`H1 no reparado: ${h1}`);
}
if (footerBrand !== 'Cerrajeros Getafe Pro') {
  throw new Error(`Footer brand no sincronizado: ${footerBrand}`);
}
if (faqCount < 4) {
  throw new Error(`FAQ insuficiente: ${faqCount}`);
}
if (!/index\.html$/i.test(href)) {
  throw new Error(`Href local no preservado: ${href}`);
}
if (/En\s*,/.test(faqText)) {
  throw new Error('Quedó un fragmento local roto en FAQ.');
}

console.log('OK: finalDocumentSanitizer endurece SEO, FAQ y enlaces locales.');
