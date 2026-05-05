import fs from 'fs/promises';
import path from 'path';

import type { PipelineState } from '../types/pipeline/state.js';
import { QualityPolicyEngine } from '../quality/policy/qualityPolicyEngine.js';
import { CANONICAL_PIPELINE_PHASES } from '../types/pipeline/contracts.js';

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function loadState(filePath: string): Promise<PipelineState> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as PipelineState;
}

async function main(): Promise<void> {
  const statePath = getArg('--state') || path.join(process.cwd(), 'debug_runs', 'latest', 'pipeline-state.json');
  const state = await loadState(statePath);
  const engine = new QualityPolicyEngine();
  const profile = engine.resolveProfile({ softMode: false, deliver: true });

  const assessments = CANONICAL_PIPELINE_PHASES
    .map((phase) => state.data.qualityLedger?.assessments?.[phase])
    .filter(Boolean);

  console.log('\n===== QUALITY POLICY REPORT =====');
  console.log(`profile=${state.data.qualityLedger?.profile || profile.id}`);
  console.log(`blocked=${Boolean(state.data.qualityLedger?.blocked)}`);
  console.log(`counts=${JSON.stringify(state.data.qualityLedger?.counts || null)}`);

  for (const assessment of assessments) {
    console.log(`- ${assessment?.phase}: ${assessment?.decision} :: ${assessment?.summary}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
