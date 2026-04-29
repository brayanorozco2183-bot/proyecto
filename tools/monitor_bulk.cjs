const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'maestro.db');
const db = new sqlite3.Database(dbPath);

const niches = [
    { name: 'Carpinteros', city: 'Barcelona' },
    { name: 'Cerrajeros', city: 'Madrid' },
    { name: 'Electricistas', city: 'Valencia' },
    { name: 'Fontaneros', city: 'Sevilla' },
    { name: 'Pintores', city: 'Bilbao' }
];

function checkStatus() {
    console.clear();
    console.log(`[MONITOR] Checking status at ${new Date().toLocaleTimeString()}...`);
    console.log(''.padEnd(70, '-'));
    console.log(`${'NICHE'.padEnd(15)} | ${'CITY'.padEnd(12)} | ${'STATUS'.padEnd(20)} | ${'SCORE'}`);
    console.log(''.padEnd(70, '-'));

    niches.forEach(niche => {
        db.get(
            `SELECT m.status as m_status, c.status as c_status, c.quality_score 
             FROM missions m 
             LEFT JOIN city_data c ON m.id = c.mission_id 
             WHERE m.niche = ? AND c.city = ? 
             ORDER BY m.created_at DESC LIMIT 1`,
            [niche.name.toLowerCase(), niche.city],
            (err, row) => {
                if (err) {
                    console.error(`Error checking ${niche.name}:`, err.message);
                    return;
                }

                const status = row ? (row.c_status || row.m_status || 'NOT_STARTED') : 'NOT_STARTED';
                const score = row ? (row.quality_score || 'N/A') : 'N/A';
                
                console.log(`${niche.name.padEnd(15)} | ${niche.city.padEnd(12)} | ${status.padEnd(20)} | ${score}`);
            }
        );
    });
}

console.log('[MONITOR] Starting Multi-Niche Monitor...');
setInterval(checkStatus, 5000);
checkStatus();
