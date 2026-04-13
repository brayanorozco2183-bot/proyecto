import * as fs from 'fs';
import { runAsyncQualityGate } from './src/validators/qualityGate.js';

async function check() {
    const html = fs.readFileSync('debug_failed_quality_gate.html', 'utf8');
    const result = await runAsyncQualityGate({
        html,
        niche: 'fontaneros',
        city: 'Sevilla'
    });
    console.log(JSON.stringify(result.issues, null, 2));
    console.log("Score:", result.score);
}
check().catch(console.error);
