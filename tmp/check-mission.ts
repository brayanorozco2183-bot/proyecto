
import { dbManager } from '../src/db/index.js';
async function run() {
    const db = await dbManager.getDB();
    const mission = await db.get('SELECT * FROM missions ORDER BY created_at DESC LIMIT 1');
    console.log("--- LATEST MISSION ---");
    console.log(JSON.stringify(mission, null, 2));

    const cities = await db.all('SELECT city, status, mission_id FROM city_data WHERE mission_id = ?', [mission?.id]);
    console.log("--- CITIES IN MISSION ---");
    console.log(JSON.stringify(cities, null, 2));
    
    process.exit();
}
run();
