
import { dbManager } from '../src/db/index.js';
async function run() {
    const db = await dbManager.getDB();
    const mission = await db.get('SELECT * FROM missions ORDER BY created_at DESC LIMIT 1');
    console.log(`Checking mission: ${mission?.id} (${mission?.status})`);
    
    const cities = await db.all('SELECT * FROM city_data WHERE mission_id = ?', [mission?.id]);
    console.log(`Found ${cities.length} cities.`);
    cities.forEach(c => {
        console.log(`- ${c.city}: ${c.status} (Scored: ${c.quality_score})`);
    });
    
    if (cities.length === 0) {
        // Check if there are ANY cities at all in the DB
        const allCities = await db.all('SELECT * FROM city_data ORDER BY id DESC LIMIT 5');
        console.log("Latest cities in DB (any mission):");
        allCities.forEach(c => console.log(`- ${c.city} [${c.mission_id}]: ${c.status}`));
    }
    
    process.exit();
}
run();
