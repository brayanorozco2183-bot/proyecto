#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const archive = path.join(root, '.gravity_archive', `production-clean-${stamp}`);
const targets = [];

function addIfExists(rel) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) targets.push(full);
}
addIfExists('output_sites');
addIfExists('scratch');
addIfExists('scripts/output_sites');
addIfExists('scripts/public_static');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.gravity_archive'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.bak($|[_-])|bak_ble_|bak-cleanup|\.orig$|\.old$/i.test(entry.name) || /\.(db|sqlite|sqlite3)$/i.test(entry.name)) targets.push(full);
  }
}
walk(root);

const unique = [...new Set(targets)].sort((a, b) => a.length - b.length);
console.log(`Elementos a archivar fuera del arbol activo: ${unique.length}`);
for (const item of unique) {
  const rel = path.relative(root, item);
  console.log(`${apply ? 'ARCHIVE' : 'DRY'} ${rel}`);
  if (apply) {
    const dest = path.join(archive, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(item, dest);
  }
}
if (!apply) console.log('\nDry-run. Ejecuta npm run prepare:production:apply para moverlos a .gravity_archive/.');
