import { DatabaseLike, SiteStructureMemoryEntry } from './types.js';

export async function installSiteStructureMemorySchema(db: DatabaseLike): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS site_structure_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      cluster_scope TEXT NOT NULL,
      city TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      service_key TEXT NOT NULL,
      block_sequence_json TEXT NOT NULL,
      block_variants_json TEXT NOT NULL,
      hero_signature TEXT NOT NULL,
      nav_signature TEXT NOT NULL,
      cta_signature TEXT NOT NULL,
      faq_structure_signature TEXT NOT NULL,
      structural_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_site_structure_scope_created ON site_structure_memory(cluster_scope, created_at DESC);`);
}

export async function recordSiteStructureMemory(db: DatabaseLike, entry: SiteStructureMemoryEntry): Promise<void> {
  for (const scope of entry.clusterScopes) {
    await db.run(`
      INSERT INTO site_structure_memory (
        page_id, cluster_scope, city, niche, page_type, service_key,
        block_sequence_json, block_variants_json, hero_signature, nav_signature,
        cta_signature, faq_structure_signature, structural_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.pageId,
      scope,
      entry.city,
      entry.niche,
      entry.pageType,
      entry.serviceKey,
      JSON.stringify(entry.blockSequence || []),
      JSON.stringify(entry.blockVariants || []),
      entry.heroSignature,
      entry.navSignature,
      entry.ctaSignature,
      entry.faqStructureSignature,
      entry.structural ? JSON.stringify(entry.structural) : null
    ]);
  }
}

export async function getRecentSiteStructureMemory(db: DatabaseLike, scopes: string[], limit = 20, niche?: string): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `
    SELECT *
    FROM site_structure_memory
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

export async function scoreDesignRepetitionRisk(db: DatabaseLike, scopes: string[], candidate: any): Promise<number> {
  const recent = await getRecentSiteStructureMemory(db, scopes, 15);
  let score = 0;

  for (const entry of recent) {
    // 1. Hero + Cadence (Approximate family/personality)
    if (entry.hero_signature === candidate.heroSignature && entry.block_variants_json === JSON.stringify(candidate.blockVariants)) {
      score += 0.5;
    }

    // 2. Block sequence (Top 3)
    const entrySeq = JSON.parse(entry.block_sequence_json || '[]').slice(0, 3).join('|');
    const candidateSeq = (candidate.blockSequence || []).slice(0, 3).join('|');
    if (entrySeq && candidateSeq && entrySeq === candidateSeq) {
      score += 0.3;
    }

    // 3. Structural Metadata (if available)
    if (entry.structural_json && candidate.structural) {
      const s1 = JSON.parse(entry.structural_json);
      const s2 = candidate.structural;
      
      if (JSON.stringify(s1.order) === JSON.stringify(s2.order)) score += 0.4;
      if (JSON.stringify(s1.shells) === JSON.stringify(s2.shells)) score += 0.3;
      if (s1.composition === s2.composition && s1.cadence === s2.cadence) score += 0.2;
    }
  }

  return score;
}