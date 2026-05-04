import * as cheerio from 'cheerio';
import {
  DatabaseLike,
  DesignExemplarEntry,
  DesignLearningGuidance,
  DesignLearningIssue,
  DesignLearningRun,
  DesignLessonEntry,
  MissionLike,
  OriginalityIssue,
  PagePlanLike
} from './types.js';
import {
  getRecentDesignLearningRuns,
  getTopDesignExemplars,
  getTopDesignLessons,
  parseIssueArray,
  parseStringArray,
  recordDesignExemplar,
  recordDesignLearningRun,
  upsertDesignLesson
} from './designLearningMemory.js';
import {
  buildSnapshotFromPlan,
  firstWordsSignature,
  getBlockVariants,
  serializeSignature
} from './signatures.js';

const CARD_HEAVY_BLOCKS = new Set([
  'services_grid',
  'local_proof',
  'trust_band',
  'faq',
  'process_steps',
  'comparison_table',
  'checklist',
  'service_matrix'
]);

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function pushIssue(target: DesignLearningIssue[], issue: DesignLearningIssue): void {
  target.push(issue);
}

function normalizeText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectPatternsFromPlan(pagePlan: PagePlanLike): string[] {
  const ordered = pagePlan.layoutContract?.orderedSectionIds || [];
  const byId = pagePlan.layoutContract?.sections || {};

  if (ordered.length > 0) {
    return ordered
      .map((id) => String(byId[id]?.pattern || '').trim())
      .filter(Boolean);
  }

  return [];
}

