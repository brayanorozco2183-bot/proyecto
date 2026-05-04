import type {
  ContentDraft,
  GenerationMission,
  NormalizedContext,
  PagePlan,
  RenderedPage,
  ResearchContext,
} from '../pipeline_v2.js';
import type { ResolvedPageRenderPlan } from '../design.js';
import type { PostDeployAuditResult } from '../pipeline_v2.js';

export const CANONICAL_PIPELINE_PHASES = [
  'playbook',
  'site-graph',
  'research',
  'normalization',
  'planning',
  'render-plan',
  'writing',
  'correction',
  'integrity',
  'enrichment',
  'seo-contract',
  'assembly',
  'images',
  'completeness',
  'technical-validation',
  'ux-validation',
  'quality-gate',
  'editorial-validation',
  'delivery',
  'post-audit',
] as const;

export type CanonicalPipelinePhaseId = typeof CANONICAL_PIPELINE_PHASES[number];

export const CANONICAL_PIPELINE_LABELS: Record<CanonicalPipelinePhaseId, string> = {
  'playbook': 'resolve-niche-playbook',
  'site-graph': 'build-site-graph',
  'research': 'research',
  'normalization': 'normalization',
  'planning': 'planning',
  'render-plan': 'render-plan',
  'writing': 'writing',
  'correction': 'correction',
  'integrity': 'integrity',
  'enrichment': 'enrichment',
  'seo-contract': 'seo-contract',
  'assembly': 'assembly',
  'images': 'images',
  'completeness': 'completeness',
  'technical-validation': 'technical-validation',
  'ux-validation': 'ux-validation',
  'quality-gate': 'quality-gate',
  'editorial-validation': 'editorial-validation',
  'delivery': 'delivery',
  'post-audit': 'post-audit',
};

export interface PlaybookPhaseInput {
  mission: GenerationMission;
}

export interface PlaybookPhaseOutput {
  mission: GenerationMission;
  playbookContext?: any;
}

export interface SiteGraphPhaseInput {
  mission: GenerationMission;
}

export interface SiteGraphPhaseOutput {
  siteGraph: any;
}

export interface ResearchPhaseInput {
  mission: GenerationMission;
}

export interface ResearchPhaseOutput {
  researchContext: ResearchContext;
}

export interface NormalizationPhaseInput {
  mission: GenerationMission;
  researchContext: ResearchContext;
}

export interface NormalizationPhaseOutput {
  normalizedContext: NormalizedContext;
}

export interface PlanningPhaseInput {
  mission: GenerationMission;
  normalizedContext: NormalizedContext;
}

export interface PlanningPhaseOutput {
  pagePlan: PagePlan;
}

export interface RenderPlanPhaseInput {
  mission: GenerationMission;
  pagePlan: PagePlan;
}

export interface RenderPlanPhaseOutput {
  resolvedPlan: ResolvedPageRenderPlan;
}

export interface WritingPhaseInput {
  mission: GenerationMission;
  normalizedContext: NormalizedContext;
  pagePlan: PagePlan;
  resolvedPlan: ResolvedPageRenderPlan;
}

export interface WritingPhaseOutput {
  contentDraft: ContentDraft;
}

export interface CorrectionPhaseInput {
  mission: GenerationMission;
  normalizedContext: NormalizedContext;
  contentDraft: ContentDraft;
}

export interface CorrectionPhaseOutput {
  correctedDraft: ContentDraft;
}

export interface IntegrityPhaseInput {
  mission: GenerationMission;
  normalizedContext: NormalizedContext;
  pagePlan: PagePlan;
  correctedDraft: ContentDraft;
}

export interface IntegrityPhaseOutput {
  correctedDraft: ContentDraft;
}

export interface EnrichmentPhaseInput {
  mission: GenerationMission;
  normalizedContext: NormalizedContext;
  pagePlan: PagePlan;
  correctedDraft: ContentDraft;
}

export interface EnrichmentPhaseOutput {
  enrichedDraft: ContentDraft;
}

export interface SeoContractPhaseInput {
  mission: GenerationMission;
  pagePlan: PagePlan;
  enrichedDraft: ContentDraft;
}

export interface SeoContractPhaseOutput {
  pagePlan: PagePlan;
  enrichedDraft: ContentDraft;
  seoResult: any;
  internalLinks: Array<{
    url: string;
    text: string;
    relation: string;
  }>;
}

