import fs from 'fs/promises';
import path from 'path';

export interface LlmTelemetryRecord {
  id: string;
  ts: string;
  agentName: string;
  model: string;
  requestedModel?: string;
  attempt: number;
  maxRetries: number;
  tierFallback: boolean;
  status: 'started' | 'success' | 'failed' | 'tier_failed' | 'slow';
  durationMs?: number;
  promptChars: number;
  responseChars?: number;
  jsonMode: boolean;
  timeoutMs?: number;
  error?: string;
  missionId?: string;
  niche?: string;
  city?: string;
  scopeKey?: string;
}

const records: LlmTelemetryRecord[] = [];

function makeId(agentName: string, model: string, attempt: number): string {
  const safeAgent = String(agentName || 'agent').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 48);
  const safeModel = String(model || 'model').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 48);
  return `llm_${safeAgent}_${safeModel}_${Date.now()}_${attempt}`;
}

export function recordLlmTelemetry(record: Omit<LlmTelemetryRecord, 'id' | 'ts'> & { id?: string; ts?: string }): LlmTelemetryRecord {
  const entry: LlmTelemetryRecord = {
    id: record.id || makeId(record.agentName, record.model, record.attempt),
    ts: record.ts || new Date().toISOString(),
    ...record,
  };
  records.push(entry);
  return entry;
}

export function getLlmTelemetryRecords(): LlmTelemetryRecord[] {
  return [...records];
}

export async function writeLlmTelemetry(artifactsDir: string | undefined): Promise<void> {
  if (!artifactsDir) return;
  try {
    await fs.mkdir(artifactsDir, { recursive: true });
    await fs.writeFile(path.join(artifactsDir, 'llm_calls.json'), JSON.stringify(getLlmTelemetryRecords(), null, 2), 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[OBSERVABILITY] Could not write llm_calls.json: ${message}`);
  }
}
