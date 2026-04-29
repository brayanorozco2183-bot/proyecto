const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('maestro.db');

db.all("SELECT content FROM agent_knowledge WHERE agent_id = 'Content_Architect_01'", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    rows.forEach((row, i) => {
        console.log(`--- Content_Architect_01 Knowledge ${i} ---`);
        console.log(row.content);
        console.log("--------------------------------------------");
    });
    db.close();
});
