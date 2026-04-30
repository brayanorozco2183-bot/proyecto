import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'data', 'learning', 'exemplars_learning_balance_v81.json');
const DEFAULT_DB = path.join(ROOT, 'data', 'gravity.db');
const DB_PATH = process.env.GRAVITY_DB_PATH || process.env.DATABASE_PATH || DEFAULT_DB;

type Exemplar = {
  agent_name: string;
  niche: string | null;
  city: string | null;
  block_type: string;
  polarity: string;
  title: string;
  score: number;
  fingerprint: string;
  excerpt: string;
  metadata_json: string;
};

function openDb(file: string): sqlite3.Database {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return new sqlite3.Database(file);
}

function run(db: sqlite3.Database, sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`No existe ${DATA_PATH}. Ejecuta primero apply_patch.sh desde la raíz del proyecto.`);
  }

  const exemplars = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as Exemplar[];
  const db = openDb(DB_PATH);

  await run(db, `CREATE TABLE IF NOT EXISTS learning_exemplars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    niche TEXT,
    city TEXT,
    block_type TEXT NOT NULL,
    polarity TEXT NOT NULL DEFAULT 'positive',
    title TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 100,
    fingerprint TEXT UNIQUE,
    excerpt TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(db, 'BEGIN TRANSACTION');
  let inserted = 0;
  let skipped = 0;

  const stmtSql = `INSERT OR IGNORE INTO learning_exemplars
    (agent_name, niche, city, block_type, polarity, title, score, fingerprint, excerpt, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const ex of exemplars) {
    await new Promise<void>((resolve, reject) => {
      db.run(stmtSql, [
        ex.agent_name,
        ex.niche,
        ex.city,
        ex.block_type,
        ex.polarity,
        ex.title,
        ex.score,
        ex.fingerprint,
        ex.excerpt,
        ex.metadata_json,
      ], function (err) {
        if (err) return reject(err);
        if (this.changes && this.changes > 0) inserted += this.changes;
        else skipped += 1;
        resolve();
      });
    });
  }

  await run(db, 'COMMIT');

  await new Promise<void>((resolve, reject) => db.close((err) => (err ? reject(err) : resolve())));

  console.log(`✅ Learning Balance V8.1 completado`);
  console.log(`DB: ${DB_PATH}`);
  console.log(`Insertados: ${inserted}`);
  console.log(`Omitidos por fingerprint existente: ${skipped}`);
  console.log(`Total procesados: ${exemplars.length}`);
}

main().catch((err) => {
  console.error('❌ Error sembrando exemplars V8.1:', err);
  process.exit(1);
});
