import { DatabaseLike } from '../originality/types.js';
import { PromptLearningContext } from './types.js';
import { hashString, normalizeKey } from './utils.js';

export interface SentenceRecord {
  agent_name: string;
  niche?: string;
  city?: string;
  block_type?: string;
  sentence_text: string;
  technical_score: number;
  local_score: number;
}

export async function insertSentence(db: DatabaseLike, sentence: SentenceRecord): Promise<void> {
  const fingerprint = hashString(sentence.sentence_text);
  try {
    await db.run(`
      INSERT INTO learning_sentences (
        agent_name, niche, city, block_type, sentence_text,
        technical_score, local_score, fingerprint
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(fingerprint) DO UPDATE SET
        usage_count = usage_count + 1
    `, [
      sentence.agent_name,
      normalizeKey(sentence.niche),
      normalizeKey(sentence.city),
      normalizeKey(sentence.block_type),
      sentence.sentence_text,
      sentence.technical_score,
      sentence.local_score,
      fingerprint
    ]);
  } catch (e) {
    // Ignore duplicates or other errors in background learning
  }
}

export async function getRelevantSentences(db: DatabaseLike, context: PromptLearningContext, limit = 10): Promise<string[]> {
  const clauses: string[] = ['agent_name = ?'];
  const params: any[] = [context.agentName];

  if (context.niche) {
    clauses.push('(niche = ? OR niche IS NULL)');
    params.push(normalizeKey(context.niche));
  }
  if (context.city) {
    clauses.push('(city = ? OR city IS NULL)');
    params.push(normalizeKey(context.city));
  }

  const rows = await db.all<any[]>(`
    SELECT sentence_text
    FROM learning_sentences
    WHERE ${clauses.join(' AND ')}
    ORDER BY technical_score DESC, local_score DESC, created_at DESC
    LIMIT ?
  `, [...params, limit]);

  return rows.map(r => r.sentence_text);
}
