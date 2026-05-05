import { existsSync, readFileSync } from 'fs';

const checks = [
  ['src/utils/finalUxDeliveryGuard.ts', ['applyFinalUxDeliveryGuard', 'gravity-final-ux-delivery-guard-css', 'GRAVITY_FINAL_UX_DELIVERY_GUARD_APPLIED']],
  ['src/utils/finalDocumentSanitizer.ts', ['applyFinalUxDeliveryGuard']],
  ['src/repair/pageRepairKit.ts', ['applyFinalUxDeliveryGuard']],
  ['src/pipelines/phases/delivery.phase.ts', ['applyFinalUxDeliveryGuard']],
  ['package.json', ['verify:final-ux-delivery-guard']]
];

const failures = [];
for (const [file, needles] of checks) {
  if (!existsSync(file)) {
    failures.push(`Falta ${file}`);
    continue;
  }
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${file} no contiene ${needle}`);
  }
}

if (failures.length) {
  console.error('Final UX Delivery Guard verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Final UX Delivery Guard verification passed.');
