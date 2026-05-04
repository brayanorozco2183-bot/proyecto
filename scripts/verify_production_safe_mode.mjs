#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'src/config/productionSafeMode.ts',
  'src/renderers/blocks/productionVariants.ts',
  'src/design-system/deterministicAiKernel.ts',
  'src/renderers/blocks/contracts.ts'
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing file: ${file}`);
}

function assertContains(file, needle) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes(needle)) failures.push(`${file} does not contain ${needle}`);
}

if (!failures.length) {
  assertContains('src/config/productionSafeMode.ts', "services_grid: 'clean_cards'");
  assertContains('src/config/productionSafeMode.ts', "process_steps: 'numbered_list'");
  assertContains('src/config/productionSafeMode.ts', "local_proof: 'cards_minimal'");
  assertContains('src/config/productionSafeMode.ts', "cta_panel: 'minimal_phone_bar'");
  assertContains('src/renderers/blocks/productionVariants.ts', 'resolveProductionSafeVariant');
  assertContains('src/design-system/deterministicAiKernel.ts', 'productionSafeModeSummary()');
  assertContains('src/renderers/blocks/contracts.ts', 'getProductionSafeVariant');
}

if (failures.length) {
  console.error('[production-safe-mode] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[production-safe-mode] OK: stable delivery variants are installed.');
