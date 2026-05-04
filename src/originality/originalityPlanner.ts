import {
  MissionLike,
  OriginalityGuidance,
  OriginalityIssue,
  PagePlanLike,
  PreRenderOriginalityResult,
  DatabaseLike
} from './types.js';
import { buildSnapshotFromPlan } from './signatures.js';
import { getRecentEditorialMemory } from './editorialMemory.js';
import { getRecentSiteStructureMemory } from './siteStructureMemory.js';
import { getRecentVisualMemory } from './visualMemory.js';
import { getDesignLearningGuidance, summarizeDesignGuidance } from './designLearning.js';

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
    suggestedSectionFlips: [],
    avoidFamilies: [],
    preferFamilies: [],
    avoidHeroTreatments: [],
    preferHeroTreatments: [],
    avoidVisualVariants: [],
    preferVisualVariants: [],
    avoidPatterns: [],
    preferPatterns: [],
    designLessons: [],
    exemplarPageIds: []
  };
}

function countOverlap(a: string[], b: string[]): number {
  const set = new Set(a);
  return b.filter((item) => set.has(item)).length;
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
  const scopes = snapshot.scopes.map((scope) => scope.key);
  const limit = input.window || 24;

  const [visualRows, editorialRows, structureRows, designGuidance] = await Promise.all([
    getRecentVisualMemory(db, scopes, limit, mission.niche),
    getRecentEditorialMemory(db, scopes, limit, mission.niche),
    getRecentSiteStructureMemory(db, scopes, limit, mission.niche),
    getDesignLearningGuidance({
      db,
      scopes,
      niche: mission.niche,
      pageType: snapshot.pageType
    })
  ]);

  const issues: OriginalityIssue[] = [];
  const guidance = guidanceFactory();
  let score = 100;

  const lastTwo = visualRows.slice(0, 2);
  if (lastTwo.length === 2 && lastTwo.every((row) => row.hero_signature === snapshot.heroSignature)) {
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

  const exactSequenceCollision = structureRows.find((row) => {
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

  const sameHeroNavCta = structureRows.find((row) =>
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

  const sameNav = visualRows.filter((row) => row.nav_pattern_signature === snapshot.navPatternSignature).length;
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

  const sameCta = visualRows.filter((row) => row.cta_pattern_signature === snapshot.ctaPatternSignature).length;
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

  guidance.avoidFamilies.push(...designGuidance.avoidFamilies);
  guidance.preferFamilies.push(...designGuidance.preferFamilies);
  guidance.avoidHeroTreatments.push(...designGuidance.avoidHeroTreatments);
  guidance.preferHeroTreatments.push(...designGuidance.preferHeroTreatments);
  guidance.avoidVisualVariants.push(...designGuidance.avoidVisualVariants);
  guidance.preferVisualVariants.push(...designGuidance.preferVisualVariants);
  guidance.avoidPatterns.push(...designGuidance.avoidPatterns);
  guidance.preferPatterns.push(...designGuidance.preferPatterns);
  guidance.designLessons.push(...designGuidance.designLessons);
  guidance.exemplarPageIds.push(...designGuidance.exemplarPageIds);
  guidance.suggestedHeroTreatments.push(...designGuidance.preferHeroTreatments);

  if (designGuidance.avoidFamilies.length >= 2) {
    pushIssue(issues, {
      code: 'DESIGN_MEMORY_WARNINGS_PRESENT',
      severity: 'warning',
      message: 'La memoria visual del cluster ya ha identificado familias problemáticas que conviene evitar.',
      penalty: 6,
      evidence: designGuidance.avoidFamilies.slice(0, 4)
    });
    score -= 6;
  }

  if (designGuidance.avoidVisualVariants.length >= 3) {
    pushIssue(issues, {
      code: 'DESIGN_VARIANT_LESSONS_PRESENT',
      severity: 'warning',
      message: 'El sistema ya tiene lecciones activas sobre variantes visuales a evitar por monotonía o mala salida.',
      penalty: 5,
      evidence: designGuidance.avoidVisualVariants.slice(0, 6)
    });
    score -= 5;
  }

  if (designGuidance.exemplarPageIds.length > 0) {
    score += 3;
  }

  score = Math.max(0, Math.min(100, score));

  guidance.avoidHeroSignatures = [...new Set(guidance.avoidHeroSignatures)];
  guidance.avoidBlockSequenceSignatures = [...new Set(guidance.avoidBlockSequenceSignatures)];
  guidance.avoidH2Openings = [...new Set(guidance.avoidH2Openings)];
  guidance.avoidFaqOpenings = [...new Set(guidance.avoidFaqOpenings)];
  guidance.avoidLocalProofOpenings = [...new Set(guidance.avoidLocalProofOpenings)];
  guidance.avoidNavPatterns = [...new Set(guidance.avoidNavPatterns)];
  guidance.avoidCtaPatterns = [...new Set(guidance.avoidCtaPatterns)];
  guidance.suggestedHeroTreatments = [...new Set(guidance.suggestedHeroTreatments)].slice(0, 6);
  guidance.avoidFamilies = [...new Set(guidance.avoidFamilies)].slice(0, 6);
  guidance.preferFamilies = [...new Set(guidance.preferFamilies)].filter((value) => !guidance.avoidFamilies.includes(value)).slice(0, 6);
  guidance.avoidHeroTreatments = [...new Set(guidance.avoidHeroTreatments)].slice(0, 6);
  guidance.preferHeroTreatments = [...new Set(guidance.preferHeroTreatments)].filter((value) => !guidance.avoidHeroTreatments.includes(value)).slice(0, 6);
  guidance.avoidVisualVariants = [...new Set(guidance.avoidVisualVariants)].slice(0, 8);
  guidance.preferVisualVariants = [...new Set(guidance.preferVisualVariants)].filter((value) => !guidance.avoidVisualVariants.includes(value)).slice(0, 8);
  guidance.avoidPatterns = [...new Set(guidance.avoidPatterns)].slice(0, 8);
  guidance.preferPatterns = [...new Set(guidance.preferPatterns)].filter((value) => !guidance.avoidPatterns.includes(value)).slice(0, 8);
  guidance.designLessons = [...new Set(guidance.designLessons)].slice(0, 8);
  guidance.exemplarPageIds = [...new Set(guidance.exemplarPageIds)].slice(0, 8);

  return {
    passed: score >= 70 && !issues.some((issue) => issue.severity === 'critical'),
    score,
    issues: issues.sort((a, b) => b.penalty - a.penalty),
    guidance,
    snapshot
  };
}

export function buildOriginalityDirective(result: PreRenderOriginalityResult): string {
  const lines: string[] = [];
  lines.push('DIRECTIVA DE ORIGINALIDAD Y APRENDIZAJE VISUAL DEL CLUSTER:');

  if (result.guidance.avoidHeroSignatures.length) {
    lines.push(`- Evita estas firmas de hero: ${result.guidance.avoidHeroSignatures.slice(0, 6).join(' | ')}`);
  }
  if (result.guidance.avoidBlockSequenceSignatures.length) {
    lines.push(`- No reutilices estas secuencias completas de bloques: ${result.guidance.avoidBlockSequenceSignatures.slice(0, 4).join(' | ')}`);
  }
  if (result.guidance.avoidH2Openings.length) {
    lines.push(`- Evita reutilizar estos arranques de H2: ${result.guidance.avoidH2Openings.slice(0, 6).join(' | ')}`);
  }
  if (result.guidance.avoidFaqOpenings.length) {
    lines.push(`- No repitas estas fórmulas de FAQ: ${result.guidance.avoidFaqOpenings.slice(0, 6).join(' | ')}`);
  }
  if (result.guidance.avoidLocalProofOpenings.length) {
    lines.push(`- Prohibido reutilizar estos arranques de local proof: ${result.guidance.avoidLocalProofOpenings.slice(0, 6).join(' | ')}`);
  }
  if (result.guidance.suggestedSectionFlips.length) {
    lines.push(`- Cambia el orden de secciones con alguno de estos flips: ${result.guidance.suggestedSectionFlips.map((pair) => pair.join(' <-> ')).join(' ; ')}`);
  }
  if (result.guidance.preferFamilies.length) {
    lines.push(`- Familias visuales preferidas por aprendizaje: ${result.guidance.preferFamilies.join(', ')}`);
  }
  if (result.guidance.avoidFamilies.length) {
    lines.push(`- Familias visuales a evitar por aprendizaje: ${result.guidance.avoidFamilies.join(', ')}`);
  }
  if (result.guidance.preferHeroTreatments.length) {
    lines.push(`- Hero treatments preferidos: ${result.guidance.preferHeroTreatments.join(', ')}`);
  }
  if (result.guidance.avoidHeroTreatments.length) {
    lines.push(`- Hero treatments a evitar: ${result.guidance.avoidHeroTreatments.join(', ')}`);
  }
  if (result.guidance.preferVisualVariants.length) {
    lines.push(`- Variantes visuales preferidas: ${result.guidance.preferVisualVariants.join(', ')}`);
  }
  if (result.guidance.avoidVisualVariants.length) {
    lines.push(`- Variantes visuales a evitar: ${result.guidance.avoidVisualVariants.join(', ')}`);
  }
  if (result.guidance.preferPatterns.length) {
    lines.push(`- Patrones de sección preferidos: ${result.guidance.preferPatterns.join(', ')}`);
  }
  if (result.guidance.avoidPatterns.length) {
    lines.push(`- Patrones de sección a evitar: ${result.guidance.avoidPatterns.join(', ')}`);
  }

  for (const line of summarizeDesignGuidance({
    avoidFamilies: result.guidance.avoidFamilies,
    preferFamilies: result.guidance.preferFamilies,
    avoidHeroTreatments: result.guidance.avoidHeroTreatments,
    preferHeroTreatments: result.guidance.preferHeroTreatments,
    avoidVisualVariants: result.guidance.avoidVisualVariants,
    preferVisualVariants: result.guidance.preferVisualVariants,
    avoidPatterns: result.guidance.avoidPatterns,
    preferPatterns: result.guidance.preferPatterns,
    designLessons: result.guidance.designLessons,
    exemplarPageIds: result.guidance.exemplarPageIds
  })) {
    lines.push(`- ${line}`);
  }

  if (result.guidance.exemplarPageIds.length) {
    lines.push(`- Existen exemplars visuales recientes útiles en el cluster: ${result.guidance.exemplarPageIds.join(', ')}`);
  }

  return lines.join('\n');
}
