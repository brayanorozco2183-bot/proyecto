import fs from 'fs/promises';
import path from 'path';
import { analyzeTechnicalIntegrity, formatTechnicalIntegrityIssues } from '../src/quality/technicalIntegrityGate.js';

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [] as any[]);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.html?$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const root = process.argv[2] || path.join(process.cwd(), 'output_sites');
  const files = await walk(root);
  let failed = 0;
  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const report = analyzeTechnicalIntegrity(html);
    if (!report.passed) {
      failed++;
      console.error(`\n[FAIL] ${path.relative(process.cwd(), file)}`);
      console.error(formatTechnicalIntegrityIssues(report));
    }
  }
  console.log(`\nBLE V2.2 technical integrity audit: ${files.length - failed}/${files.length} passed`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
