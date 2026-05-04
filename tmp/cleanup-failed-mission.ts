
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function cleanup() {
    const dbPath = 'C:\\Proyects\\CreateWebSeoOptimized\\tmp\\maestro.db';
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log("Cleaning up failed Valencia entries from today...");
    
    // Delete city_data for Valencia neighborhoods from mission-1773676916226
    const missionId = 'mission-1773676916226';
    await db.run('DELETE FROM city_data WHERE mission_id = ?', [missionId]);
    await db.run('DELETE FROM missions WHERE id = ?', [missionId]);
    await db.run('DELETE FROM agent_logs WHERE mission_id = ?', [missionId]);

    console.log("Database cleaned for a fresh run.");
}

cleanup();
