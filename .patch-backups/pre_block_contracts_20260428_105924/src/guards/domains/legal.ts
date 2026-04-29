import { sanitizeLegalRiskClaims } from '../../utils/legalClaimSanitizer.js';
import type { GuardContext, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

export function runLegalGuard(html: string, context: GuardContext): HtmlGuardResult {
  const report = sanitizeLegalRiskClaims(html, context.niche);
  const issues = report.replacements.map((replacement) => createIssue(
    'legal',
    'LEGAL_CLAIM_SANITIZED',
    `Se suavizó una afirmación de riesgo legal o garantía absoluta: ${replacement.pattern}`,
    'warning',
    [replacement.replacement]
  ));
  return { html: report.html, issues };
}
