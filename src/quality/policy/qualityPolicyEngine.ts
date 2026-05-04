import type { CanonicalPipelinePhaseId } from '../../types/pipeline/contracts.js';
import type { PipelinePhaseStatus, PipelineState } from '../../types/pipeline/state.js';
import {
  createEmptyQualityLedger,
  emptyQualityCounts,
  summarizeQualityCounts,
  type PipelineQualityLedger,
  type QualityAssessment,
  type QualityAssessmentCounts,
  type QualityDecision,
  type QualityIssue,
  type QualityPolicyProfile,
  type QualityPolicyProfileId,
} from '../../types/pipeline/quality.js';
import { buildDeliveryPolicyIssue, extractQualityIssuesForPhase } from './qualityIssueAdapters.js';

const QUALITY_POLICY_PROFILES: Record<QualityPolicyProfileId, QualityPolicyProfile> = {
  development: {
    id: 'development',
    description: 'Tolera warnings y majors; solo bloquea fatales.',
    blockOnSeverities: ['fatal'],
    maxMajorBeforeBlock: Number.POSITIVE_INFINITY,
    maxMinorBeforeBlock: Number.POSITIVE_INFINITY,
    allowWarnings: true,
  },
  publish: {
    id: 'publish',
    description: 'Bloquea publicación con fatales o majors.',
    blockOnSeverities: ['fatal'],
    maxMajorBeforeBlock: 0,
    maxMinorBeforeBlock: Number.POSITIVE_INFINITY,
    allowWarnings: true,
  },
  'soft-debug': {
    id: 'soft-debug',
    description: 'Nunca bloquea; registra y degrada.',
    blockOnSeverities: [],
    maxMajorBeforeBlock: Number.POSITIVE_INFINITY,
    maxMinorBeforeBlock: Number.POSITIVE_INFINITY,
    allowWarnings: true,
  },
};

function nowIso(): string {
  return new Date().toISOString();
}

function countIssues(issues: QualityIssue[]): QualityAssessmentCounts {
  const counts = emptyQualityCounts();
  for (const issue of issues) {
    counts[issue.severity] += 1;
  }
  return counts;
}

function addCounts(base: QualityAssessmentCounts, extra: QualityAssessmentCounts): QualityAssessmentCounts {
  return {
    fatal: base.fatal + extra.fatal,
    major: base.major + extra.major,
    minor: base.minor + extra.minor,
    warning: base.warning + extra.warning,
  };
}

function compactIssues(issues: QualityIssue[], max = 4): string[] {
  return issues.slice(0, max).map((issue) => `${issue.code}: ${issue.message}`);
}

