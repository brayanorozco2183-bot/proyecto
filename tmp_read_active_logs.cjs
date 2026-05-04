const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

const missionId = 'mission-1774537291150';
db.all("SELECT agent_name, thought, timestamp FROM agent_logs WHERE mission_id = ? ORDER BY timestamp DESC LIMIT 20", [missionId], (err, logs) => {
    if (err) {
        console.error(err);
    } else {
        logs.reverse().forEach(log => {
            console.log(`[${log.agent_name}] [${log.timestamp}] ${log.thought}`);
        });
    }
    db.close();
});
