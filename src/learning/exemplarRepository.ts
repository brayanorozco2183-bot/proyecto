import { DatabaseLike } from '../originality/types.js';
import { ExemplarRecord, PromptLearningContext, ReviewPersistenceRecord } from './types.js';
import { excerptText, firstWords, hashString, normalizeKey } from './utils.js';
import { expandAgentAliases, expandBlockTypeAliases } from './blockTypeAliases.js';

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

function buildWhere(context: PromptLearningContext, polarity?: 'positive' | 'negative') {
  const clauses: string[] = [];
  const params: any[] = [];

  const agentAliases = expandAgentAliases(context.agentName);
  if (agentAliases.length) {
    clauses.push(`agent_name IN (${placeholders(agentAliases.length)})`);
    params.push(...agentAliases);
  } else {
    clauses.push('agent_name = ?');
    params.push(context.agentName);
  }

  if (context.niche) {
    clauses.push('(niche = ? OR niche IS NULL)');
    params.push(normalizeKey(context.niche));
  }
  if (context.city) {
    clauses.push('(city = ? OR city IS NULL)');
    params.push(normalizeKey(context.city));
  }
  if (context.pageType) {
    clauses.push('(page_type = ? OR page_type IS NULL)');
    params.push(normalizeKey(context.pageType));
  }
  if (context.blockType) {
    const aliases = expandBlockTypeAliases(context.blockType);
    if (aliases.length) {
      clauses.push(`(block_type IN (${placeholders(aliases.length)}) OR block_type IS NULL)`);
      params.push(...aliases);
    } else {
      clauses.push('(block_type = ? OR block_type IS NULL)');
      params.push(normalizeKey(context.blockType));
    }
  }
  if (polarity) {
    clauses.push('polarity = ?');
    params.push(polarity);
  }

  return { where: clauses.join(' AND '), params };
}

function specificityOrder(context: PromptLearningContext): string {
  const city = context.city ? normalizeKey(context.city) : '';
  const niche = context.niche ? normalizeKey(context.niche) : '';
  const blockAliases = expandBlockTypeAliases(context.blockType);
  const blockCase = blockAliases.length
    ? `CASE WHEN block_type IN (${blockAliases.map((alias) => `'${alias.replace(/'/g, "''")}'`).join(',')}) THEN 8 ELSE 0 END`
    : '0';
  return `
    (CASE WHEN city = '${city.replace(/'/g, "''")}' THEN 40 WHEN city IS NULL THEN 0 ELSE 5 END) +
    (CASE WHEN niche = '${niche.replace(/'/g, "''")}' THEN 30 WHEN niche IS NULL THEN 0 ELSE 5 END) +
    (${blockCase}) +
    (CASE WHEN page_type IS NOT NULL THEN 3 ELSE 0 END)
  `;
}

export async function getExemplars(db: DatabaseLike, context: PromptLearningContext, polarity?: 'positive' | 'negative', limit = 3): Promise<ExemplarRecord[]> {
  const { where, params } = buildWhere(context, polarity);
  return db.all<ExemplarRecord[]>(`
    SELECT *
    FROM learning_exemplars
    WHERE ${where}
    ORDER BY (${specificityOrder(context)}) DESC, score DESC, created_at DESC
    LIMIT ?
  `, [...params, limit]);
}

