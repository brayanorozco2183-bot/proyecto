const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('maestro.db');

db.all("SELECT DISTINCT agent_id FROM agent_knowledge", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("--- AGENT IDs IN KNOWLEDGE ---");
    rows.forEach(row => {
        console.log(row.agent_id);
    });
    db.close();
});
