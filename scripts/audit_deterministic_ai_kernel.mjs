
#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';

const target = process.argv[2] || 'index.html';
if (!existsSync(target)) {
  console.log(`[gravity audit] ${target} no existe; omitiendo auditoría HTML local.`);
  process.exit(0);
}
const html = readFileSync(target, 'utf8');
const checks = [
  ['DETERMINISTIC_CSS', /gravity-deterministic-premium-css/],
  ['NO_TEMPLATE_RESIDUE', /^((?![:;,\.\s]+este\s+bloque\s+resume).)*$/is],
  ['NO_EMPTY_LISTS', /^((?!<(?:ul|ol)[^>]*>\s*<\/\s*(?:ul|ol)>).)*$/is],
  ['NO_UNVERIFIED_REVIEWS', /^((?!Lo\s+que\s+dicen\s+nuestros\s+clientes|testimonios|reseñas\s+de\s+clientes).)*$/is],
  ['NO_BROKEN_LOCAL_COPY', /^((?!\ben\s+y\b|\ben\s+puede\s+variar\b).)*$/is]
];
let failed = 0;
for (const [name, rx] of checks) {
  const ok = rx.test(html);
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
