import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'src/design-system/procedural-engine.ts',
  'src/design-system/proceduralStyles.ts',
  'src/types/design.ts',
  'docs/PATCH_SUPER_TYPECHECK_FLOW_CLEANUP.md'
];

const optionalCssFile = 'src/design-system/procedural-global.css';
const failures = [];

function readText(file) {
  if (!existsSync(file)) return '';
  return readFileSync(file, 'utf8');
}

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const engine = readText('src/design-system/procedural-engine.ts');
const styles = readText('src/design-system/proceduralStyles.ts');
const css = readText(optionalCssFile);
const designTypes = readText('src/types/design.ts');
const proceduralCssSource = css || styles;

if (!engine.includes("import { getProceduralGlobalStyles } from './proceduralStyles.js';")) {
  failures.push('procedural-engine.ts does not import getProceduralGlobalStyles.');
}
if (!engine.includes('const globalStyles = getProceduralGlobalStyles();')) {
  failures.push('procedural-engine.ts still does not use getProceduralGlobalStyles().');
}
if (engine.includes('const globalStyles = `')) {
  failures.push('procedural-engine.ts still contains the giant inline globalStyles template.');
}
if (!styles.includes('PROCEDURAL_GLOBAL_STYLES_FALLBACK')) {
  failures.push('proceduralStyles.ts does not provide a CSS fallback.');
}
if (!styles.includes("readFileSync(new URL('./procedural-global.css'")) {
  failures.push('proceduralStyles.ts does not attempt to load procedural-global.css when present.');
}
if (!proceduralCssSource.includes('.el-container') || !proceduralCssSource.includes('.service-card')) {
  failures.push('Procedural CSS source does not contain core layout/card classes.');
}
if (!proceduralCssSource.includes('Gravity Conversion UX Super Patch')) {
  failures.push('Procedural CSS source does not include the conversion UX patch.');
}
if (!designTypes.includes('visualSystem?:') || !designTypes.includes('system?:')) {
  failures.push('ResolvedPageRenderPlan visualSystem aliases are not typed.');
}
if (!engine.includes('resolvedPlan.visualSystem.visualSystem') || !engine.includes('resolvedPlan.visualSystem.system')) {
  failures.push('Renderer compatibility path for visualSystem/system aliases is missing.');
}

if (failures.length) {
  console.error('Super patch verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const cssMode = css ? 'external procedural-global.css' : 'embedded fallback CSS';
console.log(`Super typecheck/flow cleanup verification passed. Renderer CSS loading, alias typing, fallback CSS and documentation are present (${cssMode}).`);