function uniqIssues(items: QualityIssue[]): QualityIssue[] {
  const seen = new Set<string>();
  const out: QualityIssue[] = [];
  for (const item of items) {
    const key = `${item.phase}|${item.source}|${item.code}|${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export class QualityPolicyEngine {
  resolveProfile(input: { softMode: boolean; deliver?: boolean }): QualityPolicyProfile {
    const explicit = String(process.env.QUALITY_POLICY_PROFILE || '').trim() as QualityPolicyProfileId;
    if (explicit && QUALITY_POLICY_PROFILES[explicit]) return QUALITY_POLICY_PROFILES[explicit];
    if (input.softMode) return QUALITY_POLICY_PROFILES['soft-debug'];
    if (input.deliver === false) return QUALITY_POLICY_PROFILES.development;
    return QUALITY_POLICY_PROFILES.publish;
  }

  assessPhase(input: {
    phase: CanonicalPipelinePhaseId;
    state: PipelineState;
    outcomeStatus: PipelinePhaseStatus;
    warnings?: string[];
    profile: QualityPolicyProfile;
  }): QualityAssessment {
    const issues = extractQualityIssuesForPhase(input.phase, input.state, input.outcomeStatus, input.warnings || []);
    const counts = countIssues(issues);

    const blockedBySeverity = issues.some((issue) => input.profile.blockOnSeverities.includes(issue.severity));
    const blockedByMajorThreshold = Number.isFinite(input.profile.maxMajorBeforeBlock || 0)
      ? counts.major > Number(input.profile.maxMajorBeforeBlock)
      : false;
    const blockedByMinorThreshold = Number.isFinite(input.profile.maxMinorBeforeBlock || 0)
      ? counts.minor > Number(input.profile.maxMinorBeforeBlock)
      : false;

    let decision: QualityDecision = 'pass';
    if (blockedBySeverity || blockedByMajorThreshold || blockedByMinorThreshold) {
      decision = 'blocked';
    } else if (issues.length > 0 || input.outcomeStatus === 'degraded') {
      decision = 'degraded';
    }

    const summary = issues.length
      ? `[${input.profile.id}] ${input.phase}: ${decision} (${summarizeQualityCounts(counts)})`
      : `[${input.profile.id}] ${input.phase}: pass`;

    return {
      phase: input.phase,
      profile: input.profile.id,
      generatedAt: nowIso(),
      issues,
      counts,
      decision,
      summary,
    };
  }

  applyAssessment(ledger: PipelineQualityLedger | undefined, assessment: QualityAssessment): PipelineQualityLedger {
    const base = ledger || createEmptyQualityLedger(assessment.profile);
    const assessments = {
      ...(base.assessments || {}),
      [assessment.phase]: assessment,
    };

    const allIssues = uniqIssues(
      Object.values(assessments)
        .filter(Boolean)
        .flatMap((item) => (item as QualityAssessment).issues || []),
    );

    const counts = Object.values(assessments)
      .filter(Boolean)
      .reduce((acc, item) => addCounts(acc, (item as QualityAssessment).counts), emptyQualityCounts());

    const blockingPhases = Object.values(assessments)
      .filter(Boolean)
      .filter((item) => (item as QualityAssessment).decision === 'blocked')
      .map((item) => (item as QualityAssessment).phase);

    return {
      profile: assessment.profile,
      assessments,
      allIssues,
      counts,
      blocked: blockingPhases.length > 0,
      blockingPhases,
      lastDecision: assessment.decision,
      updatedAt: nowIso(),
    };
  }

  summarizeAssessment(assessment: QualityAssessment): {
    decision: QualityDecision;
    issueCount: number;
    fatal: number;
    major: number;
    minor: number;
    warning: number;
  } {
    return {
      decision: assessment.decision,
      issueCount: assessment.issues.length,
      fatal: assessment.counts.fatal,
      major: assessment.counts.major,
      minor: assessment.counts.minor,
      warning: assessment.counts.warning,
    };
  }

  evaluateDeliveryPolicy(input: {
    ledger?: PipelineQualityLedger;
    profile: QualityPolicyProfile;
    phase: CanonicalPipelinePhaseId;
  }): { blocked: boolean; issue?: QualityIssue; summary: string } {
    const ledger = input.ledger;
    if (!ledger) {
      return { blocked: false, summary: 'No hay ledger de calidad todavía.' };
    }

    const fatalIssues = ledger.allIssues.filter((issue) => issue.severity === 'fatal');
    const majorIssues = ledger.allIssues.filter((issue) => issue.severity === 'major');

    const blocked = input.profile.id === 'publish' && (fatalIssues.length > 0 || majorIssues.length > 0);
    if (!blocked) {
      return {
        blocked: false,
        summary: `Delivery permitido por policy ${input.profile.id}. ${summarizeQualityCounts(ledger.counts)}`,
      };
    }

    const evidence = compactIssues([...fatalIssues, ...majorIssues], 6);
    const issue = buildDeliveryPolicyIssue(
      input.phase,
      `La policy ${input.profile.id} bloquea delivery con ${fatalIssues.length} fatales y ${majorIssues.length} majors acumulados.`,
      evidence,
    );

    return {
      blocked: true,
      issue,
      summary: `${issue.message} Evidencia: ${evidence.join(' | ')}`,
    };
  }
}

export { QUALITY_POLICY_PROFILES };
