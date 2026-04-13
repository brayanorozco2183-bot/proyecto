const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('maestro.db');

db.all("SELECT agent_id, content FROM agent_knowledge WHERE agent_id IN ('global', 'Content_Writer_01', 'Content_Architect_01')", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("--- AGENT KNOWLEDGE ---");
    rows.forEach(row => {
        console.log(`Agent: ${row.agent_id}`);
        console.log(`Content: ${row.content.substring(0, 500)}...`);
        console.log("------------------------");
    });
    db.close();
});
