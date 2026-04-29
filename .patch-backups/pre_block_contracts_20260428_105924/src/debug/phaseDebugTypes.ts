import type {
  ContentDraft,
  GenerationMission,
  NormalizedContext,
  ObservabilityMetadata,
  PagePlan,
  PostDeployAuditResult,
  RenderedPage,
  ResearchContext,
} from '../types/pipeline_v2.js';
import type { ResolvedPageRenderPlan } from '../types/design.js';

export const DEBUG_PHASE_ORDER = [
  '0.1',
  '0.5',
  '1',
  '2',
  '3',
  '3.5',
  '4',
  '5',
  '6',
  '7',
  '7.5',
  '8',
  '8.2',
  '8.5',
  '9',
  '9.25',
  '9.5',
  '10',
  '11',
  '12',
] as const;

export type DebugPhaseId = typeof DEBUG_PHASE_ORDER[number];

export const DEBUG_PHASE_LABELS: Record<DebugPhaseId, string> = {
  '0.1': 'playbook',
  '0.5': 'site-graph',
  '1': 'research',
  '2': 'normalization',
  '3': 'planning',
  '3.5': 'render-plan',
  '4': 'writing',
  '5': 'correction',
  '6': 'integrity',
  '7': 'enrichment',
  '7.5': 'seo-contract',
  '8': 'assembly',
  '8.2': 'images',
  '8.5': 'completeness',
  '9': 'technical-validation',
  '9.25': 'ux-validation',
  '9.5': 'quality-gate',
  '10': 'editorial-validation',
  '11': 'delivery',
  '12': 'post-audit',
};

export interface DebugPhaseSummary {
  phase: DebugPhaseId;
  label: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  notes?: string[];
  metrics?: Record<string, number | string | boolean | null>;
}

export interface DebugPipelineState {
  mission: GenerationMission;
  runId: string;
  lastCompletedPhase?: DebugPhaseId;
  createdAt: string;
  updatedAt: string;
  artifactsDir?: string;
  phaseSummaries: DebugPhaseSummary[];
  observability: ObservabilityMetadata;
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
  renderedPage?: RenderedPage;
  qualityGateResult?: any;
  editorialAudit?: { score: number; blockScores: any[] };
  delivery?: {
    attempted: boolean;
    completed: boolean;
    skipped?: boolean;
    reason?: string;
  };
  postDeployAudit?: PostDeployAuditResult;
}

export interface DebugRunnerOptions {
  mission: GenerationMission;
  fromPhase?: DebugPhaseId;
  toPhase?: DebugPhaseId;
  replayFile?: string;
  baseArtifactsDir?: string;
  withImages?: boolean;
  deliver?: boolean;
  realQualityGate?: boolean;
}

export interface DebugRunnerResult {
  runId: string;
  artifactsDir: string;
  state: DebugPipelineState;
}
