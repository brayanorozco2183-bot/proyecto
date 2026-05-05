import { dbManager } from './src/db/index.js';

async function checkStatus() {
    const db = await dbManager.getDB();
    const cityStats = await db.all('SELECT status, COUNT(*) as count FROM city_data GROUP BY status');
    console.log("city_data stats:", cityStats);
    const missionStats = await db.all('SELECT status, COUNT(*) as count FROM missions GROUP BY status');
    console.log("missions stats:", missionStats);
    process.exit(0);
}

checkStatus();
