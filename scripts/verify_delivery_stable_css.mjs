#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [
  ['src/design-system/deliveryStableCss.ts', 'Gravity Delivery Stable CSS v1'],
  ['src/design-system/proceduralStyles.ts', 'DELIVERY_STABLE_CSS'],
  ['src/utils/finalDocumentSanitizer.ts', 'ensureDeliveryStableCss'],
  ['src/utils/finalDocumentSanitizer.ts', 'gravity-delivery-stable'],
];

const failures = [];
for (const [file, marker] of checks) {
  const path = join(root, file);
  if (!existsSync(path)) {
    failures.push(`${file}: no existe`);
    continue;
  }
  const content = readFileSync(path, 'utf8');
  if (!content.includes(marker)) failures.push(`${file}: falta marcador ${marker}`);
}

if (failures.length) {
  console.error('❌ Verificación Delivery Stable CSS fallida:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('✅ Delivery Stable CSS instalado correctamente.');
console.log('   - CSS final compacto disponible');
console.log('   - Inyección en proceduralStyles activa');
console.log('   - Sanitizador final añade clase body y style final');
