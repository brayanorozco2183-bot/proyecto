const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.all("SELECT id, niche, status, created_at FROM missions ORDER BY created_at DESC LIMIT 5", (err, missions) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Latest Missions:", JSON.stringify(missions, null, 2));
    }
    db.close();
});