export async function insertExemplar(db: DatabaseLike, exemplar: ExemplarRecord): Promise<void> {
  const existing = db.get ? await db.get<any>(`
    SELECT id FROM learning_exemplars
    WHERE fingerprint = ? AND agent_name = ? AND polarity = ?
    LIMIT 1
  `, [exemplar.fingerprint, exemplar.agent_name, exemplar.polarity]) : null;
  if (existing) return;

  await db.run(`
    INSERT INTO learning_exemplars (
      agent_name, niche, city, page_type, block_type, polarity,
      title, excerpt, fingerprint, score, source_review_id, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    exemplar.agent_name,
    exemplar.niche,
    exemplar.city,
    exemplar.page_type,
    exemplar.block_type,
    exemplar.polarity,
    exemplar.title,
    exemplar.excerpt,
    exemplar.fingerprint,
    exemplar.score,
    exemplar.source_review_id || null,
    exemplar.metadata_json || null
  ]);
}

export async function promoteReviewToExemplars(db: DatabaseLike, context: {
  agentName: string;
  niche: string;
  city: string;
  pageType?: string;
  blockType?: string;
  reviewId?: number;
  review: ReviewPersistenceRecord;
  html: string;
}): Promise<void> {
  const htmlKey = hashString(context.html);
  const existing = await db.get<any>(`
    SELECT id FROM learning_exemplars
    WHERE agent_name = ? AND niche = ? AND city = ? AND page_type IS ? AND block_type IS ? AND fingerprint = ? AND polarity = 'positive'
    LIMIT 1
  `, [context.agentName, context.niche, context.city, context.pageType || null, context.blockType || null, htmlKey]);
  if (existing) return;

  const title = firstWords(context.review.excerpt || context.html, 12) || `${context.agentName} exemplar`;
  await insertExemplar(db, {
    agent_name: context.agentName,
    niche: context.niche,
    city: context.city,
    page_type: context.pageType || null,
    block_type: context.blockType || null,
    polarity: 'positive',
    title,
    excerpt: excerptText(context.html, 520),
    fingerprint: htmlKey,
    score: context.review.score,
    source_review_id: context.reviewId || null,
    metadata_json: JSON.stringify({
      strengths: context.review.strengths,
      metrics: context.review.metrics,
      status: context.review.status
    })
  });
}

export async function promoteNegativeExemplar(db: DatabaseLike, context: {
  agentName: string;
  niche: string;
  city: string;
  pageType?: string;
  blockType?: string;
  reviewId?: number;
  review: ReviewPersistenceRecord;
  html: string;
}): Promise<void> {
  const fingerprint = `${hashString(context.html)}:negative`;
  const existing = await db.get<any>(`
    SELECT id FROM learning_exemplars
    WHERE agent_name = ? AND niche = ? AND city = ? AND page_type IS ? AND block_type IS ? AND fingerprint = ? AND polarity = 'negative'
    LIMIT 1
  `, [context.agentName, context.niche, context.city, context.pageType || null, context.blockType || null, fingerprint]);
  if (existing) return;

  await insertExemplar(db, {
    agent_name: context.agentName,
    niche: context.niche,
    city: context.city,
    page_type: context.pageType || null,
    block_type: context.blockType || null,
    polarity: 'negative',
    title: `Evitar: ${context.review.issueCodes.slice(0, 2).join(' + ') || 'output defectuoso'}`,
    excerpt: excerptText(context.html, 360),
    fingerprint,
    score: context.review.score,
    source_review_id: context.reviewId || null,
    metadata_json: JSON.stringify({
      issueCodes: context.review.issueCodes,
      issues: context.review.issues,
      metrics: context.review.metrics
    })
  });
}

function compactExcerpt(excerpt: string, max = 700): string {
  const text = String(excerpt || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function summarizeExemplarForPrompt(exemplar: ExemplarRecord): string {
  let metadata: any = null;
  try {
    metadata = exemplar.metadata_json ? JSON.parse(exemplar.metadata_json) : null;
  } catch {
    metadata = null;
  }

  if (exemplar.polarity === 'positive') {
    const strengths = Array.isArray(metadata?.strengths) ? metadata.strengths.slice(0, 4).join('; ') : '';
    const pattern = compactExcerpt(exemplar.excerpt, 760);
    return [
      `BUEN PATRÓN (${exemplar.score}/100): ${exemplar.title}.`,
      strengths ? `Señales: ${strengths}.` : '',
      `Ejemplo a imitar: ${pattern}`
    ].filter(Boolean).join(' ');
  }

  const issues = Array.isArray(metadata?.issueCodes) ? metadata.issueCodes.slice(0, 3).join(', ') : 'errores repetidos';
  return `EVITAR (${exemplar.score}/100): ${issues}. Ejemplo corto: ${compactExcerpt(exemplar.excerpt, 420)}`;
}
