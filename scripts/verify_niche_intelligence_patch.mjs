import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const mustExist = [
  'src/niche-intelligence/types.ts',
  'src/niche-intelligence/text.ts',
  'src/niche-intelligence/verticalProfiles.ts',
  'src/niche-intelligence/classifyNiche.ts',
  'src/niche-intelligence/buildNicheProfile.ts',
  'src/niche-intelligence/index.ts',
  'scripts/verify_niche_intelligence_patch.mjs'
];

const failures = [];
for (const file of mustExist) {
  if (!exists(file)) failures.push(`Missing file: ${file}`);
}

function expect(file, pattern, message) {
  const content = read(file);
  const ok = pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern);
  if (!ok) failures.push(`${file}: ${message}`);
}

expect('src/niche-intelligence/verticalProfiles.ts', "home_services", 'home services profile missing');
expect('src/niche-intelligence/verticalProfiles.ts', "healthcare", 'healthcare profile missing');
expect('src/niche-intelligence/verticalProfiles.ts', "legal", 'legal profile missing');
expect('src/niche-intelligence/verticalProfiles.ts', "education", 'education profile missing');
expect('src/niche-intelligence/verticalProfiles.ts', "automotive", 'automotive profile missing');
expect('src/niche-intelligence/verticalProfiles.ts', "hospitality", 'hospitality profile missing');
expect('src/niche-intelligence/verticalProfiles.ts', "finance", 'finance profile missing');
expect('src/niche-intelligence/classifyNiche.ts', 'classifyNicheVertical', 'classifier export missing');
expect('src/niche-intelligence/buildNicheProfile.ts', 'buildNicheIntelligenceProfile', 'profile builder missing');
expect('src/niche-intelligence/buildNicheProfile.ts', 'NICHE_OVERRIDES', 'niche-specific override layer missing');
expect('src/renderers/blocks/types.ts', 'nicheProfile?: NicheIntelligenceProfile', 'BlockRendererInput does not carry nicheProfile');
expect('src/renderers/blocks/contracts.ts', 'resolveNicheProfile', 'block contracts do not resolve niche profile');
expect('src/renderers/blocks/contracts.ts', 'niche_vocabulary', 'block readiness does not check niche vocabulary');
expect('src/renderers/blocks/contracts.ts', 'claim_safety', 'block readiness does not check claim safety');
expect('src/design-system/blockPayloadAdapter.ts', 'buildNicheIntelligenceProfile', 'adapter does not build niche profile');
expect('src/design-system/blockPayloadAdapter.ts', 'nicheProfile,', 'adapter does not pass nicheProfile to renderer input');
expect('src/niches/premiumContracts.ts', 'buildNicheIntelligenceProfile', 'premium contracts do not use niche intelligence fallback');

const contracts = read('src/renderers/blocks/contracts.ts');
if ((contracts.match(/^\s{4}cta_text:/gm) || []).length > 1) failures.push('contracts.ts: duplicate cta_text assignment detected');
if (/Comprobación final y siguientes pasos'\s*'Comprobación final/.test(contracts)) failures.push('contracts.ts: malformed fallback service array detected');

const adapter = read('src/design-system/blockPayloadAdapter.ts');
if ((adapter.match(/buildNicheIntelligenceProfile/g) || []).length < 2) failures.push('blockPayloadAdapter.ts: profile builder is imported but not used');
if (!/preferredCtas\?\.length/.test(adapter)) failures.push('blockPayloadAdapter.ts: CTA fallback is not driven by niche profile');

if (failures.length) {
  console.error('Niche Intelligence patch verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Niche Intelligence patch verification passed. Profiles, classifier, adapter integration, block readiness checks, and premium fallback integration are present.');
