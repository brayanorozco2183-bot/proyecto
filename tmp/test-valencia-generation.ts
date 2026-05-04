
import { orchestrator } from '../src/orchestrator/orchestrator.js';
import { dbManager } from '../src/db/index.js';

async function testValencia() {
    console.log("--- Starting Test Generation for 3 Valencia Neighborhoods ---");

    const niche = "Cerrajeros";
    const locations = ["Ruzafa", "Benimaclet", "El Carmen"];

    console.log(`Targeting niche: ${niche}`);
    console.log(`Targeting locations: ${locations.join(', ')}`);

    try {
        const jobId = await orchestrator.startMission(niche, locations, 'publish', {
            site_type: 'static',
            force: true
        });

        console.log(`Mission started with Job ID: ${jobId}`);
        console.log("Waiting for mission to complete (this may take a few minutes)...");

        // Wait and poll DB until completed
        const db = await dbManager.getDB();
        let status = 'PENDING';

        while (status === 'PENDING' || status === 'PROCESSING') {
            const mission = await db.get('SELECT status FROM missions WHERE id = ?', [jobId]);
            status = mission?.status || 'UNKNOWN';
            process.stdout.write(`Current Status: ${status}\r`);
            if (status === 'COMPLETED' || status === 'FAILED' || status === 'STOPPED') break;
            await new Promise(r => setTimeout(r, 5000));
        }

        console.log(`\nMission finished with status: ${status}`);

        if (status === 'COMPLETED') {
            console.log("--- SUCCESS ---");
            console.log("Check the 'output_sites' directory for the generated pages.");
        } else {
            console.error("--- FAILURE ---");
        }

    } catch (error) {
        console.error("Error during test execution:", error);
    } finally {
        process.exit();
    }
}

testValencia();
