import { dbManager } from '../db/index.js';
import { DatabaseLike } from '../originality/types.js';
import { promoteNegativeExemplar, promoteReviewToExemplars } from './exemplarRepository.js';
import { deriveCuratedLessonsFromReview } from './lessonRepository.js';
import { installLearningSchema } from './schema.js';
import { scoreRenderedOutput } from './scoring.js';
import { OutputReviewInput, ReviewPersistenceRecord } from './types.js';

export async function ensureLearningSchema(): Promise<void> {
  const db = await dbManager.getDB();
  await installLearningSchema(db as any);
}

export async function persistOutputReview(input: OutputReviewInput): Promise<ReviewPersistenceRecord & { reviewId?: number }> {
  const db = await dbManager.getDB();
  await installLearningSchema(db as any);

  const scored = scoreRenderedOutput(input);
  const record: ReviewPersistenceRecord = {
    mission_id: input.missionId || null,
    agent_name: input.agentName,
    niche: input.niche,
    city: input.city,
    page_type: input.pageType || null,
    block_type: input.blockType || null,
    html_hash: scored.htmlHash,
    score: scored.score,
    status: scored.status,
    issues: scored.issues,
    issueCodes: scored.issueCodes,
    strengths: scored.strengths,
    metrics: scored.metrics,
    excerpt: scored.excerpt,
    llm_score: input.llmScore || null,
    llm_reasoning: input.llmReasoning || null,
    llm_issues_json: JSON.stringify(input.llmIssues || []),
    issues_json: JSON.stringify(scored.issues),
    issue_codes_json: JSON.stringify(scored.issueCodes),
    strengths_json: JSON.stringify(scored.strengths),
    metrics_json: JSON.stringify(scored.metrics)
  } as any;

  const result = await db.run(`
    INSERT INTO learning_output_reviews (
      mission_id, agent_name, niche, city, page_type, block_type, html_hash,
      score, status, issues_json, issue_codes_json, strengths_json, metrics_json,
      excerpt, llm_score, llm_reasoning, llm_issues_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.mission_id,
    record.agent_name,
    record.niche,
    record.city,
    record.page_type,
    record.block_type,
    record.html_hash,
    record.score,
    record.status,
    record.issues_json,
    record.issue_codes_json,
    record.strengths_json,
    record.metrics_json,
    record.excerpt,
    record.llm_score,
    record.llm_reasoning,
    record.llm_issues_json
  ]);

  const reviewId = result?.lastID;
  await deriveCuratedLessonsFromReview(db as any, record, {
    agentName: input.agentName,
    niche: input.niche,
    city: input.city,
    pageType: input.pageType,
    blockType: input.blockType,
    reviewId
  });

  if (record.status === 'premium' || (record.status === 'publishable' && record.score >= 78)) {
    await promoteReviewToExemplars(db as any, {
      agentName: input.agentName,
      niche: input.niche,
      city: input.city,
      pageType: input.pageType,
      blockType: input.blockType,
      reviewId,
      review: record,
      html: input.html
    });
  }

  if (record.status === 'rejected' || (record.status === 'fixable' && record.score <= 58)) {
    await promoteNegativeExemplar(db as any, {
      agentName: input.agentName,
      niche: input.niche,
      city: input.city,
      pageType: input.pageType,
      blockType: input.blockType,
      reviewId,
      review: record,
      html: input.html
    });
  }

  await db.run(`
    INSERT INTO learning_feedback_events (mission_id, page_id, agent_name, event_type, payload_json)
    VALUES (?, ?, ?, ?, ?)
  `, [
    input.missionId || null,
    input.seo?.canonical || null,
    input.agentName,
    'output_review_recorded',
    JSON.stringify({ reviewId, score: record.score, status: record.status, issueCodes: record.issueCodes })
  ]);

  return { ...record, reviewId };
}
