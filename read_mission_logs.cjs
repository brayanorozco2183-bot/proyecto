const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('maestro.db');

db.get("SELECT mission_id FROM agent_logs ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err || !row) {
        console.error(err);
        return;
    }
    const missionId = row.mission_id;
    console.log(`Latest Mission ID: ${missionId}`);
    
    db.all("SELECT agent_name, thought FROM agent_logs WHERE mission_id = ? ORDER BY id ASC", [missionId], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        rows.forEach(r => {
            console.log(`[${r.agent_name}] ${r.thought}`);
        });
        db.close();
    });
});
