import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'src/utils/finalClientFacingSanitizer.ts',
  'src/utils/cleanDeliveryHtmlNormalizer.ts',
  'src/design-system/finalDeliveryCascadeLockCss.ts',
  'src/design-system/procedural-global.css',
  'src/design-system/proceduralStyles.ts',
  'src/utils/finalDocumentSanitizer.ts',
  'src/seo/schemaFactory.ts'
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('[verify:final-client-polish] Missing files:', missing.join(', '));
  process.exit(1);
}

const sanitizer = readFileSync('src/utils/finalDocumentSanitizer.ts', 'utf8');
const schema = readFileSync('src/seo/schemaFactory.ts', 'utf8');
const client = readFileSync('src/utils/finalClientFacingSanitizer.ts', 'utf8');
const styles = readFileSync('src/design-system/proceduralStyles.ts', 'utf8');

const checks = [
  ['finalDocumentSanitizer imports client polish', sanitizer.includes('finalClientFacingSanitizer')],
  ['finalDocumentSanitizer imports clean delivery normalizer', sanitizer.includes('cleanDeliveryHtmlNormalizer')],
  ['finalDocumentSanitizer calls normalizeCleanDeliveryHtml', sanitizer.includes('normalizeCleanDeliveryHtml(legalSafeHtml')],
  ['finalDocumentSanitizer calls polishClientFacingHtml', sanitizer.includes('polishClientFacingHtml(')],
  ['schemaFactory rejects placeholder phones', schema.includes('looksLikePlaceholderPhone') && schema.includes('GRAVITY_ALLOW_UNVERIFIED_NAP_SCHEMA')],
  ['client polish strips fake double country prefix', client.includes('\\+\\s*34\\s*\\+\\s*34') || client.includes('+\\s*34')],
  ['client polish injects final client CSS', client.includes('gravity-final-client-facing-css')],
  ['procedural styles default to non layered CSS', styles.includes('GRAVITY_LEGACY_LAYERED_CSS')]
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  console.error('[verify:final-client-polish] Failed checks:');
  for (const name of failed) console.error(' - ' + name);
  process.exit(1);
}

console.log('[verify:final-client-polish] OK');
