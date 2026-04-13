const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.all("SELECT * FROM missions ORDER BY id DESC LIMIT 1", (err, missions) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Missions:", JSON.stringify(missions, null, 2));
        if (missions.length > 0) {
            const missionId = missions[0].id;
            db.all("SELECT * FROM city_data WHERE mission_id = ?", [missionId], (err, cities) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("City Data:", JSON.stringify(cities, null, 2));
                }
                db.close();
            });
        } else {
            db.close();
        }
    }
});
