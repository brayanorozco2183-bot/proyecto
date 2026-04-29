import { autoCleanHtml, scanHtmlContent } from '../../utils/contentGuard.js';
import { refinePremiumBlockCopy } from '../../utils/premiumCopyGuard.js';
import { repairRenderedSemanticQuality, validateRenderedSemanticQuality } from '../../utils/semanticContentGuard.js';
import type { GuardContext, GuardIssue, GuardSeverity, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readSeverity(value: unknown): GuardSeverity {
  return value === 'info' || value === 'warning' || value === 'error' || value === 'critical'
    ? value
    : 'warning';
}

function safeCopyIssue(source: unknown, fallbackCode: string): GuardIssue {
  const record = source && typeof source === 'object' ? source as Record<string, unknown> : {};
  return createIssue(
    'copy',
    readString(record.code) || readString(record.type) || fallbackCode,
    readString(record.message) || readString(record.code) || readString(record.type) || fallbackCode,
    readSeverity(record.severity),
    Array.isArray(record.evidence) ? record.evidence.filter((item): item is string => typeof item === 'string') : undefined,
  );
}

function guardFailureIssue(error: unknown, stage: string): GuardIssue {
  const message = error instanceof Error ? error.message : String(error || 'unknown error');
  return createIssue('copy', `COPY_GUARD_${stage}_FAILED`, `Copy guard omitido en ${stage}: ${message}`, 'warning');
}

export function runCopyGuard(html: string, context: GuardContext): HtmlGuardResult {
  let output = String(html || '');
  const issues: GuardIssue[] = [];

  try {
    const contentScan = scanHtmlContent(output, { city: context.city || '', niche: context.niche || '' });
    output = contentScan.valid ? output : autoCleanHtml(output);
    issues.push(...(contentScan.issues || []).map((issue) => safeCopyIssue(issue, 'CONTENT_SCAN_ISSUE')));
  } catch (error) {
    issues.push(guardFailureIssue(error, 'CONTENT_SCAN'));
  }

  try {
    output = refinePremiumBlockCopy(output, {
      city: context.city,
      niche: context.niche,
      businessName: context.businessName,
      phone: context.phone
    });
  } catch (error) {
    issues.push(guardFailureIssue(error, 'PREMIUM_REFINEMENT'));
  }

  try {
    const semanticIssues = validateRenderedSemanticQuality(output, {
      city: context.city || '',
      niche: context.niche || '',
      businessName: context.businessName,
      phone: context.phone,
      canonical: context.canonical
    });

    if (semanticIssues.some((issue) => issue.severity === 'critical')) {
      try {
        output = repairRenderedSemanticQuality(output, {
          city: context.city || '',
          niche: context.niche || '',
          businessName: context.businessName,
          phone: context.phone,
          canonical: context.canonical
        });
      } catch (error) {
        issues.push(guardFailureIssue(error, 'SEMANTIC_REPAIR'));
      }
    }

    issues.push(...semanticIssues.map((issue) => safeCopyIssue(issue, 'SEMANTIC_COPY_ISSUE')));
  } catch (error) {
    issues.push(guardFailureIssue(error, 'SEMANTIC_VALIDATION'));
  }

  return { html: output, issues };
}
