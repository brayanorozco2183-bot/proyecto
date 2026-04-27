import type {
  ContentDraft,
  GenerationMission,
  NormalizedContext,
  ObservabilityMetadata,
  PagePlan,
  PipelineResult,
  PostDeployAuditResult,
  RenderedPage,
  ResearchContext,
} from '../pipeline_v2.js';
import type { ResolvedPageRenderPlan } from '../design.js';
import type { CanonicalPipelinePhaseId } from './contracts.js';
import type { PipelineQualityLedger } from './quality.js';

export type PipelinePhaseStatus = 'success' | 'degraded' | 'failed';
export type PipelineLifecycleState = 'initialized' | 'running' | 'completed' | 'failed';

export interface PipelineRunOptions {
  persistState?: boolean;
  resumeFromStatePath?: string;
  startFromPhase?: CanonicalPipelinePhaseId;
  stopAfterPhase?: CanonicalPipelinePhaseId;
  forceReexecuteFromPhase?: CanonicalPipelinePhaseId;
  withImages?: boolean;
  deliver?: boolean;
  artifactsBaseDir?: string;
  artifactsDir?: string;
}

export interface PipelinePhaseExecutionRecord {
  phase: CanonicalPipelinePhaseId;
  status: PipelinePhaseStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  warnings: string[];
  error?: string;
  metrics?: Record<string, string | number | boolean | null>;
  qualitySummary?: {
    decision: 'pass' | 'degraded' | 'blocked';
    issueCount: number;
    fatal: number;
    major: number;
    minor: number;
    warning: number;
  };
  artifactPaths?: {
    inputPath?: string;
    outputPath?: string;
    metaPath?: string;
    htmlPath?: string;
  };
}

export interface PipelineStateData {
  playbookContext?: any;
  siteGraph?: any;
  researchContext?: ResearchContext;
  normalizedContext?: NormalizedContext;
  pagePlan?: PagePlan;
  resolvedPlan?: ResolvedPageRenderPlan;
  contentDraft?: ContentDraft;
  correctedDraft?: ContentDraft;
  enrichedDraft?: ContentDraft;
  seoResult?: any;
  internalLinks?: Array<{ url: string; text: string; relation: string }>;
  renderedPage?: RenderedPage;
  qualityGateResult?: any;
  editorialAudit?: any;
  qualityLedger?: PipelineQualityLedger;
  delivery?: {
    attempted: boolean;
    completed: boolean;
    skipped?: boolean;
    reason?: string;
  };
  postDeployAudit?: PostDeployAuditResult;
}

export interface PipelineState {
  schemaVersion: 'pipeline-state@1';
  runId: string;
  createdAt: string;
  updatedAt: string;
  mission: GenerationMission;
  lifecycle: {
    status: PipelineLifecycleState;
    currentPhase?: CanonicalPipelinePhaseId;
    lastStablePhase?: CanonicalPipelinePhaseId;
    resumedFromPhase?: CanonicalPipelinePhaseId;
  };
  artifactsDir?: string;
  stateFilePath?: string;
  phases: PipelinePhaseExecutionRecord[];
  observability: ObservabilityMetadata;
  data: PipelineStateData;
}

export interface PipelineStateMachineRunResult {
  result: PipelineResult;
  state: PipelineState;
}

export interface PhaseHostOutcome<TOutput = any> {
  status: PipelinePhaseStatus;
  warnings?: string[];
  output?: TOutput;
  metrics?: Record<string, string | number | boolean | null>;
  html?: string;
  error?: string;
}

export interface PipelineHostAdapter {
  ensureMissionEnrolledDB(mission: GenerationMission): Promise<void>;
  sanitizeMission(mission: GenerationMission): GenerationMission;
  shouldUseSoftMode(mission: GenerationMission): boolean;
  applyPlaybookContext(mission: GenerationMission): Promise<{ mission: GenerationMission; playbookContext?: any }>;
  buildSiteGraph(mission: GenerationMission): any;
  runResearchPhase(mission: GenerationMission): Promise<ResearchContext>;
  runNormalizationPhase(research: ResearchContext): Promise<NormalizedContext>;
  validateNormalizationGate(context: NormalizedContext): Promise<void>;
  runPlanningPhase(context: NormalizedContext, mission: GenerationMission): Promise<PagePlan>;
  validatePlanningGate(plan: PagePlan, mission: GenerationMission): Promise<void>;
  resolveRenderPlan(mission: GenerationMission, pagePlan: PagePlan): ResolvedPageRenderPlan;
  runWritingPhase(
    context: NormalizedContext,
    plan: PagePlan,
    mission: GenerationMission,
    observability: ObservabilityMetadata,
    resolvedPlan: ResolvedPageRenderPlan,
  ): Promise<ContentDraft>;
  runCorrectionPhase(draft: ContentDraft, context: NormalizedContext): Promise<ContentDraft>;
  validateWordBudget(draft: ContentDraft, target: number): void;
  validatePreAssemblyIntegrityGate(
    draft: ContentDraft,
    options: { softMode: boolean; city: string; niche: string; targetTotal: number },
  ): Promise<void>;
  runEnrichmentPhase(
    draft: ContentDraft,
    context: NormalizedContext,
    plan: PagePlan,
    mission: GenerationMission,
  ): Promise<ContentDraft>;
  buildSeoContract(
    draft: ContentDraft,
    pagePlan: PagePlan,
    mission: GenerationMission,
  ): Promise<{
    enrichedDraft: ContentDraft;
    seoResult: any;
    internalLinks: Array<{ url: string; text: string; relation: string }>;
    pagePlan: PagePlan;
  }>;
  runAssemblyPhase(
    draft: ContentDraft,
    plan: PagePlan,
    context: NormalizedContext,
    mission: GenerationMission,
    resolvedPlan: ResolvedPageRenderPlan,
  ): Promise<RenderedPage>;
  finalizeImages(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    pagePlan: PagePlan,
    options: PipelineRunOptions,
  ): Promise<PhaseHostOutcome<RenderedPage>>;
  validateCompleteness(renderedPage: RenderedPage, mission: GenerationMission, softMode: boolean): Promise<PhaseHostOutcome<RenderedPage>>;
  validateTechnical(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    pagePlan: PagePlan,
    resolvedPlan: ResolvedPageRenderPlan,
    seoResult: any,
    softMode: boolean,
  ): Promise<PhaseHostOutcome<RenderedPage>>;
  runUxValidation(renderedPage: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<RenderedPage>>;
  runQualityGate(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    pagePlan: PagePlan,
    softMode: boolean,
  ): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; qualityGateResult?: any }>>;
  runEditorialValidation(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    softMode: boolean,
  ): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; editorialAudit: any }>>;
  runDeliveryPhase(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    options: PipelineRunOptions,
  ): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; delivery: PipelineStateData['delivery'] }>>;
  runPostDeployAudit(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    pagePlan?: PagePlan,
  ): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; postDeployAudit: PostDeployAuditResult }>>;
  extractFaqsFromRenderedHtml(html: string, mission: GenerationMission): any[];
  extractPrimaryH1FromHtml(html: string): string;
  countWordsFromRenderedHtml(html: string): number;
  buildPostAuditNotes(audit: any): string[];
  buildSoftModeResult(
    renderedPage: RenderedPage,
    mission: GenerationMission,
    error: Error,
    observability: ObservabilityMetadata,
  ): PipelineResult;
  saveLegacyDebugSnapshot?(
    phase: CanonicalPipelinePhaseId,
    state: PipelineState,
    extra?: { html?: string; summary?: any; notes?: string[] },
  ): Promise<void>;
}
