const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'maestro.db');
const db = new sqlite3.Database(dbPath);

function checkStatus() {
    db.all("SELECT * FROM city_data WHERE city LIKE '%Valencia%' ORDER BY id DESC LIMIT 1", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        if (rows.length > 0) {
            const row = rows[0];
            console.log(`[MONITOR] City: ${row.city}, Status: ${row.status}, Quality: ${row.quality_score}`);
            if (row.status === 'STATIC_READY' || row.status === 'PUBLISHED' || row.status === 'COMPLETED') {
                console.log('[MONITOR] ✅ Flow completed for Valencia!');
                process.exit(0);
            }
            if (row.status === 'FAILED') {
                console.log('[MONITOR] ❌ Flow failed for Valencia.');
                process.exit(1);
            }
        } else {
            console.log('[MONITOR] No data yet for Valencia...');
        }
    });
}

console.log('[MONITOR] Monitoring started...');
setInterval(checkStatus, 5000);
checkStatus();
