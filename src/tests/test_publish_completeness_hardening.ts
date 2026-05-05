import { validateRenderCompleteness } from '../quality/postRenderCompletenessGuard.js';

const html = `<!DOCTYPE html><html><head><meta property="og:site_name" content="Servicio local"></head><body>
<a class="internal-links-item__anchor" href="#top">Abrir página</a>
<p>En , conviene revisar el caso y ver si en compensa reparar.</p>
</body></html>`;

const result = validateRenderCompleteness(html);
const codes = result.issues.map(i => i.code);
for (const code of ['BROKEN_LOCAL_FRAGMENT', 'BROKEN_COMPENSA', 'INTERNAL_LINKS_TOP_FALLBACK', 'BRAND_GENERIC_SITE_NAME']) {
  if (!codes.includes(code)) throw new Error(`Falta issue esperado: ${code}`);
}

console.log('OK: publish completeness hardening');
