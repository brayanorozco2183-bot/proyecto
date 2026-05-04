import fs from 'fs/promises';
import path from 'path';
import { runFinalProductionAudit, renderFinalProductionAuditMarkdown } from '../src/quality/finalProductionAudit.js';

async function main(): Promise<void> {
  const target = process.argv[2] || path.join(process.cwd(), 'output_sites');
  const stat = await fs.stat(target);
  const htmlFiles: string[] = [];

  async function scan(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await scan(full);
      else if (/\.html?$/i.test(entry.name)) htmlFiles.push(full);
    }
  }

  if (stat.isDirectory()) await scan(target);
  else htmlFiles.push(target);

  if (!htmlFiles.length) {
    console.error(`[audit:final-html] No se encontraron HTML en: ${target}`);
    process.exitCode = 1;
    return;
  }

  let criticalCount = 0;
  let warningCount = 0;
  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8');
    const audit = runFinalProductionAudit(html);
    const dir = path.dirname(file);
    const base = path.basename(file).replace(/\.html?$/i, '');
    const jsonPath = path.join(dir, `${base}.production_audit.json`);
    const mdPath = path.join(dir, `${base}.production_audit.md`);
    await fs.writeFile(jsonPath, JSON.stringify(audit, null, 2), 'utf8');
    await fs.writeFile(mdPath, renderFinalProductionAuditMarkdown(audit), 'utf8');
    criticalCount += audit.issues.filter((issue) => issue.severity === 'critical').length;
    warningCount += audit.issues.filter((issue) => issue.severity === 'warning').length;
    console.log(`[audit:final-html] ${path.relative(process.cwd(), file)} -> ${audit.status} score=${audit.score} issues=${audit.issues.length}`);
  }

  if (criticalCount > 0) {
    console.error(`[audit:final-html] Hay ${criticalCount} incidencias críticas y ${warningCount} warnings.`);
    process.exitCode = 2;
    return;
  }
  console.log(`[audit:final-html] OK. ${htmlFiles.length} HTML auditados. Warnings=${warningCount}.`);
}

main().catch((error) => {
  console.error('[audit:final-html] Error:', error?.message || error);
  process.exitCode = 1;
});
