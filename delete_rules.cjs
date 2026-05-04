const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.run("DELETE FROM agent_knowledge WHERE id IN (126, 127, 135)", (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Deleted rules 126, 127, 135 successfully.");
    db.close();
});
