import { dbManager } from '../src/db/index.js';

async function nukeAndSeed() {
  const db = await dbManager.getDB();
  
  console.log('--- NUCLEAR MEMORY CLEANUP START ---');

  // 1. Nuke New Learning Tables
  const tablesToNuke = [
    'learning_output_reviews',
    'learning_curated_lessons',
    'learning_exemplars',
    'learning_feedback_events'
  ];

  for (const table of tablesToNuke) {
    const result = await db.run(`DELETE FROM ${table}`);
    console.log(`[CLEAN] Table ${table} nuked. Changes: ${result.changes}`);
  }

  // 2. Nuke Old Learning Tables (for redundancy)
  const oldTables = ['agent_lessons', 'agent_failures'];
  for (const table of oldTables) {
    const result = await db.run(`DELETE FROM ${table}`);
    console.log(`[CLEAN] Old table ${table} nuked. Changes: ${result.changes}`);
  }

  // 3. Reset Mission Status for Experiment Areas
  const targetCities = ['Getafe', 'Bilbao', 'Alicante'];
  const placeholders = targetCities.map(() => '?').join(',');
  
  const missionReset = await db.run(`UPDATE missions SET status = 'pending' WHERE city IN (${placeholders})`, targetCities);
  console.log(`[RESET] Missions status effectively reset for ${targetCities.join(', ')}. Changes: ${missionReset.changes}`);
  
  const cityDataReset = await db.run(`UPDATE city_data SET status = 'pending', quality_score = 0 WHERE city IN (${placeholders})`, targetCities);
  console.log(`[RESET] City Data results cleared for ${targetCities.join(', ')}. Changes: ${cityDataReset.changes}`);

  // 4. Seed Perfect Master Exemplar (Generic for Fontaneros)
  // This exemplar provides a "Premium" structural pattern without hardcoding a specific city in the text.
  console.log('[SEED] Injecting Master Exemplar for Fontaneros...');
  
  const masterExemplar = {
    agent_name: 'Content_Writer_01',
    niche: 'fontaneros',
    polarity: 'positive',
    score: 98,
    title: 'Estructura Premium Fontanería V7',
    excerpt: 'Atención técnica directa y presupuestos transparentes. Nuestro equipo de fontaneros expertos garantiza soluciones duraderas para fugas y desatascos, siguiendo protocolos de seguridad e higiene rigurosos en cada intervención local.',
    fingerprint: 'master_seed_v7_fontaneros',
    metadata_json: JSON.stringify({
      strengths: ['Tono editorial autoritativo', 'Estructura SEO perfecta', 'Sin muletillas de IA'],
      status: 'premium'
    })
  };

  await db.run(`
    INSERT INTO learning_exemplars (
      agent_name, niche, city, polarity, title, excerpt, fingerprint, score, metadata_json
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
  `, [
    masterExemplar.agent_name,
    masterExemplar.niche,
    masterExemplar.polarity,
    masterExemplar.title,
    masterExemplar.excerpt,
    masterExemplar.fingerprint,
    masterExemplar.score,
    masterExemplar.metadata_json
  ]);

  console.log('[SEED] Master Exemplar injected successfully.');
  console.log('--- NUCLEAR MEMORY CLEANUP COMPLETE ---');
}

nukeAndSeed().catch(console.error);
