import fs from 'fs/promises';
import path from 'path';

import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import type { GenerationMission } from '../types/pipeline_v2.js';
import type { CanonicalPipelinePhaseId } from '../types/pipeline/contracts.js';

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
  const resumeFromStatePath = getArg('--resume');
  const startFromPhase = getArg('--from') as CanonicalPipelinePhaseId | undefined;
  const stopAfterPhase = getArg('--to') as CanonicalPipelinePhaseId | undefined;
  const forceReexecuteFromPhase = getArg('--force-from') as CanonicalPipelinePhaseId | undefined;
  const artifactsDir = getArg('--artifacts-dir');
  const persistState = !hasFlag('--no-persist');
  const withImages = hasFlag('--with-images');
  const deliver = !hasFlag('--no-deliver');

  const mission = await loadMission(missionPath);
  const pipeline = new ContentGenerationPipeline();

  const result = await pipeline.run(mission, {
    resumeFromStatePath,
    startFromPhase,
    stopAfterPhase,
    forceReexecuteFromPhase,
    artifactsDir,
    persistState,
    withImages,
    deliver,
  });

  console.log('\n===== STATE MACHINE RESULT =====');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
