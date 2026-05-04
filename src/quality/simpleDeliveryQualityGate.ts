export type SimpleDeliveryIssueSeverity = 'critical' | 'warning';

export interface SimpleDeliveryQualityIssue {
  code: string;
  severity: SimpleDeliveryIssueSeverity;
  message: string;
  selector?: string;
  evidence?: string;
}

export interface SimpleDeliveryQualityContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
  canonical?: string;
}

export interface SimpleDeliveryQualityResult {
  schemaVersion: 'simple-delivery-quality-gate@1';
  passed: boolean;
  score: number;
  criticalCount: number;
  warningCount: number;
  issues: SimpleDeliveryQualityIssue[];
  summary: string;
}

function stripTags(input: string): string {
  return String(input || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(input: string): string {
  return stripTags(input).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function uniqueIssues(issues: SimpleDeliveryQualityIssue[]): SimpleDeliveryQualityIssue[] {
  const seen = new Set<string>();
  const out: SimpleDeliveryQualityIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.code}|${issue.selector || ''}|${issue.evidence || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

function addIssue(issues: SimpleDeliveryQualityIssue[], issue: SimpleDeliveryQualityIssue): void {
  issues.push(issue);
}

function getMatches(regex: RegExp, html: string, limit = 25): RegExpMatchArray[] {
  const matches: RegExpMatchArray[] = [];
  const source = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = source.exec(html)) && matches.length < limit) {
    matches.push(match);
    if (match.index === source.lastIndex) source.lastIndex += 1;
  }
  return matches;
}

function collectIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const match of getMatches(/\b(?:id|name)=["']([^"']+)["']/gi, html, 500)) {
    const value = String(match[1] || '').trim();
    if (value) ids.add(value);
  }
  return ids;
}

function normalizePhone(phone?: string): string {
  return String(phone || '').replace(/[^+\d]/g, '');
}

function hasRealPhone(phone?: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.replace(/^\+/, '').length >= 9;
}

function sectionCount(html: string): number {
  return getMatches(/<section\b/gi, html, 1000).length;
}

function countRegex(html: string, regex: RegExp): number {
  return getMatches(regex, html, 1000).length;
}

function containsJsonLdLocalBusinessWithTelephone(html: string): boolean {
  const jsonLdBlocks = getMatches(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, html, 100);
  return jsonLdBlocks.some((match) => /"@type"\s*:\s*"LocalBusiness"/i.test(match[1] || '') && /"telephone"\s*:/i.test(match[1] || ''));
}

function containsStreetAddressWithoutEvidence(html: string): boolean {
  const jsonLdBlocks = getMatches(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, html, 100);
  return jsonLdBlocks.some((match) => /"streetAddress"\s*:/i.test(match[1] || ''));
}

function looksLikeVerifiedReviewSchema(html: string): boolean {
  return /"aggregateRating"\s*:/i.test(html) || /"review"\s*:/i.test(html);
}

