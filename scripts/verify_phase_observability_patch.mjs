#!/usr/bin/env node
import fs from 'fs';

const requiredFiles = [
  'src/observability/errorClassifier.ts',
  'src/observability/missionEvents.ts',
  'src/observability/missionSummary.ts',
  'src/observability/llmTelemetry.ts',
  'src/observability/blockDiagnostics.ts',
  'scripts/analyze_mission_logs.mjs',
  'docs/PATCH_PHASE_OBSERVABILITY.md',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

const stateMachine = fs.readFileSync('src/pipeline-state/contentPipelineStateMachine.ts', 'utf8');
const aiFacade = fs.readFileSync('src/tools/aiFacade.ts', 'utf8');

const requiredStateMarkers = [
  'MISSION_START',
  'PHASE_START',
  'PHASE_END',
  'PHASE_FAILED',
  'MISSION_SUCCESS',
  'MISSION_FAILED',
  'writeMissionSummary',
  'appendMissionEvent',
  'classifyPipelineError',
];

for (const marker of requiredStateMarkers) {
  if (!stateMachine.includes(marker)) throw new Error(`State machine missing marker: ${marker}`);
}

const requiredLlmMarkers = [
  'recordLlmTelemetry',
  'SLOW_CALL',
  "status: 'started'",
  "status: callDurationMs >= 60000 ? 'slow' : 'success'",
];
for (const marker of requiredLlmMarkers) {
  if (!aiFacade.includes(marker)) throw new Error(`AIFacade missing marker: ${marker}`);
}

console.log('Phase observability patch verification passed. Events, summaries, timings, LLM telemetry and analysis script are present.');
