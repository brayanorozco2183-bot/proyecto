const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'maestro.db');
const db = new sqlite3.Database(dbPath);

let lastLogId = 0;

function checkStatus() {
    // Check city status
    db.get("SELECT * FROM city_data WHERE city = 'Murcia' ORDER BY id DESC LIMIT 1", (err, row) => {
        if (err) {
            console.error('[MONITOR ERROR]', err);
            return;
        }
        if (row) {
            console.log(`\n[STATUS] City: ${row.city} | Status: ${row.status} | Quality: ${row.quality_score}`);
            if (['STATIC_READY', 'PUBLISHED', 'COMPLETED'].includes(row.status)) {
                console.log('\n✅ ¡FLUJO COMPLETADO CON ÉXITO PARA MURCIA!');
                process.exit(0);
            }
            if (row.status === 'FAILED') {
                console.log('\n❌ EL FLUJO HA FALLADO. Revisa los logs arriba.');
                process.exit(1);
            }
        }
    });

    // Check new logs
    db.all("SELECT id, agent_name, thought, timestamp FROM agent_logs WHERE id > ? ORDER BY id ASC", [lastLogId], (err, rows) => {
        if (err) {
            console.error('[LOG ERROR]', err);
            return;
        }
        rows.forEach(log => {
            console.log(`[${log.timestamp}] [${log.agent_name}] ${log.thought}`);
            lastLogId = log.id;
        });
    });
}

console.log('--- MONITOR DE FLUJO: MURCIA ---');
console.log('Buscando actualizaciones en la base de datos cada 3 segundos...');
setInterval(checkStatus, 3000);
checkStatus();
