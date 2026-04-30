import { DatabaseLike } from '../originality/types.js';

export async function installLearningSchema(db: DatabaseLike): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS learning_output_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id TEXT,
      agent_name TEXT NOT NULL,
      niche TEXT NOT NULL,
      city TEXT NOT NULL,
      page_type TEXT,
      block_type TEXT,
      html_hash TEXT NOT NULL,
      score INTEGER NOT NULL,
      status TEXT NOT NULL,
      issues_json TEXT NOT NULL,
      issue_codes_json TEXT NOT NULL,
      strengths_json TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      excerpt TEXT,
      llm_score INTEGER,
      llm_reasoning TEXT,
      llm_issues_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_learning_output_reviews_agent_created ON learning_output_reviews(agent_name, created_at DESC);`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_learning_output_reviews_context ON learning_output_reviews(agent_name, niche, city, page_type, block_type, created_at DESC);`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS learning_curated_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      niche TEXT,
      city TEXT,
      page_type TEXT,
      block_type TEXT,
      issue_code TEXT NOT NULL,
      lesson_text TEXT NOT NULL,
      weight REAL DEFAULT 1,
      active INTEGER DEFAULT 1,
      source_review_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_learning_lessons_context ON learning_curated_lessons(agent_name, niche, city, page_type, block_type, active, weight DESC, created_at DESC);`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS learning_exemplars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      niche TEXT,
      city TEXT,
      page_type TEXT,
      block_type TEXT,
      polarity TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      score INTEGER NOT NULL,
      source_review_id INTEGER,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_learning_exemplars_context ON learning_exemplars(agent_name, niche, city, page_type, block_type, polarity, score DESC, created_at DESC);`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS learning_feedback_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id TEXT,
      page_id TEXT,
      agent_name TEXT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_learning_feedback_events_created ON learning_feedback_events(created_at DESC);`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS learning_sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      niche TEXT,
      city TEXT,
      block_type TEXT,
      sentence_text TEXT NOT NULL,
      technical_score INTEGER DEFAULT 0,
      local_score INTEGER DEFAULT 0,
      fingerprint TEXT UNIQUE NOT NULL,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_learning_sentences_lookup ON learning_sentences(agent_name, niche, city, block_type, technical_score DESC, local_score DESC);`);
}
