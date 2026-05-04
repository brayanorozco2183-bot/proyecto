
import { dbManager } from '../src/db/index.js';
async function run() {
    const db = await dbManager.getDB();
    const cities = await db.all('SELECT city, status, mission_id FROM city_data ORDER BY id DESC LIMIT 5');
    console.log("--- CITY STATUS ---");
    console.log(JSON.stringify(cities, null, 2));
    process.exit();
}
run();
