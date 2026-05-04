export type PipelinePhaseId =
  | 'brief'
  | 'niche-contract'
  | 'content-blocks'
  | 'faq'
  | 'schema'
  | 'images'
  | 'html-assembly'
  | 'post-render'
  | 'quality-gate'
  | 'delivery';

export type PhaseSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface PhaseIssue {
  code: string;
  severity: PhaseSeverity;
  message: string;
  evidence?: string[];
}

export interface PhaseResult<T> {
  phase: PipelinePhaseId;
  ok: boolean;
  value: T;
  issues: PhaseIssue[];
  attempts: number;
}

export interface RepairablePhase<T> {
  phase: PipelinePhaseId;
  maxAttempts?: number;
  run: () => Promise<T> | T;
  validate: (value: T) => Promise<PhaseIssue[]> | PhaseIssue[];
  repair?: (value: T, issues: PhaseIssue[]) => Promise<T> | T;
  fallback?: (issues: PhaseIssue[]) => Promise<T> | T;
}

export async function runRepairablePhase<T>(spec: RepairablePhase<T>): Promise<PhaseResult<T>> {
  const maxAttempts = Math.max(1, spec.maxAttempts ?? 3);
  let value = await spec.run();
  let lastIssues: PhaseIssue[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastIssues = await spec.validate(value);
    const blockers = lastIssues.filter((issue) => issue.severity === 'error' || issue.severity === 'critical');
    if (blockers.length === 0) {
      return { phase: spec.phase, ok: true, value, issues: lastIssues, attempts: attempt };
    }
    if (attempt < maxAttempts && spec.repair) {
      value = await spec.repair(value, lastIssues);
      continue;
    }
  }

  if (spec.fallback) {
    const fallbackValue = await spec.fallback(lastIssues);
    const fallbackIssues = await spec.validate(fallbackValue);
    const blockers = fallbackIssues.filter((issue) => issue.severity === 'error' || issue.severity === 'critical');
    return { phase: spec.phase, ok: blockers.length === 0, value: fallbackValue, issues: fallbackIssues, attempts: maxAttempts + 1 };
  }

  return { phase: spec.phase, ok: false, value, issues: lastIssues, attempts: maxAttempts };
}
