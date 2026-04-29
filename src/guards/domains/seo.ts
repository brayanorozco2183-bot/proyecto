import { scorePremiumOutput } from '../../quality/premiumScore.js';
import { runQualityGate } from '../../validators/qualityGate.js';
import type { GuardContext, GuardIssue, HtmlGuardResult } from '../types.js';
import { createIssue, isRecord } from '../types.js';

export function runSeoGuard(html: string, context: GuardContext): HtmlGuardResult {
  const quality = runQualityGate({
    html,
    city: context.city || '',
    niche: context.niche || '',
    businessName: context.businessName,
    phone: context.phone
  });

  const premium = scorePremiumOutput({
    html,
    city: context.city || '',
    niche: context.niche || '',
    businessName: context.businessName,
    phone: context.phone,
    qualityGate: isRecord(quality) ? quality : undefined
  });

  const issues: GuardIssue[] = [
    ...quality.issues.map((issue) => createIssue('seo', issue.code, issue.message, issue.severity)),
    ...premium.issueCodes.map((code) => createIssue('seo', code, `Premium score issue: ${code}`, code.includes('MISSING') || code.includes('INVALID') ? 'error' : 'warning'))
  ];

  return { html, issues };
}