export function validateSimpleDeliveryQuality(html: string, context: SimpleDeliveryQualityContext = {}): SimpleDeliveryQualityResult {
  const source = String(html || '');
  const text = normalizeText(source);
  const issues: SimpleDeliveryQualityIssue[] = [];
  const ids = collectIds(source);
  const city = String(context.city || '').trim();
  const cityNorm = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hasPhone = hasRealPhone(context.phone);

  if (!source.trim()) {
    addIssue(issues, { code: 'EMPTY_HTML', severity: 'critical', message: 'El HTML final está vacío.' });
  }

  if (!/<html\b/i.test(source) || !/<body\b/i.test(source)) {
    addIssue(issues, { code: 'HTML_SHELL_INCOMPLETE', severity: 'critical', message: 'Falta la estructura HTML básica html/body.' });
  }

  const h1Matches = getMatches(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, source, 20);
  if (h1Matches.length === 0) {
    addIssue(issues, { code: 'H1_MISSING', severity: 'critical', message: 'La página no tiene H1.' });
  } else if (h1Matches.some((match) => stripTags(match[1] || '').length < 8)) {
    addIssue(issues, { code: 'H1_EMPTY_OR_TOO_SHORT', severity: 'critical', message: 'El H1 está vacío o es demasiado corto.' });
  } else if (h1Matches.length > 1) {
    addIssue(issues, { code: 'MULTIPLE_H1', severity: 'warning', message: 'La página tiene más de un H1.' });
  }

  if (!/<title\b[^>]*>[^<]{12,}<\/title>/i.test(source)) {
    addIssue(issues, { code: 'TITLE_MISSING_OR_TOO_SHORT', severity: 'critical', message: 'El title falta o es demasiado corto.' });
  }

  if (!/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']{40,}["']/i.test(source)) {
    addIssue(issues, { code: 'META_DESCRIPTION_MISSING_OR_TOO_SHORT', severity: 'warning', message: 'La meta description falta o es demasiado corta.' });
  }

  const cleanTextLength = stripTags(source).length;
  if (cleanTextLength < 2200) {
    addIssue(issues, { code: 'CONTENT_TOO_SHORT_FOR_DELIVERY', severity: 'critical', message: 'El contenido visible parece demasiado corto para publicar una landing SEO local.' });
  }

  const sections = sectionCount(source);
  if (sections < 6) {
    addIssue(issues, { code: 'TOO_FEW_SECTIONS', severity: 'warning', message: `La página tiene pocas secciones renderizadas (${sections}).` });
  }

  const ctaCount = countRegex(source, /class=["'][^"']*(?:cta-primary|nav__cta|mobile-sticky-cta__button|card__btn)[^"']*["']/gi);
  if (ctaCount === 0) {
    addIssue(issues, { code: 'CTA_MISSING', severity: 'critical', message: 'No se detecta ningún CTA principal.' });
  }

  const hrefAnchors = getMatches(/href=["']#([^"'#\s]+)["']/gi, source, 500).map((match) => String(match[1] || '').trim()).filter(Boolean);
  const brokenAnchors = Array.from(new Set(hrefAnchors.filter((anchor) => !ids.has(anchor))));
  for (const anchor of brokenAnchors.slice(0, 12)) {
    addIssue(issues, { code: 'BROKEN_HASH_ANCHOR', severity: anchor === 'contacto' ? 'critical' : 'warning', message: `El CTA/enlace apunta a #${anchor}, pero no existe ese id/name en el HTML.`, evidence: `#${anchor}` });
  }

  if (/href=["']#contacto["']/i.test(source) && !ids.has('contacto')) {
    addIssue(issues, { code: 'CONTACT_ANCHOR_MISSING', severity: 'critical', message: 'Hay CTAs a #contacto pero falta la sección/ancla id="contacto".' });
  }

  const emptyLists = countRegex(source, /<(ul|ol)\b[^>]*>\s*<\/\1>/gi);
  if (emptyLists > 0) {
    addIssue(issues, { code: 'EMPTY_LISTS_RENDERED', severity: 'critical', message: `Se han renderizado listas vacías (${emptyLists}).` });
  }

  const emptyCards = countRegex(source, /<(article|div)\b[^>]*class=["'][^"']*(?:service-card|step-card|proof-card|price-card|semantic-card|faq-item|trust-band__signal-card)[^"']*["'][^>]*>\s*<\/\1>/gi);
  if (emptyCards > 0) {
    addIssue(issues, { code: 'EMPTY_CARD_RENDERED', severity: 'critical', message: `Se han renderizado cards vacías (${emptyCards}).` });
  }

  const templateResiduePatterns: Array<[RegExp, string]> = [
    [/:\s*este bloque\b/i, 'Texto residual visible: ": este bloque...".'],
    [/\beste bloque resume\b/i, 'Texto residual visible: "este bloque resume...".'],
    [/\b(?:undefined|null|\[object Object\])\b/i, 'Token técnico visible en el HTML.'],
    [/\b(lorem ipsum|placeholder|dummy text)\b/i, 'Placeholder visible en el HTML.'],
    [/\{\{[^}]+\}\}|%%[^%]+%%|__[A-Z0-9_]{3,}__/i, 'Token de plantilla visible en el HTML.']
  ];
  for (const [pattern, message] of templateResiduePatterns) {
    if (pattern.test(source)) addIssue(issues, { code: 'TEMPLATE_RESIDUE_VISIBLE', severity: 'critical', message });
  }

  const brokenLocalPhrases: Array<[RegExp, string]> = [
    [/\ben\s+y\b/i, 'Frase local incompleta: "en y".'],
    [/\ben\s+puede\s+variar\b/i, 'Frase local incompleta: "en puede variar".'],
    [/\ben\s+conviene\b/i, 'Frase local incompleta: "en conviene".'],
    [/\ben\s*[,.;:!?]/i, 'Frase local incompleta después de "en".'],
    [/\bpara\s+en\b/i, 'Frase rota: "para en".']
  ];
  for (const [pattern, message] of brokenLocalPhrases) {
    if (pattern.test(text)) addIssue(issues, { code: 'BROKEN_LOCAL_COPY', severity: 'critical', message });
  }

  if (cityNorm && !text.includes(cityNorm)) {
    addIssue(issues, { code: 'CITY_NOT_VISIBLE', severity: 'critical', message: `La ciudad esperada (${city}) no aparece de forma visible en el contenido.` });
  }

  const dangerousReviewLanguage = /\b(lo que dicen nuestros clientes|opiniones de clientes|resenas?|reseñas|testimonios?|valoraciones?)\b/i;
  if (dangerousReviewLanguage.test(text) && !looksLikeVerifiedReviewSchema(source)) {
    addIssue(issues, { code: 'UNVERIFIED_REVIEW_LANGUAGE', severity: 'critical', message: 'Aparece lenguaje de clientes/reseñas/testimonios sin evidencia verificable.' });
  }

  const riskyClaims: Array<[RegExp, string]> = [
    [/\bgratis\b/i, 'Claim delicado "gratis" sin evidencia explícita.'],
    [/\bgarantizad[oa]s?\b/i, 'Claim delicado "garantizado" sin evidencia explícita.'],
    [/\b24\s*h\b|\b24 horas\b/i, 'Claim "24h" debe estar respaldado por datos reales antes de publicar.'],
    [/\bmejor(?:es)?\s+(?:electricistas|cerrajeros|fontaneros|empresa|servicio)s?\b/i, 'Superlativo comercial no verificable.']
  ];
  for (const [pattern, message] of riskyClaims) {
    if (pattern.test(text)) addIssue(issues, { code: 'UNVERIFIED_COMMERCIAL_CLAIM', severity: 'warning', message });
  }

  const telLinks = getMatches(/href=["']tel:([^"']*)["']/gi, source, 100).map((match) => String(match[1] || '').trim());
  if (telLinks.length > 0 && !hasPhone) {
    addIssue(issues, { code: 'TEL_LINK_WITHOUT_VERIFIED_PHONE', severity: 'critical', message: 'Hay enlaces tel: pero la misión no tiene teléfono verificado.' });
  }
  for (const tel of telLinks) {
    if (normalizePhone(tel).replace(/^\+/, '').length < 9) {
      addIssue(issues, { code: 'INVALID_TEL_LINK', severity: 'critical', message: 'Hay un enlace tel: con número incompleto o inválido.', evidence: tel });
    }
  }

  if (containsJsonLdLocalBusinessWithTelephone(source) && !hasPhone) {
    addIssue(issues, { code: 'SCHEMA_PHONE_WITHOUT_VERIFIED_PHONE', severity: 'critical', message: 'El schema LocalBusiness incluye telephone sin teléfono verificado en la misión.' });
  }

  if (containsStreetAddressWithoutEvidence(source) && !/\bstreetAddressVerified\b|data-address-verified=["']true["']/i.test(source)) {
    addIssue(issues, { code: 'SCHEMA_STREET_ADDRESS_REQUIRES_EVIDENCE', severity: 'warning', message: 'El schema incluye streetAddress; debe existir evidencia real antes de producción masiva.' });
  }

  const brokenImages = getMatches(/<img\b[^>]*>/gi, source, 300).filter((match) => !/\bsrc=["'][^"']+["']/i.test(match[0]) || /\bsrc=["']\s*["']/i.test(match[0]));
  if (brokenImages.length > 0) {
    addIssue(issues, { code: 'IMAGE_WITHOUT_SRC', severity: 'critical', message: `Hay imágenes sin src válido (${brokenImages.length}).` });
  }

  if (/data-image-warning=["'][^"']*hero-resolution-low/i.test(source)) {
    addIssue(issues, { code: 'HERO_LOW_RESOLUTION_WARNING', severity: 'warning', message: 'La imagen hero está marcada como baja resolución; conviene usar fallback visual o regenerarla.' });
  }

  if (/<iframe\b/i.test(source) && !/\btitle=["'][^"']+["']/i.test(source)) {
    addIssue(issues, { code: 'IFRAME_WITHOUT_TITLE', severity: 'warning', message: 'Hay iframe sin title accesible.' });
  }

  const duplicateCtaLabels = getMatches(/<a\b[^>]*class=["'][^"']*(?:cta-primary|card__btn)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, source, 50)
    .map((match) => stripTags(match[1] || '').toLowerCase())
    .filter((label) => label.length > 0);
  const labelCounts = duplicateCtaLabels.reduce<Record<string, number>>((acc, label) => {
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const excessiveDuplicates = Object.entries(labelCounts).filter(([, count]) => count >= 6);
  if (excessiveDuplicates.length > 0) {
    addIssue(issues, { code: 'EXCESSIVE_DUPLICATE_CTA_LABELS', severity: 'warning', message: 'Hay demasiados CTAs con el mismo texto; la página puede parecer mecánica.', evidence: excessiveDuplicates.map(([label, count]) => `${label} x${count}`).join(', ') });
  }

  const unique = uniqueIssues(issues);
  const criticalCount = unique.filter((issue) => issue.severity === 'critical').length;
  const warningCount = unique.filter((issue) => issue.severity === 'warning').length;
  const score = Math.max(0, 100 - criticalCount * 18 - warningCount * 5);
  const passed = criticalCount === 0;

  return {
    schemaVersion: 'simple-delivery-quality-gate@1',
    passed,
    score,
    criticalCount,
    warningCount,
    issues: unique,
    summary: passed
      ? `PASS simple delivery gate · score=${score} warnings=${warningCount}`
      : `FAIL simple delivery gate · score=${score} critical=${criticalCount} warnings=${warningCount}`
  };
}
