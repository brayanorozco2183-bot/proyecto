#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const missionDir = process.argv[2];
if (!missionDir) {
  console.error('Uso: node scripts/analyze_mission_logs.mjs <debug_runs/mission_dir>');
  process.exit(1);
}

const summaryPath = path.join(missionDir, 'mission_summary.json');
const eventsPath = path.join(missionDir, 'mission_events.jsonl');
const llmPath = path.join(missionDir, 'llm_calls.json');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function readJsonl(file) {
  try {
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch { return []; }
}

const summary = readJson(summaryPath, null);
const events = readJsonl(eventsPath);
const llm = readJson(llmPath, []);

if (!summary && !events.length) {
  console.error(`No se encontraron mission_summary.json ni mission_events.jsonl en ${missionDir}`);
  process.exit(2);
}

console.log('\n=== Mission Analysis ===');
if (summary) {
  console.log(`Status: ${summary.status}`);
  console.log(`Failed phase: ${summary.failedPhase || 'none'}`);
  console.log(`Last stable phase: ${summary.lastStablePhase || 'none'}`);
  console.log(`Error type: ${summary.errorType || 'none'}`);
  if (summary.error) console.log(`Error: ${summary.error}`);
  if (summary.recommendedAction) console.log(`Recommended: ${summary.recommendedAction}`);

  console.log('\nSlowest phases:');
  [...(summary.phases || [])]
    .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
    .slice(0, 8)
    .forEach((phase) => console.log(`- ${phase.phase}: ${phase.duration} (${phase.status})`));

  console.log('\nWeak blocks:');
  const weakBlocks = (summary.blockDiagnostics || []).filter((block) => block.status !== 'success');
  if (!weakBlocks.length) console.log('- none');
  weakBlocks.slice(0, 10).forEach((block) => console.log(`- ${block.blockType}/${block.blockId}: ${block.score} ${block.issues?.join(', ') || ''}`));
}

console.log('\nLLM calls:');
const completed = llm.filter((call) => ['success', 'failed', 'slow'].includes(call.status));
console.log(`Total completed/failed: ${completed.length}`);
const slow = llm.filter((call) => (call.durationMs || 0) >= 60000 || call.status === 'slow');
if (slow.length) {
  slow.sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0)).slice(0, 10)
    .forEach((call) => console.log(`- ${call.agentName} ${call.model} ${call.durationMs}ms ${call.status}`));
} else {
  console.log('- no slow calls recorded');
}

console.log('\nRecent error events:');
const errors = events.filter((event) => event.level === 'error' || /FAILED|ERROR/.test(event.event || ''));
if (!errors.length) console.log('- none');
errors.slice(-10).forEach((event) => console.log(`- ${event.ts} ${event.phase || 'mission'} ${event.event}: ${event.message || event.status || ''}`));
