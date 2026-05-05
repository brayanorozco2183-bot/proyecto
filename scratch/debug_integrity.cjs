const { analyzeTechnicalIntegrity } = require('./src/quality/technicalIntegrityGate.js');
const fs = require('fs');

const html = fs.readFileSync('debug_runs/cerrajeros__valencia__2026-05-04T14-51-04-474Z/phase-8__assembly/artifact.html', 'utf8');
const report = analyzeTechnicalIntegrity(html);

console.log('Passed:', report.passed);
console.log('Issues:', JSON.stringify(report.issues, null, 2));
