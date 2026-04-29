import { autoCleanHtml, scanHtmlContent } from '../../utils/contentGuard.js';
import { refinePremiumBlockCopy } from '../../utils/premiumCopyGuard.js';
import { repairRenderedSemanticQuality, validateRenderedSemanticQuality } from '../../utils/semanticContentGuard.js';
import type { GuardContext, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

export function runCopyGuard(html: string, context: GuardContext): HtmlGuardResult {
  const contentScan = scanHtmlContent(html, { city: context.city || '', niche: context.niche || '' });
  let output = contentScan.valid ? html : autoCleanHtml(html);

  output = refinePremiumBlockCopy(output, {
    city: context.city,
    niche: context.niche,
    businessName: context.businessName,
    phone: context.phone
  });

  const semanticIssues = validateRenderedSemanticQuality(output, {
    city: context.city || '',
    niche: context.niche || '',
    businessName: context.businessName,
    phone: context.phone,
    canonical: context.canonical
  });

  if (semanticIssues.some((issue) => issue.severity === 'critical')) {
    output = repairRenderedSemanticQuality(output, {
      city: context.city || '',
      niche: context.niche || '',
      businessName: context.businessName,
      phone: context.phone,
      canonical: context.canonical
    });
  }

  const issues = [
    ...contentScan.issues.map((issue) => createIssue('copy', issue.code, issue.message, issue.severity)),
    ...semanticIssues.map((issue) => createIssue('copy', issue.code, issue.message, issue.severity))
  ];

  return { html: output, issues };
}
