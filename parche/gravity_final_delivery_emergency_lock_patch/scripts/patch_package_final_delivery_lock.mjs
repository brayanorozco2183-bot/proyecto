import { readFileSync, writeFileSync } from 'node:fs';

const path = 'package.json';
const pkg = JSON.parse(readFileSync(path, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['verify:final-delivery-lock'] = 'node scripts/verify_final_delivery_emergency_lock.mjs';
writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json actualizado: verify:final-delivery-lock');
