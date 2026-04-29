import type { GuardContext, GuardDomain, GuardIssue, HtmlGuardResult } from './types.js';
import { parseGuardContext } from './types.js';
import { runCopyGuard } from './domains/copy.js';
import { runHtmlGuard } from './domains/html.js';
import { runLayoutGuard } from './domains/layout.js';
import { runLegalGuard } from './domains/legal.js';
import { runLinksGuard } from './domains/links.js';
import { runNapGuard } from './domains/nap.js';
import { runSchemaGuard } from './domains/schema.js';
import { runSeoGuard } from './domains/seo.js';

export type { GuardContext, GuardDomain, GuardIssue, HtmlGuardResult } from './types.js';

export interface DomainGuardPipelineOptions {
  domains?: GuardDomain[];
}

const DEFAULT_FINAL_SANITIZER_DOMAINS: GuardDomain[] = ['legal', 'copy', 'html', 'layout', 'links', 'nap', 'schema'];
const DEFAULT_AUDIT_DOMAINS: GuardDomain[] = [...DEFAULT_FINAL_SANITIZER_DOMAINS, 'seo'];

function runDomain(domain: GuardDomain, html: string, context: GuardContext): HtmlGuardResult {
  switch (domain) {
    case 'legal': return runLegalGuard(html, context);
    case 'copy': return runCopyGuard(html, context);
    case 'html': return runHtmlGuard(html, context);
    case 'layout': return runLayoutGuard(html, context);
    case 'links': return runLinksGuard(html, context);
    case 'nap': return runNapGuard(html, context);
    case 'schema': return runSchemaGuard(html, context);
    case 'seo': return runSeoGuard(html, context);
  }
}

export function applyDomainGuards(html: string, contextInput: unknown, options: DomainGuardPipelineOptions = {}): HtmlGuardResult {
  const context = parseGuardContext(contextInput);
  const domains = options.domains || DEFAULT_AUDIT_DOMAINS;
  let output = String(html || '');
  const issues: GuardIssue[] = [];

  for (const domain of domains) {
    const result = runDomain(domain, output, context);
    output = result.html;
    issues.push(...result.issues);
  }

  return { html: output, issues };
}

export function applyFinalHtmlDomainGuards(html: string, contextInput: unknown, options: DomainGuardPipelineOptions = {}): HtmlGuardResult {
  return applyDomainGuards(html, contextInput, {
    domains: options.domains || DEFAULT_FINAL_SANITIZER_DOMAINS
  });
}
