import fs from 'fs/promises';
import path from 'path';
import { finalHtmlPolish } from '../utils/finalHtmlPolish.js';

async function main(): Promise<void> {
  const inputFile = process.argv[2];
  const cityArg = process.argv[3];

  if (!inputFile) {
    console.error('Uso: node polish_generated_html.js <ruta-html> [ciudad]');
    process.exit(1);
  }

  const absolute = path.resolve(process.cwd(), inputFile);
  const raw = await fs.readFile(absolute, 'utf8');
  const polished = finalHtmlPolish(raw, { city: cityArg });
  await fs.writeFile(absolute, polished, 'utf8');
  console.log(`[safe-polish] Archivo actualizado: ${absolute}`);
}

main().catch(err => {
  console.error('[safe-polish] Error:', err);
  process.exit(1);
});
