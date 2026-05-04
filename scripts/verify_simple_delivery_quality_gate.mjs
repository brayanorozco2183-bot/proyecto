import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/quality/simpleDeliveryQualityGate.ts',
  'src/pipelines/phases/quality.phase.ts',
  'docs/PATCH_SIMPLE_DELIVERY_QUALITY_GATE.md'
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing file: ${file}`);
}

function read(file) {
  return fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : '';
}

const gate = read('src/quality/simpleDeliveryQualityGate.ts');
const quality = read('src/pipelines/phases/quality.phase.ts');
const pkg = read('package.json');

const checks = [
  ['gate exports validateSimpleDeliveryQuality', /export function validateSimpleDeliveryQuality/.test(gate)],
  ['gate detects broken #contacto anchors', /CONTACT_ANCHOR_MISSING/.test(gate)],
  ['gate detects empty lists', /EMPTY_LISTS_RENDERED/.test(gate)],
  ['gate detects template residue', /TEMPLATE_RESIDUE_VISIBLE/.test(gate)],
  ['gate detects broken local copy', /BROKEN_LOCAL_COPY/.test(gate)],
  ['gate detects unverified review language', /UNVERIFIED_REVIEW_LANGUAGE/.test(gate)],
  ['quality phase imports simple gate', /simpleDeliveryQualityGate\.js/.test(quality)],
  ['quality phase stores metadata result', /simple_delivery_quality_gate/.test(quality)],
  ['quality phase honors env flag', /GRAVITY_SIMPLE_DELIVERY_GATE/.test(quality)],
  ['package has verify script', /verify:simple-delivery-gate/.test(pkg)]
];

for (const [name, ok] of checks) {
  if (!ok) failures.push(`Check failed: ${name}`);
}

if (failures.length) {
  console.error('Simple Delivery Quality Gate verification FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Simple Delivery Quality Gate verification OK');
