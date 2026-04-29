import { dbManager } from '../src/db/index.js';

async function executePremiumCleanup() {
  const db = await dbManager.getDB();
  console.log('[CLEANUP] Starting Premium Saneamiento...');

  // 1. Borrar reviews de baja calidad
  const r1 = await db.run('DELETE FROM learning_output_reviews WHERE score < 80');
  console.log(`- Reviews de baja calidad eliminadas: ${r1.changes}`);

  // 2. Borrar lecciones derivadas de esas reviews
  const r2 = await db.run(`
    DELETE FROM learning_curated_lessons 
    WHERE source_review_id NOT IN (SELECT id FROM learning_output_reviews) 
    AND source_review_id IS NOT NULL
  `);
  console.log(`- Lecciones obsoletas eliminadas: ${r2.changes}`);

  // 3. Borrar exemplars derivados de esas reviews (excepto los maestros que no tienen source_review_id)
  const r3 = await db.run(`
    DELETE FROM learning_exemplars 
    WHERE source_review_id NOT IN (SELECT id FROM learning_output_reviews) 
    AND source_review_id IS NOT NULL
  `);
  console.log(`- Exemplars débiles eliminados: ${r3.changes}`);

  // 4. Borrar lecciones de impacto negativo
  const r4 = await db.run('DELETE FROM agent_lessons WHERE score_impact < 0');
  console.log(`- Lecciones de impacto negativo eliminadas: ${r4.changes}`);

  // 5. Resetear misiones del experimento anterior para re-ejecución
  try {
    const r5 = await db.run("UPDATE missions SET status = 'pending' WHERE mission_id LIKE 'ble-%'");
    console.log(`- Misiones BLE reseteadas: ${r5.changes}`);
  } catch (e: any) {
    console.log(`- No se pudo resetear la tabla missions (quizás no existe): ${e.message}`);
  }

  console.log('[CLEANUP] Saneamiento completo. Memoria lista para BLE V2.');
}

executePremiumCleanup().catch(console.error);
