import fs from 'fs/promises';
import path from 'path';
import { finalHtmlPolish } from '../utils/finalHtmlPolish.js';

async function run(): Promise<void> {
  const src = path.join(process.cwd(), 'src', 'tests', 'fixtures', 'broken-premium-sample.html');
  const out = path.join(process.cwd(), 'test_results', 'broken-premium-sample.polished.html');
  const raw = await fs.readFile(src, 'utf8');
  const polished = finalHtmlPolish(raw, { city: 'Getafe', niche: 'cerrajeros' });
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, polished, 'utf8');
  console.log(`[test_final_html_polish] OK -> ${out}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
