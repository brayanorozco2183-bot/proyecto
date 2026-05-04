
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

async function readRootDB() {
    const dbPath = 'C:\\Proyects\\CreateWebSeoOptimized\\maestro.db';
    console.log(`Reading from: ${dbPath}`);
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const mission = await db.get('SELECT * FROM missions ORDER BY created_at DESC LIMIT 1');
    if (!mission) {
        console.log("No mission found.");
        return;
    }
    const missionId = mission.id;
    console.log(`Latest Mission: ${missionId} (${mission.status})`);

    console.log(`\n--- Agent Logs for ${missionId} ---`);
    const logs = await db.all('SELECT agent_name, thought, timestamp FROM agent_logs WHERE mission_id = ? ORDER BY timestamp ASC', [missionId]);
    logs.forEach(log => {
        console.log(`[${log.agent_name}] ${log.thought}`);
    });

    console.log(`\n--- City Data for ${missionId} ---`);
    const cities = await db.all('SELECT city, status, length(content_draft) as len FROM city_data WHERE mission_id = ?', [missionId]);
    cities.forEach(c => {
        console.log(`${c.city}: ${c.status} (Content Len: ${c.len})`);
    });
}

readRootDB();
