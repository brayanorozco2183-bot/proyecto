import { dbManager } from './src/db/index.js';
import { exec } from 'child_process';
import * as path from 'path';

async function monitorMission() {
    console.log('\n🚀 [MONITOR] Iniciando misión de Pintores en Zaragoza (Modo Cerebro Híbrido)...');
    
    const db = await dbManager.getDB();
    
    // Start the test script
    const testProcess = exec('node node_modules/tsx/dist/cli.mjs test_pintores_fix.ts');
    
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

            // Check if mission is done
            const mission = await db.get('SELECT status, error_message FROM mission WHERE status IN ("completed", "failed") ORDER BY created_at DESC LIMIT 1');
            
            if (mission) {
                console.log(`\n🏁 [MONITOR] Misión terminada con estado: ${mission.status.toUpperCase()}`);
                if (mission.error_message) {
                    console.error(`❌ Error: ${mission.error_message}`);
                }
                clearInterval(interval);
                process.exit(0);
            }

            // Timeout after 10 minutes
            if (Date.now() - startTime > 10 * 60 * 1000) {
                console.error('\n⚠️ [TIMEOUT] La misión está tardando demasiado.');
                clearInterval(interval);
                process.exit(1);
            }
        } catch (e) {
            // Silent error (DB might be locked temporarily)
        }
    }, 2000);

    testProcess.stdout?.on('data', (data) => {
        // console.log(data.toString());
    });

    testProcess.stderr?.on('data', (data) => {
        if (data.includes('error') || data.includes('Error')) {
             console.error(`🔥 [ERROR PROCESO]: ${data}`);
        }
    });
}

monitorMission();
