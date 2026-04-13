import {
  DatabaseLike,
  MissionLike,
  OriginalityIssue,
  PagePlanLike,
  SiteOriginalityGateResult
} from './types.js';
import {
  buildSnapshotFromPlan,
  getCtaPatternSignatureFromHtml,
  getFaqOpeningsFromHtml,
  getFaqStructureSignatureFromHtml,
  getH2OpeningsFromHtml,
  getLocalProofOpeningsFromHtml,
  getNavPatternSignatureFromHtml,
  getParagraphSignaturesFromHtml
} from './signatures.js';
import { getRecentEditorialMemory } from './editorialMemory.js';
import { getRecentSiteStructureMemory } from './siteStructureMemory.js';
import { getRecentVisualMemory } from './visualMemory.js';

function parseJsonArray(raw: any): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function overlap(a: string[], b: string[]): number {
  const set = new Set(a);
  return b.filter(item => set.has(item)).length;
}

function buildCollisionFrequency(current: string[], rows: any[], field: string): Map<string, number> {
  const currentSet = new Set((current || []).filter(Boolean));
  const counter = new Map<string, number>();

  for (const row of rows) {
    const rowValues = new Set(parseJsonArray(row?.[field]));
    for (const value of rowValues) {
      if (!currentSet.has(value)) continue;
      counter.set(value, (counter.get(value) || 0) + 1);
    }
  }

  return counter;
}

function repeatedAcrossRows(counter: Map<string, number>, minRows: number): string[] {
  return [...counter.entries()]
    .filter(([, count]) => count >= minRows)
    .map(([value]) => value);
}

function pushIssue(target: OriginalityIssue[], issue: OriginalityIssue): void {
  target.push(issue);
}