function getDenseCardStreak(pagePlan: PagePlanLike): number {
  const sections = Array.isArray(pagePlan.sections) ? pagePlan.sections : [];
  let best = 0;
  let current = 0;

  for (const section of sections) {
    const type = String(section?.block_type || '').toLowerCase().trim();
    if (CARD_HEAVY_BLOCKS.has(type)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function analyzeDesignHeuristics(pagePlan: PagePlanLike, html: string): {
  score: number;
  issues: DesignLearningIssue[];
  blurCount: number;
  denseCardStreak: number;
  uniqueVariantCount: number;
  contractLeakCount: number;
  responsiveHotfixUsed: boolean;
  heroCtaVisible: boolean;
} {
  const issues: DesignLearningIssue[] = [];
  let score = 100;

  const $ = cheerio.load(html || '');
  const rawHtml = String(html || '');
  const lower = rawHtml.toLowerCase();
  const sections = Array.isArray(pagePlan.sections) ? pagePlan.sections : [];
  const variants = getBlockVariants(pagePlan).filter(Boolean);
  const uniqueVariantCount = unique(variants).length;
  const denseCardStreak = getDenseCardStreak(pagePlan);

  const blurMatches = rawHtml.match(/backdrop-filter\s*:\s*blur|blur\s*\(/gi) || [];
  const blurCount = blurMatches.length;
  if (blurCount >= 10) {
    pushIssue(issues, {
      code: 'DESIGN_EXCESSIVE_BLUR',
      severity: 'critical',
      message: 'La página abusa de blur/backdrop-filter y entra en zona de degradación visual y rendimiento.',
      penalty: 18,
      evidence: [String(blurCount)]
    });
    score -= 18;
  } else if (blurCount >= 6) {
    pushIssue(issues, {
      code: 'DESIGN_HIGH_BLUR_USAGE',
      severity: 'error',
      message: 'La página usa demasiados efectos blur para un layout estable.',
      penalty: 10,
      evidence: [String(blurCount)]
    });
    score -= 10;
  }

  const responsiveHotfixUsed = /layout-hotfix-responsive|overflow-x:\s*clip|table-wrap\s*\{|min-width:\s*640px/i.test(rawHtml);
  if (responsiveHotfixUsed) {
    pushIssue(issues, {
      code: 'DESIGN_RESPONSIVE_HOTFIX_REQUIRED',
      severity: 'warning',
      message: 'La página necesitó hotfixes responsivos explícitos, señal de contrato visual frágil.',
      penalty: 4
    });
    score -= 4;
  }

  const contractLeakCount = (rawHtml.match(/\b(contract-|system-|pattern-section_|layout-hotfix-|skeleton-)/g) || []).length;
  if (contractLeakCount >= 35) {
    pushIssue(issues, {
      code: 'DESIGN_INTERNAL_CONTRACT_OVEREXPOSED',
      severity: 'warning',
      message: 'La salida final expone demasiadas huellas internas del sistema visual.',
      penalty: 5,
      evidence: [String(contractLeakCount)]
    });
    score -= 5;
  }

  if (sections.length >= 5 && uniqueVariantCount <= 2) {
    pushIssue(issues, {
      code: 'DESIGN_VARIANT_MONOTONY',
      severity: 'error',
      message: 'La página usa muy pocas variantes visuales para el número de secciones, generando monotonía.',
      penalty: 9,
      evidence: variants.slice(0, 8)
    });
    score -= 9;
  }

  if (denseCardStreak >= 4) {
    pushIssue(issues, {
      code: 'DESIGN_CARD_DENSITY_OVERLOAD',
      severity: 'error',
      message: 'Se encadenan demasiados bloques card-heavy seguidos.',
      penalty: 10,
      evidence: [String(denseCardStreak)]
    });
    score -= 10;
  } else if (denseCardStreak === 3) {
    pushIssue(issues, {
      code: 'DESIGN_CARD_DENSITY_WARNING',
      severity: 'warning',
      message: 'La cadencia visual queda demasiado apoyada en tarjetas.',
      penalty: 4,
      evidence: [String(denseCardStreak)]
    });
    score -= 4;
  }

  const hero = $('.hero, [data-block-type="hero"], header.hero').first();
  const heroCtaVisible = hero.find('a, button, .cta-primary, .hero__cta').length > 0;
  if (!heroCtaVisible) {
    pushIssue(issues, {
      code: 'DESIGN_HERO_CTA_WEAK',
      severity: 'warning',
      message: 'El hero no deja una CTA visual clara y detectable.',
      penalty: 4
    });
    score -= 4;
  }

  const defaultVariantCount = variants.filter((variant) => /^(default|clean|standard)$/i.test(variant)).length;
  if (sections.length >= 5 && defaultVariantCount >= Math.max(4, sections.length - 1)) {
    pushIssue(issues, {
      code: 'DESIGN_DEFAULT_VARIANTS_OVERUSED',
      severity: 'warning',
      message: 'La mayoría de secciones caen en variantes por defecto.',
      penalty: 4,
      evidence: [String(defaultVariantCount)]
    });
    score -= 4;
  }

  const family = String(pagePlan.design?.dna?.family || '').trim();
  if (!family) {
    pushIssue(issues, {
      code: 'DESIGN_FAMILY_MISSING',
      severity: 'warning',
      message: 'No se resolvió una familia visual clara en el PagePlan.',
      penalty: 3
    });
    score -= 3;
  }

  if (/\ben ,\b|\ben compensa\b/i.test(lower)) {
    pushIssue(issues, {
      code: 'DESIGN_COPY_LAYOUT_FRAGILITY',
      severity: 'warning',
      message: 'La composición visual está conviviendo con copy roto o fragmentado.',
      penalty: 3
    });
    score -= 3;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    blurCount,
    denseCardStreak,
    uniqueVariantCount,
    contractLeakCount,
    responsiveHotfixUsed,
    heroCtaVisible
  };
}

function buildLessonsFromRun(run: DesignLearningRun): Array<Omit<Parameters<typeof upsertDesignLesson>[1], 'clusterScope' | 'niche' | 'pageType'>> {
  const lessons: Array<Omit<Parameters<typeof upsertDesignLesson>[1], 'clusterScope' | 'niche' | 'pageType'>> = [];
  const issueCodes = new Set(run.issues.map((issue) => issue.code));

  if (run.designScore >= 86 && run.family) {
    lessons.push({
      lessonCode: 'GOOD_FAMILY_OUTCOME',
      lessonText: `La familia ${run.family} ha producido una salida visual estable y premium en este scope.`,
      polarity: 'prefer',
      targetType: 'family',
      targetValue: run.family,
      weight: 1.5
    });
  }

  if (run.designScore >= 86 && run.heroTreatment) {
    lessons.push({
      lessonCode: 'GOOD_HERO_OUTCOME',
      lessonText: `El tratamiento de hero ${run.heroTreatment} ha funcionado bien en este contexto.`,
      polarity: 'prefer',
      targetType: 'hero_treatment',
      targetValue: run.heroTreatment,
      weight: 1.2
    });
  }

  if (issueCodes.has('DESIGN_EXCESSIVE_BLUR') && run.family) {
    lessons.push({
      lessonCode: 'AVOID_FAMILY_BLUR_OVERLOAD',
      lessonText: `Evitar la familia ${run.family} cuando induce exceso de blur o glass effects en este scope.`,
      polarity: 'avoid',
      targetType: 'family',
      targetValue: run.family,
      weight: 2.5
    });
  }

  if (issueCodes.has('DESIGN_CARD_DENSITY_OVERLOAD')) {
    lessons.push({
      lessonCode: 'AVOID_CARD_DENSITY_OVERLOAD',
      lessonText: 'No encadenar demasiados bloques card-heavy; alternar shells, flows o patrones editoriales.',
      polarity: 'avoid',
      targetType: 'general',
      weight: 1.8
    });
  }

  if (issueCodes.has('DESIGN_VARIANT_MONOTONY')) {
    for (const variant of unique(run.blockVariants).slice(0, 3)) {
      lessons.push({
        lessonCode: 'AVOID_VARIANT_MONOTONY',
        lessonText: `Reducir la dependencia de la variante ${variant} cuando se repite en exceso dentro de la misma página.`,
        polarity: 'avoid',
        targetType: 'visual_variant',
        targetValue: variant,
        weight: 1.5
      });
    }
  }

  if (!issueCodes.has('DESIGN_VARIANT_MONOTONY') && run.designScore >= 86) {
    for (const variant of unique(run.blockVariants).slice(0, 3)) {
      lessons.push({
        lessonCode: 'PREFER_VARIANT_BALANCE',
        lessonText: `La variante ${variant} aparece en composiciones visuales sanas dentro de este scope.`,
        polarity: 'prefer',
        targetType: 'visual_variant',
        targetValue: variant,
        weight: 0.9
      });
    }
  }

  if (run.responsiveHotfixUsed) {
    lessons.push({
      lessonCode: 'AVOID_RESPONSIVE_FRAGILITY',
      lessonText: 'Evitar patrones o combinaciones que requieran hotfixes responsivos de última hora.',
      polarity: 'avoid',
      targetType: 'general',
      weight: 1.3
    });
  }

  if (run.designScore >= 90 && run.patterns.length > 0) {
    for (const pattern of unique(run.patterns).slice(0, 2)) {
      lessons.push({
        lessonCode: 'PREFER_PATTERN_SUCCESS',
        lessonText: `El patrón ${pattern} ha rendido bien como parte del layout en este scope.`,
        polarity: 'prefer',
        targetType: 'pattern',
        targetValue: pattern,
        weight: 1.0
      });
    }
  }

  return lessons;
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export async function inferAndRecordDesignLearning(input: {
  db: DatabaseLike;
  mission: MissionLike;
  pagePlan: PagePlanLike;
  html: string;
  pageId?: string;
}): Promise<DesignLearningRun> {
  const snapshot = buildSnapshotFromPlan({
    mission: input.mission,
    pagePlan: input.pagePlan,
    pageId: input.pageId
  });

  const heuristics = analyzeDesignHeuristics(input.pagePlan, input.html);
  const run: DesignLearningRun = {
    pageId: snapshot.pageId,
    clusterScopes: snapshot.scopes.map((scope) => scope.key),
    city: snapshot.city,
    niche: snapshot.niche,
    pageType: snapshot.pageType,
    serviceKey: snapshot.serviceKey,
    family: input.pagePlan.design?.dna?.family,
    heroTreatment: input.pagePlan.design?.dna?.heroTreatment || input.pagePlan.layoutContract?.heroTemplate,
    pageSkeleton: input.pagePlan.design?.dna?.pageSkeleton,
    pageComposition: input.pagePlan.design?.dna?.pageComposition || input.pagePlan.layoutContract?.pageComposition,
    visualSystem: input.pagePlan.design?.dna?.visualSystem,
    blockVariants: snapshot.blockVariants,
    patterns: collectPatternsFromPlan(input.pagePlan),
    designScore: heuristics.score,
    issues: heuristics.issues,
    blurCount: heuristics.blurCount,
    denseCardStreak: heuristics.denseCardStreak,
    uniqueVariantCount: heuristics.uniqueVariantCount,
    contractLeakCount: heuristics.contractLeakCount,
    responsiveHotfixUsed: heuristics.responsiveHotfixUsed,
    heroCtaVisible: heuristics.heroCtaVisible,
    source: 'post_render_heuristics'
  };

  await recordDesignLearningRun(input.db, run);

  for (const scope of run.clusterScopes) {
    const lessons = buildLessonsFromRun(run);
    for (const lesson of lessons) {
      await upsertDesignLesson(input.db, {
        ...lesson,
        clusterScope: scope,
        niche: run.niche,
        pageType: run.pageType
      });
    }
  }

  const hasCritical = run.issues.some((issue) => issue.severity === 'critical');
  const hasError = run.issues.some((issue) => issue.severity === 'error');
  if (run.designScore >= 86 && !hasCritical && !hasError) {
    const exemplar: DesignExemplarEntry = {
      pageId: snapshot.pageId,
      clusterScopes: snapshot.scopes.map((scope) => scope.key),
      city: snapshot.city,
      niche: snapshot.niche,
      pageType: snapshot.pageType,
      serviceKey: snapshot.serviceKey,
      family: run.family,
      heroTreatment: run.heroTreatment,
      pageSkeleton: run.pageSkeleton,
      pageComposition: run.pageComposition,
      visualSystem: run.visualSystem,
      blockSequenceSignature: snapshot.blockSequenceSignature,
      blockVariantsSignature: snapshot.blockVariantsSignature,
      designScore: run.designScore,
      reason: 'design_score_high_and_no_critical_or_error_issues',
      excerpt: firstWordsSignature(input.pagePlan.hero?.subtitle || input.pagePlan.h1 || '', 14)
    };

    await recordDesignExemplar(input.db, exemplar);
  }

  return run;
}

export async function getDesignLearningGuidance(input: {
  db: DatabaseLike;
  scopes: string[];
  niche: string;
  pageType: string;
}): Promise<DesignLearningGuidance> {
  const [runs, exemplars, lessons] = await Promise.all([
    getRecentDesignLearningRuns(input.db, input.scopes, 24, input.niche, input.pageType),
    getTopDesignExemplars(input.db, input.scopes, 8, input.niche, input.pageType),
    getTopDesignLessons(input.db, input.scopes, 20, input.niche, input.pageType)
  ]);

  const guidance: DesignLearningGuidance = {
    avoidFamilies: [],
    preferFamilies: [],
    avoidHeroTreatments: [],
    preferHeroTreatments: [],
    avoidVisualVariants: [],
    preferVisualVariants: [],
    avoidPatterns: [],
    preferPatterns: [],
    designLessons: [],
    exemplarPageIds: exemplars.map((row: any) => String(row.page_id || '')).filter(Boolean)
  };

  const byFamily = new Map<string, number[]>();
  const byHero = new Map<string, number[]>();
  const badVariantCounter = new Map<string, number>();
  const goodVariantCounter = new Map<string, number>();
  const badPatternCounter = new Map<string, number>();
  const goodPatternCounter = new Map<string, number>();

  for (const row of runs) {
    const designScore = Number(row.design_score || 0);
    const issues = parseIssueArray(row.issues_json);
    const family = String(row.family || '').trim();
    const heroTreatment = String(row.hero_treatment || '').trim();
    const variants = unique(parseStringArray(row.block_variants_json));
    const patterns = unique(parseStringArray(row.patterns_json));

    if (family) {
      const bucket = byFamily.get(family) || [];
      bucket.push(designScore);
      byFamily.set(family, bucket);
    }

    if (heroTreatment) {
      const bucket = byHero.get(heroTreatment) || [];
      bucket.push(designScore);
      byHero.set(heroTreatment, bucket);
    }

    const badRun = designScore < 70 || issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error');
    const goodRun = designScore >= 86 && !issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error');

    if (badRun) {
      for (const variant of variants) {
        badVariantCounter.set(variant, (badVariantCounter.get(variant) || 0) + 1);
      }
      for (const pattern of patterns) {
        badPatternCounter.set(pattern, (badPatternCounter.get(pattern) || 0) + 1);
      }
    }

    if (goodRun) {
      for (const variant of variants) {
        goodVariantCounter.set(variant, (goodVariantCounter.get(variant) || 0) + 1);
      }
      for (const pattern of patterns) {
        goodPatternCounter.set(pattern, (goodPatternCounter.get(pattern) || 0) + 1);
      }
    }
  }

  for (const [family, scores] of byFamily.entries()) {
    const avg = average(scores);
    if (scores.length >= 2 && avg >= 84) guidance.preferFamilies.push(family);
    if (scores.length >= 2 && avg <= 68) guidance.avoidFamilies.push(family);
  }

  for (const [heroTreatment, scores] of byHero.entries()) {
    const avg = average(scores);
    if (scores.length >= 2 && avg >= 84) guidance.preferHeroTreatments.push(heroTreatment);
    if (scores.length >= 2 && avg <= 68) guidance.avoidHeroTreatments.push(heroTreatment);
  }

  for (const [variant, count] of badVariantCounter.entries()) {
    if (count >= 2) guidance.avoidVisualVariants.push(variant);
  }
  for (const [variant, count] of goodVariantCounter.entries()) {
    if (count >= 2) guidance.preferVisualVariants.push(variant);
  }
  for (const [pattern, count] of badPatternCounter.entries()) {
    if (count >= 2) guidance.avoidPatterns.push(pattern);
  }
  for (const [pattern, count] of goodPatternCounter.entries()) {
    if (count >= 2) guidance.preferPatterns.push(pattern);
  }

  for (const row of lessons) {
    const text = String(row.lesson_text || '').trim();
    if (text) guidance.designLessons.push(text);

    const polarity = String(row.polarity || '').trim();
    const targetType = String(row.target_type || '').trim();
    const targetValue = String(row.target_value || '').trim();
    if (!targetValue) continue;

    if (polarity === 'avoid' && targetType === 'family') guidance.avoidFamilies.push(targetValue);
    if (polarity === 'prefer' && targetType === 'family') guidance.preferFamilies.push(targetValue);
    if (polarity === 'avoid' && targetType === 'hero_treatment') guidance.avoidHeroTreatments.push(targetValue);
    if (polarity === 'prefer' && targetType === 'hero_treatment') guidance.preferHeroTreatments.push(targetValue);
    if (polarity === 'avoid' && targetType === 'visual_variant') guidance.avoidVisualVariants.push(targetValue);
    if (polarity === 'prefer' && targetType === 'visual_variant') guidance.preferVisualVariants.push(targetValue);
    if (polarity === 'avoid' && targetType === 'pattern') guidance.avoidPatterns.push(targetValue);
    if (polarity === 'prefer' && targetType === 'pattern') guidance.preferPatterns.push(targetValue);
  }

  guidance.avoidFamilies = unique(guidance.avoidFamilies).slice(0, 6);
  guidance.preferFamilies = unique(guidance.preferFamilies.filter((item) => !guidance.avoidFamilies.includes(item))).slice(0, 6);
  guidance.avoidHeroTreatments = unique(guidance.avoidHeroTreatments).slice(0, 6);
  guidance.preferHeroTreatments = unique(guidance.preferHeroTreatments.filter((item) => !guidance.avoidHeroTreatments.includes(item))).slice(0, 6);
  guidance.avoidVisualVariants = unique(guidance.avoidVisualVariants).slice(0, 8);
  guidance.preferVisualVariants = unique(guidance.preferVisualVariants.filter((item) => !guidance.avoidVisualVariants.includes(item))).slice(0, 8);
  guidance.avoidPatterns = unique(guidance.avoidPatterns).slice(0, 8);
  guidance.preferPatterns = unique(guidance.preferPatterns.filter((item) => !guidance.avoidPatterns.includes(item))).slice(0, 8);
  guidance.designLessons = unique(guidance.designLessons).slice(0, 8);
  guidance.exemplarPageIds = unique(guidance.exemplarPageIds).slice(0, 8);

  return guidance;
}

export function mapDesignLearningIssuesToOriginality(issues: DesignLearningIssue[]): OriginalityIssue[] {
  return issues.map((issue) => ({
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
    penalty: issue.penalty,
    evidence: issue.evidence
  }));
}

export function summarizeDesignGuidance(guidance: DesignLearningGuidance): string[] {
  const lines: string[] = [];

  if (guidance.preferFamilies.length) {
    lines.push(`Familias preferidas por rendimiento visual: ${guidance.preferFamilies.join(', ')}.`);
  }
  if (guidance.avoidFamilies.length) {
    lines.push(`Familias a evitar por mal rendimiento o fragilidad visual: ${guidance.avoidFamilies.join(', ')}.`);
  }
  if (guidance.preferHeroTreatments.length) {
    lines.push(`Hero treatments preferidos: ${guidance.preferHeroTreatments.join(', ')}.`);
  }
  if (guidance.avoidHeroTreatments.length) {
    lines.push(`Hero treatments a evitar: ${guidance.avoidHeroTreatments.join(', ')}.`);
  }
  if (guidance.preferVisualVariants.length) {
    lines.push(`Variantes visuales que han funcionado bien: ${guidance.preferVisualVariants.join(', ')}.`);
  }
  if (guidance.avoidVisualVariants.length) {
    lines.push(`Variantes visuales a evitar por monotonía o mala salida: ${guidance.avoidVisualVariants.join(', ')}.`);
  }
  if (guidance.preferPatterns.length) {
    lines.push(`Patrones de sección bien valorados: ${guidance.preferPatterns.join(', ')}.`);
  }
  if (guidance.avoidPatterns.length) {
    lines.push(`Patrones a evitar: ${guidance.avoidPatterns.join(', ')}.`);
  }

  for (const lesson of guidance.designLessons.slice(0, 4)) {
    lines.push(`Lección de diseño: ${lesson}`);
  }

  return lines;
}

export function buildDesignExemplarSignature(input: {
  family?: string;
  heroTreatment?: string;
  pageSkeleton?: string;
  visualSystem?: string;
  blockVariants?: string[];
}): string {
  return serializeSignature([
    input.family || '',
    input.heroTreatment || '',
    input.pageSkeleton || '',
    input.visualSystem || '',
    ...(input.blockVariants || []).slice(0, 6)
  ]);
}
