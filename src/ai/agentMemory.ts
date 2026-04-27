import crypto from 'crypto';
import type { Database } from 'sqlite';
import { vault } from '../tools/vault.js';

export interface AgentLessonRecord {
  agentName: string;
  niche?: string;
  city?: string;
  scopeKey?: string;
  severity?: 'warning' | 'minor' | 'major' | 'fatal';
  lessonType?: string;
  title: string;
  lesson: string;
  source?: string;
}

export interface AgentFailureRecord {
  agentName: string;
  model: string;
  errorMessage: string;
  failureType?: string;
  niche?: string;
  city?: string;
  scopeKey?: string;
  promptHash?: string;
}

export interface AgentRunRecord {
  agentName: string;
  model: string;
  success: boolean;
  durationMs: number;
  promptLength: number;
  responseLength?: number;
  jsonMode?: boolean;
  missionId?: string;
  niche?: string;
  city?: string;
  scopeKey?: string;
  promptHash?: string;
}

function hashInput(value: string): string {
  return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

export async function installAgentMemorySchema(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      model TEXT NOT NULL,
      success INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      prompt_length INTEGER NOT NULL,
      response_length INTEGER DEFAULT 0,
      json_mode INTEGER DEFAULT 0,
      mission_id TEXT,
      niche TEXT,
      city TEXT,
      scope_key TEXT,
      prompt_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_created
      ON agent_runs(agent_name, created_at DESC);

    CREATE TABLE IF NOT EXISTS agent_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      model TEXT NOT NULL,
      failure_type TEXT,
      error_message TEXT NOT NULL,
      error_signature TEXT NOT NULL,
      niche TEXT,
      city TEXT,
      scope_key TEXT,
      prompt_hash TEXT,
      recurrence_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_failures_signature
      ON agent_failures(agent_name, error_signature);

    CREATE TABLE IF NOT EXISTS agent_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      niche TEXT,
      city TEXT,
      scope_key TEXT,
      severity TEXT DEFAULT 'minor',
      lesson_type TEXT DEFAULT 'quality',
      title TEXT NOT NULL,
      lesson TEXT NOT NULL,
      source TEXT DEFAULT 'system',
      usage_count INTEGER DEFAULT 0,
      last_used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_agent_lessons_lookup
      ON agent_lessons(agent_name, niche, city, scope_key, created_at DESC);

    CREATE TABLE IF NOT EXISTS model_benchmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      capability TEXT,
      model TEXT NOT NULL,
      prompt_family TEXT NOT NULL,
      success_rate REAL DEFAULT 0,
      avg_duration_ms REAL DEFAULT 0,
      avg_response_length REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_model_benchmarks_agent_model
      ON model_benchmarks(agent_name, model, created_at DESC);
  `);
}

export class AgentMemoryStore {
  async getDB(): Promise<Database> {
    const { dbManager } = await import('../db/index.js');
    return dbManager.getDB();
  }

  async recordRun(input: AgentRunRecord): Promise<void> {
    if (!vault.AGENT_MEMORY_ENABLED) return;
    const db = await this.getDB();
    await db.run(
      `INSERT INTO agent_runs (
        agent_name, model, success, duration_ms, prompt_length, response_length,
        json_mode, mission_id, niche, city, scope_key, prompt_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.agentName,
        input.model,
        input.success ? 1 : 0,
        Math.round(input.durationMs || 0),
        Math.max(0, Math.round(input.promptLength || 0)),
        Math.max(0, Math.round(input.responseLength || 0)),
        input.jsonMode ? 1 : 0,
        input.missionId || null,
        input.niche || null,
        input.city || null,
        input.scopeKey || null,
        input.promptHash || null,
      ]
    );
  }

  async recordFailure(input: AgentFailureRecord): Promise<void> {
    if (!vault.AGENT_MEMORY_ENABLED) return;
    const db = await this.getDB();
    const signature = hashInput(`${input.failureType || 'generic'}|${input.errorMessage}`.slice(0, 400));

    await db.run(
      `INSERT INTO agent_failures (
        agent_name, model, failure_type, error_message, error_signature,
        niche, city, scope_key, prompt_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent_name, error_signature) DO UPDATE SET
        recurrence_count = recurrence_count + 1,
        model = excluded.model,
        error_message = excluded.error_message,
        failure_type = excluded.failure_type,
        niche = COALESCE(excluded.niche, agent_failures.niche),
        city = COALESCE(excluded.city, agent_failures.city),
        scope_key = COALESCE(excluded.scope_key, agent_failures.scope_key),
        prompt_hash = COALESCE(excluded.prompt_hash, agent_failures.prompt_hash),
        updated_at = CURRENT_TIMESTAMP`,
      [
        input.agentName,
        input.model,
        input.failureType || 'generic',
        input.errorMessage,
        signature,
        input.niche || null,
        input.city || null,
        input.scopeKey || null,
        input.promptHash || null,
      ]
    );
  }

  async recordLesson(input: AgentLessonRecord): Promise<void> {
    if (!vault.AGENT_MEMORY_ENABLED) return;
    const db = await this.getDB();
    await db.run(
      `INSERT INTO agent_lessons (
        agent_name, niche, city, scope_key, severity, lesson_type,
        title, lesson, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.agentName,
        input.niche || null,
        input.city || null,
        input.scopeKey || null,
        input.severity || 'minor',
        input.lessonType || 'quality',
        input.title,
        input.lesson,
        input.source || 'system',
      ]
    );
  }

  async getRelevantLessons(input: {
    agentName: string;
    niche?: string;
    city?: string;
    scopeKey?: string;
    limit?: number;
  }): Promise<Array<{ title: string; lesson: string; severity: string; lesson_type: string }>> {
    if (!vault.AGENT_MEMORY_ENABLED) return [];
    const db = await this.getDB();
    const maxLessons = Math.max(1, Math.min(10, Number(input.limit || vault.AGENT_MEMORY_MAX_LESSONS || 5)));
    const rows = await db.all(
      `SELECT id, title, lesson, severity, lesson_type
       FROM agent_lessons
       WHERE agent_name = ?
         AND (
           niche = ?
           OR (niche IS NULL AND lesson_type IN ('global_safety','format','governance'))
         )
         AND (city IS NULL OR city = ?)
         AND (scope_key IS NULL OR scope_key = ?)
       ORDER BY
         CASE severity
           WHEN 'fatal' THEN 1
           WHEN 'major' THEN 2
           WHEN 'minor' THEN 3
           ELSE 4
         END,
         created_at DESC
       LIMIT ?`,
      [
        input.agentName,
        input.niche || null,
        input.city || null,
        input.scopeKey || null,
        maxLessons,
      ]
    );

    if (rows.length) {
      const ids = rows.map((row: any) => row.id).filter(Boolean);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(', ');
        await db.run(
          `UPDATE agent_lessons
           SET usage_count = usage_count + 1,
               last_used_at = CURRENT_TIMESTAMP
           WHERE id IN (${placeholders})`,
          ids
        );
      }
    }

    return rows.map((row: any) => ({
      title: row.title,
      lesson: row.lesson,
      severity: row.severity,
      lesson_type: row.lesson_type,
    }));
  }

  async beginMissionScope(input: { missionId: string; niche: string; city: string; forbiddenTerms?: string[] }): Promise<void> {
    process.env.GRAVITY_CURRENT_MISSION_ID = input.missionId;
    process.env.GRAVITY_CURRENT_NICHE = input.niche;
    process.env.GRAVITY_CURRENT_CITY = input.city;
    process.env.GRAVITY_FORBIDDEN_TERMS = (input.forbiddenTerms || []).join('|');
  }

  async getMissionSafeLessons(input: {
    agentName: string;
    niche?: string;
    city?: string;
    scopeKey?: string;
    limit?: number;
    forbiddenTerms?: string[];
  }): Promise<Array<{ title: string; lesson: string; severity: string; lesson_type: string }>> {
    const rows = await this.getRelevantLessons(input);
    const forbidden = (input.forbiddenTerms || String(process.env.GRAVITY_FORBIDDEN_TERMS || '').split('|'))
      .map((v) => String(v || '').toLowerCase().trim())
      .filter(Boolean);
    if (!forbidden.length) return rows;
    return rows.filter((row) => {
      const haystack = String(row.title + ' ' + row.lesson).toLowerCase();
      return !forbidden.some((term) => haystack.includes(term));
    });
  }

  async upsertBenchmark(input: {
    agentName: string;
    capability?: string;
    model: string;
    promptFamily: string;
    successRate: number;
    avgDurationMs: number;
    avgResponseLength: number;
    notes?: string;
  }): Promise<void> {
    if (!vault.AGENT_MEMORY_ENABLED) return;
    const db = await this.getDB();
    await db.run(
      `INSERT INTO model_benchmarks (
        agent_name, capability, model, prompt_family, success_rate,
        avg_duration_ms, avg_response_length, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.agentName,
        input.capability || null,
        input.model,
        input.promptFamily,
        input.successRate,
        input.avgDurationMs,
        input.avgResponseLength,
        input.notes || null,
      ]
    );
  }
}

export const agentMemoryStore = new AgentMemoryStore();
export const makePromptHash = hashInput;
