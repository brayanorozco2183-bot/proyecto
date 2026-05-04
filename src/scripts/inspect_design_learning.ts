import { dbManager } from '../db/index.js';

async function main(): Promise<void> {
  const db = await dbManager.getDB();

  const tables = ['design_learning_runs', 'design_exemplars', 'design_lessons'];
  for (const table of tables) {
    const exists = await db.get(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, [table]);
    if (!exists) {
      console.log(`[inspect_design_learning] Tabla no encontrada: ${table}`);
      continue;
    }

    const count = await db.get(`SELECT COUNT(*) as total FROM ${table}`);
    console.log(`${table}: ${count?.total || 0}`);

    const rows = await db.all(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 5`);
    console.dir(rows, { depth: 4 });
  }
}

main().catch((err) => {
  console.error('[inspect_design_learning] Fatal error:', err);
  process.exit(1);
});
