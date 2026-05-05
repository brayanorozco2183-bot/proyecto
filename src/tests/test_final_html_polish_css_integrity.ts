import { strict as assert } from 'assert';
import { finalHtmlPolish } from '../utils/finalHtmlPolish.js';

const input = `<!DOCTYPE html><html><head>
<style id="optimized-bundle">:root{--h1-size:1rem;--h2-size:1rem;--hero-title-size:1rem}body:before{background:#f8fafc,transparent 25%)}</style>
</head><body><section class="internal-links-hub"><div class="internal-links-item"><h3 class="internal-links-item__title">Money page</h3></div></section></body></html>`;

const output = finalHtmlPolish(input, { city: 'Madrid' });

assert(!output.includes('background:#f8fafc,transparent 25%)'));
assert(!output.includes('--hero-title-size:1rem;--h1-size:1rem;--h2-size:1rem'));
assert(output.includes('patch-premium-safe-polish'));
assert(output.includes('Abrir página'));

console.log('OK: finalHtmlPolish no destruye el CSS y repara anchors internos.');
