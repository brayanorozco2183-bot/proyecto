export interface DeterministicProductionIssue {
  code: string;
  severity: 'warning' | 'critical';
  message: string;
}

export interface DeterministicProductionGateResult {
  passed: boolean;
  issues: DeterministicProductionIssue[];
}

function count(pattern: RegExp, html: string): number {
  return (html.match(pattern) || []).length;
}

export function validateDeterministicProductionHtml(html: string): DeterministicProductionGateResult {
  const source = String(html || '');
  const issues: DeterministicProductionIssue[] = [];
  const add = (code: string, severity: 'warning' | 'critical', message: string) => issues.push({ code, severity, message });

  if (!/gravity-deterministic-premium-css/.test(source)) {
    add('DETERMINISTIC_CSS_MISSING', 'critical', 'Falta la capa CSS premium determinista.');
  }
  if (/[:;,\.\s]+este\s+bloque\s+resume/i.test(source)) {
    add('VISIBLE_TEMPLATE_RESIDUE', 'critical', 'Hay texto residual de plantilla visible en la página.');
  }
  if (/\ben\s+y\b|\ben\s+puede\s+variar\b|\baver[ií]as\s+comunes\s+en\s+y\b/i.test(source)) {
    add('BROKEN_LOCAL_COPY', 'critical', 'Hay copy local incompleto, normalmente ciudad o contexto perdido.');
  }
  if (/<(?:ul|ol)[^>]*>\s*<\/\s*(?:ul|ol)>/i.test(source)) {
    add('EMPTY_LIST_RENDERED', 'critical', 'Se renderizaron listas vacías que pueden romper el espaciado.');
  }
  if (/Lo\s+que\s+dicen\s+nuestros\s+clientes|reseñas\s+de\s+clientes|testimonios/i.test(source)) {
    add('UNVERIFIED_REVIEW_LANGUAGE', 'critical', 'Hay lenguaje de reseñas/testimonios sin evidencia explícita.');
  }
  if (count(/class="[^"]*(?:undefined|null)[^"]*"/gi, source) > 0) {
    add('BROKEN_CLASS_TOKEN', 'critical', 'Hay tokens undefined/null en clases CSS.');
  }
  if (/href=["']#contacto["']/i.test(source) && !/id=["']contacto["']/i.test(source)) {
    add('MISSING_CONTACT_ANCHOR', 'critical', 'Hay CTAs a #contacto sin destino real en la página.');
  }
  if (/href=["']#[^"']+["']/i.test(source) && /data-gravity-link-repaired=["']missing-anchor["']/i.test(source)) {
    add('HASH_LINKS_REPAIRED', 'warning', 'El sanitizador tuvo que reparar enlaces internos sin destino.');
  }

  if (count(/data-image-warning="[^"]*resolution-low/gi, source) > 0 && !/gdk-hero-illustration/.test(source)) {
    add('LOW_RES_HERO_NOT_REPLACED', 'warning', 'La imagen hero de baja resolución no fue sustituida por fallback premium.');
  }
  if (count(/<section\b/gi, source) < 6) {
    add('TOO_FEW_SECTIONS', 'warning', 'La página parece tener pocas secciones para una landing local completa.');
  }

  return { passed: !issues.some(issue => issue.severity === 'critical'), issues };
}
