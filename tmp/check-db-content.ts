
import { dbManager } from '../src/db/index.js';

async function checkContent() {
    const db = await dbManager.getDB();
    
    console.log("--- Latest 5 Missions ---");
    const missions = await db.all('SELECT * FROM missions ORDER BY created_at DESC LIMIT 5');
    missions.forEach(m => console.log(`ID: ${m.id}, Status: ${m.status}, Created: ${m.created_at}`));
    
    console.log("\n--- Latest 15 City Data entries ---");
    const cities = await db.all('SELECT mission_id, city, status, length(content_draft) as len FROM city_data ORDER BY id DESC LIMIT 15');
    cities.forEach(c => {
        console.log(`Mission: ${c.mission_id}, City: ${c.city}, Status: ${c.status}, Content Length: ${c.len}`);
    });
}

checkContent();
