import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager } from '../db/index.js';
import { installLearningSchema } from '../learning/schema.js';
import { insertExemplar } from '../learning/exemplarRepository.js';
import { normalizeKey } from '../learning/utils.js';
import { ExemplarRecord } from '../learning/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDataPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data/learning/exemplars_400_premium_v80.json'),
    path.resolve(__dirname, '../../data/learning/exemplars_400_premium_v80.json'),
    path.resolve(__dirname, '../../../data/learning/exemplars_400_premium_v80.json')
  ];
  return candidates[0];
}

function normalizeNullable(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return normalizeKey(value);
}

function normalizeRecord(raw: any): ExemplarRecord {
  return {
    agent_name: String(raw.agent_name || '').trim(),
    niche: normalizeNullable(raw.niche),
    city: normalizeNullable(raw.city),
    page_type: normalizeNullable(raw.page_type),
    block_type: normalizeNullable(raw.block_type),
    polarity: raw.polarity === 'negative' ? 'negative' : 'positive',
    title: String(raw.title || '').trim(),
    excerpt: String(raw.excerpt || '').trim(),
    fingerprint: String(raw.fingerprint || '').trim(),
    score: Number(raw.score || 100),
    source_review_id: null,
    metadata_json: typeof raw.metadata_json === 'string' ? raw.metadata_json : JSON.stringify(raw.metadata_json || {})
  };
}

async function main() {
  const dataPath = resolveDataPath();
  const raw = await fs.readFile(dataPath, 'utf8');
  const records = JSON.parse(raw).map(normalizeRecord) as ExemplarRecord[];

  await dbManager.init();
  const db = await dbManager.getDB();
  await installLearningSchema(db as any);

  let inserted = 0;
  let skipped = 0;
  for (const record of records) {
    if (!record.agent_name || !record.title || !record.excerpt || !record.fingerprint) {
      skipped += 1;
      continue;
    }
    const before = await db.get<{ id: number }>(
      'SELECT id FROM learning_exemplars WHERE fingerprint = ? AND agent_name = ? LIMIT 1',
      [record.fingerprint, record.agent_name]
    );
    if (before) {
      skipped += 1;
      continue;
    }
    await insertExemplar(db as any, record);
    inserted += 1;
  }

  console.log(`[EXEMPLARS_400_V80] inserted=${inserted} skipped=${skipped} total=${records.length}`);
}

main().catch((error) => {
  console.error('[EXEMPLARS_400_V80] Failed:', error);
  process.exit(1);
});
