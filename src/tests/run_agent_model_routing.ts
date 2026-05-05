import { buildAgentModelManifest } from '../ai/modelRouter.js';
import { formatHardwareProfile, getHardwareProfile } from '../ai/hardwareProfile.js';

async function main() {
  const hardware = getHardwareProfile();
  console.log('[agent-model-routing] hardware');
  console.log(formatHardwareProfile(hardware));
  console.log('');
  console.table(buildAgentModelManifest().map((item) => ({
    agent: item.agentName,
    tier: item.selectedTier,
    model: item.selectedModel,
    reason: item.reason,
  })));
}

main().catch((error) => {
  console.error('[agent-model-routing] failed', error);
  process.exit(1);
});
