#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const archiveRoot = path.join(root, '.gravity_archive', `duplicate-js-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const duplicates = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.gravity_archive'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.js') && full.includes(`${path.sep}src${path.sep}`)) {
      const ts = full.slice(0, -3) + '.ts';
      if (fs.existsSync(ts)) duplicates.push(full);
    }
  }
}
walk(path.join(root, 'src'));

console.log(`Duplicados .js con par .ts encontrados: ${duplicates.length}`);
for (const file of duplicates) {
  const rel = path.relative(root, file);
  console.log(`${apply ? 'ARCHIVE' : 'DRY'} ${rel}`);
  if (apply) {
    const dest = path.join(archiveRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(file, dest);
  }
}
if (!apply) console.log('\nDry-run. Ejecuta npm run cleanup:duplicates:apply para archivar.');
