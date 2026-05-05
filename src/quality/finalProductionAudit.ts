import * as cheerio from 'cheerio';

export type FinalProductionAuditSeverity = 'info' | 'warning' | 'critical';

export interface FinalProductionAuditIssue {
  code: string;
  severity: FinalProductionAuditSeverity;
  message: string;
  selector?: string;
  sample?: string;
}

export interface FinalProductionAuditBlockMetric {
  blockType: string;
  count: number;
  headings: string[];
}

export interface FinalProductionAuditResult {
  schemaVersion: 'gravity-final-production-audit@1';
  passed: boolean;
  score: number;
  status: 'production_ready' | 'needs_review' | 'blocked';
  metrics: {
    titleLength: number;
    metaDescriptionLength: number;
    h1Count: number;
    h2Count: number;
    sectionCount: number;
    ctaCount: number;
    contactAnchors: number;
    contactLinks: number;
    internalHashLinks: number;
    deadHashLinks: string[];
    blockTypes: FinalProductionAuditBlockMetric[];
    styleLayerCount: number;
  };
  issues: FinalProductionAuditIssue[];
  summary: string;
}

function text(value: unknown): string {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clean(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function addIssue(issues: FinalProductionAuditIssue[], code: string, severity: FinalProductionAuditSeverity, message: string, extra: Partial<FinalProductionAuditIssue> = {}): void {
  issues.push({ code, severity, message, ...extra });
}

function countMatches(source: string, pattern: RegExp): number {
  return (source.match(pattern) || []).length;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function scoreFromIssues(issues: FinalProductionAuditIssue[], base = 100): number {
  let score = base;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 18;
    else if (issue.severity === 'warning') score -= 7;
    else score -= 2;
  }
  return Math.max(0, Math.min(100, score));
}

function safeHasId($: cheerio.CheerioAPI, id: string): boolean {
  const escaped = id.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
  return $(`#${escaped}`).length > 0;
}

function collectDeadHashLinksSafe($: cheerio.CheerioAPI): string[] {
  const dead: string[] = [];
  $('a[href^="#"]').each((_i: number, el: any) => {
    const href = clean($(el).attr('href'));
    if (!href || href === '#') return;
    const id = href.slice(1);
    if (!id) return;
    if (!safeHasId($, id)) dead.push(href);
  });
  return unique(dead).slice(0, 20);
}

function collectBlockMetrics($: cheerio.CheerioAPI): FinalProductionAuditBlockMetric[] {
  const map = new Map<string, { count: number; headings: string[] }>();
  $('[data-block-type]').each((_i: number, el: any) => {
    const node = $(el);
    const blockType = clean(node.attr('data-block-type') || 'unknown') || 'unknown';
    const item = map.get(blockType) || { count: 0, headings: [] };
    item.count += 1;
    const heading = clean(node.find('h2,h3').first().text());
    if (heading) item.headings.push(heading.slice(0, 120));
    map.set(blockType, item);
  });
  return Array.from(map.entries()).map(([blockType, value]) => ({
    blockType,
    count: value.count,
    headings: unique(value.headings).slice(0, 5),
  }));
}

export function runFinalProductionAudit(html: string): FinalProductionAuditResult {
  const source = String(html || '');
  const $ = cheerio.load(source, { decodeEntities: false });
  const issues: FinalProductionAuditIssue[] = [];
  const visibleText = text(source);
  const title = clean($('title').first().text());
  const metaDescription = clean($('meta[name="description"]').attr('content'));
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const sectionCount = $('section').length;
  const ctaCount = $('a.cta-primary, a.card__btn, a[href="#contacto"], a[href^="tel:"]').length;
  const contactLinks = $('a[href="#contacto"]').length;
  const contactAnchors = $('#contacto').length;
  const internalHashLinks = $('a[href^="#"]').length;
  const deadHashLinks = collectDeadHashLinksSafe($);
  const styleLayerCount = $('style').length;
  const blockTypes = collectBlockMetrics($);

  if (!source.trim()) addIssue(issues, 'EMPTY_HTML', 'critical', 'El HTML final está vacío.');
  if (!/gravity-deterministic-premium-css/.test(source)) addIssue(issues, 'DETERMINISTIC_CSS_MISSING', 'critical', 'No se encontró la capa CSS determinista premium.');
  if (h1Count !== 1) addIssue(issues, 'H1_COUNT_INVALID', 'critical', `La página debe tener exactamente un H1; detectados: ${h1Count}.`);
  if (h2Count < 5) addIssue(issues, 'LOW_SECTION_HEADING_DEPTH', 'warning', `Hay pocos H2 para una landing local completa; detectados: ${h2Count}.`);
  if (sectionCount < 7) addIssue(issues, 'LOW_SECTION_COUNT', 'warning', `La página parece corta para producción masiva; secciones detectadas: ${sectionCount}.`);
  if (title.length < 35 || title.length > 68) addIssue(issues, 'TITLE_LENGTH_OUT_OF_RANGE', 'warning', `Longitud de title fuera de rango recomendado: ${title.length}.`);
  if (metaDescription.length < 110 || metaDescription.length > 165) addIssue(issues, 'META_DESCRIPTION_LENGTH_OUT_OF_RANGE', 'warning', `Longitud de meta description fuera de rango recomendado: ${metaDescription.length}.`);
  if (ctaCount < 3) addIssue(issues, 'LOW_CTA_COUNT', 'warning', `Pocos CTAs detectados: ${ctaCount}.`);
  if (contactLinks > 0 && contactAnchors === 0) addIssue(issues, 'MISSING_CONTACT_ANCHOR', 'critical', 'Hay enlaces a #contacto pero no existe ningún elemento con id="contacto".');
  if (deadHashLinks.length) addIssue(issues, 'DEAD_HASH_LINKS', 'critical', `Hay enlaces internos sin destino: ${deadHashLinks.join(', ')}.`, { sample: deadHashLinks.join(', ') });
  if (/<(?:ul|ol)[^>]*>\s*<\/\s*(?:ul|ol)>/i.test(source)) addIssue(issues, 'EMPTY_LIST_RENDERED', 'critical', 'Hay listas vacías renderizadas.');
  if (/[:;,.\s]+este\s+bloque\s+resume/i.test(visibleText)) addIssue(issues, 'VISIBLE_TEMPLATE_RESIDUE', 'critical', 'Hay residuo de plantilla visible.', { sample: visibleText.match(/.{0,40}este\s+bloque\s+resume.{0,80}/i)?.[0] });
  if (/\ben\s+y\b|\ben\s+puede\s+variar\b|\baver[ií]as\s+comunes\s+en\s+y\b/i.test(visibleText)) addIssue(issues, 'BROKEN_LOCAL_COPY', 'critical', 'Hay copy local incompleto, normalmente por ciudad perdida.');
  if (/Lo\s+que\s+dicen\s+nuestros\s+clientes|reseñas\s+de\s+clientes|testimonios/i.test(visibleText)) addIssue(issues, 'UNVERIFIED_REVIEW_LANGUAGE', 'critical', 'Hay lenguaje de reseñas/testimonios sin evidencia.');
  if (countMatches(source, /class="[^"]*(?:undefined|null)[^"]*"/gi) > 0) addIssue(issues, 'BROKEN_CLASS_TOKEN', 'critical', 'Hay clases CSS con tokens undefined/null.');
  if (styleLayerCount > 8) addIssue(issues, 'TOO_MANY_STYLE_LAYERS', 'warning', `Hay muchas capas <style> en el HTML final (${styleLayerCount}); conviene consolidar para evitar conflictos visuales.`);
  if (!blockTypes.some((b) => b.blockType === 'services_grid')) addIssue(issues, 'SERVICES_BLOCK_MISSING', 'warning', 'No se detectó bloque services_grid.');
  if (!blockTypes.some((b) => b.blockType === 'faq')) addIssue(issues, 'FAQ_BLOCK_MISSING', 'warning', 'No se detectó bloque FAQ.');
  if (!blockTypes.some((b) => b.blockType === 'cta_panel')) addIssue(issues, 'FINAL_CTA_BLOCK_MISSING', 'warning', 'No se detectó bloque CTA final.');

  $('.service-card, .proof-card, .step-card, .price-card, .semantic-card, .trust-band__signal-card').each((_i: number, el: any) => {
    const node = $(el);
    const cardText = clean(node.text());
    if (cardText.length > 0 && cardText.length < 28) {
      addIssue(issues, 'VERY_THIN_CARD_COPY', 'warning', 'Hay una card con contenido demasiado escaso.', { sample: cardText.slice(0, 120) });
      return false;
    }
    return undefined;
  });

  const score = scoreFromIssues(issues);
  const hasCritical = issues.some((issue) => issue.severity === 'critical');
  const status = hasCritical ? 'blocked' : score >= 82 ? 'production_ready' : 'needs_review';
  const summary = hasCritical
    ? `Bloqueado por ${issues.filter((i) => i.severity === 'critical').length} incidencias críticas.`
    : score >= 82
      ? `Listo para producción con score ${score}.`
      : `Necesita revisión visual/editorial con score ${score}.`;

  return {
    schemaVersion: 'gravity-final-production-audit@1',
    passed: !hasCritical && score >= 72,
    score,
    status,
    metrics: {
      titleLength: title.length,
      metaDescriptionLength: metaDescription.length,
      h1Count,
      h2Count,
      sectionCount,
      ctaCount,
      contactAnchors,
      contactLinks,
      internalHashLinks,
      deadHashLinks,
      blockTypes,
      styleLayerCount,
    },
    issues: issues.slice(0, 80),
    summary,
  };
}

export function renderFinalProductionAuditMarkdown(audit: FinalProductionAuditResult): string {
  const lines: string[] = [];
  lines.push(`# Gravity Final Production Audit`);
  lines.push('');
  lines.push(`Estado: **${audit.status}**`);
  lines.push(`Score: **${audit.score}/100**`);
  lines.push(`Resumen: ${audit.summary}`);
  lines.push('');
  lines.push(`## Métricas`);
  lines.push('');
  lines.push(`- H1: ${audit.metrics.h1Count}`);
  lines.push(`- H2: ${audit.metrics.h2Count}`);
  lines.push(`- Secciones: ${audit.metrics.sectionCount}`);
  lines.push(`- CTAs: ${audit.metrics.ctaCount}`);
  lines.push(`- Enlaces internos hash: ${audit.metrics.internalHashLinks}`);
  lines.push(`- Capas style: ${audit.metrics.styleLayerCount}`);
  lines.push('');
  lines.push(`## Bloques detectados`);
  lines.push('');
  if (audit.metrics.blockTypes.length) {
    for (const block of audit.metrics.blockTypes) {
      lines.push(`- ${block.blockType}: ${block.count}${block.headings.length ? ` — ${block.headings.join(' | ')}` : ''}`);
    }
  } else {
    lines.push('- No se detectaron bloques con data-block-type.');
  }
  lines.push('');
  lines.push(`## Incidencias`);
  lines.push('');
  if (!audit.issues.length) {
    lines.push('- Sin incidencias.');
  } else {
    for (const issue of audit.issues) {
      lines.push(`- **${issue.severity.toUpperCase()}** · ${issue.code}: ${issue.message}${issue.sample ? `\n  - Ejemplo: ${issue.sample}` : ''}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
