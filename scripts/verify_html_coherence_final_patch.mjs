import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
function check(name, condition) {
  checks.push({ name, condition });
  if (!condition) console.error(`FAIL: ${name}`);
}

const coherence = read('src/utils/pageCoherenceGuard.ts');
const assembly = read('src/pipelines/phases/assembly.phase.ts');
const engine = read('src/design-system/procedural-engine.ts');

check('page coherence guard exists', coherence.includes('applyPageCoherenceCleanup'));
check('FAQ schema cleaner is present', coherence.includes('FAQ_SCHEMA_SCOPED_AND_CLEANED') && coherence.includes('isForbiddenFaqQuestion'));
check('local proof truthfulness rewrite is present', coherence.includes('LOCAL_PROOF_TESTIMONIAL_PROMISE_REWRITTEN'));
check('duplicate terminal urgency removal is present', coherence.includes('DUPLICATE_TERMINAL_URGENCY_REMOVED'));
check('unverified claims sanitizer is present', coherence.includes('años\\s+de\\s+experiencia') && coherence.includes('garantizamos'));
check('electrician grounding is present', coherence.includes('instalaciones eléctricas') && coherence.includes('aparatos\\s+el'));
check('assembly calls page coherence cleanup', assembly.includes('applyPageCoherenceCleanup(finalGuard.html'));
check('assembly stores page coherence issues', assembly.includes('page_coherence_issues'));
check('breadcrumbs visible renderer uses text not links', engine.includes('el-breadcrumbs__text') && !engine.includes('class="el-breadcrumbs__link" href='));
check('final urgency CTA is skipped when urgency panel exists', engine.includes('!hasUrgencyPanel'));

const failed = checks.filter(c => !c.condition);
if (failed.length) {
  process.exit(1);
}
console.log('HTML coherence final patch verification passed. Page-level cleanup, FAQ schema filter, breadcrumbs text mode, urgency de-duplication and claim grounding are present.');
