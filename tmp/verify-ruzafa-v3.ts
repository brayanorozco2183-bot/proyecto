
import { orchestrator } from '../src/orchestrator/orchestrator.js';
import { dbManager } from '../src/db/index.js';
import fs from 'fs';
import path from 'path';

async function verifyRuzafa() {
    console.log("--- STARTING VALIDATION: Cerrajeros en Ruzafa, Valencia ---");

    const niche = "Cerrajeros";
    const locations = ["Ruzafa"];

    try {
        const jobId = await orchestrator.startMission(niche, locations, 'publish', {
            site_type: 'static',
            force: true
        });

        console.log(`Mission started: ${jobId}`);
        
        const db = await dbManager.getDB();
        let status = 'PENDING';

        while (status === 'PENDING' || status === 'PROCESSING') {
            const mission = await db.get('SELECT status FROM missions WHERE id = ?', [jobId]);
            status = mission?.status || 'UNKNOWN';
            process.stdout.write(`Status: ${status}\r`);
            if (status === 'COMPLETED' || status === 'FAILED' || status === 'STOPPED') break;
            await new Promise(r => setTimeout(r, 5000));
        }

        console.log(`\nMission Total: ${status}`);

        if (status === 'COMPLETED') {
            // Find the generated file
            const siteDir = path.join(process.cwd(), 'output_sites', 'cerrajeros-valencia', 'ruzafa');
            const indexPath = path.join(siteDir, 'index.html');

            if (fs.existsSync(indexPath)) {
                const html = fs.readFileSync(indexPath, 'utf-8');
                console.log("\n--- HTML AUDIT ---");
                
                const checks = [
                    { name: "No Filler Text", test: !html.includes("Contenido auxiliar adaptado") },
                    { name: "No Duplicate H2", test: (html.match(/<h2/g) || []).length === (new Set(html.match(/<h2.*?>(.*?)<\/h2>/g))).size },
                    { name: "Ruzafa Local zones", test: html.includes("Calle Cádiz") || html.includes("Calle Sueca") || html.includes("Russafa") },
                    { name: "No Madrid Zones", test: !html.includes("El Prado") && !html.includes("Juan Bravo") && !html.includes("Plaza del Carmen") },
                    { name: "Professional Terms", test: html.includes("bombín") || html.includes("ganzuado") || html.includes("impresioning") },
                    { name: "No Meta-Talk", test: !html.includes("incluyendo la estructura de encabezados") },
                    { name: "Premium Design (Glass)", test: html.includes("backdrop-filter") || html.includes("glass") || html.includes("gradient") }
                ];

                checks.forEach(c => {
                    console.log(`${c.test ? '✅' : '❌'} ${c.name}`);
                });

                if (checks.every(c => c.test)) {
                    console.log("\n🚀 ALL QUALITY CHECKS PASSED!");
                } else {
                    console.log("\n⚠️ SOME QUALITY CHECKS FAILED.");
                }
            } else {
                console.error("Generated HTML not found at expected path:", indexPath);
                // Try parent dir if slugified differently
                console.log("Searching in output_sites...");
            }
        }

    } catch (error) {
        console.error("Error during verification:", error);
    } finally {
        process.exit();
    }
}

verifyRuzafa();
