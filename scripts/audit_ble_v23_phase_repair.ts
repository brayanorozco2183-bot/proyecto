import fs from 'fs';
import path from 'path';
import { analyzeTechnicalIntegrity } from '../src/quality/technicalIntegrityGate.js';

function collectHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...collectHtmlFiles(full));
    else if (item.isFile() && item.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

const root = process.argv[2] || 'output_sites';
const htmlFiles = collectHtmlFiles(root);
let failures = 0;
console.log(`[BLE V2.3] Auditando ${htmlFiles.length} HTML(s) en ${root}`);
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const report = analyzeTechnicalIntegrity(html);
  const rel = path.relative(process.cwd(), file);
  if (report.passed) {
    console.log(`PASS ${rel} faq=${report.visibleFaqCount}/${report.schemaFaqCount}`);
  } else {
    failures++;
    console.error(`FAIL ${rel}: ${report.issueCodes.join(', ')}`);
    for (const issue of report.issues) {
      console.error(`  - ${issue.severity} ${issue.code}: ${issue.message}${issue.evidence ? ` (${issue.evidence})` : ''}`);
    }
  }
}
if (failures > 0) {
  console.error(`[BLE V2.3] ${failures} archivo(s) no están listos para producción.`);
  process.exit(1);
}
console.log('[BLE V2.3] Todos los HTML auditados están listos para producción.');
