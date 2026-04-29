import fs from 'fs/promises';
import path from 'path';
import type { DebugPhaseId, DebugPipelineState } from './phaseDebugTypes.js';
import { DEBUG_PHASE_LABELS } from './phaseDebugTypes.js';

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

export async function ensureRunArtifactsDir(
  mission: { niche: string; city: string },
  baseDir = path.join(process.cwd(), 'debug_runs'),
): Promise<{ runId: string; dir: string }> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = `${sanitizeToken(mission.niche)}__${sanitizeToken(mission.city)}__${stamp}`;
  const dir = path.join(baseDir, runId);
  await fs.mkdir(dir, { recursive: true });
  return { runId, dir };
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function readStateFromReplay(filePath: string): Promise<DebugPipelineState> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as DebugPipelineState;
}

export async function savePhaseArtifact(
  artifactsDir: string,
  phase: DebugPhaseId,
  state: DebugPipelineState,
  extra?: {
    html?: string;
    summary?: any;
    notes?: string[];
  },
): Promise<{ statePath: string; htmlPath?: string; summaryPath?: string }> {
  const label = DEBUG_PHASE_LABELS[phase as keyof typeof DEBUG_PHASE_LABELS] || `PHASE_${phase}`;
  const phaseDir = path.join(artifactsDir, `phase-${phase}__${label}`);
  await fs.mkdir(phaseDir, { recursive: true });

  const snapshot = safeClone({
    ...state,
    updatedAt: new Date().toISOString(),
    artifactsDir,
  });

  const statePath = path.join(phaseDir, 'state.json');
  await writeJsonFile(statePath, snapshot);

  let htmlPath: string | undefined;
  if (extra?.html) {
    htmlPath = path.join(phaseDir, 'artifact.html');
    await fs.writeFile(htmlPath, extra.html, 'utf8');
  }

  let summaryPath: string | undefined;
  if (extra?.summary || extra?.notes) {
    summaryPath = path.join(phaseDir, 'summary.json');
    await writeJsonFile(summaryPath, {
      phase,
      label,
      notes: extra.notes || [],
      summary: extra.summary || {},
    });
  }

  return { statePath, htmlPath, summaryPath };
}

export async function consolidateRunJsonFiles(runDir: string): Promise<string> {
  const outputPath = path.join(runDir, 'resultado_json.txt');
  let output = '';

  const scanDir = async (dir: string): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? scanDir(res) : Promise.resolve([res]);
    }));
    return Array.prototype.concat(...files);
  };

  const allFiles = await scanDir(runDir);
  const jsonFiles = allFiles.filter(f => f.endsWith('.json')).sort();

  for (const file of jsonFiles) {
    const relPath = path.relative(runDir, file);
    output += '='.repeat(100) + '\n';
    output += `ARCHIVO: ${path.basename(file)}\n`;
    output += `RUTA RELATIVA: ${relPath}\n`;
    output += '='.repeat(100) + '\n\n';

    try {
      const content = await fs.readFile(file, 'utf8');
      output += content;
    } catch (err: any) {
      output += `[ERROR AL LEER EL ARCHIVO: ${err.message}]`;
    }
    output += '\n\n';
  }

  await fs.writeFile(outputPath, output, 'utf8');
  return outputPath;
}

