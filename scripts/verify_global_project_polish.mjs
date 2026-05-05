#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const checks = [
  ['src/utils/globalProjectPolish.ts', 'applyGlobalProjectPolish'],
  ['src/design-system/globalProjectPolishCss.ts', 'GLOBAL_PROJECT_POLISH_CSS'],
  ['src/utils/finalDocumentSanitizer.ts', 'applyGlobalProjectPolish'],
  ['package.json', 'verify:global-project-polish']
];

let failed = false;
for (const [file, needle] of checks) {
  if (!existsSync(file)) {
    console.error(`FAIL: falta ${file}`);
    failed = true;
    continue;
  }
  const content = readFileSync(file, 'utf8');
  if (!content.includes(needle)) {
    console.error(`FAIL: ${file} no contiene ${needle}`);
    failed = true;
  } else {
    console.log(`OK: ${file}`);
  }
}

if (failed) process.exit(1);
console.log('Global Project Polish instalado correctamente.');
