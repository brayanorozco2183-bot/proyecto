import fs from 'fs/promises';
import path from 'path';
import { scoreRenderedOutput } from '../src/learning/scoring.js';
import { finalHtmlPolish } from '../src/utils/finalHtmlPolish.js';

const outputRoot = path.join(process.cwd(), 'output_sites');

function inferFromSlug(slug: string) {
  const parts = slug.split('-').filter(Boolean);
  const known = ['cerrajeros', 'fontaneros', 'pintores', 'electricistas', 'carpinteros'];
  const niche = known.find((item) => parts.includes(item)) || parts[0] || '';
  const city = parts[parts.length - 1] || '';
  return { niche, city: city.charAt(0).toUpperCase() + city.slice(1) };
}

async function main() {
  const dirs = await fs.readdir(outputRoot, { withFileTypes: true });
  const rows: string[] = ['slug,score,status,issues'];
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const htmlPath = path.join(outputRoot, dir.name, 'index.html');
    try {
      const raw = await fs.readFile(htmlPath, 'utf8');
      const { niche, city } = inferFromSlug(dir.name);
      const polished = finalHtmlPolish(raw, { niche, city });
      const scored = scoreRenderedOutput({ html: polished, niche, city, phone: '910000000', businessName: `${city} ${niche} Pro` } as any);
      rows.push(`${dir.name},${scored.score},${scored.status},"${scored.issueCodes.join('|')}"`);
    } catch {}
  }
  await fs.writeFile('BLE_V21_OUTPUT_AUDIT.csv', rows.join('\n'));
  console.log('Audit guardado en BLE_V21_OUTPUT_AUDIT.csv');
}

main().catch((err) => { console.error(err); process.exit(1); });
