
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'maestro.db');
const db = new sqlite3.Database(dbPath);

let lastLogId = 0;
const niche = 'Cerrajeros';
const city = 'Madrid';

console.log(`\n🛡️ [MONITOR] Iniciando vigilancia Premium Gravity para ${niche} en ${city}...`);

function poll() {
    // Check Agent Logs
    db.all("SELECT id, agent_name, thought, created_at FROM agent_logs WHERE id > ? ORDER BY id ASC", [lastLogId], (err, rows) => {
        if (err) return;
        rows.forEach(row => {
            const time = new Date(row.created_at).toLocaleTimeString();
            console.log(`[${time}] ➡️  ${row.agent_name}: ${row.thought}`);
            lastLogId = row.id;
        });
    });

    // Check Mission Status
    db.get("SELECT id, status FROM missions WHERE niche = ? ORDER BY id DESC LIMIT 1", [niche], (err, mission) => {
        if (err || !mission) return;

        if (mission.status === 'COMPLETED' || mission.status === 'FAILED') {
            console.log(`\n🏁 [MONITOR] Misión terminada con estado: ${mission.status}`);
            
            db.get("SELECT status, quality_score FROM city_data WHERE mission_id = ?", [mission.id], (err, cityData) => {
                if (cityData) {
                    console.log(`📊 [MONITOR] Resultado Final - Calidad: ${cityData.quality_score}/100`);
                }
                process.exit(mission.status === 'COMPLETED' ? 0 : 1);
            });
        }
    });
}

setInterval(poll, 3000);
poll();
