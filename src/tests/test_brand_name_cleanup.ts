import { finalHtmlPolish } from '../utils/finalHtmlPolish.js';

const html = `<!DOCTYPE html><html><head><meta property="og:site_name" content="Bombines Getafe Express En Getafe"></head><body><footer><h3 class="footer__brand-name">Bombines Getafe Express En Getafe</h3></footer></body></html>`;
const out = finalHtmlPolish(html, { city: 'Getafe' });
if (/Express En Getafe/i.test(out)) throw new Error('La limpieza de marca no eliminó el sufijo duplicado de ciudad.');
console.log('OK test_brand_name_cleanup');
