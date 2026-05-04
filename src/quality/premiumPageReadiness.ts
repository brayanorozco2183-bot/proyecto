import * as cheerio from 'cheerio';
import type { GenerationMission, PagePlan, RenderedPage } from '../types/pipeline_v2.js';

export type PremiumReadinessSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface PremiumReadinessIssue {
  code: string;
  severity: PremiumReadinessSeverity;
  message: string;
  evidence?: string;
}

export interface PremiumReadinessResult {
  passed: boolean;
  score: number;
  issues: PremiumReadinessIssue[];
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleText($: cheerio.CheerioAPI): string {
  return $('body').text().replace(/\s+/g, ' ').trim();
}

function hasPhone(mission: GenerationMission): boolean {
  const phone = mission.local_nap?.phone || (mission.local_nap as any)?.phone_normalized;
  return /\d{9,}/.test(String(phone || '').replace(/\D+/g, ''));
}

function hasVerifiedReviews(mission: GenerationMission): boolean {
  const nap = (mission as any).local_nap || {};
  const proof = (mission as any).proof || (mission as any).reviews || {};
  return Boolean(
    nap.review_count ||
    nap.aggregateRating ||
    proof.review_count ||
    proof.aggregateRating ||
    (Array.isArray(proof.reviews) && proof.reviews.length > 0)
  );
}

function push(issues: PremiumReadinessIssue[], code: string, severity: PremiumReadinessSeverity, message: string, evidence?: string): void {
  issues.push({ code, severity, message, evidence });
}

function countPenalty(issue: PremiumReadinessIssue): number {
  if (issue.severity === 'critical') return 22;
  if (issue.severity === 'error') return 12;
  if (issue.severity === 'warning') return 5;
  return 1;
}

export function validatePremiumPageReadiness(input: {
  page: RenderedPage;
  mission: GenerationMission;
  pagePlan?: PagePlan;
}): PremiumReadinessResult {
  const issues: PremiumReadinessIssue[] = [];
  const html = String(input.page?.html || '');
  const $ = cheerio.load(html);
  const text = visibleText($);
  const normalizedText = normalize(text);
  const city = normalize(input.mission.city);
  const niche = normalize(input.mission.niche);
  const assemblyMode = String((input.page.metadata as any)?.assembly_mode || '').trim();

  if (!html.trim()) push(issues, 'PREMIUM_EMPTY_HTML', 'critical', 'El HTML final está vacío.');
  if (assemblyMode === 'emergency_fallback') {
    push(issues, 'PREMIUM_ASSEMBLY_EMERGENCY_FALLBACK', 'error', 'La página salió con fallback de emergencia; no debe publicarse como premium sin revisión.');
  }

  const lang = String($('html').attr('lang') || '').toLowerCase();
  if (!/^es(?:-|$)/.test(lang)) push(issues, 'PREMIUM_LANG_MISSING_ES', 'error', 'La página local debe declarar lang="es" o lang="es-ES".', lang || 'sin lang');
  if (!$('meta[name="viewport"]').length) push(issues, 'PREMIUM_VIEWPORT_MISSING', 'critical', 'Falta meta viewport para móvil.');
  if (!$('title').first().text().trim()) push(issues, 'PREMIUM_TITLE_MISSING', 'critical', 'Falta title SEO.');
  if (!$('meta[name="description"]').attr('content')?.trim()) push(issues, 'PREMIUM_DESCRIPTION_MISSING', 'critical', 'Falta meta description.');
  if (!$('link[rel="canonical"]').attr('href')?.trim()) push(issues, 'PREMIUM_CANONICAL_MISSING', 'error', 'Falta canonical final.');

  const h1Count = $('h1').length;
  if (h1Count !== 1) push(issues, 'PREMIUM_H1_COUNT_INVALID', 'critical', `Debe existir un único H1; encontrados ${h1Count}.`);

  if (city && !normalizedText.includes(city)) push(issues, 'PREMIUM_CITY_NOT_VISIBLE', 'error', `La ciudad/localidad "${input.mission.city}" no aparece de forma visible.`);
  if (niche && !normalizedText.includes(niche)) push(issues, 'PREMIUM_NICHE_NOT_VISIBLE', 'error', `El nicho "${input.mission.niche}" no aparece de forma visible.`);

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 900) push(issues, 'PREMIUM_WORD_COUNT_LOW', 'warning', `Contenido visible corto para una página premium: ${wordCount} palabras.`);
  if ($('section, main > div[class*="section"], article').length < 5) push(issues, 'PREMIUM_SECTION_COUNT_LOW', 'warning', 'La página tiene pocas secciones diferenciadas para una landing premium.');

