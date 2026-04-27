export type RepairPhaseStatus = 'success' | 'repaired' | 'fallback' | 'failed';

export interface PhaseValidationIssue {
  code: string;
  severity?: 'info' | 'warning' | 'error' | 'critical' | string;
  message: string;
  evidence?: string;
}

export interface PhaseValidationResult {
  passed: boolean;
  hardBlock?: boolean;
  issues?: PhaseValidationIssue[];
  warnings?: string[];
  summary?: string;
}

export interface PhaseRepairContext<T> {
  phase: string;
  attempt: number;
  value: T;
  issues: PhaseValidationIssue[];
  warnings: string[];
}

export interface PhaseRepairResult<T> {
  status: RepairPhaseStatus;
  output: T;
  attempts: number;
  repaired: boolean;
  warnings: string[];
  issues: PhaseValidationIssue[];
  error?: string;
  history: Array<{
    attempt: number;
    action: 'execute' | 'validate' | 'repair' | 'fallback';
    passed?: boolean;
    issueCodes?: string[];
    warningCount?: number;
    error?: string;
  }>;
}

export interface RunPhaseWithRepairOptions<T> {
  phase: string;
  input: T;
  maxAttempts?: number;
  execute?: (value: T, attempt: number) => Promise<T> | T;
  validate: (value: T, attempt: number) => Promise<PhaseValidationResult> | PhaseValidationResult;
  repair?: (context: PhaseRepairContext<T>) => Promise<T> | T;
  fallback?: (context: PhaseRepairContext<T>) => Promise<T> | T;
  hardBlockCodes?: string[];
  allowFallbackOnHardBlock?: boolean;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeIssues(result: PhaseValidationResult | undefined): PhaseValidationIssue[] {
  return (result?.issues || []).map((issue: any) => ({
    code: String(issue?.code || 'UNKNOWN_PHASE_ISSUE'),
    severity: issue?.severity || 'error',
    message: String(issue?.message || issue?.code || 'Phase validation issue'),
    evidence: issue?.evidence,
  }));
}

function isHardBlocked(result: PhaseValidationResult | undefined, hardBlockCodes: Set<string>): boolean {
  if (!result) return true;
  if (result.hardBlock) return true;
  const issues = normalizeIssues(result);
  return issues.some((issue) => issue.severity === 'critical' || hardBlockCodes.has(issue.code));
}

export async function runPhaseWithRepair<T>(options: RunPhaseWithRepairOptions<T>): Promise<PhaseRepairResult<T>> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const hardBlockCodes = new Set(options.hardBlockCodes || []);
  const history: PhaseRepairResult<T>['history'] = [];
  const warnings: string[] = [];
  let value = options.input;
  let lastIssues: PhaseValidationIssue[] = [];
  let repaired = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (options.execute) {
        value = await options.execute(value, attempt);
        history.push({ attempt, action: 'execute' });
      }

      const validation = await options.validate(value, attempt);
      lastIssues = normalizeIssues(validation);
      warnings.push(...(validation.warnings || []));
      history.push({
        attempt,
        action: 'validate',
        passed: validation.passed,
        issueCodes: unique(lastIssues.map((issue) => issue.code)),
        warningCount: validation.warnings?.length || 0,
      });

      if (validation.passed && !isHardBlocked(validation, hardBlockCodes)) {
        return {
          status: repaired ? 'repaired' : 'success',
          output: value,
          attempts: attempt,
          repaired,
          warnings: unique(warnings),
          issues: [],
          history,
        };
      }

      const canRepair = Boolean(options.repair) && attempt < maxAttempts;
      if (canRepair) {
        value = await options.repair!({ phase: options.phase, attempt, value, issues: lastIssues, warnings });
        repaired = true;
        history.push({ attempt, action: 'repair', issueCodes: unique(lastIssues.map((issue) => issue.code)) });
        continue;
      }

      const hardBlocked = isHardBlocked(validation, hardBlockCodes);
      const canFallback = Boolean(options.fallback) && (!hardBlocked || options.allowFallbackOnHardBlock !== false);
      if (canFallback) {
        value = await options.fallback!({ phase: options.phase, attempt, value, issues: lastIssues, warnings });
        repaired = true;
        history.push({ attempt, action: 'fallback', issueCodes: unique(lastIssues.map((issue) => issue.code)) });
        const afterFallback = await options.validate(value, attempt + 1);
        lastIssues = normalizeIssues(afterFallback);
        warnings.push(...(afterFallback.warnings || []));
        history.push({
          attempt: attempt + 1,
          action: 'validate',
          passed: afterFallback.passed,
          issueCodes: unique(lastIssues.map((issue) => issue.code)),
          warningCount: afterFallback.warnings?.length || 0,
        });
        if (afterFallback.passed && !isHardBlocked(afterFallback, hardBlockCodes)) {
          return {
            status: 'fallback',
            output: value,
            attempts: attempt,
            repaired,
            warnings: unique(warnings),
            issues: [],
            history,
          };
        }
      }

      return {
        status: 'failed',
        output: value,
        attempts: attempt,
        repaired,
        warnings: unique(warnings),
        issues: lastIssues,
        error: `${options.phase} failed after ${attempt} attempt(s): ${unique(lastIssues.map((issue) => issue.code)).join(', ') || validation.summary || 'unknown error'}`,
        history,
      };
    } catch (error: any) {
      const message = String(error?.message || error);
      history.push({ attempt, action: attempt === 1 ? 'execute' : 'repair', error: message });
      lastIssues = [{ code: 'PHASE_EXCEPTION', severity: 'critical', message }];
      if (options.repair && attempt < maxAttempts) {
        value = await options.repair({ phase: options.phase, attempt, value, issues: lastIssues, warnings });
        repaired = true;
        history.push({ attempt, action: 'repair', issueCodes: ['PHASE_EXCEPTION'] });
        continue;
      }
      return {
        status: 'failed',
        output: value,
        attempts: attempt,
        repaired,
        warnings: unique(warnings),
        issues: lastIssues,
        error: message,
        history,
      };
    }
  }

  return {
    status: 'failed',
    output: value,
    attempts: maxAttempts,
    repaired,
    warnings: unique(warnings),
    issues: lastIssues,
    error: `${options.phase} failed after ${maxAttempts} attempts`,
    history,
  };
}
