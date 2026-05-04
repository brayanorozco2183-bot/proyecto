import { InternalLinkPlan, InternalLinkValidationResult, SiteNode } from './types.js';

function extractInternalLinksFromHtml(html: string): string[] {
  const matches = html.match(/href=["'](\/[^"']+|\.\/[^"']+|\.\.\/[^"']+)["']/gi) || [];
  return matches.map((match) => match.replace(/^href=["']|["']$/gi, ''));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function validateInternalLinkCoverage(
  plan: InternalLinkPlan,
  currentNode: SiteNode,
  html?: string,
): InternalLinkValidationResult {
  const issues: string[] = [];
  const renderedLinks = html ? unique(extractInternalLinksFromHtml(html)) : [];
  const plannedLinks = plan.selected?.length ? plan.selected : plan.all || [];
  const autoBlocks = Array.isArray(plan.autoBlocks) ? plan.autoBlocks : [];

  const totalUsefulLinks = renderedLinks.length || plannedLinks.length;

  const hasUpward = Boolean(plan.upward);
  const hasLateral = currentNode.type === 'service_area'
    ? renderedLinks.length > 0
    : Boolean(plan.lateral) || renderedLinks.length > 0;
  const hasBofu = Boolean(plan.bofu);

  const blockIsIntentionallyOmitted = autoBlocks.length === 0 && renderedLinks.length === 0;

  if (!blockIsIntentionallyOmitted && autoBlocks.length > 0 && renderedLinks.length === 0) {
    issues.push('El bloque automático de interlinking no llegó a renderizar enlaces internos útiles.');
  }

  const suspicious = renderedLinks.filter((href) => /\/index\.html\/?$/i.test(href) || href === '#top');
  if (suspicious.length > 0) {
    issues.push(`Se detectaron enlaces internos sospechosos en el bloque automático: ${suspicious.join(', ')}`);
  }

  if (!blockIsIntentionallyOmitted && currentNode.type === 'service_area' && renderedLinks.length < 1) {
    issues.push('La página de barrio debería mostrar al menos otro barrio válido del mismo cluster cuando exista.');
  }

  if (!blockIsIntentionallyOmitted && currentNode.type !== 'service_area' && renderedLinks.length < 1) {
    issues.push('No se llegó a renderizar ningún enlace interno útil en la banda automática.');
  }

  return {
    passed: issues.length === 0,
    issues,
    stats: {
      totalUsefulLinks,
      hasUpward,
      hasLateral,
      hasBofu,
    },
  };
}