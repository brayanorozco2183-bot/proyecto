import { dbManager } from './src/db/index.js';

async function checkStatus() {
    const db = await dbManager.getDB();
    const rows = await db.all(
        "SELECT city, status FROM city_data WHERE city IN ('Gràcia', 'Eixample', 'Poblenou') ORDER BY id DESC LIMIT 5"
    );
    console.log("--- DB STATUS ---");
    console.table(rows);
    process.exit(0);
}

checkStatus();
