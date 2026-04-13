const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.all("SELECT * FROM agent_logs ORDER BY id DESC LIMIT 20", (err, logs) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Latest Agent Logs:");
        logs.reverse().forEach(log => {
            console.log(`[${log.timestamp}] [${log.agent_name}] ${log.thought}`);
        });
    }
    db.close();
});
