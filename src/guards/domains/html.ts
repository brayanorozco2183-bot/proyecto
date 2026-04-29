import { finalHtmlPolish } from '../../utils/finalHtmlPolish.js';
import { sanitizeFinalRenderedHtml } from '../../utils/finalDocumentSanitizer.js';
import type { GuardContext, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

export function runHtmlGuard(html: string, context: GuardContext): HtmlGuardResult {
  const polished = finalHtmlPolish(String(html || ''), { city: context.city, niche: context.niche });
  const sanitized = sanitizeFinalRenderedHtml(polished, {
    city: context.city,
    niche: context.niche,
    businessName: context.businessName,
    phone: context.phone
  });

  const issues = sanitized !== html
    ? [createIssue('html', 'HTML_POLISHED', 'Se aplicó pulido final de HTML, head, media, anchors y texto visible.', 'info')]
    : [];

  return { html: sanitized, issues };
}
