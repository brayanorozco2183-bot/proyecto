const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

let missionId = process.argv[2];

const getMission = (cb) => {
    if (missionId) return cb(null, missionId);
    db.get("SELECT mission_id FROM agent_logs ORDER BY id DESC LIMIT 1", (err, row) => {
        if (err || !row) return cb(err || new Error("No logs found"));
        cb(null, row.mission_id);
    });
};

getMission((err, id) => {
    if (err) {
        console.error(err.message);
        db.close();
        return;
    }
    console.log(`Reading logs for mission: ${id}`);
    db.all("SELECT agent_name, thought, timestamp FROM agent_logs WHERE mission_id = ? ORDER BY id ASC", [id], (err, logs) => {
        if (err) {
            console.error(err);
        } else {
            logs.forEach(log => {
                console.log(`[${log.agent_name}] ${log.thought}`);
            });
        }
        db.close();
    });
});
