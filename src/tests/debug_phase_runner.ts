import fs from 'fs/promises';
import path from 'path';
import { ContentPipelinePhaseRunner } from '../debug/contentPipelinePhaseRunner.js';
import type { GenerationMission } from '../types/pipeline_v2.js';
import type { DebugPhaseId } from '../debug/phaseDebugTypes.js';

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function loadMission(filePath: string): Promise<GenerationMission> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as GenerationMission;
}

async function main(): Promise<void> {
  const missionPath = getArg('--mission') || path.join(process.cwd(), 'src', 'tests', 'fixtures', 'debug_mission.getafe.json');
  const replayFile = getArg('--replay');
  const fromPhase = getArg('--from') as DebugPhaseId | undefined;
  const toPhase = (getArg('--to') as DebugPhaseId | undefined) || fromPhase || '12';
  const deliver = hasFlag('--deliver');
  const withImages = hasFlag('--with-images');
  const realQualityGate = hasFlag('--real-gates');
  const baseArtifactsDir = getArg('--artifacts-dir');

  const mission = await loadMission(missionPath);
  const runner = new ContentPipelinePhaseRunner();

  const result = await runner.run({
    mission,
    fromPhase,
    toPhase,
    replayFile,
    deliver,
    withImages,
    realQualityGate,
    baseArtifactsDir,
  });

  console.log('');
  console.log('✅ Debug run completado');
  console.log(`Run ID: ${result.runId}`);
  console.log(`Artifacts: ${result.artifactsDir}`);
  console.log(`Última fase: ${result.state.lastCompletedPhase}`);
  if (result.state.qualityGateResult) {
    console.log(`Quality Gate: ${result.state.qualityGateResult.score}/100 · passed=${result.state.qualityGateResult.passed}`);
  }
  if (result.state.editorialAudit) {
    console.log(`Editorial Score: ${result.state.editorialAudit.score}`);
  }
}

main().catch((error) => {
  console.error('❌ Error en debug_phase_runner:', error);
  process.exit(1);
});
