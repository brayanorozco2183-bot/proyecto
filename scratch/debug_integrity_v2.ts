import { analyzeTechnicalIntegrity } from '../src/quality/technicalIntegrityGate.js';
import fs from 'fs';

const html = fs.readFileSync('debug_runs/cerrajeros__valencia__2026-05-04T14-51-04-474Z/phase-8__assembly/artifact.html', 'utf8');
const report = analyzeTechnicalIntegrity(html);

console.log(JSON.stringify(report, null, 2));
