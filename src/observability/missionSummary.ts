import fs from 'fs/promises';
import path from 'path';
import type { PipelineResult } from '../types/pipeline_v2.js';
import type { PipelineState } from '../types/pipeline/state.js';
import { buildBlockDiagnostics } from './blockDiagnostics.js';
import { classifyPipelineError } from './errorClassifier.js';
import { getLlmTelemetryRecords, writeLlmTelemetry } from './llmTelemetry.js';

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value, (_key, current) => {
    if (typeof current === 'bigint') return Number(current);
    if (current instanceof Error) return { name: current.name, message: current.message, stack: current.stack };
    return current;
  }, 2);
}

function fallbackEventsFromState(state: PipelineState): Array<{ type: string; phase?: string; reason?: string }> {
  const events: Array<{ type: string; phase?: string; reason?: string }> = [];
  for (const phase of state.phases || []) {
    for (const warning of phase.warnings || []) {
      if (/degrad|fallback|omitido|skipped|unavailable|no se gener/i.test(warning)) {
        events.push({ type: 'PHASE_WARNING_FALLBACK', phase: phase.phase, reason: warning });
      }
    }
    if (phase.status === 'degraded') {
      events.push({ type: 'PHASE_DEGRADED', phase: phase.phase, reason: phase.error || phase.warnings?.join('; ') });
    }
  }
  return events;
}

function buildRecommendedAction(state: PipelineState, result?: PipelineResult): string {
  const failed = [...(state.phases || [])].reverse().find((phase) => phase.status === 'failed');
  if (!failed && result?.success) return 'No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.';
  const error = failed?.error || result?.error || 'Error desconocido';
  const classified = classifyPipelineError(new Error(error), { phase: failed?.phase });
  return `${classified.hint} Fase: ${failed?.phase || state.lifecycle.currentPhase || 'desconocida'}.`;
}

export async function writeMissionSummary(state: PipelineState, result?: PipelineResult, error?: unknown): Promise<void> {
  const artifactsDir = state.artifactsDir;
  if (!artifactsDir) return;

  const llmCalls = getLlmTelemetryRecords();
  const blockDiagnostics = buildBlockDiagnostics(
    state.data.enrichedDraft || state.data.correctedDraft || state.data.contentDraft,
  );
  const failedPhase = [...(state.phases || [])].reverse().find((phase) => phase.status === 'failed');
  const classified = failedPhase?.error || error || result?.error
    ? classifyPipelineError(error || new Error(failedPhase?.error || result?.error || 'Unknown'), { phase: failedPhase?.phase })
    : undefined;

  const phaseTimings = (state.phases || []).map((phase) => ({
    phase: phase.phase,
    status: phase.status,
    durationMs: phase.durationMs,
    duration: formatDuration(phase.durationMs),
    warnings: phase.warnings || [],
    error: phase.error,
    metrics: phase.metrics || {},
  }));

  const slowLlmCalls = llmCalls
    .filter((call) => (call.durationMs || 0) >= 60000 || call.status === 'slow')
    .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
    .slice(0, 20);

  const summary = {
    schemaVersion: 'mission-summary@1',
    generatedAt: new Date().toISOString(),
    runId: state.runId,
    status: result?.success ? (blockDiagnostics.some((b) => b.status !== 'success') ? 'success_with_warnings' : 'success') : state.lifecycle.status,
    failedPhase: failedPhase?.phase || null,
    lastStablePhase: state.lifecycle.lastStablePhase || null,
    error: failedPhase?.error || result?.error || null,
    errorType: classified?.type || null,
    errorHint: classified?.hint || null,
    durationMs: phaseTimings.reduce((sum, phase) => sum + phase.durationMs, 0),
    phases: phaseTimings,
    llmCalls: {
      total: llmCalls.filter((call) => call.status === 'success' || call.status === 'failed').length,
      failed: llmCalls.filter((call) => call.status === 'failed').length,
      slow: slowLlmCalls.length,
      totalDurationMs: llmCalls.reduce((sum, call) => sum + (call.durationMs || 0), 0),
    },
    fallbacks: fallbackEventsFromState(state),
    blockDiagnostics,
    recommendedAction: buildRecommendedAction(state, result),
  };

  await fs.mkdir(artifactsDir, { recursive: true });
  await fs.writeFile(path.join(artifactsDir, 'mission_summary.json'), safeJson(summary), 'utf8');
  await fs.writeFile(path.join(artifactsDir, 'phase_timings.json'), safeJson(phaseTimings), 'utf8');
  await fs.writeFile(path.join(artifactsDir, 'block_diagnostics.json'), safeJson(blockDiagnostics), 'utf8');
  await writeLlmTelemetry(artifactsDir);

  const markdown = [
    '# Mission Summary',
    '',
    `Status: **${summary.status}**`,
    `Run ID: \`${summary.runId}\``,
    `Failed phase: **${summary.failedPhase || 'none'}**`,
    `Last stable phase: **${summary.lastStablePhase || 'none'}**`,
    `Error type: **${summary.errorType || 'none'}**`,
    summary.error ? `Error: \`${summary.error}\`` : 'Error: none',
    '',
    '## Phase timings',
    '',
    '| Phase | Status | Duration | Warnings |',
    '|---|---:|---:|---:|',
    ...phaseTimings.map((phase) => `| ${phase.phase} | ${phase.status} | ${phase.duration} | ${(phase.warnings || []).length} |`),
    '',
    '## Slow LLM calls',
    '',
    slowLlmCalls.length
      ? '| Agent | Model | Attempt | Duration | Status |\n|---|---|---:|---:|---|\n' + slowLlmCalls.map((call) => `| ${call.agentName} | ${call.model} | ${call.attempt} | ${formatDuration(call.durationMs || 0)} | ${call.status} |`).join('\n')
      : 'No slow LLM calls recorded above the 60s marker.',
    '',
    '## Fallbacks / degraded events',
    '',
    summary.fallbacks.length ? summary.fallbacks.map((item) => `- ${item.type}${item.phase ? ` (${item.phase})` : ''}: ${item.reason || 'sin detalle'}`).join('\n') : 'No fallbacks detected.',
    '',
    '## Block diagnostics',
    '',
    blockDiagnostics.length
      ? '| Block | Type | Score | Status | Issues |\n|---|---|---:|---|---|\n' + blockDiagnostics.map((b) => `| ${b.blockId} | ${b.blockType} | ${b.score} | ${b.status} | ${b.issues.join(', ') || 'none'} |`).join('\n')
      : 'No block diagnostics available yet.',
    '',
    '## Recommended next action',
    '',
    summary.recommendedAction,
    '',
  ].join('\n');

  await fs.writeFile(path.join(artifactsDir, 'mission_summary.md'), markdown, 'utf8');
}
