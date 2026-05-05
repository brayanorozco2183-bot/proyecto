import { WPBridgeAgent } from '../agents/bridge.js';
import { LinguistAgent } from '../agents/linguist.js';
import { ROIAuditorAgent } from '../agents/roi_auditor.js';
import { SentinelAgent } from '../agents/sentinel.js';
import { VideoArchitectAgent } from '../agents/video.js';
import { AuthorityWeaverAgent } from '../agents/weaver.js';

async function runTests() {
  console.log('🚀 Starting Agents Verification...\n');

  // 1. Linguist Agent
  console.log('--- Testing LinguistAgent ---');
  const linguist = new LinguistAgent();
  const interpretation = await linguist.execute({ command: 'quiero un cluster de cerrajeros en Barcelona' });
  console.log('Interpretation Success:', interpretation.success);
  console.log('Niche:', interpretation.data?.niche);
  console.log('Locations:', interpretation.data?.locations);

  const auditResult = await linguist.auditContent('<h1>Cerrajeros en Madrid</h1><p>Servicio profesional en Barcelona.</p>', 'Barcelona');
  console.log('Audit Result (Should fail due to Madrid):', auditResult.data?.passed);
  console.log('Audit Issues:', auditResult.data?.issues);

  const auditSuccess = await linguist.auditContent('<h1>Cerrajeros en Barcelona</h1><p>Servicio profesional en Barcelona.</p>', 'Barcelona');
  console.log('Audit Result (Should pass):', auditSuccess.data?.passed);

  // 2. Sentinel Agent
  console.log('\n--- Testing SentinelAgent ---');
  const sentinel = new SentinelAgent();
  // We call with {} to match orchestrator usage
  try {
    const sentinelResult = await sentinel.execute({});
    console.log('Sentinel Success:', sentinelResult.success);
    console.log('Degraded (Expected if no DB):', sentinelResult.data?.degraded);
  } catch (e: any) {
    console.log('Sentinel Error (Expected if DB fails):', e.message);
  }

  // 3. ROI Auditor
  console.log('\n--- Testing ROIAuditorAgent ---');
  const roi = new ROIAuditorAgent();
  const roiResult = await roi.execute({ niche: 'fontaneros', city: 'Madrid', pageType: 'service' });
  console.log('ROI Success:', roiResult.success);
  console.log('Priority:', roiResult.data?.priority);

  // 4. Video Architect
  console.log('\n--- Testing VideoArchitectAgent ---');
  const video = new VideoArchitectAgent();
  const videoResult = await video.execute({ niche: 'pintores', city: 'Valencia' });
  console.log('Video Success:', videoResult.success);
  console.log('Title:', videoResult.data?.title);

  // 5. Authority Weaver
  console.log('\n--- Testing AuthorityWeaverAgent ---');
  const weaver = new AuthorityWeaverAgent();
  const weaverResult = await weaver.execute({ niche: 'electricistas', city: 'Sevilla' });
  console.log('Weaver Success:', weaverResult.success);
  console.log('Trust Signals:', weaverResult.data?.trustSignals);

  // 6. WP Bridge
  console.log('\n--- Testing WPBridgeAgent ---');
  const bridge = new WPBridgeAgent();
  const bridgeResult = await bridge.execute({ enabled: false } as any);
  console.log('Bridge Success (Skipped):', bridgeResult.success);
  console.log('Skipped Reason:', bridgeResult.data?.reason);

  console.log('\n✅ Verification Finished.');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
