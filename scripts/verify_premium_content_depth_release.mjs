#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['src/utils/premiumContentDepth.ts', 'GRAVITY_PREMIUM_CONTENT_DEPTH_APPLIED'],
  ['src/utils/finalDocumentSanitizer.ts', 'applyPremiumContentDepth'],
  ['src/repair/pageRepairKit.ts', 'applyPremiumContentDepth'],
  ['src/pipelines/phases/delivery.phase.ts', 'applyPremiumContentDepth'],
  ['package.json', 'verify:premium-content-depth'],
  ['.env.example', 'GRAVITY_PREMIUM_TARGET_WORDS']
];

let failed = false;
for (const [file, needle] of checks) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    console.error(`[FAIL] Missing ${file}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(p, 'utf8');
  if (!text.includes(needle)) {
    console.error(`[FAIL] ${file} does not contain ${needle}`);
    failed = true;
  } else {
    console.log(`[OK] ${file}`);
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!pkg.scripts?.['release:premium-check']) {
  console.error('[FAIL] package.json missing release:premium-check');
  failed = true;
} else {
  console.log('[OK] release:premium-check available');
}

console.log('\nAfter generating a page, the final HTML should contain:');
console.log('  GRAVITY_PREMIUM_CONTENT_DEPTH_APPLIED');
console.log('  gravity-premium-content-depth-css');
console.log('  data-gravity-content-depth="premium-v1"');
console.log('  <meta name="gravity-premium-word-count" ...>');

if (failed) process.exit(1);
console.log('\nPremium Content Depth release files are installed.');
