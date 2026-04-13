const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.all("PRAGMA table_info(missions)", (err, columns) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Columns:", JSON.stringify(columns, null, 2));
    }
    db.close();
});
