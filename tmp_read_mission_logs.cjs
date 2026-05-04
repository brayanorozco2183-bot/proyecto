const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

const missionId = 'mission-1774540411883';
db.all("SELECT agent_name, thought, timestamp FROM agent_logs WHERE mission_id = ? ORDER BY timestamp ASC", [missionId], (err, logs) => {
    if (err) {
        console.error(err);
    } else {
        logs.forEach(log => {
            console.log(`[${log.agent_name}] ${log.thought}`);
        });
    }
    db.close();
});
