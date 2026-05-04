import { DatabaseLike, OriginalityReservationEntry } from './types.js';

export async function installOriginalityReservationSchema(db: DatabaseLike): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS originality_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_key TEXT UNIQUE NOT NULL,
      cluster_scope TEXT NOT NULL,
      mission_id TEXT,
      page_id TEXT,
      city TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      service_key TEXT NOT NULL,
      hero_signature TEXT NOT NULL,
      block_sequence_signature TEXT NOT NULL,
      nav_pattern_signature TEXT NOT NULL,
      cta_pattern_signature TEXT NOT NULL,
      family TEXT,
      status TEXT DEFAULT 'pending',
      expires_at DATETIME,
      consumed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_originality_res_scope_status ON originality_reservations(cluster_scope, status, created_at DESC);`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_originality_res_signatures ON originality_reservations(hero_signature, block_sequence_signature, nav_pattern_signature, cta_pattern_signature, status);`);
}

export async function reserveOriginalityCombo(db: DatabaseLike, entry: OriginalityReservationEntry): Promise<void> {
  const expiresAt = entry.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString();
  for (const scope of entry.clusterScopes) {
    await db.run(`
      INSERT OR IGNORE INTO originality_reservations (
        reservation_key, cluster_scope, mission_id, page_id, city, niche, page_type,
        service_key, hero_signature, block_sequence_signature, nav_pattern_signature,
        cta_pattern_signature, family, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.reservationKey,
      scope,
      entry.missionId || null,
      entry.pageId || null,
      entry.city,
      entry.niche,
      entry.pageType,
      entry.serviceKey,
      entry.heroSignature,
      entry.blockSequenceSignature,
      entry.navPatternSignature,
      entry.ctaPatternSignature,
      entry.family || null,
      entry.status || 'pending',
      expiresAt
    ]);
  }
}

export async function markOriginalityReservationConsumed(db: DatabaseLike, reservationKey: string): Promise<void> {
  await db.run(`
    UPDATE originality_reservations
    SET status = 'consumed', consumed_at = CURRENT_TIMESTAMP
    WHERE reservation_key = ? AND status = 'pending'
  `, [reservationKey]);
}

export async function releaseOriginalityReservation(db: DatabaseLike, reservationKey: string): Promise<void> {
  await db.run(`
    UPDATE originality_reservations
    SET status = 'released'
    WHERE reservation_key = ? AND status = 'pending'
  `, [reservationKey]);
}

export async function expireOldReservations(db: DatabaseLike): Promise<void> {
  await db.run(`
    UPDATE originality_reservations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
  `);
}

export async function getActiveReservations(db: DatabaseLike, scopes: string[], niche?: string, limit = 30): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `
    SELECT *
    FROM originality_reservations
    WHERE cluster_scope IN (${placeholders})
      AND status = 'pending'
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

export async function findReservationBySnapshot(db: DatabaseLike, input: {
  scopes: string[];
  niche: string;
  heroSignature: string;
  blockSequenceSignature: string;
  navPatternSignature: string;
  ctaPatternSignature: string;
}): Promise<any | undefined> {
  if (!input.scopes.length || !db.get) return undefined;
  const placeholders = input.scopes.map(() => '?').join(', ');
  return db.get(`
    SELECT *
    FROM originality_reservations
    WHERE cluster_scope IN (${placeholders})
      AND niche = ?
      AND hero_signature = ?
      AND block_sequence_signature = ?
      AND nav_pattern_signature = ?
      AND cta_pattern_signature = ?
      AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `, [
    ...input.scopes,
    input.niche,
    input.heroSignature,
    input.blockSequenceSignature,
    input.navPatternSignature,
    input.ctaPatternSignature
  ]);
}
