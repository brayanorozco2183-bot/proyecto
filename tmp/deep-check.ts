
import { dbManager } from '../src/db/index.js';
async function run() {
    const db = await dbManager.getDB();
    const city = await db.get('SELECT * FROM city_data ORDER BY id DESC LIMIT 1');
    console.log("--- CITY DATA ---");
    console.log(JSON.stringify(city, null, 2));
    const mission = await db.get('SELECT * FROM missions WHERE id = ?', [city?.mission_id]);
    console.log("--- MISSION DATA ---");
    console.log(JSON.stringify(mission, null, 2));
    process.exit();
}
run();
