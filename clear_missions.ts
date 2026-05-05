import { dbManager } from './src/db/index.js';

async function clearMissions() {
    const db = await dbManager.getDB();
    await db.run("UPDATE missions SET status = 'FAILED' WHERE status IN ('PENDING', 'PROCESSING')");
    await db.run("UPDATE city_data SET status = 'FAILED' WHERE status IN ('PENDING', 'RESEARCHING', 'ANALYZED')");
    console.log("Missions cleared!");
    process.exit(0);
}

clearMissions();
