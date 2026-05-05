import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./maestro.db');
db.all('SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT 10', (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