export async function runSiteOriginalityGate(input: {
  db: DatabaseLike;
  html: string;
  mission: MissionLike;
  pagePlan: PagePlanLike;
  pageId?: string;
  window?: number;
}): Promise<SiteOriginalityGateResult> {
  const snapshot = buildSnapshotFromPlan({ mission: input.mission, pagePlan: input.pagePlan, pageId: input.pageId });
  const scopes = snapshot.scopes.map(scope => scope.key);
  const limit = input.window || 24;

  const niche = input.mission.niche;

  const [visualRows, editorialRows, structureRows] = await Promise.all([
    getRecentVisualMemory(input.db, scopes, limit, niche),
    getRecentEditorialMemory(input.db, scopes, limit, niche),
    getRecentSiteStructureMemory(input.db, scopes, limit, niche)
  ]);

  const issues: OriginalityIssue[] = [];
  let scoreDelta = 0;

  const h2Openings = getH2OpeningsFromHtml(input.html);
  const faqOpenings = getFaqOpeningsFromHtml(input.html);
  const localProofOpenings = getLocalProofOpeningsFromHtml(input.html);
  const paragraphSignatures = getParagraphSignaturesFromHtml(input.html);
  const navPattern = getNavPatternSignatureFromHtml(input.html);
  const ctaPattern = getCtaPatternSignatureFromHtml(input.html);
  const faqStructure = getFaqStructureSignatureFromHtml(input.html);

  const exactSequenceCollision = structureRows.find(row => JSON.stringify(parseJsonArray(row.block_sequence_json)) === JSON.stringify(snapshot.blockSequence));
  if (exactSequenceCollision) {
    pushIssue(issues, {
      code: 'SITE_BLOCK_SEQUENCE_COLLISION',
      severity: 'critical',
      message: 'La página comparte la misma secuencia completa de bloques con otra página del mismo cluster.',
      penalty: 24,
      evidence: snapshot.blockSequence
    });
    scoreDelta -= 24;
  }

  const sameCombo = structureRows.find(row => row.hero_signature === snapshot.heroSignature && row.nav_signature === navPattern && row.cta_signature === ctaPattern);
  if (sameCombo) {
    pushIssue(issues, {
      code: 'SITE_HERO_NAV_CTA_COLLISION',
      severity: 'critical',
      message: 'La página repite hero + nav + CTA final de otra URL del mismo cluster.',
      penalty: 26,
      evidence: [snapshot.heroSignature, navPattern, ctaPattern]
    });
    scoreDelta -= 26;
  }

  const repeatedNav = visualRows.filter(row => row.nav_pattern_signature === navPattern).length;
  if (repeatedNav >= 3) {
    pushIssue(issues, {
      code: 'SITE_NAV_REPETITION',
      severity: 'warning',
      message: 'La navegación repite un patrón de anchors demasiado estable dentro del cluster.',
      penalty: 7,
      evidence: [navPattern]
    });
    scoreDelta -= 7;
  }

  const repeatedCta = visualRows.filter(row => row.cta_pattern_signature === ctaPattern).length;
  if (repeatedCta >= 3) {
    pushIssue(issues, {
      code: 'SITE_CTA_REPETITION',
      severity: 'warning',
      message: 'El CTA final repite un patrón demasiado frecuente dentro del cluster.',
      penalty: 7,
      evidence: [ctaPattern]
    });
    scoreDelta -= 7;
  }

  const repeatedFaqStructure = structureRows.filter(row => row.faq_structure_signature === faqStructure).length;
  if (repeatedFaqStructure >= 2 && faqStructure) {
    pushIssue(issues, {
      code: 'SITE_FAQ_STRUCTURE_REPETITION',
      severity: 'error',
      message: 'La estructura FAQ replica una firma ya usada varias veces en el cluster.',
      penalty: 12,
      evidence: [faqStructure]
    });
    scoreDelta -= 12;
  }

  const h2CollisionMap = buildCollisionFrequency(h2Openings, editorialRows, 'h2_openings_json');
  const faqCollisionMap = buildCollisionFrequency(faqOpenings, editorialRows, 'faq_openings_json');
  const localProofCollisionMap = buildCollisionFrequency(localProofOpenings, editorialRows, 'local_proof_openings_json');
  const paragraphCollisionMap = buildCollisionFrequency(paragraphSignatures, editorialRows, 'paragraph_signatures_json');

  const repeatedH2 = repeatedAcrossRows(h2CollisionMap, 2);
  const repeatedFaq = repeatedAcrossRows(faqCollisionMap, 2);
  const repeatedLocalProof = repeatedAcrossRows(localProofCollisionMap, 2);
  const repeatedParagraphs = repeatedAcrossRows(paragraphCollisionMap, 2);

  if (repeatedH2.length >= 3) {
    pushIssue(issues, {
      code: 'SITE_H2_REPETITION',
      severity: 'error',
      message: 'Los H2 comparten demasiados arranques con otras páginas del mismo cluster.',
      penalty: 10,
      evidence: repeatedH2.slice(0, 8)
    });
    scoreDelta -= 10;
  }

  if (repeatedFaq.length >= 2) {
    pushIssue(issues, {
      code: 'SITE_FAQ_OPENING_REPETITION',
      severity: 'error',
      message: 'Las FAQs repiten demasiadas fórmulas de apertura dentro del cluster.',
      penalty: 10,
      evidence: repeatedFaq.slice(0, 6)
    });
    scoreDelta -= 10;
  }

  if (repeatedLocalProof.length >= 2) {
    pushIssue(issues, {
      code: 'SITE_LOCAL_PROOF_REPETITION',
      severity: 'error',
      message: 'La sección local repite demasiados inicios ya utilizados.',
      penalty: 10,
      evidence: repeatedLocalProof.slice(0, 6)
    });
    scoreDelta -= 10;
  }

  if (repeatedParagraphs.length >= 4) {
    pushIssue(issues, {
      code: 'SITE_EDITORIAL_SIGNATURE_COLLISION',
      severity: 'critical',
      message: 'Se repiten demasiadas firmas editoriales frente a páginas del mismo cluster.',
      penalty: 16,
      evidence: repeatedParagraphs.slice(0, 10)
    });
    scoreDelta -= 16;
  }

  return {
    passed: !issues.some(issue => issue.severity === 'critical'),
    scoreDelta,
    issues: issues.sort((a, b) => b.penalty - a.penalty)
  };
}