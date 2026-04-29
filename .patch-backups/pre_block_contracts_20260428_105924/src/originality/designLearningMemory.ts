import {
  DatabaseLike,
  DesignExemplarEntry,
  DesignLearningIssue,
  DesignLearningRun,
  DesignLessonEntry
} from './types.js';

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export async function installDesignLearningSchema(db: DatabaseLike): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS design_learning_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      cluster_scope TEXT NOT NULL,
      city TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      service_key TEXT NOT NULL,
      family TEXT,
      hero_treatment TEXT,
      page_skeleton TEXT,
      page_composition TEXT,
      visual_system TEXT,
      block_variants_json TEXT NOT NULL,
      patterns_json TEXT NOT NULL,
      design_score REAL NOT NULL,
      issues_json TEXT NOT NULL,
      blur_count INTEGER DEFAULT 0,
      dense_card_streak INTEGER DEFAULT 0,
      unique_variant_count INTEGER DEFAULT 0,
      contract_leak_count INTEGER DEFAULT 0,
      responsive_hotfix_used INTEGER DEFAULT 0,
      hero_cta_visible INTEGER DEFAULT 0,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_design_learning_scope_created ON design_learning_runs(cluster_scope, created_at DESC);`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_design_learning_scope_family ON design_learning_runs(cluster_scope, family, created_at DESC);`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS design_exemplars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      cluster_scope TEXT NOT NULL,
      city TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      service_key TEXT NOT NULL,
      family TEXT,
      hero_treatment TEXT,
      page_skeleton TEXT,
      page_composition TEXT,
      visual_system TEXT,
      block_sequence_signature TEXT NOT NULL,
      block_variants_signature TEXT NOT NULL,
      design_score REAL NOT NULL,
      reason TEXT NOT NULL,
      excerpt TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_design_exemplars_scope_created ON design_exemplars(cluster_scope, created_at DESC);`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS design_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cluster_scope TEXT NOT NULL,
      niche TEXT NOT NULL,
      page_type TEXT NOT NULL,
      lesson_code TEXT NOT NULL,
      lesson_text TEXT NOT NULL,
      polarity TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_value TEXT,
      weight REAL NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_design_lessons_scope_target ON design_lessons(cluster_scope, target_type, target_value, last_seen_at DESC);`);
}

export async function recordDesignLearningRun(db: DatabaseLike, entry: DesignLearningRun): Promise<void> {
  for (const scope of entry.clusterScopes) {
    await db.run(`
      INSERT INTO design_learning_runs (
        page_id, cluster_scope, city, niche, page_type, service_key,
        family, hero_treatment, page_skeleton, page_composition, visual_system,
        block_variants_json, patterns_json, design_score, issues_json,
        blur_count, dense_card_streak, unique_variant_count, contract_leak_count,
        responsive_hotfix_used, hero_cta_visible, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.pageId,
      scope,
      entry.city,
      entry.niche,
      entry.pageType,
      entry.serviceKey,
      entry.family || null,
      entry.heroTreatment || null,
      entry.pageSkeleton || null,
      entry.pageComposition || null,
      entry.visualSystem || null,
      json(entry.blockVariants || []),
      json(entry.patterns || []),
      entry.designScore,
      json(entry.issues || []),
      entry.blurCount || 0,
      entry.denseCardStreak || 0,
      entry.uniqueVariantCount || 0,
      entry.contractLeakCount || 0,
      entry.responsiveHotfixUsed ? 1 : 0,
      entry.heroCtaVisible ? 1 : 0,
      entry.source || 'post_render'
    ]);
  }
}

export async function recordDesignExemplar(db: DatabaseLike, entry: DesignExemplarEntry): Promise<void> {
  for (const scope of entry.clusterScopes) {
    await db.run(`
      INSERT INTO design_exemplars (
        page_id, cluster_scope, city, niche, page_type, service_key,
        family, hero_treatment, page_skeleton, page_composition, visual_system,
        block_sequence_signature, block_variants_signature, design_score,
        reason, excerpt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.pageId,
      scope,
      entry.city,
      entry.niche,
      entry.pageType,
      entry.serviceKey,
      entry.family || null,
      entry.heroTreatment || null,
      entry.pageSkeleton || null,
      entry.pageComposition || null,
      entry.visualSystem || null,
      entry.blockSequenceSignature,
      entry.blockVariantsSignature,
      entry.designScore,
      entry.reason,
      entry.excerpt || null
    ]);
  }
}

