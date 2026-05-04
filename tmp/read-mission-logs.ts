
import { dbManager } from '../src/db/index.js';

async function readLogs() {
    const db = await dbManager.getDB();
    const mission = await db.get('SELECT * FROM missions ORDER BY created_at DESC LIMIT 1');
    const missionId = mission?.id;
    
    if (!missionId) {
        console.log("No mission found in DB.");
        return;
    }
    
    console.log(`--- Logs for mission ${missionId} ---`);
    const logs = await db.all('SELECT agent_name, thought, timestamp FROM agent_logs WHERE mission_id = ? ORDER BY timestamp ASC', [missionId]);
    
    logs.forEach(log => {
        console.log(`[${log.agent_name}] ${log.thought}`);
    });

    console.log(`\n--- Status for cities ---`);
    const cities = await db.all('SELECT city, status, quality_score FROM city_data WHERE mission_id = ?', [missionId]);
    cities.forEach(c => {
        console.log(`${c.city}: ${c.status} (Score: ${c.quality_score})`);
    });
}

readLogs();
