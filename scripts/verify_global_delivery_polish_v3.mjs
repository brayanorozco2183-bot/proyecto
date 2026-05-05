import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'src/utils/globalDeliveryPolish.ts',
  'src/utils/finalDocumentSanitizer.ts',
  'src/repair/pageRepairKit.ts'
];
const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  console.error('[global-delivery-polish-v3] Missing files:', missing.join(', '));
  process.exit(1);
}

const util = readFileSync(join(root, 'src/utils/globalDeliveryPolish.ts'), 'utf8');
const sanitizer = readFileSync(join(root, 'src/utils/finalDocumentSanitizer.ts'), 'utf8');
const repair = readFileSync(join(root, 'src/repair/pageRepairKit.ts'), 'utf8');
const pkg = readFileSync(join(root, 'package.json'), 'utf8');

const checks = [
  ['final CSS id', util.includes('gravity-global-delivery-polish-v3-css')],
  ['body class', util.includes('gravity-global-delivery-polish-v3')],
  ['legacy css cleanup', util.includes('removeLegacyPatchStyles')],
  ['breadcrumb polish', util.includes('gdp-breadcrumbs')],
  ['unstyled list polish', util.includes('gdp-check-list')],
  ['signal number cleanup', util.includes('Señal\\s*0?\\d+')],
  ['sanitizer integration', sanitizer.includes('applyGlobalDeliveryPolish($, context)')],
  ['repair integration', repair.includes('applyGlobalDeliveryPolish($, options)')],
  ['npm script', pkg.includes('verify:global-delivery-polish-v3')]
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error('[global-delivery-polish-v3] Failed checks:', failed.join(', '));
  process.exit(1);
}
console.log('[global-delivery-polish-v3] OK: global final delivery polish is installed and wired.');
