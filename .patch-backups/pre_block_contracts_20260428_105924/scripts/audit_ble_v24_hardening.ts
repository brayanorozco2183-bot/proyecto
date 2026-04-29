import fs from 'fs';
import path from 'path';

const root = process.cwd();
type Issue = { severity: 'critical' | 'warning' | 'info'; code: string; file?: string; message: string };
const issues: Issue[] = [];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.gravity_archive', 'dist', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
function rel(file: string) { return path.relative(root, file).replace(/\\/g, '/'); }
function exists(relPath: string) { return fs.existsSync(path.join(root, relPath)); }
function read(relPath: string) { return fs.readFileSync(path.join(root, relPath), 'utf8'); }
function add(issue: Issue) { issues.push(issue); }

const files = walk(root);

// 1) Duplicados JS/TS en src.
for (const file of files) {
  if (!file.includes(`${path.sep}src${path.sep}`) || !file.endsWith('.js')) continue;
  const tsTwin = file.slice(0, -3) + '.ts';
  if (fs.existsSync(tsTwin)) add({ severity: 'warning', code: 'DUPLICATE_JS_TS', file: rel(file), message: 'Existe .js con .ts equivalente; archivar para evitar imports ambiguos.' });
}

// 2) Backups/parches evolutivos dentro del arbol activo.
for (const file of files) {
  const r = rel(file);
  if (/\.bak($|[_-])|bak_ble_|bak-cleanup|\.orig$|\.old$/i.test(r)) {
    add({ severity: 'warning', code: 'BACKUP_IN_SOURCE_TREE', file: r, message: 'Backup evolutivo dentro del paquete principal.' });
  }
}

// 3) Artefactos generados y bases de datos en repo activo.
for (const file of files) {
  const r = rel(file);
  if (/^(output_sites|scratch)\//.test(r) || /(^|\/)maestro\.db$/.test(r) || /\.(sqlite|sqlite3|db)$/.test(r)) {
    add({ severity: 'warning', code: 'GENERATED_ARTIFACT_IN_SOURCE_TREE', file: r, message: 'Artefacto generado/DB dentro del paquete principal; mover a storage/archivo.' });
  }
}

// 4) Seguridad dashboard.
if (!exists('src/dashboard/security.ts')) add({ severity: 'critical', code: 'MISSING_DASHBOARD_SECURITY', message: 'Falta src/dashboard/security.ts.' });
if (exists('src/dashboard/server.ts')) {
  const server = read('src/dashboard/server.ts');
  if (!server.includes('dashboardSecurity()')) add({ severity: 'critical', code: 'DASHBOARD_SECURITY_NOT_MOUNTED', file: 'src/dashboard/server.ts', message: 'Dashboard no monta middleware de seguridad.' });
  if (!server.includes('validateDashboardCommandPayload')) add({ severity: 'critical', code: 'COMMAND_PAYLOAD_NOT_VALIDATED', file: 'src/dashboard/server.ts', message: '/api/command no valida payload.' });
}

// 5) Configuracion prod.
if (!exists('.env.example')) add({ severity: 'critical', code: 'MISSING_ENV_EXAMPLE', message: 'Falta .env.example documentado.' });
else {
  const env = read('.env.example');
  for (const key of ['DASHBOARD_AUTH_TOKEN', 'PIPELINE_SOFT_MODE', 'DEBUG_MODE', 'QUALITY_AUDIT_FAIL_OPEN']) {
    if (!new RegExp(`^${key}=`, 'm').test(env)) add({ severity: 'warning', code: 'ENV_EXAMPLE_MISSING_KEY', file: '.env.example', message: `Falta ${key}.` });
  }
}
if (exists('src/tools/vault.ts')) {
  const vault = read('src/tools/vault.ts');
  if (vault.includes('DEBUG_MODE: boolish.default(true)')) add({ severity: 'critical', code: 'UNSAFE_DEBUG_DEFAULT', file: 'src/tools/vault.ts', message: 'DEBUG_MODE default true.' });
  if (vault.includes('PIPELINE_SOFT_MODE: boolish.default(true)')) add({ severity: 'critical', code: 'UNSAFE_SOFT_MODE_DEFAULT', file: 'src/tools/vault.ts', message: 'PIPELINE_SOFT_MODE default true.' });
}

// 6) Package scripts oficiales.
if (exists('package.json')) {
  const pkg = JSON.parse(read('package.json'));
  const scripts = pkg.scripts || {};
  for (const name of ['audit:hardening', 'audit:security', 'prepare:production', 'cleanup:duplicates']) {
    if (!scripts[name]) add({ severity: 'warning', code: 'MISSING_OFFICIAL_SCRIPT', file: 'package.json', message: `Falta script ${name}.` });
  }
}

// 7) QualityGate duplicados obvios.
if (exists('src/validators/qualityGate.ts')) {
  const q = read('src/validators/qualityGate.ts');
  const matches = q.match(/hasFaqNumberingArtifact/g) || [];
  if (matches.length > 3) add({ severity: 'warning', code: 'DUPLICATE_IMPORT_OR_SYMBOL', file: 'src/validators/qualityGate.ts', message: 'Posible import o simbolo FAQ duplicado.' });
  if (!q.includes('BLE_V24_BLOCKER_ESCALATION')) add({ severity: 'critical', code: 'TECHNICAL_BLOCKERS_NOT_ESCALATED', file: 'src/validators/qualityGate.ts', message: 'Los bloqueadores tecnicos no se escalan a critical.' });
}

console.log('\nBLE V2.4 HARDENING AUDIT');
console.log('========================');
if (issues.length === 0) {
  console.log('OK: no se detectaron problemas de hardening.');
  process.exit(0);
}
for (const issue of issues) {
  console.log(`${issue.severity.toUpperCase()} ${issue.code}${issue.file ? ` ${issue.file}` : ''} - ${issue.message}`);
}
const critical = issues.filter(i => i.severity === 'critical').length;
console.log(`\nResumen: ${critical} critical, ${issues.filter(i => i.severity === 'warning').length} warning, ${issues.length} total.`);
process.exit(critical > 0 ? 1 : 0);
