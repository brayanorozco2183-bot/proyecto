import { dbManager } from './src/db/index.js';

async function clearAll() {
    const db = await dbManager.getDB();
    await db.run("UPDATE missions SET status = 'FAILED' WHERE status NOT IN ('COMPLETED', 'FAILED', 'STOPPED', 'TESTING')");
    await db.run("UPDATE city_data SET status = 'FAILED' WHERE status NOT IN ('COMPLETED', 'FAILED', 'STOPPED', 'STATIC_READY', 'NEEDS_REOPTIMIZATION')");
    console.log("All active/pending missions cleared!");
    process.exit(0);
}

clearAll();
