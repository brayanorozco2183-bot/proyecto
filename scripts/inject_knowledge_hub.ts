import { dbManager } from '../src/db/index.js';
import fs from 'fs';

async function main() {
  const db = await dbManager.getDB();
  console.log('--- Injecting Knowledge Hub Rules ---');

  const filePath = 'C:/Users/Bryan/Desktop/pruebaGravity/templates/knowledge_hub_rules.json';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rules = data.rules;

  console.log(`[1/3] Deleting existing rules to start fresh...`);
  await db.run('DELETE FROM agent_knowledge');

  console.log(`[2/3] Injecting ${rules.length} rules...`);
  
  let count = 0;
  for (const rule of rules) {
    try {
      // Map user-friendly agent names to internal names if needed, or just insert as is.
      // Gravity's base.ts does: 'SELECT content FROM agent_knowledge WHERE agent_id = ? OR agent_id = "global"'
      // So agent_id needs to match what is passed. E.g., 'Content_Architect_01'.
      
      let agentId = rule.agent_id;
      if (agentId === 'Estratega de Mercado') agentId = 'Market_Strategist_01'; // Guess based on usual naming, although they might not query knowledge
      if (agentId === 'Arquitecto de Contenidos') agentId = 'Content_Architect_01';
      if (agentId === 'Redactor de Sección') agentId = 'Content_Writer_01';
      if (agentId === 'Motor de Variedad') agentId = 'Content_Variety_01';
      if (agentId === 'Auditor de Calidad') agentId = 'Quality_Score_01';
      if (agentId === 'Auditor de Coherencia') agentId = 'Niche_Coherence_01';
      if (agentId === 'Corrector de Castellano') agentId = 'Spanish_Corrector_01';
      if (agentId === 'Visual Designer') agentId = 'Art_Director_01';
      // Protector de Datos -> might not have a direct agent yet, keep as is

      await db.run(
        'INSERT INTO agent_knowledge (agent_id, category, content) VALUES (?, ?, ?)',
        [agentId, rule.category, rule.content]
      );
      count++;
    } catch (err: any) {
      console.warn(`[!] Failed to inject rule for "${rule.agent_id}":`, err.message);
    }
  }

  console.log(`[3/3] Successfully injected ${count} rules into agent_knowledge.`);
  console.log('\n[SUCCESS] Knowledge Hub rules applied.');
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to inject rules:', err);
  process.exit(1);
});
