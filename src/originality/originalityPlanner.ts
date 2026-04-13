import {
  DatabaseLike,
  MissionLike,
  OriginalityGuidance,
  OriginalityIssue,
  PagePlanLike,
  PreRenderOriginalityResult
} from './types.js';
import { buildSnapshotFromPlan } from './signatures.js';
import { getRecentEditorialMemory } from './editorialMemory.js';
import { getRecentSiteStructureMemory } from './siteStructureMemory.js';
import { getRecentVisualMemory } from './visualMemory.js';

function pushIssue(target: OriginalityIssue[], issue: OriginalityIssue): void {
  target.push(issue);
}

function guidanceFactory(): OriginalityGuidance {
  return {
    avoidHeroSignatures: [],
    avoidBlockSequenceSignatures: [],
    avoidH2Openings: [],
    avoidFaqOpenings: [],
    avoidLocalProofOpenings: [],
    avoidNavPatterns: [],
    avoidCtaPatterns: [],
    suggestedHeroTreatments: ['centered', 'split', 'proof_first', 'cta_heavy'],
    suggestedSectionFlips: []
  };
}

function countOverlap(a: string[], b: string[]): number {
  const set = new Set(a);
  return b.filter(item => set.has(item)).length;
}

function parseJsonArray(raw: any): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function assessOriginalityBeforeRender(input: {
  db: DatabaseLike;
  mission: MissionLike;
  pagePlan: PagePlanLike;
  pageId?: string;
  window?: number;
}): Promise<PreRenderOriginalityResult> {
  const { db, mission, pagePlan } = input;
  const snapshot = buildSnapshotFromPlan({ mission, pagePlan, pageId: input.pageId });
  const scopes = snapshot.scopes.map(scope => scope.key);
  const limit = input.window || 24;

  const [visualRows, editorialRows, structureRows] = await Promise.all([
    getRecentVisualMemory(db, scopes, limit),
    getRecentEditorialMemory(db, scopes, limit),
    getRecentSiteStructureMemory(db, scopes, limit)
  ]);

  const issues: OriginalityIssue[] = [];
  const guidance = guidanceFactory();
  let score = 100;

  const lastTwo = visualRows.slice(0, 2);
  if (lastTwo.length === 2 && lastTwo.every(row => row.hero_signature === snapshot.heroSignature)) {
    pushIssue(issues, {
      code: 'HERO_THIRD_REPEAT_IN_CLUSTER',
      severity: 'critical',
      message: 'El hero repetiría la misma firma por tercera vez consecutiva dentro del cluster.',
      penalty: 25,
      evidence: [snapshot.heroSignature]
    });
    guidance.avoidHeroSignatures.push(snapshot.heroSignature);
    score -= 25;
  }

  const exactSequenceCollision = structureRows.find(row => {
    const sequence = parseJsonArray(row.block_sequence_json);
    return JSON.stringify(sequence) === JSON.stringify(snapshot.blockSequence);
  });

  if (exactSequenceCollision) {
    pushIssue(issues, {
      code: 'BLOCK_SEQUENCE_DUPLICATED_IN_CLUSTER',
      severity: 'critical',
      message: 'La secuencia completa de bloques ya existe en una página vecina del mismo cluster.',
      penalty: 28,
      evidence: snapshot.blockSequence
    });
    guidance.avoidBlockSequenceSignatures.push(snapshot.blockSequenceSignature);
    if (snapshot.blockSequence.length >= 4) {
      guidance.suggestedSectionFlips.push([snapshot.blockSequence[1], snapshot.blockSequence[2]]);
    }
    score -= 28;
  }

  const sameHeroNavCta = structureRows.find(row =>
    row.hero_signature === snapshot.heroSignature &&
    row.nav_signature === snapshot.navPatternSignature &&
    row.cta_signature === snapshot.ctaPatternSignature
  );

  if (sameHeroNavCta) {
    pushIssue(issues, {
      code: 'HERO_NAV_CTA_COMBO_DUPLICATED',
      severity: 'critical',
      message: 'La combinación hero + nav + CTA final replica una firma ya usada en el cluster.',
      penalty: 30,
      evidence: [snapshot.heroSignature, snapshot.navPatternSignature, snapshot.ctaPatternSignature]
    });
    guidance.avoidNavPatterns.push(snapshot.navPatternSignature);
    guidance.avoidCtaPatterns.push(snapshot.ctaPatternSignature);
    score -= 30;
  }

  let repeatedH2 = 0;
  let repeatedFaqOpenings = 0;
  let repeatedLocalProofOpenings = 0;

  for (const row of editorialRows) {
    const h2Openings = parseJsonArray(row.h2_openings_json);
    const faqOpenings = parseJsonArray(row.faq_openings_json);
    const localProofOpenings = parseJsonArray(row.local_proof_openings_json);

    repeatedH2 += countOverlap(snapshot.h2Openings, h2Openings);
    repeatedFaqOpenings += countOverlap(snapshot.faqOpenings, faqOpenings);
    repeatedLocalProofOpenings += countOverlap(snapshot.localProofOpenings, localProofOpenings);
  }

  if (repeatedH2 >= 6) {
    pushIssue(issues, {
      code: 'H2_OPENINGS_OVERLAP',
      severity: 'error',
      message: 'Demasiados arranques de H2 coinciden con páginas del mismo cluster.',
      penalty: 14,
      evidence: snapshot.h2Openings
    });
    guidance.avoidH2Openings.push(...snapshot.h2Openings);
    score -= 14;
  }

  if (repeatedFaqOpenings >= 3) {
    pushIssue(issues, {
      code: 'FAQ_OPENINGS_OVERLAP',
      severity: 'error',
      message: 'Las FAQs arrancan con fórmulas demasiado repetidas en páginas vecinas.',
      penalty: 12,
      evidence: snapshot.faqOpenings
    });
    guidance.avoidFaqOpenings.push(...snapshot.faqOpenings);
    score -= 12;
  }

  if (repeatedLocalProofOpenings >= 3) {
    pushIssue(issues, {
      code: 'LOCAL_PROOF_OPENINGS_OVERLAP',
      severity: 'error',
      message: 'La prueba local repite demasiados inicios ya usados en el cluster.',
      penalty: 12,
      evidence: snapshot.localProofOpenings
    });
    guidance.avoidLocalProofOpenings.push(...snapshot.localProofOpenings);
    score -= 12;
  }

  const sameNav = visualRows.filter(row => row.nav_pattern_signature === snapshot.navPatternSignature).length;
  if (sameNav >= 3) {
    pushIssue(issues, {
      code: 'NAV_PATTERN_OVERUSED',
      severity: 'warning',
      message: 'La navegación cae en un patrón de anchors demasiado repetido en el cluster.',
      penalty: 8,
      evidence: [snapshot.navPatternSignature]
    });
    guidance.avoidNavPatterns.push(snapshot.navPatternSignature);
    score -= 8;
  }

  const sameCta = visualRows.filter(row => row.cta_pattern_signature === snapshot.ctaPatternSignature).length;
  if (sameCta >= 3) {
    pushIssue(issues, {
      code: 'CTA_PATTERN_OVERUSED',
      severity: 'warning',
      message: 'El cierre CTA replica un patrón ya muy usado en el cluster.',
      penalty: 8,
      evidence: [snapshot.ctaPatternSignature]
    });
    guidance.avoidCtaPatterns.push(snapshot.ctaPatternSignature);
    score -= 8;
  }

  return {
    passed: score >= 70 && !issues.some(issue => issue.severity === 'critical'),
    score: Math.max(0, score),
    issues: issues.sort((a, b) => b.penalty - a.penalty),
    guidance: {
      ...guidance,
      avoidHeroSignatures: [...new Set(guidance.avoidHeroSignatures)],
      avoidBlockSequenceSignatures: [...new Set(guidance.avoidBlockSequenceSignatures)],
      avoidH2Openings: [...new Set(guidance.avoidH2Openings)],
      avoidFaqOpenings: [...new Set(guidance.avoidFaqOpenings)],
      avoidLocalProofOpenings: [...new Set(guidance.avoidLocalProofOpenings)],
      avoidNavPatterns: [...new Set(guidance.avoidNavPatterns)],
      avoidCtaPatterns: [...new Set(guidance.avoidCtaPatterns)]
    },
    snapshot
  };
}

export function buildOriginalityDirective(result: PreRenderOriginalityResult): string {
  const lines: string[] = [];

  if (result.guidance.avoidHeroSignatures.length) {
    lines.push(`- Evita repetir la firma de hero actual. Cambia el tratamiento de hero.`);
  }
  if (result.guidance.avoidH2Openings.length) {
    lines.push(`- Prohibido reutilizar estos arranques de H2: ${result.guidance.avoidH2Openings.slice(0, 8).join(' | ')}`);
  }
  if (result.guidance.avoidFaqOpenings.length) {
    lines.push(`- Prohibido reutilizar estos arranques de FAQ: ${result.guidance.avoidFaqOpenings.slice(0, 6).join(' | ')}`);
  }
  if (result.guidance.avoidLocalProofOpenings.length) {
    lines.push(`- Prohibido reutilizar estos arranques de local proof: ${result.guidance.avoidLocalProofOpenings.slice(0, 6).join(' | ')}`);
  }
  if (result.guidance.suggestedSectionFlips.length) {
    lines.push(`- Cambia el orden de secciones con alguno de estos flips: ${result.guidance.suggestedSectionFlips.map(pair => pair.join(' <-> ')).join(' ; ')}`);
  }

  return lines.join('\n');
}