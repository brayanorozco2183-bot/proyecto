import { DatabaseLike } from '../originality/types.js';
import { CuratedLesson, PromptLearningContext, ReviewPersistenceRecord } from './types.js';
import { uniqueStrings } from './utils.js';

function buildContextWhere(context: PromptLearningContext) {
  const clauses: string[] = ['agent_name = ?', 'active = 1'];
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

  return { where: clauses.join(' AND '), params };
}

export async function getCuratedLessons(db: DatabaseLike, context: PromptLearningContext, limit = 5): Promise<CuratedLesson[]> {
  const { where, params } = buildContextWhere(context);
  return db.all<CuratedLesson[]>(`
    SELECT *
    FROM learning_curated_lessons
    WHERE ${where}
    ORDER BY weight DESC, created_at DESC
    LIMIT ?
  `, [...params, limit]);
}

export async function upsertCuratedLesson(db: DatabaseLike, lesson: CuratedLesson): Promise<void> {
  const existing = await db.get<any>(`
    SELECT id, weight
    FROM learning_curated_lessons
    WHERE agent_name = ?
      AND COALESCE(niche, '') = COALESCE(?, '')
      AND COALESCE(city, '') = COALESCE(?, '')
      AND COALESCE(page_type, '') = COALESCE(?, '')
      AND COALESCE(block_type, '') = COALESCE(?, '')
      AND issue_code = ?
      AND lesson_text = ?
    LIMIT 1
  `, [
    lesson.agent_name,
    lesson.niche || null,
    lesson.city || null,
    lesson.page_type || null,
    lesson.block_type || null,
    lesson.issue_code,
    lesson.lesson_text
  ]);

  if (existing?.id) {
    await db.run(`UPDATE learning_curated_lessons SET weight = ?, active = 1 WHERE id = ?`, [Math.max(existing.weight || 1, lesson.weight || 1) + 0.25, existing.id]);
    return;
  }

  await db.run(`
    INSERT INTO learning_curated_lessons (
      agent_name, niche, city, page_type, block_type,
      issue_code, lesson_text, weight, active, source_review_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    lesson.agent_name,
    lesson.niche || null,
    lesson.city || null,
    lesson.page_type || null,
    lesson.block_type || null,
    lesson.issue_code,
    lesson.lesson_text,
    lesson.weight || 1,
    lesson.active ?? 1,
    lesson.source_review_id || null
  ]);
}

function inferLessonsFromIssueCodes(review: ReviewPersistenceRecord, context: {
  agentName: string;
  niche: string;
  city: string;
  pageType?: string;
  blockType?: string;
}): CuratedLesson[] {
  const lessons: CuratedLesson[] = [];
  const issueCodes = new Set(review.issueCodes || []);

  if (issueCodes.has('PLACEHOLDER_OR_BROKEN_COPY')) {
    lessons.push({
      agent_name: context.agentName,
      niche: context.niche,
      city: context.city,
      page_type: context.pageType || null,
      block_type: context.blockType || null,
      issue_code: 'PLACEHOLDER_OR_BROKEN_COPY',
      lesson_text: 'Nunca dejes frases rotas como “En ,”, “en compensa”, “Factor 1” o texto con huecos; si falta contexto, rehace la frase completa.',
      weight: 1.25,
      active: 1
    });
  }

  if (issueCodes.has('SYSTEM_LEAK_VISIBLE')) {
    lessons.push({
      agent_name: context.agentName,
      niche: context.niche,
      city: context.city,
      page_type: context.pageType || null,
      block_type: context.blockType || null,
      issue_code: 'SYSTEM_LEAK_VISIBLE',
      lesson_text: 'No conviertas labels internos, variantes visuales ni nombres de contrato en texto visible para el usuario.',
      weight: 1.15,
      active: 1
    });
  }

  if (issueCodes.has('PHONE_MISSING')) {
    lessons.push({
      agent_name: context.agentName,
      niche: context.niche,
      city: context.city,
      page_type: context.pageType || null,
      block_type: context.blockType || null,
      issue_code: 'PHONE_MISSING',
      lesson_text: 'Preserva el teléfono exactamente como llega; no reformatees ni elimines href tel:, visible text ni JSON-LD asociado.',
      weight: 1.35,
      active: 1
    });
  }

  if (issueCodes.has('CITY_MISSING')) {
    lessons.push({
      agent_name: context.agentName,
      niche: context.niche,
      city: context.city,
      page_type: context.pageType || null,
      block_type: context.blockType || null,
      issue_code: 'CITY_MISSING',
      lesson_text: 'Integra la ciudad de forma natural en los bloques clave sin duplicarla mecánicamente ni borrarla al corregir.',
      weight: 1.05,
      active: 1
    });
  }

  if (issueCodes.has('CROSS_NICHE_POLLUTION')) {
    lessons.push({
      agent_name: context.agentName,
      niche: context.niche,
      city: context.city,
      page_type: context.pageType || null,
      block_type: context.blockType || null,
      issue_code: 'CROSS_NICHE_POLLUTION',
      lesson_text: 'No mezcles vocabulario de otros nichos; si dudas, prioriza el vocabulario permitido del playbook actual y regenera el bloque.',
      weight: 1.3,
      active: 1
    });
  }

  if (issueCodes.has('CONTENT_TOO_THIN')) {
    lessons.push({
      agent_name: context.agentName,
      niche: context.niche,
      city: context.city,
      page_type: context.pageType || null,
      block_type: context.blockType || null,
      issue_code: 'CONTENT_TOO_THIN',
      lesson_text: 'Aumenta profundidad útil: explica proceso, criterios de decisión y comprobaciones reales en lugar de dejar descripciones telegráficas.',
      weight: 0.95,
      active: 1
    });
  }

  return lessons;
}

export async function deriveCuratedLessonsFromReview(db: DatabaseLike, review: ReviewPersistenceRecord, context: {
  agentName: string;
  niche: string;
  city: string;
  pageType?: string;
  blockType?: string;
  reviewId?: number;
}): Promise<void> {
  const inferred = inferLessonsFromIssueCodes(review, context);
  for (const lesson of inferred) {
    lesson.source_review_id = context.reviewId || null;
    await upsertCuratedLesson(db, lesson);
  }
}

export function summarizeLessonForPrompt(lesson: CuratedLesson): string {
  return `${lesson.issue_code}: ${lesson.lesson_text}`;
}

export function dedupeLessonTexts(lessons: CuratedLesson[]): CuratedLesson[] {
  const seen = new Set<string>();
  const out: CuratedLesson[] = [];
  for (const lesson of lessons || []) {
    const key = `${lesson.issue_code}||${lesson.lesson_text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lesson);
  }
  return out;
}
