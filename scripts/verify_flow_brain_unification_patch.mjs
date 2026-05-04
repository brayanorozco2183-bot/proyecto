import fs from 'fs';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assertContains(file, needle, label) {
  const content = read(file);
  if (!content.includes(needle)) {
    throw new Error(`${label} missing in ${file}: ${needle}`);
  }
}

assertContains('src/utils/legalClaimSanitizer.ts', 'buildNicheIntelligenceProfile', 'legal sanitizer niche intelligence integration');
assertContains('src/utils/legalClaimSanitizer.ts', 'sanitizeLegalRiskClaimsWithProfile', 'profile-aware legal sanitizer API');
assertContains('src/utils/legalClaimSanitizer.ts', "source: 'niche-intelligence'", 'legal sanitizer source reporting');
assertContains('src/utils/legalClaimSanitizer.ts', 'replacementsFromLegacyPlaybook', 'legacy playbook fallback kept');

assertContains('src/design-system/blockPayloadAdapter.ts', 'SHARED_NICHE_PROFILE_CACHE', 'shared niche profile cache');
assertContains('src/design-system/blockPayloadAdapter.ts', 'getSharedNicheProfile', 'shared niche profile resolver');
assertContains('src/design-system/blockPayloadAdapter.ts', 'explicitProfile: explicitNicheProfile', 'explicit profile passthrough');

assertContains('src/orchestrator/missionController.ts', 'atomicWriteJson', 'atomic state writer');
assertContains('src/orchestrator/missionController.ts', 'loadLatestRecoverableState', 'state recovery fallback');
assertContains('src/orchestrator/missionController.ts', 'isSafeStateFileName', 'safe state filename guard');

assertContains('src/agents/quality_score.ts', 'DomEvidence', 'DOM evidence model');
assertContains('src/agents/quality_score.ts', "confidence: 'high' | 'medium' | 'low'", 'DOM confidence levels');
assertContains('src/agents/quality_score.ts', 'no la trates como verdad absoluta', 'non-absolute DOM evidence instruction');
assertContains('src/agents/quality_score.ts', 'placeholder-or-serialization-artifact', 'malformed DOM warning');

console.log('Flow brain unification patch verification passed. Legal intelligence, shared profile cache, atomic mission state, and guarded DOM evidence are present.');
