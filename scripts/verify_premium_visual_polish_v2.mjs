import { readFileSync, existsSync } from 'node:fs';

const required = [
  'src/utils/premiumVisualPolishV2.ts',
  'src/utils/finalDocumentSanitizer.ts'
];
const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('[verify:premium-visual-polish-v2] Missing files:', missing.join(', '));
  process.exit(1);
}
const polish = readFileSync('src/utils/premiumVisualPolishV2.ts', 'utf8');
const sanitizer = readFileSync('src/utils/finalDocumentSanitizer.ts', 'utf8');
const checks = [
  ['final sanitizer imports v2', sanitizer.includes('premiumVisualPolishV2')],
  ['final sanitizer calls v2', sanitizer.includes('applyPremiumVisualPolishV2(releaseFrozenHtml')],
  ['breadcrumb css exists', polish.includes('.el-breadcrumbs__list')],
  ['conversion proof css exists', polish.includes('.conversion-proof-item__value')],
  ['signals converted to checks', polish.includes("$el.text('✓')")],
  ['mobile sticky cta css exists', polish.includes('.mobile-sticky-cta')],
  ['loose list css exists', polish.includes('.premium-designed-list')],
  ['broken map text repair exists', polish.includes('Trabajamos con cobertura operativa')]
];
const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error('[verify:premium-visual-polish-v2] Failed checks:');
  for (const item of failed) console.error(' - ' + item);
  process.exit(1);
}
console.log('[verify:premium-visual-polish-v2] OK');
