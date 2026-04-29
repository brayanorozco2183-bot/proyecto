const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'maestro.db');
const db = new sqlite3.Database(dbPath);

console.log('[MONITOR] Starting monitor for Barcelona...');

let startTime = Date.now();
const MAX_WAIT = 10 * 60 * 1000; // 10 minutes

function checkStatus() {
    if (Date.now() - startTime > MAX_WAIT) {
        console.log('[MONITOR] 🕒 Timeout reached (10 min). Exiting.');
        process.exit(1);
    }

    db.all("SELECT * FROM city_data WHERE city LIKE '%Barcelona%' ORDER BY id DESC LIMIT 1", (err, rows) => {
        if (err) {
            console.error('[MONITOR] DB Error:', err);
            return;
        }
        if (rows.length > 0) {
            const row = rows[0];
            console.log(`[MONITOR] ${new Date().toLocaleTimeString()} - City: ${row.city}, Status: ${row.status}, Quality: ${row.quality_score}`);
            
            if (row.status === 'STATIC_READY' || row.status === 'PUBLISHED' || row.status === 'COMPLETED') {
                console.log('[MONITOR] ✅ Flow completed for Barcelona!');
                process.exit(0);
            }
            if (row.status === 'FAILED') {
                console.log('[MONITOR] ❌ Flow failed for Barcelona.');
                process.exit(1);
            }
        } else {
            console.log('[MONITOR] No data yet for Barcelona...');
        }
    });
}

const interval = setInterval(checkStatus, 5000);
checkStatus();
