import fs from 'fs/promises';
import path from 'path';

import type { GenerationMission } from '../types/pipeline_v2.js';
import type { CanonicalPipelinePhaseId } from '../types/pipeline/contracts.js';
import type { PipelinePhaseExecutionRecord, PipelineState } from '../types/pipeline/state.js';

function sanitizeToken(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'na';
}

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (typeof current === 'bigint') return Number(current);
    if (current instanceof Error) {
      return {
        name: current.name,
        message: current.message,
        stack: current.stack,
      };
    }
    return current;
  }));
}

function nowIso(): string {
  return new Date().toISOString();
}

function phaseFolderName(phase: CanonicalPipelinePhaseId): string {
  return phase.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
}

export async function ensurePipelineStateArtifactsDir(
  mission: { niche: string; city: string },
  options?: { baseDir?: string; artifactsDir?: string },
): Promise<{ runId: string; dir: string }> {
  if (options?.artifactsDir) {
    await fs.mkdir(path.join(options.artifactsDir, 'pipeline_state'), { recursive: true });
    return {
      runId: path.basename(options.artifactsDir),
      dir: options.artifactsDir,
    };
  }

  const baseDir = options?.baseDir || path.join(process.cwd(), 'debug_runs');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = `${sanitizeToken(mission.niche)}__${sanitizeToken(mission.city)}__${stamp}`;
  const dir = path.join(baseDir, runId);
  await fs.mkdir(path.join(dir, 'pipeline_state'), { recursive: true });
  return { runId, dir };
}

export function getPipelineStateDir(artifactsDir: string): string {
  return path.join(artifactsDir, 'pipeline_state');
}

export function getPipelineStateFilePath(artifactsDir: string): string {
  return path.join(getPipelineStateDir(artifactsDir), 'state.json');
}

async function readJsonState(filePath: string): Promise<PipelineState> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as PipelineState;
}

function stateSnapshotFileName(state: PipelineState): string {
  const index = String((state.phases || []).length).padStart(3, '0');
  const phase = state.lifecycle.currentPhase || state.lifecycle.lastStablePhase || 'initialized';
  const status = state.lifecycle.status || 'running';
  return `state_${index}_${phase}_${status}.json`.replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

async function findRecoverableState(filePath: string): Promise<PipelineState | null> {
  const dir = path.dirname(filePath);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }

  const candidates = entries
    .filter((name) => /^state_\d+_.*\.json$/i.test(name))
    .sort()
    .reverse();

  for (const candidate of candidates) {
    try {
      return await readJsonState(path.join(dir, candidate));
    } catch {
      continue;
    }
  }
  return null;
}

async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

export async function loadPipelineState(filePath: string): Promise<PipelineState> {
  try {
    return await readJsonState(filePath);
  } catch (error: any) {
    const recovered = await findRecoverableState(filePath);
    if (recovered) return recovered;
    throw new Error(`No se pudo cargar PipelineState ni recuperar snapshot estable: ${error?.message || error}`);
  }
}

export async function savePipelineState(state: PipelineState): Promise<string> {
  if (!state.artifactsDir) {
    throw new Error('No se puede persistir PipelineState sin artifactsDir.');
  }
  const filePath = getPipelineStateFilePath(state.artifactsDir);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const snapshot = safeClone({
    ...state,
    updatedAt: nowIso(),
    stateFilePath: filePath,
  });
  await atomicWriteJson(filePath, snapshot);

  const snapshotPath = path.join(path.dirname(filePath), stateSnapshotFileName(snapshot as PipelineState));
  await atomicWriteJson(snapshotPath, snapshot);
  return filePath;
}

export async function writePhaseArtifacts(
  artifactsDir: string,
  phase: CanonicalPipelinePhaseId,
  input: unknown,
  output: unknown,
  record: PipelinePhaseExecutionRecord,
  attemptNumber: number,
  extra?: { html?: string },
): Promise<PipelinePhaseExecutionRecord['artifactPaths']> {
  const phaseRoot = path.join(getPipelineStateDir(artifactsDir), phaseFolderName(phase));
  const attemptDir = path.join(phaseRoot, `attempt-${attemptNumber}`);
  await fs.mkdir(attemptDir, { recursive: true });

  const inputPath = path.join(attemptDir, 'input.json');
  const outputPath = path.join(attemptDir, 'output.json');
  const metaPath = path.join(attemptDir, 'meta.json');

  await atomicWriteJson(inputPath, safeClone(input));
  await atomicWriteJson(outputPath, safeClone(output));
  await atomicWriteJson(metaPath, safeClone(record));

  let htmlPath: string | undefined;
  if (extra?.html) {
    htmlPath = path.join(attemptDir, 'artifact.html');
    const tmpHtmlPath = `${htmlPath}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tmpHtmlPath, extra.html, 'utf8');
    await fs.rename(tmpHtmlPath, htmlPath);
  }

  return { inputPath, outputPath, metaPath, htmlPath };
}

export function createInitialPipelineState(mission: GenerationMission, runId: string, artifactsDir?: string): PipelineState {
  const stamp = nowIso();
  return {
    schemaVersion: 'pipeline-state@1',
    runId,
    createdAt: stamp,
    updatedAt: stamp,
    mission: safeClone(mission),
    lifecycle: {
      status: 'initialized',
    },
    artifactsDir,
    stateFilePath: artifactsDir ? getPipelineStateFilePath(artifactsDir) : undefined,
    phases: [],
    observability: {
      durations: {},
      scores: {},
      retries: {},
      agent_logs: [],
      tokenUsage: 0,
      tokenBudget: 50000,
      totalCost: 0,
      agentConfidence: {},
    },
    data: {},
  };
}

export function getLastStablePhase(state: PipelineState): CanonicalPipelinePhaseId | undefined {
  const successful = [...(state.phases || [])]
    .filter((phase) => phase.status === 'success' || phase.status === 'degraded')
    .map((phase) => phase.phase);
  return successful.length ? successful[successful.length - 1] : undefined;
}
