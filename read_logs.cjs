const Database = require('better-sqlite3');
const db = new Database('maestro.db');
const row = db.prepare("SELECT content_draft, agent_logs FROM city_data WHERE city='Valencia' ORDER BY id DESC LIMIT 1").get();
if (row) {
    console.log("=== LOGS ===");
    console.log(row.agent_logs);
    console.log("\n=== DRAFT PREVIEW ===");
    console.log(row.content_draft.substring(0, 5000));
} else {
    console.log("No Data Found.");
}
