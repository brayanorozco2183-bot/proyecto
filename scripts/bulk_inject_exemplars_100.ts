
import { dbManager } from '../src/db/index.js';
import { insertExemplar } from '../src/learning/exemplarRepository.js';
import { installLearningSchema } from '../src/learning/schema.js';
import fs from 'fs';
import crypto from 'crypto';

function hashString(value: string): string {
  return crypto.createHash('sha1').update(value).digest('hex');
}

const BLOCK_TYPE_MAP: Record<string, string> = {
  'hero_local_service': 'hero_trust',
  'services_grid': 'services_grid',
  'urgency_panel': 'urgency_panel',
  'process_timeline': 'process_steps',
  'local_authority': 'local_proof',
  'proof_trust': 'trust_band',
  'neighborhood_coverage': 'local_proof',
  'pricing_value': 'price_guidance',
  'faq_schema': 'faq',
  'conversion_cta': 'cta_panel'
};

async function main() {
  const db = await dbManager.getDB();
  console.log('--- Gravity Exemplar Injection (100/100 Pack) [WITH MAPPING] ---');

  // Ensure schema is installed
  await installLearningSchema(db);
  
  // Clean previous injection to avoid duplicates or misaligned block types
  console.log('[1/3] Cleaning previous premium exemplars...');
  await db.run("DELETE FROM learning_exemplars WHERE score = 100 AND agent_name = 'Content_Writer_01'");

  const filePath = 'C:/Users/Bryan/Desktop/pruebaGravity/parche/gravity_10_nichos_100_exemplars_pack/exemplars/combined/all_100_exemplars.json';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const exemplars = data.exemplars;

  console.log(`[2/3] Found ${exemplars.length} exemplars in combined pack.`);

  let count = 0;
  for (const ex of exemplars) {
    const systemBlockType = BLOCK_TYPE_MAP[ex.block_type] || ex.block_type;
    const semanticStr = JSON.stringify(ex.semantic);
    const fingerprint = hashString(semanticStr + systemBlockType); // Include block type in fingerprint
    
    const record = {
      agent_name: 'Content_Writer_01', 
      niche: ex.niche,
      city: null, 
      page_type: 'local-service',
      block_type: systemBlockType,
      polarity: 'positive' as const,
      title: ex.title,
      excerpt: Array.isArray(ex.semantic.intro) ? ex.semantic.intro[0] : (ex.semantic.intro || ex.title),
      fingerprint,
      score: ex.quality_score || 100,
      metadata_json: semanticStr
    };

    try {
      await insertExemplar(db, record);
      count++;
    } catch (err: any) {
      if (!err.message.includes('UNIQUE constraint failed')) {
        console.warn(`[!] Failed to inject "${ex.title}":`, err.message);
      }
    }
  }

  console.log(`[3/3] Successfully injected ${count} mapped exemplars.`);
  console.log('\n[SUCCESS] 100/100 Exemplar Pack applied with system-aligned block types.');
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to inject exemplars:', err);
  process.exit(1);
});
