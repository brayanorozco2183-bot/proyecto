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

export async function loadPipelineState(filePath: string): Promise<PipelineState> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as PipelineState;
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
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
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

  await fs.writeFile(inputPath, JSON.stringify(safeClone(input), null, 2), 'utf8');
  await fs.writeFile(outputPath, JSON.stringify(safeClone(output), null, 2), 'utf8');
  await fs.writeFile(metaPath, JSON.stringify(safeClone(record), null, 2), 'utf8');

  let htmlPath: string | undefined;
  if (extra?.html) {
    htmlPath = path.join(attemptDir, 'artifact.html');
    await fs.writeFile(htmlPath, extra.html, 'utf8');
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
