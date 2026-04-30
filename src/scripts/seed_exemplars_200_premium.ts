import fs from 'fs';
import path from 'path';
import { dbManager } from '../db/index.js';
import { installLearningSchema } from '../learning/schema.js';
import { insertExemplar } from '../learning/exemplarRepository.js';
import { ExemplarRecord } from '../learning/types.js';

type SeedPayload = {
  pack: string;
  count: number;
  exemplars: Array<{
    agent_name: string;
    niche: string | null;
    city: string | null;
    page_type: string | null;
    block_type: string | null;
    polarity: 'positive' | 'negative';
    title: string;
    score: number;
    fingerprint: string;
    excerpt: string;
    metadata_json?: string | null;
  }>;
};

function resolveSeedPath(): string {
  const explicit = process.env.GRAVITY_EXEMPLARS_FILE;
  if (explicit) return explicit;
  return path.resolve(process.cwd(), 'data/learning/exemplars_200_premium_v72.json');
}

function normalizeNullable(value: string | null | undefined): string | null {
  const cleaned = String(value ?? '').trim();
  return cleaned.length > 0 ? cleaned.toLowerCase() : null;
}

async function main() {
  const filePath = resolveSeedPath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el fichero de exemplars: ${filePath}`);
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as SeedPayload;
  if (!Array.isArray(payload.exemplars) || payload.exemplars.length !== 200) {
    throw new Error(`El pack debe contener exactamente 200 exemplars. Detectados: ${payload.exemplars?.length ?? 0}`);
  }

  const db = await dbManager.getDB();
  await installLearningSchema(db);

  console.log(`[learning] Instalando ${payload.exemplars.length} exemplars premium desde ${payload.pack}...`);

  await db.run("DELETE FROM learning_exemplars WHERE fingerprint LIKE 'v72_200_%'");

  let inserted = 0;
  for (const raw of payload.exemplars) {
    const record: ExemplarRecord = {
      agent_name: process.env.GRAVITY_EXEMPLAR_AGENT || raw.agent_name || 'Content_Writer_01',
      niche: normalizeNullable(raw.niche),
      city: normalizeNullable(raw.city),
      page_type: normalizeNullable(raw.page_type),
      block_type: normalizeNullable(raw.block_type),
      polarity: raw.polarity,
      title: raw.title,
      excerpt: raw.excerpt,
      fingerprint: raw.fingerprint,
      score: 100,
      source_review_id: null,
      metadata_json: raw.metadata_json || null
    };
    await insertExemplar(db, record);
    inserted++;
  }

  const byBlock = await db.all<{ block_type: string; total: number }[]>(
    "SELECT block_type, COUNT(*) as total FROM learning_exemplars WHERE fingerprint LIKE 'v72_200_%' GROUP BY block_type ORDER BY block_type"
  );

  console.log(`[learning] OK: ${inserted} exemplars 100/100 instalados.`);
  console.table(byBlock);
}

main().catch((error) => {
  console.error('[learning] Error instalando exemplars premium:', error);
  process.exit(1);
});
