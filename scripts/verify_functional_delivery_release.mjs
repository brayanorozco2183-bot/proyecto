import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'src/utils/functionalDeliveryRelease.ts',
  'src/utils/finalDocumentSanitizer.ts',
  'src/repair/pageRepairKit.ts',
  'src/design-system/procedural-global.css'
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Falta ${file}`);
}

function mustContain(file, needle) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes(needle)) failures.push(`${file} no contiene ${needle}`);
}

if (existsSync('src/utils/finalDocumentSanitizer.ts')) {
  mustContain('src/utils/finalDocumentSanitizer.ts', 'applyFunctionalDeliveryRelease($, context)');
}
if (existsSync('src/repair/pageRepairKit.ts')) {
  mustContain('src/repair/pageRepairKit.ts', 'applyFunctionalDeliveryRelease($, options)');
}
if (existsSync('src/utils/functionalDeliveryRelease.ts')) {
  const text = readFileSync('src/utils/functionalDeliveryRelease.ts', 'utf8');
  for (const needle of [
    'gravity-functional-release',
    'gravity-functional-delivery-release-css',
    'normalizeBreadcrumbs',
    'normalizeProofStrip',
    'normalizeTrustSignals',
    'removeStyleDebt',
    'applyFunctionalDeliveryRelease'
  ]) {
    if (!text.includes(needle)) failures.push(`functionalDeliveryRelease.ts no contiene ${needle}`);
  }
}

if (failures.length) {
  console.error('❌ Functional Delivery Release no está completo:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('✅ Functional Delivery Release instalado correctamente.');
