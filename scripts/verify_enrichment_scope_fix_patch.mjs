import fs from 'fs';

const checks = [
  {
    file: 'src/pipelines/phases/writing.phase.ts',
    patterns: [
      'async runEnrichment(draft: ContentDraft, context: NormalizedContext, plan: PagePlan, mission?: GenerationMission)',
      'resolveEnrichmentMission(draft, context, plan, mission)',
      'safeInjectAutomaticLinks(enrichedDraft, plan)',
      'ENRICHMENT_DEGRADED',
      'Block enrichment degraded',
      'Internal link enrichment skipped',
      'Continuing with corrected draft',
    ],
  },
  {
    file: 'src/pipelines/contentGenerationPipeline.ts',
    patterns: [
      'this.writingEngine.runEnrichment(draft, context, plan, mission)',
      'this.writingEngine.runEnrichment(d, c, p, m)',
    ],
  },
  {
    file: 'docs/PATCH_ENRICHMENT_SCOPE_FIX.md',
    patterns: ['mission is not defined', 'ENRICHMENT_DEGRADED'],
  },
];

const failures = [];
for (const check of checks) {
  const content = fs.existsSync(check.file) ? fs.readFileSync(check.file, 'utf8') : '';
  if (!content) {
    failures.push(`${check.file}: file missing or empty`);
    continue;
  }
  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) failures.push(`${check.file}: missing pattern ${pattern}`);
  }
}

if (failures.length) {
  console.error('Enrichment scope fix verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Enrichment scope fix verification passed. Mission scope, degraded enrichment fallback and call-site propagation are present.');
