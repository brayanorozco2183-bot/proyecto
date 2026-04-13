const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maestro.db');

db.all(`
    SELECT agent_name, thought, timestamp 
    FROM agent_logs 
    WHERE mission_id = 'mission-1776055595219' 
    ORDER BY id ASC
`, (err, rows) => {
    if (err) {
        console.error(err);
        db.close();
        return;
    }

    console.log('--- MISSION LOGS ---');
    rows.forEach(r => {
        console.log(`[${r.agent_name}] ${r.thought}`);
    });
    console.log('--- END OF LOGS ---');
    db.close();
});
