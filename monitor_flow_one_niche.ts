import { dbManager } from './src/db/index.js';
import { exec } from 'child_process';
import * as path from 'path';

async function monitorMission() {
    console.log('\n🚀 [MONITOR] Iniciando Monitoreo de Misión (Fontaneros en Valencia)...');
    
    // Start the test script
    // Using npx tsx to ensure it runs correctly
    const testProcess = exec('npx tsx test_flow_one_niche.ts');
    
    const db = await dbManager.getDB();
    let lastLogId = 0;
    const startTime = Date.now();

    const interval = setInterval(async () => {
        try {
            // Check for new logs
            const logs = await db.all('SELECT id, agent_name, thought, created_at FROM agent_logs WHERE id > ? ORDER BY id ASC', [lastLogId]);
            
            for (const log of logs) {
                const time = new Date(log.created_at).toLocaleTimeString();
                console.log(`[${time}] ➡️  ${log.agent_name}: ${log.thought}`);
                lastLogId = log.id;
            }

            // Check if missions are completed
            // We look for the MOST RECENT mission started for Fontaneros
            const mission = await db.get('SELECT id, status FROM missions WHERE niche = "Fontaneros" ORDER BY rowid DESC LIMIT 1');
            
            if (mission && (mission.status === 'COMPLETED' || mission.status === 'FAILED')) {
                console.log(`\n🏁 [MONITOR] Misión terminada con estado: ${mission.status}`);
                
                // Final check on city data
                const cityData = await db.get('SELECT status, quality_score FROM city_data WHERE mission_id = ?', [mission.id]);
                if (cityData) {
                    console.log(`📊 [MONITOR] Resultado Final - Ciudad: Valencia, Estado: ${cityData.status}, Calidad: ${cityData.quality_score}/100`);
                }

                clearInterval(interval);
                process.exit(mission.status === 'COMPLETED' ? 0 : 1);
            }

            // Timeout after 5 minutes (Hybrid Brain is fast)
            if (Date.now() - startTime > 5 * 60 * 1000) {
                console.error('\n⚠️ [TIMEOUT] La misión está tardando demasiado.');
                clearInterval(interval);
                process.exit(1);
            }
        } catch (e) {
            // Silent error (DB might be locked temporarily)
        }
    }, 2000);

    testProcess.stdout?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[PROCESS STDOUT] ${msg}`);
    });

    testProcess.stderr?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.error(`[PROCESS STDERR] ${msg}`);
    });
}

monitorMission();