export async function upsertDesignLesson(db: DatabaseLike, lesson: DesignLessonEntry): Promise<void> {
  const exists = db.get ? await db.get<any>(`
    SELECT id, weight
    FROM design_lessons
    WHERE cluster_scope = ? AND niche = ? AND page_type = ?
      AND lesson_code = ? AND polarity = ? AND target_type = ?
      AND COALESCE(target_value, '') = COALESCE(?, '')
    LIMIT 1
  `, [
    lesson.clusterScope,
    lesson.niche,
    lesson.pageType,
    lesson.lessonCode,
    lesson.polarity,
    lesson.targetType,
    lesson.targetValue || null
  ]) : undefined;

  if (exists?.id) {
    await db.run(`
      UPDATE design_lessons
      SET weight = weight + ?,
          lesson_text = ?,
          last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [lesson.weight || 1, lesson.lessonText, exists.id]);
    return;
  }

  await db.run(`
    INSERT INTO design_lessons (
      cluster_scope, niche, page_type, lesson_code, lesson_text,
      polarity, target_type, target_value, weight
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    lesson.clusterScope,
    lesson.niche,
    lesson.pageType,
    lesson.lessonCode,
    lesson.lessonText,
    lesson.polarity,
    lesson.targetType,
    lesson.targetValue || null,
    lesson.weight || 1
  ]);
}

export async function getRecentDesignLearningRuns(
  db: DatabaseLike,
  scopes: string[],
  limit = 24,
  niche?: string,
  pageType?: string
): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `SELECT * FROM design_learning_runs WHERE cluster_scope IN (${placeholders})`;
  const params: any[] = [...scopes];

  if (niche) {
    query += ` AND niche = ?`;
    params.push(niche);
  }

  if (pageType) {
    query += ` AND page_type = ?`;
    params.push(pageType);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  return db.all(query, params);
}

export async function getTopDesignExemplars(
  db: DatabaseLike,
  scopes: string[],
  limit = 8,
  niche?: string,
  pageType?: string
): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `SELECT * FROM design_exemplars WHERE cluster_scope IN (${placeholders})`;
  const params: any[] = [...scopes];

  if (niche) {
    query += ` AND niche = ?`;
    params.push(niche);
  }

  if (pageType) {
    query += ` AND page_type = ?`;
    params.push(pageType);
  }

  query += ` ORDER BY design_score DESC, created_at DESC LIMIT ?`;
  params.push(limit);

  return db.all(query, params);
}

export async function getTopDesignLessons(
  db: DatabaseLike,
  scopes: string[],
  limit = 20,
  niche?: string,
  pageType?: string
): Promise<any[]> {
  if (!scopes.length) return [];
  const placeholders = scopes.map(() => '?').join(', ');
  let query = `SELECT * FROM design_lessons WHERE cluster_scope IN (${placeholders})`;
  const params: any[] = [...scopes];

  if (niche) {
    query += ` AND niche = ?`;
    params.push(niche);
  }

  if (pageType) {
    query += ` AND page_type = ?`;
    params.push(pageType);
  }

  query += ` ORDER BY weight DESC, last_seen_at DESC LIMIT ?`;
  params.push(limit);

  return db.all(query, params);
}

export function parseIssueArray(raw: any): DesignLearningIssue[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseStringArray(raw: any): string[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.map((item) => String(item || '')).filter(Boolean) : [];
  } catch {
    return [];
  }
}
