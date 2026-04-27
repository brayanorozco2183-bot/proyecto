import type { CanonicalPipelinePhaseId } from '../../types/pipeline/contracts.js';
import type { PipelineState, PipelinePhaseStatus } from '../../types/pipeline/state.js';
import type { QualityIssue, QualitySeverity } from '../../types/pipeline/quality.js';

function nowStamp(): string {
  return new Date().toISOString();
}

function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'issue';
}

function createIssue(
  phase: CanonicalPipelinePhaseId,
  source: QualityIssue['source'],
  code: string,
  severity: QualitySeverity,
  message: string,
  extra: Partial<Omit<QualityIssue, 'id' | 'phase' | 'source' | 'code' | 'severity' | 'message'>> = {},
): QualityIssue {
  return {
    id: `${phase}:${source}:${slugify(code)}:${slugify(message).slice(0, 48)}`,
    phase,
    source,
    code,
    severity,
    message,
    ...extra,
  };
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

function severityFromTechnicalCode(code: string): QualitySeverity {
  const upper = String(code || '').toUpperCase();
  if (/PRODUCTION_PLACEHOLDER|PHONE_|CANONICAL_|BUSINESS_NAME_|ADDRESS_|SCHEMA_|FAQ_REQUIRED_MISSING/.test(upper)) return 'major';
  if (/PERFORMANCE_|ACCESSIBILITY_|RESPONSIVE_/.test(upper)) return 'minor';
  return 'major';
}

function suggestedActionForTechnical(code: string): string {
  const upper = String(code || '').toUpperCase();
  if (/PRODUCTION_PLACEHOLDER/.test(upper)) return 'Revisar sanitización final y sustitución de placeholders antes de publicar.';
  if (/PHONE_/.test(upper)) return 'Proteger y reinyectar el teléfono/NAP tras correctores y sanitizadores.';
  if (/CANONICAL_/.test(upper)) return 'Reconstruir el contrato SEO renderizado antes del ensamblado final.';
  if (/PERFORMANCE_/.test(upper)) return 'Reducir efectos visuales caros o aplicar el hotfix de rendimiento antes de publicar.';
  return 'Corregir la validación técnica antes de continuar con delivery.';
}

function parseBracketedMessage(raw: string): { family: string; code: string; message: string } | null {
  const match = String(raw || '').match(/^\[([A-Z-]+)(?::([^\]]+))?\]\s*(.*)$/);
  if (!match) return null;
  return {
    family: match[1],
    code: match[2] || match[1],
    message: match[3] || match[2] || match[1],
  };
}

