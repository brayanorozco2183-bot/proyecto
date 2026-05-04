import fs from 'fs';
import path from 'path';

const root = process.cwd();
const required = [
  'src/utils/deliveryEditorialHardening.ts',
  'src/utils/finalDocumentSanitizer.ts'
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('[delivery-editorial-hardening] Faltan archivos:', missing.join(', '));
  process.exit(1);
}

const moduleText = fs.readFileSync(path.join(root, 'src/utils/deliveryEditorialHardening.ts'), 'utf8');
const sanitizerText = fs.readFileSync(path.join(root, 'src/utils/finalDocumentSanitizer.ts'), 'utf8');

const checks = [
  ['export hardenDeliveryEditorialHtml', /export\s+function\s+hardenDeliveryEditorialHtml/.test(moduleText)],
  ['export auditDeliveryEditorialHtml', /export\s+function\s+auditDeliveryEditorialHtml/.test(moduleText)],
  ['final sanitizer imports hardening', /deliveryEditorialHardening\.js/.test(sanitizerText)],
  ['final sanitizer calls hardening before deterministic sanitizer', /hardenDeliveryEditorialHtml\(\$\.html\(\),\s*context\)/.test(sanitizerText)],
  ['empty list check exists', /EMPTY_LIST/.test(moduleText)],
  ['unverified social proof check exists', /UNVERIFIED_SOCIAL_PROOF_COPY/.test(moduleText)],
  ['broken local fragment check exists', /BROKEN_LOCAL_FRAGMENT_EN_Y/.test(moduleText)]
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK ' : 'ERR'} ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error('[delivery-editorial-hardening] Verificación fallida.');
  process.exit(1);
}

console.log('[delivery-editorial-hardening] Verificación completada correctamente.');
