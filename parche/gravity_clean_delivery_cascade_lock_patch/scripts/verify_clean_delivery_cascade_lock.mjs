import { readFileSync, existsSync } from 'node:fs';

const required = [
  'src/design-system/finalDeliveryCascadeLockCss.ts',
  'src/design-system/procedural-global.css',
  'src/utils/cleanDeliveryHtmlNormalizer.ts',
  'src/utils/finalDocumentSanitizer.ts',
  'src/repair/pageRepairKit.ts'
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('[clean-delivery] Missing files:', missing.join(', '));
  process.exit(1);
}

const sanitizer = readFileSync('src/utils/finalDocumentSanitizer.ts', 'utf8');
const repairKit = readFileSync('src/repair/pageRepairKit.ts', 'utf8');
const normalizer = readFileSync('src/utils/cleanDeliveryHtmlNormalizer.ts', 'utf8');

const checks = [
  ['sanitizer imports normalizer', sanitizer.includes('normalizeCleanDeliveryHtml')],
  ['repair kit runs normalizer', repairKit.includes('normalizeCleanDeliveryHtml(repaired, options)')],
  ['nav desktop/mobile lock exists', normalizer.includes('.nav--desktop') && normalizer.includes('.nav-mobile')],
  ['hero local image normalizer exists', normalizer.includes('normalizeLocalImageSrc')],
  ['loose list styling exists', normalizer.includes('gravity-list-card')],
  ['final css injection exists', normalizer.includes('gravity-final-delivery-cascade-lock-css')],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
if (failed.length) {
  console.error('[clean-delivery] Verification failed:', failed.join(', '));
  process.exit(1);
}

console.log('[clean-delivery] OK: cascade lock, DOM normalizer, image/link/list repairs are installed.');
