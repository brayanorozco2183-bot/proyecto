import fs from 'fs/promises';
import path from 'path';

export type MissionEventLevel = 'debug' | 'info' | 'warn' | 'error';

export interface MissionEvent {
  ts?: string;
  level: MissionEventLevel;
  missionId?: string;
  phase?: string;
  event: string;
  status?: string;
  durationMs?: number;
  message?: string;
  data?: Record<string, unknown>;
}

function safeClone(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (typeof current === 'bigint') return Number(current);
    if (current instanceof Error) return { name: current.name, message: current.message, stack: current.stack };
    return current;
  }));
}

function lineFor(event: MissionEvent): string {
  return JSON.stringify(safeClone({ ts: event.ts || new Date().toISOString(), ...event })) + '\n';
}

export async function appendMissionEvent(artifactsDir: string | undefined, event: MissionEvent): Promise<void> {
  if (!artifactsDir) return;
  try {
    await fs.mkdir(artifactsDir, { recursive: true });
    await fs.appendFile(path.join(artifactsDir, 'mission_events.jsonl'), lineFor(event), 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[OBSERVABILITY] Could not append mission event: ${message}`);
  }
}

export function formatHumanEvent(event: MissionEvent): string {
  const pieces = [
    `[${event.phase || 'Mission'}]`,
    event.event,
    event.status ? `status=${event.status}` : '',
    typeof event.durationMs === 'number' ? `durationMs=${event.durationMs}` : '',
    event.message ? `message="${event.message}"` : '',
  ].filter(Boolean);
  return pieces.join(' ');
}
