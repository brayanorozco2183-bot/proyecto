const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.all("SELECT * FROM agent_knowledge WHERE content LIKE '%Ruzafa%' OR content LIKE '%Ensanche%' OR content LIKE '%Monteolivete%'", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
