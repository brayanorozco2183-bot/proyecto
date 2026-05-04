import { DatabaseLike, VisualMemoryEntry } from './types.js';

export async function installVisualMemorySchema(db: DatabaseLike): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS visual_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      cluster_scope TEXT NOT NULL,
      city TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      service_key TEXT NOT NULL,
      family TEXT,
      hero_signature TEXT NOT NULL,
      block_sequence_signature TEXT NOT NULL,
      block_variants_signature TEXT NOT NULL,
      nav_pattern_signature TEXT NOT NULL,
      cta_pattern_signature TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_visual_memory_scope_created ON visual_memory(cluster_scope, created_at DESC);`);
}

export async function recordVisualMemory(db: DatabaseLike, entry: VisualMemoryEntry): Promise<void> {
  for (const scope of entry.clusterScopes) {
    await db.run(`
      INSERT INTO visual_memory (
        page_id, cluster_scope, city, niche, page_type, service_key, family,
        hero_signature, block_sequence_signature, block_variants_signature,
        nav_pattern_signature, cta_pattern_signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.pageId,
      scope,
      entry.city,
      entry.niche,
      entry.pageType,
      entry.serviceKey,
      entry.family || null,
      entry.heroSignature,
      entry.blockSequenceSignature,
      entry.blockVariantsSignature,
      entry.navPatternSignature,
      entry.ctaPatternSignature
    ]);
  }
}

export async function getRecentVisualMemory(db: DatabaseLike, scopes: string[], limit = 20, niche?: string): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `
    SELECT *
    FROM visual_memory
    WHERE cluster_scope IN (${placeholders})
  `;
  const params: any[] = [...scopes];

  if (niche) {
    query += ` AND niche = ?`;
    params.push(niche);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  return db.all(query, params);
}