  const bodyAndAttrs = `${text} ${$('[alt], [title], [aria-label], [placeholder]').map((_i: any, el: any) => $(el).attr('alt') || $(el).attr('title') || $(el).attr('aria-label') || $(el).attr('placeholder') || '').get().join(' ')}`;
  const placeholderHit = bodyAndAttrs.match(/\{\{[^}]+\}\}|\[[^\]]*(?:ciudad|nicho|servicio|empresa|phone|telefono|placeholder|url|title|h1)[^\]]*\]|\bundefined\b|\bnull\b|\[object Object\]/i);
  if (placeholderHit) push(issues, 'PREMIUM_PLACEHOLDER_VISIBLE', 'critical', 'Hay placeholder o valor roto visible.', placeholderHit[0]);

  const systemLeak = bodyAndAttrs.match(/(?:system prompt|developer message|chain of thought|internal note|debug only|no publicar|lorem ipsum)/i);
  if (systemLeak) push(issues, 'PREMIUM_SYSTEM_LEAK_VISIBLE', 'critical', 'Hay texto interno o de depuración visible.', systemLeak[0]);

  const brokenIndexLinks = $('a[href$="/index.html"], a[href*="/index.html#"]').length;
  if (brokenIndexLinks) push(issues, 'PREMIUM_INDEX_HTML_LINKS', 'error', `Hay ${brokenIndexLinks} enlaces internos con /index.html.`);

  const phoneAvailable = hasPhone(input.mission);
  const telLinks = $('a[href^="tel:"]').length;
  if (!phoneAvailable && telLinks > 0) push(issues, 'PREMIUM_FAKE_TEL_LINK', 'critical', 'Hay enlaces tel: aunque la misión no aporta teléfono validado.');

  const hasReviews = hasVerifiedReviews(input.mission);
  const jsonLdText = $('script[type="application/ld+json"]').map((_i: any, el: any) => $(el).contents().text()).get().join('\n');
  if (!hasReviews && /aggregateRating|reviewRating|reviewCount/i.test(jsonLdText)) {
    push(issues, 'PREMIUM_UNVERIFIED_REVIEW_SCHEMA', 'critical', 'El schema incluye reseñas o aggregateRating sin evidencia validada en la misión.');
  }

  const footer = $('footer').last();
  if (footer.length && footer.nextAll('section, main, article, div[class*="section"]').length > 0) {
    push(issues, 'PREMIUM_CONTENT_AFTER_FOOTER', 'error', 'Hay bloques de contenido insertados después del footer.');
  }

  const faqQuestions = $('summary, .faq-question, [data-faq-question], .faq-item h3').map((_i: any, el: any) => $(el).text().trim()).get().filter(Boolean);
  const badFaq = faqQuestions.find((q: string) => /^\s*(?:\d+[.)-]\s*)?¿?\d+[.)-]?\s*¿/i.test(q) || /^\s*\d+[.)-]\s*¿/i.test(q));
  if (badFaq) push(issues, 'PREMIUM_FAQ_NUMBERING_ARTIFACT', 'error', 'Una FAQ conserva numeración o artefactos visibles.', badFaq);

  const visibleResidue = text.match(/(^|\s)[:;,]\s*este bloque|bloque resume|servicios gratuitos|contactarahoranos|contáctaranos|\ben\s+y\b|\ben\s+puede\s+variar\b/i);
  if (visibleResidue) push(issues, 'PREMIUM_VISIBLE_TEMPLATE_RESIDUE', 'critical', 'Hay residuo de plantilla o fragmento local roto visible.', visibleResidue[0]);

  const emptyStructuralLists = $('ul:empty, ol:empty, .service-card__meta:empty, .step-row__meta:empty, .proof-row__meta:empty').length;
  if (emptyStructuralLists) push(issues, 'PREMIUM_EMPTY_STRUCTURAL_LISTS', 'error', `Hay ${emptyStructuralLists} listas estructurales vacías en el HTML final.`);

  const lowConfidenceHero = $('figure.hero-visual[data-image-warning*="low"], figure.hero-visual[data-image-status*="fallback"], figure.hero-visual img[data-image-width-real]').filter((_i: any, el: any) => {
    const img = $(el).is('img') ? $(el) : $(el).find('img').first();
    const w = Number(img.attr('data-image-width-real') || img.attr('width') || 0);
    const h = Number(img.attr('data-image-height-real') || img.attr('height') || 0);
    return (w > 0 && w < 900) || (h > 0 && h < 520) || /low|fallback/i.test(String($(el).attr('data-image-warning') || $(el).attr('data-image-status') || ''));
  }).length;
  if (lowConfidenceHero && !$('.hero-visual--fallback, .hero-visual--low-confidence').length) {
    push(issues, 'PREMIUM_LOW_CONFIDENCE_HERO_IMAGE', 'error', 'La imagen hero es de baja confianza y no se sustituyó por fallback visual premium.');
  }

  const reviewLanguage = $('[data-block-type="local_proof"], [data-block-type="trust_band"]').text().match(/lo que dicen nuestros clientes|reseñas|testimonios|opiniones de clientes/i);
  if (!hasReviews && reviewLanguage) push(issues, 'PREMIUM_UNVERIFIED_REVIEW_COPY', 'critical', 'Aparece lenguaje de reseñas/clientes sin evidencia validada.', reviewLanguage[0]);

  const productionStableCss = $('#gravity-production-stable-visual').length;
  const productionBodyClass = $('body.gravity-production-stable').length;
  if (!productionStableCss || !productionBodyClass) {
    push(issues, 'PREMIUM_PRODUCTION_STABLE_VISUAL_MISSING', 'error', 'Falta la capa visual estable de producción o la clase body correspondiente.');
  }

  const score = Math.max(0, 100 - issues.reduce((acc, issue) => acc + countPenalty(issue), 0));
  const passed = !issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error');
  return { passed, score, issues };
}
