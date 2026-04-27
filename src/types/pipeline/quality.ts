import type { CanonicalPipelinePhaseId } from './contracts.js';

export type QualitySeverity = 'fatal' | 'major' | 'minor' | 'warning';
export type QualityDecision = 'pass' | 'degraded' | 'blocked';
export type QualityPolicyProfileId = 'development' | 'publish' | 'soft-debug';

export interface QualityIssue {
  id: string;
  code: string;
  phase: CanonicalPipelinePhaseId;
  source: 'completeness' | 'technical' | 'ux' | 'quality-gate' | 'editorial' | 'pipeline' | 'delivery-policy';
  severity: QualitySeverity;
  message: string;
  suggestedAction?: string;
  evidence?: string[];
  blocking?: boolean;
  tags?: string[];
}

export interface QualityAssessmentCounts {
  fatal: number;
  major: number;
  minor: number;
  warning: number;
}

export interface QualityAssessment {
  phase: CanonicalPipelinePhaseId;
  profile: QualityPolicyProfileId;
  generatedAt: string;
  issues: QualityIssue[];
  counts: QualityAssessmentCounts;
  decision: QualityDecision;
  summary: string;
}

export interface QualityPolicyProfile {
  id: QualityPolicyProfileId;
  description: string;
  blockOnSeverities: QualitySeverity[];
  maxMajorBeforeBlock?: number;
  maxMinorBeforeBlock?: number;
  allowWarnings: boolean;
}

export interface PipelineQualityLedger {
  profile: QualityPolicyProfileId;
  assessments: Partial<Record<CanonicalPipelinePhaseId, QualityAssessment>>;
  allIssues: QualityIssue[];
  counts: QualityAssessmentCounts;
  blocked: boolean;
  blockingPhases: CanonicalPipelinePhaseId[];
  lastDecision: QualityDecision;
  updatedAt: string;
}

export function emptyQualityCounts(): QualityAssessmentCounts {
  return { fatal: 0, major: 0, minor: 0, warning: 0 };
}

export function createEmptyQualityLedger(profile: QualityPolicyProfileId): PipelineQualityLedger {
  return {
    profile,
    assessments: {},
    allIssues: [],
    counts: emptyQualityCounts(),
    blocked: false,
    blockingPhases: [],
    lastDecision: 'pass',
    updatedAt: new Date().toISOString(),
  };
}

export function summarizeQualityCounts(counts: QualityAssessmentCounts): string {
  return `fatal=${counts.fatal}, major=${counts.major}, minor=${counts.minor}, warning=${counts.warning}`;
}
