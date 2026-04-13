const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.serialize(() => {
    console.log('--- SITE SETTINGS ---');
    db.all("SELECT * FROM site_settings", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\n--- RECENT MISSIONS ---');
    db.all("SELECT * FROM missions ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\n--- CITY DATA (Last 5) ---');
    db.all("SELECT * FROM city_data ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
        db.close();
    });
});
