import fs from 'fs';
import path from 'path';

const root = process.cwd();
const skipDirs = new Set(['node_modules', '.git', 'output_sites']);
const findings: string[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.includes(path.join('src', 'experiments', 'results'))) continue;
      walk(full, out);
    } else if (/\.(ts|tsx|js|json|md)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string { return path.relative(root, file).replace(/\\/g, '/'); }
function existsModule(base: string): boolean {
  const candidates = [
    base,
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    base + '.ts',
    base + '.tsx',
    base + '.d.ts',
    path.join(base, 'index.ts')
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

const files = walk(root);
for (const file of files.filter((f) => /\.tsx?$/i.test(f))) {
  const text = fs.readFileSync(file, 'utf8');
  const imports = text.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g);
  for (const match of imports) {
    const spec = match[1];
    if (spec.endsWith('.ts')) findings.push(`${rel(file)} importa extensión .ts: ${spec}`);
    if (spec.startsWith('.')) {
      const resolved = path.normalize(path.join(path.dirname(file), spec));
      if (!existsModule(resolved)) findings.push(`${rel(file)} import roto: ${spec}`);
    }
  }
  if (/¿\s*\d{1,2}\s*¿/.test(text)) findings.push(`${rel(file)} contiene posible FAQ numbering literal`);
}

if (findings.length) {
  console.error('AUDITORÍA ESTÁTICA: incidencias encontradas');
  for (const finding of findings) console.error('- ' + finding);
  process.exitCode = 1;
} else {
  console.log('AUDITORÍA ESTÁTICA: sin imports rotos ni artefactos FAQ evidentes.');
}
