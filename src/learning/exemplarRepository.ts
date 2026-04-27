import { DatabaseLike } from '../originality/types.js';
import { ExemplarRecord, PromptLearningContext, ReviewPersistenceRecord } from './types.js';
import { excerptText, firstWords, hashString, normalizeKey } from './utils.js';

function buildWhere(context: PromptLearningContext, polarity?: 'positive' | 'negative') {
  const clauses: string[] = ['agent_name = ?'];
  const params: any[] = [context.agentName];

  if (context.niche) {
    clauses.push('(niche = ? OR niche IS NULL)');
    params.push(context.niche);
  }
  if (context.city) {
    clauses.push('(city = ? OR city IS NULL)');
    params.push(context.city);
  }
  if (context.pageType) {
    clauses.push('(page_type = ? OR page_type IS NULL)');
    params.push(context.pageType);
  }
  if (context.blockType) {
    clauses.push('(block_type = ? OR block_type IS NULL)');
    params.push(context.blockType);
  }
  if (polarity) {
    clauses.push('polarity = ?');
    params.push(polarity);
  }

  return { where: clauses.join(' AND '), params };
}

export async function getExemplars(db: DatabaseLike, context: PromptLearningContext, polarity?: 'positive' | 'negative', limit = 3): Promise<ExemplarRecord[]> {
  const { where, params } = buildWhere(context, polarity);
  return db.all<ExemplarRecord[]>(`
    SELECT *
    FROM learning_exemplars
    WHERE ${where}
    ORDER BY score DESC, created_at DESC
    LIMIT ?
  `, [...params, limit]);
}

export async function insertExemplar(db: DatabaseLike, exemplar: ExemplarRecord): Promise<void> {
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
    excerpt: excerptText(context.html, 240),
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
    excerpt: excerptText(context.html, 220),
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

export function summarizeExemplarForPrompt(exemplar: ExemplarRecord): string {
  let metadata: any = null;
  try {
    metadata = exemplar.metadata_json ? JSON.parse(exemplar.metadata_json) : null;
  } catch {
    metadata = null;
  }

  if (exemplar.polarity === 'positive') {
    const strengths = Array.isArray(metadata?.strengths) ? metadata.strengths.slice(0, 2).join('; ') : '';
    return `BUEN PATRÓN (${exemplar.score}/100): ${exemplar.title}. Señales: ${strengths || exemplar.excerpt}`;
  }

  const issues = Array.isArray(metadata?.issueCodes) ? metadata.issueCodes.slice(0, 3).join(', ') : 'errores repetidos';
  return `EVITAR (${exemplar.score}/100): ${issues}. Ejemplo corto: ${exemplar.excerpt}`;
}
