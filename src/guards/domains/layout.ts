import { autoFixLayoutHtml, scanLayoutHtml } from '../../utils/layoutGuard.js';
import type { GuardContext, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

export function runLayoutGuard(html: string, context: GuardContext): HtmlGuardResult {
  const fixed = autoFixLayoutHtml(html, { city: context.city || '', niche: context.niche || '' });
  const scan = scanLayoutHtml(fixed, { city: context.city || '', niche: context.niche || '' });
  const issues = scan.issues.map((issue) => createIssue(
    'layout',
    issue.type,
    issue.message,
    issue.severity === 'critical' ? 'critical' : issue.severity === 'error' ? 'error' : 'warning'
  ));
  return { html: fixed, issues };
}
