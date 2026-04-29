import type { PipelineState } from '../types/pipeline/state.js';
import type { CanonicalPipelinePhaseId } from '../types/pipeline/contracts.js';

type ContractMoment = 'input' | 'output';

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function assertFields(state: PipelineState, phase: CanonicalPipelinePhaseId, moment: ContractMoment, fields: string[]): void {
  const missing = fields.filter((field) => !hasValue(readPath(state, field)));
  if (missing.length > 0) {
    throw new Error(`PIPELINE_CONTRACT_${moment.toUpperCase()}_${phase}: faltan ${missing.join(', ')}`);
  }
}

function readPath(source: any, path: string): unknown {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
}

const INPUT_REQUIREMENTS: Record<CanonicalPipelinePhaseId, string[]> = {
  playbook: ['mission.niche', 'mission.city'],
  'site-graph': ['mission.niche', 'mission.city'],
  research: ['mission.niche', 'mission.city'],
  normalization: ['data.researchContext'],
  planning: ['data.normalizedContext'],
  'render-plan': ['data.pagePlan'],
  writing: ['data.normalizedContext', 'data.pagePlan', 'data.resolvedPlan'],
  correction: ['data.contentDraft', 'data.normalizedContext'],
  integrity: ['data.correctedDraft', 'data.pagePlan', 'data.normalizedContext'],
  enrichment: ['data.correctedDraft', 'data.normalizedContext', 'data.pagePlan'],
  'seo-contract': ['data.enrichedDraft', 'data.pagePlan'],
  assembly: ['data.enrichedDraft', 'data.pagePlan', 'data.normalizedContext', 'data.resolvedPlan'],
  images: ['data.renderedPage', 'data.pagePlan'],
  completeness: ['data.renderedPage'],
  'technical-validation': ['data.renderedPage', 'data.pagePlan', 'data.resolvedPlan', 'data.seoResult'],
  'ux-validation': ['data.renderedPage'],
  'quality-gate': ['data.renderedPage', 'data.pagePlan'],
  'editorial-validation': ['data.renderedPage'],
  delivery: ['data.renderedPage'],
  'post-audit': ['data.renderedPage'],
};

const OUTPUT_REQUIREMENTS: Record<CanonicalPipelinePhaseId, string[]> = {
  playbook: ['mission.niche', 'mission.city'],
  'site-graph': ['data.siteGraph'],
  research: ['data.researchContext'],
  normalization: ['data.normalizedContext'],
  planning: ['data.pagePlan'],
  'render-plan': ['data.resolvedPlan'],
  writing: ['data.contentDraft'],
  correction: ['data.correctedDraft'],
  integrity: ['data.correctedDraft'],
  enrichment: ['data.enrichedDraft'],
  'seo-contract': ['data.enrichedDraft', 'data.pagePlan', 'data.seoResult'],
  assembly: ['data.renderedPage.html'],
  images: ['data.renderedPage.html'],
  completeness: ['data.renderedPage.html'],
  'technical-validation': ['data.renderedPage.html'],
  'ux-validation': ['data.renderedPage.html'],
  'quality-gate': ['data.renderedPage.html'],
  'editorial-validation': ['data.renderedPage.html'],
  delivery: ['data.renderedPage.html', 'data.delivery'],
  'post-audit': ['data.renderedPage.html'],
};

export function assertPipelinePhaseContract(
  phase: CanonicalPipelinePhaseId,
  moment: ContractMoment,
  state: PipelineState,
): void {
  const requirements = moment === 'input' ? INPUT_REQUIREMENTS[phase] : OUTPUT_REQUIREMENTS[phase];
  assertFields(state, phase, moment, requirements);

  if (moment === 'output' && phase === 'quality-gate') {
    const gate = (state.data as any).qualityGateResult;
    if (gate && typeof gate.passed !== 'boolean') {
      throw new Error('PIPELINE_CONTRACT_OUTPUT_quality-gate: qualityGateResult.passed debe ser booleano cuando existe');
    }
  }

  if (moment === 'output' && phase === 'delivery') {
    const delivery = (state.data as any).delivery;
    if (delivery && delivery.completed !== true && delivery.skipped !== true) {
      throw new Error('PIPELINE_CONTRACT_OUTPUT_delivery: delivery debe terminar como completed o skipped');
    }
  }
}
