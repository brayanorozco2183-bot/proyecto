import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'src/renderers/blocks/contracts.ts',
  'src/renderers/blocks/types.ts',
  'src/renderers/blocks/index.ts',
  'src/renderers/blocks/shared/internalLinking.ts'
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

function file(path) {
  return readFileSync(path, 'utf8');
}

if (existsSync('src/renderers/blocks/contracts.ts')) {
  const contracts = file('src/renderers/blocks/contracts.ts');
  const requiredSnippets = [
    'export const BlockRendererInputSchema',
    'normalizeBlockRendererInput',
    'buildBlockReadiness',
    'assertBlockContract',
    'StrongItemsSchema',
    'LocalProofSchema',
    'TrustBandSchema',
    'FaqSchema',
    'HeroSchema',
    'z.unknown()'
  ];
  for (const snippet of requiredSnippets) {
    if (!contracts.includes(snippet)) failures.push(`contracts.ts missing snippet: ${snippet}`);
  }
}

if (existsSync('src/renderers/blocks/index.ts')) {
  const index = file('src/renderers/blocks/index.ts');
  if (!index.includes('normalizeBlockRendererInput')) failures.push('renderBlock does not call normalizeBlockRendererInput');
  if (index.includes('as any')) failures.push('index.ts still contains as any');
}

const guardFiles = [
  'comparisonTable', 'ctaPanel', 'faq', 'hero', 'localProof', 'map', 'servicesGrid', 'trustBand'
].map((name) => `src/renderers/blocks/${name}/guards.ts`);

for (const guardFile of guardFiles) {
  const body = file(guardFile);
  if (body.includes('return true;')) failures.push(`${guardFile} still has permissive return true guard`);
  if (!body.includes('BlockRendererInputSchema.safeParse')) failures.push(`${guardFile} does not validate with BlockRendererInputSchema`);
}

const schemaFiles = [
  'comparisonTable', 'ctaPanel', 'faq', 'hero', 'localProof', 'map', 'priceGuidance', 'processSteps', 'servicesGrid', 'trustBand', 'urgencyPanel'
].map((name) => `src/renderers/blocks/${name}/schema.ts`);

for (const schemaFile of schemaFiles) {
  const body = file(schemaFile);
  if (body.includes('z.any()')) failures.push(`${schemaFile} still contains z.any()`);
}

if (failures.length) {
  console.error('Patch verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Patch verification passed: block contracts, Zod guards, and any-reduction checks are present.');