export interface AssemblyPhaseInput {
  mission: GenerationMission;
  normalizedContext: NormalizedContext;
  pagePlan: PagePlan;
  resolvedPlan: ResolvedPageRenderPlan;
  enrichedDraft: ContentDraft;
}

export interface AssemblyPhaseOutput {
  renderedPage: RenderedPage;
}

export interface ImagesPhaseInput {
  mission: GenerationMission;
  pagePlan: PagePlan;
  renderedPage: RenderedPage;
}

export interface ImagesPhaseOutput {
  renderedPage: RenderedPage;
}

export interface CompletenessPhaseInput {
  mission: GenerationMission;
  renderedPage: RenderedPage;
}

export interface CompletenessPhaseOutput {
  renderedPage: RenderedPage;
}

export interface TechnicalValidationPhaseInput {
  mission: GenerationMission;
  pagePlan: PagePlan;
  resolvedPlan: ResolvedPageRenderPlan;
  seoResult: any;
  renderedPage: RenderedPage;
}

export interface TechnicalValidationPhaseOutput {
  renderedPage: RenderedPage;
}

export interface UxValidationPhaseInput {
  mission: GenerationMission;
  renderedPage: RenderedPage;
}

export interface UxValidationPhaseOutput {
  renderedPage: RenderedPage;
}

export interface QualityGatePhaseInput {
  mission: GenerationMission;
  pagePlan: PagePlan;
  renderedPage: RenderedPage;
  qualityGateResult?: any;
}

export interface QualityGatePhaseOutput {
  renderedPage: RenderedPage;
  qualityGateResult?: any;
}

export interface EditorialValidationPhaseInput {
  mission: GenerationMission;
  renderedPage: RenderedPage;
}

export interface EditorialValidationPhaseOutput {
  renderedPage: RenderedPage;
  editorialAudit: any;
}

export interface DeliveryPhaseInput {
  mission: GenerationMission;
  renderedPage: RenderedPage;
}

export interface DeliveryPhaseOutput {
  renderedPage: RenderedPage;
  delivery: {
    attempted: boolean;
    completed: boolean;
    skipped?: boolean;
    reason?: string;
  };
}

export interface PostAuditPhaseInput {
  mission: GenerationMission;
  pagePlan: PagePlan;
  renderedPage: RenderedPage;
}

export interface PostAuditPhaseOutput {
  renderedPage: RenderedPage;
  postDeployAudit: PostDeployAuditResult;
}

export interface PipelinePhaseContractMap {
  'playbook': { input: PlaybookPhaseInput; output: PlaybookPhaseOutput };
  'site-graph': { input: SiteGraphPhaseInput; output: SiteGraphPhaseOutput };
  'research': { input: ResearchPhaseInput; output: ResearchPhaseOutput };
  'normalization': { input: NormalizationPhaseInput; output: NormalizationPhaseOutput };
  'planning': { input: PlanningPhaseInput; output: PlanningPhaseOutput };
  'render-plan': { input: RenderPlanPhaseInput; output: RenderPlanPhaseOutput };
  'writing': { input: WritingPhaseInput; output: WritingPhaseOutput };
  'correction': { input: CorrectionPhaseInput; output: CorrectionPhaseOutput };
  'integrity': { input: IntegrityPhaseInput; output: IntegrityPhaseOutput };
  'enrichment': { input: EnrichmentPhaseInput; output: EnrichmentPhaseOutput };
  'seo-contract': { input: SeoContractPhaseInput; output: SeoContractPhaseOutput };
  'assembly': { input: AssemblyPhaseInput; output: AssemblyPhaseOutput };
  'images': { input: ImagesPhaseInput; output: ImagesPhaseOutput };
  'completeness': { input: CompletenessPhaseInput; output: CompletenessPhaseOutput };
  'technical-validation': { input: TechnicalValidationPhaseInput; output: TechnicalValidationPhaseOutput };
  'ux-validation': { input: UxValidationPhaseInput; output: UxValidationPhaseOutput };
  'quality-gate': { input: QualityGatePhaseInput; output: QualityGatePhaseOutput };
  'editorial-validation': { input: EditorialValidationPhaseInput; output: EditorialValidationPhaseOutput };
  'delivery': { input: DeliveryPhaseInput; output: DeliveryPhaseOutput };
  'post-audit': { input: PostAuditPhaseInput; output: PostAuditPhaseOutput };
}
