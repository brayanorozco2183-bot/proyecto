#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
const root = process.cwd();
const server = path.join(root, 'src/dashboard/server.ts');
const security = path.join(root, 'src/dashboard/security.ts');
const errors = [];
if (!fs.existsSync(security)) errors.push('Missing src/dashboard/security.ts');
if (!fs.existsSync(server)) errors.push('Missing src/dashboard/server.ts');
else {
  const s = fs.readFileSync(server, 'utf8');
  if (!s.includes('dashboardSecurity()')) errors.push('server.ts does not mount dashboardSecurity()');
  if (!s.includes('validateDashboardCommandPayload')) errors.push('server.ts does not validate /api/command payload');
  if (!s.includes('validateAgentInteractPayload')) errors.push('server.ts does not validate /api/agent/interact payload');
}
if (errors.length) {
  console.error('Dashboard security check failed:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('Dashboard security check OK');
