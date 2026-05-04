import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'src/design-system/conversionUxPatch.ts',
  'src/design-system/procedural-engine.ts',
  'src/design-system/components/index.ts',
  'src/design-system/proceduralStyles.ts',
  'src/renderers/blocks/servicesGrid/variants.ts'
];

const requiredMarkers = [
  ['src/design-system/procedural-engine.ts', 'renderEarlyTrustStrip'],
  ['src/design-system/procedural-engine.ts', 'renderMobileStickyCta'],
  ['src/design-system/proceduralStyles.ts', 'Gravity Conversion UX Super Patch'],
  ['src/design-system/components/index.ts', 'formatCtaLabel'],
  ['src/renderers/blocks/servicesGrid/variants.ts', 'serviceIcon']
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing file: ${file}`);
    failed = true;
  }
}

for (const [file, marker] of requiredMarkers) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  if (!content.includes(marker)) {
    console.error(`Missing marker "${marker}" in ${file}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Conversion UX patch audit passed.');