function extractValidationErrors(state: PipelineState): string[] {
  const errors = state.data.renderedPage?.metadata?.validation_errors;
  return Array.isArray(errors) ? errors.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function fromCompleteness(state: PipelineState, phase: CanonicalPipelinePhaseId): QualityIssue[] {
  return extractValidationErrors(state)
    .map(parseBracketedMessage)
    .filter((entry): entry is NonNullable<ReturnType<typeof parseBracketedMessage>> => Boolean(entry && entry.family === 'COMPLETENESS'))
    .map((entry) => createIssue(
      phase,
      'completeness',
      entry.code,
      /MISSING|EMPTY|PLACEHOLDER/.test(entry.code) ? 'major' : 'minor',
      entry.message,
      {
        suggestedAction: 'Completar el render final o reparar la fase de ensamblado antes de validar.',
        blocking: /MISSING|EMPTY/.test(entry.code),
      },
    ));
}

function fromTechnical(state: PipelineState, phase: CanonicalPipelinePhaseId): QualityIssue[] {
  return extractValidationErrors(state)
    .filter((entry) => !entry.startsWith('[COMPLETENESS:') && !entry.startsWith('[UX:') && !entry.startsWith('[QUALITY:') && !entry.startsWith('[EDITORIAL]'))
    .map((entry) => {
      const parts = entry.split(':');
      const code = String(parts[0] || 'TECHNICAL_VALIDATION').trim();
      const message = parts.length > 1 ? entry : code;
      const severity = severityFromTechnicalCode(code);
      return createIssue(phase, 'technical', code, severity, message, {
        suggestedAction: suggestedActionForTechnical(code),
        blocking: severity === 'major',
      });
    });
}

function fromUx(state: PipelineState, phase: CanonicalPipelinePhaseId): QualityIssue[] {
  const audit = (state.data.renderedPage?.metadata as any)?.ux_audit;
  const issues = Array.isArray(audit?.issues) ? audit.issues : [];
  return issues.map((issue: any, index: number) => {
    const severity: QualitySeverity = issue?.severity === 'error' ? 'major' : issue?.severity === 'warning' ? 'minor' : 'warning';
    return createIssue(
      phase,
      'ux',
      issue?.type || `UX_ISSUE_${index + 1}`,
      severity,
      issue?.message || 'Incidencia de UX detectada.',
      {
        suggestedAction: 'Ajustar estilos responsivos o markup antes de publicar.',
        evidence: [issue?.viewport, issue?.selector].filter(Boolean),
      },
    );
  });
}

function fromQualityGate(state: PipelineState, phase: CanonicalPipelinePhaseId): QualityIssue[] {
  const result = state.data.qualityGateResult;
  const issues = Array.isArray(result?.issues) ? result.issues : [];
  return issues.map((issue: any, index: number) => {
    const severityMap: Record<string, QualitySeverity> = {
      critical: 'fatal',
      error: 'major',
      warning: 'minor',
      info: 'warning',
    };
    const severity = severityMap[String(issue?.severity || '').toLowerCase()] || 'minor';
    return createIssue(
      phase,
      'quality-gate',
      issue?.code || `QUALITY_GATE_${index + 1}`,
      severity,
      issue?.message || 'Issue devuelto por Quality Gate.',
      {
        suggestedAction: 'Corregir el problema señalado por el Quality Gate o regenerar el bloque afectado.',
        evidence: Array.isArray(issue?.evidence) ? issue.evidence.map((item: any) => String(item)) : undefined,
        blocking: severity === 'fatal' || severity === 'major',
      },
    );
  });
}

function fromEditorial(state: PipelineState, phase: CanonicalPipelinePhaseId): QualityIssue[] {
  const audit = state.data.editorialAudit;
  if (!audit) return [];

  const score = Number(audit?.score || 0);
  const status = String(audit?.status || 'unknown').toLowerCase();
  const issues = Array.isArray(audit?.issues) ? audit.issues : [];
  const severity: QualitySeverity = ['rejected', 'failed', 'unpublishable'].includes(status) || score < 60
    ? 'major'
    : ['needs_work', 'degraded'].includes(status) || score < 75
      ? 'minor'
      : 'warning';

  const mapped = issues.map((issue: any, index: number) => createIssue(
    phase,
    'editorial',
    `EDITORIAL_${index + 1}`,
    severity,
    String(issue || 'Incidencia editorial detectada.'),
    {
      suggestedAction: 'Reescribir o reforzar la sección afectada antes de publicar.',
      blocking: severity === 'major',
    },
  ));

  if (!mapped.length && status && !['publishable', 'premium', 'passed'].includes(status)) {
    mapped.push(createIssue(
      phase,
      'editorial',
      'EDITORIAL_STATUS_DEGRADED',
      severity,
      `La auditoría editorial devolvió status=${status} y score=${score}.`,
      {
        suggestedAction: 'Revisar calidad editorial y claims antes del delivery.',
        blocking: severity === 'major',
      },
    ));
  }

  return mapped;
}

function fromPipelineOutcome(
  phase: CanonicalPipelinePhaseId,
  outcomeStatus: PipelinePhaseStatus,
  warnings: string[],
): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (outcomeStatus === 'degraded') {
    issues.push(createIssue(
      phase,
      'pipeline',
      'PHASE_DEGRADED',
      'minor',
      `La fase ${phase} terminó en modo degradado.`,
      {
        suggestedAction: 'Revisar warnings y causas antes de continuar con publicación.',
      },
    ));
  }

  for (const warning of warnings || []) {
    issues.push(createIssue(
      phase,
      'pipeline',
      'PHASE_WARNING',
      'warning',
      warning,
      {
        suggestedAction: 'Revisar el warning asociado a la fase antes de cerrar la misión.',
      },
    ));
  }

  return issues;
}

export function extractQualityIssuesForPhase(
  phase: CanonicalPipelinePhaseId,
  state: PipelineState,
  outcomeStatus: PipelinePhaseStatus,
  warnings: string[] = [],
): QualityIssue[] {
  const issues: QualityIssue[] = [];

  switch (phase) {
    case 'completeness':
      issues.push(...fromCompleteness(state, phase));
      break;
    case 'technical-validation':
      issues.push(...fromTechnical(state, phase));
      break;
    case 'ux-validation':
      issues.push(...fromUx(state, phase));
      break;
    case 'quality-gate':
      issues.push(...fromQualityGate(state, phase));
      break;
    case 'editorial-validation':
      issues.push(...fromEditorial(state, phase));
      break;
    default:
      break;
  }

  issues.push(...fromPipelineOutcome(phase, outcomeStatus, warnings));
  return uniqIssues(issues);
}

export function buildDeliveryPolicyIssue(
  phase: CanonicalPipelinePhaseId,
  message: string,
  evidence: string[] = [],
): QualityIssue {
  return createIssue(phase, 'delivery-policy', 'DELIVERY_BLOCKED_BY_POLICY', 'major', message, {
    suggestedAction: 'Resolver incidencias fatales o majors en el informe de calidad antes de entregar o publicar.',
    blocking: true,
    evidence,
  });
}
