import fs from 'node:fs';

const checks = [
  ['src/niches/playbookLoader.ts', 'resolvedNicheCache'],
  ['src/niches/playbookLoader.ts', 'GRAVITY_PLAYBOOK_LOG_EVERY_RESOLVE'],
  ['src/niches/agentAdapters.ts', 'missionPlaybookContextCache'],
  ['src/runtime/missionContext.ts', 'createMissionRuntimeContext'],
  ['src/runtime/missionContext.ts', 'attachMissionRuntimeContext'],
  ['src/pipelines/phases/assembly.phase.ts', 'renderEmergencyHtml'],
  ['src/pipelines/phases/assembly.phase.ts', 'assembly_mode'],
  ['src/pipelines/phases/assembly.phase.ts', 'START Final procedural composition'],
  ['src/debug/contentPipelinePhaseRunner.ts', 'MISSION_FAILED'],
  ['src/debug/contentPipelinePhaseRunner.ts', 'MISSION_SUCCESS'],
  ['src/design-system/procedural-engine.ts', 'Slow block render'],
  ['src/design-system/procedural-engine.ts', 'data-render-fallback'],
  ['docs/PATCH_FLOW_STABILIZATION.md', 'Flow Stabilization'],
];

const missing = [];
for (const [file, needle] of checks) {
  if (!fs.existsSync(file)) {
    missing.push(`${file} missing`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes(needle)) missing.push(`${file} missing ${needle}`);
}

if (missing.length) {
  console.error('Flow stabilization verification failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Flow stabilization patch verification passed. Cache, mission context, phase diagnostics, assembly fallback, and block fallback are present.');
