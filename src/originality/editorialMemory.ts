import { DatabaseLike, EditorialMemoryEntry } from './types.js';

export async function installEditorialMemorySchema(db: DatabaseLike): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS editorial_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      cluster_scope TEXT NOT NULL,
      city TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      service_key TEXT NOT NULL,
      h2_openings_json TEXT NOT NULL,
      paragraph_signatures_json TEXT NOT NULL,
      faq_openings_json TEXT NOT NULL,
      local_proof_openings_json TEXT NOT NULL,
      cta_openings_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_editorial_memory_scope_created ON editorial_memory(cluster_scope, created_at DESC);`);
}

export async function recordEditorialMemory(db: DatabaseLike, entry: EditorialMemoryEntry): Promise<void> {
  for (const scope of entry.clusterScopes) {
    await db.run(`
      INSERT INTO editorial_memory (
        page_id, cluster_scope, city, niche, page_type, service_key,
        h2_openings_json, paragraph_signatures_json, faq_openings_json,
        local_proof_openings_json, cta_openings_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.pageId,
      scope,
      entry.city,
      entry.niche,
      entry.pageType,
      entry.serviceKey,
      JSON.stringify(entry.h2Openings || []),
      JSON.stringify(entry.paragraphSignatures || []),
      JSON.stringify(entry.faqOpenings || []),
      JSON.stringify(entry.localProofOpenings || []),
      JSON.stringify(entry.ctaOpenings || [])
    ]);
  }
}

export async function getRecentEditorialMemory(db: DatabaseLike, scopes: string[], limit = 20, niche?: string): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `
    SELECT *
    FROM editorial_memory
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