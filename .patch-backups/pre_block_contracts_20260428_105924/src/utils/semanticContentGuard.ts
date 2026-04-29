import * as cheerio from 'cheerio';
import { sanitizeLegalRiskClaims } from './legalClaimSanitizer.js';
import type { ContentBlock, ContentDraft, GenerationMission, NormalizedContext, PagePlan, RenderedPage } from '../types/pipeline_v2.js';

export type SemanticSeverity = 'warning' | 'error' | 'critical';

export interface SemanticIssue {
  code: string;
  severity: SemanticSeverity;
  message: string;
  evidence?: string[];
  blockId?: string;
}

export interface SectionQualityContract {
  sectionId: string;
  blockType: string;
  h2: string;
  city: string;
  niche: string;
  mustMentionCity: boolean;
  mustMentionNiche: boolean;
  minTechnicalTerms: number;
  requiredTerms: string[];
  forbiddenGenericPhrases: string[];
  ctaAllowed: boolean;
  tone: 'profesional-directo' | 'informativo' | 'conversion';
}

const BROKEN_SPANISH_PATTERNS: Array<{ code: string; re: RegExp; message: string }> = [
  { code: 'BROKEN_CITY_PHRASE_EN_SON', re: /\ben\s+son\b/i, message: 'Frase local rota: "en son".' },
  { code: 'BROKEN_CITY_PHRASE_EN_PUNCT', re: /\ben\s*[,.;:]/i, message: 'Frase local rota: preposición "en" sin ciudad.' },
  { code: 'BROKEN_CITY_PHRASE_CITY_GENERIC', re: /\bes una ciudad con un gran potencial para\b/i, message: 'Frase genérica local de baja calidad.' },
  { code: 'BROKEN_CTA_AHORANOS', re: /\bahoranos\b/i, message: 'CTA corrupto: "ahoranos".' },
  { code: 'BROKEN_DOUBLE_PRONOUN_CTA', re: /\b(cont[aá]ctanosnos|ll[aá]manosnos|cons[uú]ltanosnos)\b/i, message: 'CTA con pronombre duplicado.' },
  { code: 'TRUNCATED_VISIBLE_COPY', re: /\b[a-záéíóúñ]{4,}\.{3}(?:\s|$)/i, message: 'Texto visible truncado con puntos suspensivos.' },
  { code: 'VISIBLE_PLACEHOLDER', re: /\[(?:ciudad|nicho|servicio|empresa|nombre|tel[eé]fono|phone|url|placeholder)[^\]]*\]/i, message: 'Placeholder visible sin resolver.' },
];

const GENERIC_FORBIDDEN_PHRASES = [
  'gran potencial para',
  'servicio profesional y de calidad',
  'soluciones personalizadas para cada cliente',
  'la confianza es fundamental',
  'materiales adecuados y profesionales',
  'equipo altamente cualificado',
];

const NICHE_TECH_TERMS: Record<string, string[]> = {
  electricistas: ['cuadro eléctrico', 'diferencial', 'magnetotérmico', 'boletín eléctrico', 'cortocircuito', 'derivación', 'enchufe', 'sobrecarga', 'ICP', 'LED'],
  cerrajeros: ['bombín', 'cilindro', 'cerradura', 'escudo', 'resbalón', 'llave', 'apertura', 'anti-bumping', 'anti-taladro', 'amaestramiento'],
  fontaneros: ['fuga', 'tubería', 'llave de paso', 'desagüe', 'sifón', 'caldera', 'presión', 'humedad', 'atasco', 'termo'],
  reformas: ['alicatado', 'pladur', 'solado', 'tabiquería', 'licencia', 'medición', 'presupuesto', 'acabados', 'aislamiento', 'instalación'],
  climatizacion: ['split', 'frigorías', 'conductos', 'bomba de calor', 'termostato', 'filtro', 'gas refrigerante', 'compresor'],
  limpieza: ['desinfección', 'abrillantado', 'cristales', 'comunidad', 'oficina', 'maquinaria', 'mantenimiento'],
};

function normalizeText(value: string): string {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function wordCount(text: string): number {
  return normalizeText(text).split(/\s+/).filter(Boolean).length;
}

function includesLoose(haystack: string, needle: string): boolean {
  return normalizeKey(haystack).includes(normalizeKey(needle));
}

export function inferNicheTechnicalTerms(niche: string, entities: string[] = []): string[] {
  const key = normalizeKey(niche);
  const fromKnown = Object.entries(NICHE_TECH_TERMS).find(([candidate]) => key.includes(candidate) || candidate.includes(key))?.[1] || [];
  const fromEntities = entities
    .filter((entity) => String(entity || '').trim().split(/\s+/).length <= 4)
    .slice(0, 12);
  return Array.from(new Set([...fromKnown, ...fromEntities])).slice(0, 18);
}

export function buildSectionQualityContract(args: {
  section: unknown;
  sectionId: string;
  index: number;
  totalSections: number;
  context: NormalizedContext;
  resolvedSectionContract?: unknown;
}): SectionQualityContract {
  const blockType = String(args.section?.block_type || args.section?.blockType || 'content');
  const ctaAllowed = /cta|hero|contact|conversion|trust|pricing|quote/i.test(blockType) || args.index === args.totalSections - 1;
  const requiredTerms = inferNicheTechnicalTerms(args.context.niche, args.context.deduplicated_entities || []);
  const minTechnicalTerms = /faq|guide|service|features|process|pricing|proof/i.test(blockType) ? 2 : 1;

  return {
    sectionId: args.sectionId,
    blockType,
    h2: String(args.section?.h2 || ''),
    city: args.context.city,
    niche: args.context.niche,
    mustMentionCity: args.index === 0 || /local|hero|service|contact|faq|cta|trust/i.test(blockType),
    mustMentionNiche: true,
    minTechnicalTerms,
    requiredTerms,
    forbiddenGenericPhrases: GENERIC_FORBIDDEN_PHRASES,
    ctaAllowed,
    tone: ctaAllowed ? 'conversion' : (/faq|guide|inform/i.test(blockType) ? 'informativo' : 'profesional-directo'),
  };
}

export function validateBlockSemantics(html: string, contract: SectionQualityContract): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const text = normalizeText(cheerio.load(html || '').root().text() || html || '');
  const words = wordCount(text);

  if (words < 35) {
    issues.push({ code: 'BLOCK_TOO_THIN', severity: 'error', message: `Bloque demasiado corto (${words} palabras).`, blockId: contract.sectionId });
  }

  for (const pattern of BROKEN_SPANISH_PATTERNS) {
    if (pattern.re.test(text)) {
      issues.push({ code: pattern.code, severity: 'critical', message: pattern.message, blockId: contract.sectionId });
    }
  }

  if (contract.mustMentionCity && contract.city && !includesLoose(text, contract.city)) {
    issues.push({ code: 'CITY_MISSING_IN_REQUIRED_SECTION', severity: 'error', message: `El bloque no menciona la ciudad obligatoria: ${contract.city}.`, blockId: contract.sectionId });
  }

  const nicheHead = String(contract.niche || '').split(/\s+/)[0] || contract.niche;
  if (contract.mustMentionNiche && nicheHead && !includesLoose(text, nicheHead)) {
    issues.push({ code: 'NICHE_MISSING_IN_SECTION', severity: 'warning', message: `El bloque no menciona el servicio/nicho: ${contract.niche}.`, blockId: contract.sectionId });
  }

  const termHits = contract.requiredTerms.filter((term) => includesLoose(text, term));
  if (contract.requiredTerms.length > 0 && termHits.length < Math.min(contract.minTechnicalTerms, contract.requiredTerms.length)) {
    issues.push({
      code: 'LOW_TECHNICAL_SPECIFICITY',
      severity: 'warning',
      message: `Baja especificidad técnica: ${termHits.length}/${contract.minTechnicalTerms} términos del oficio.`,
      evidence: contract.requiredTerms.slice(0, 8),
      blockId: contract.sectionId,
    });
  }

  for (const phrase of contract.forbiddenGenericPhrases) {
    if (includesLoose(text, phrase)) {
      issues.push({ code: 'GENERIC_TEMPLATE_PHRASE', severity: 'warning', message: `Frase genérica detectada: ${phrase}.`, blockId: contract.sectionId });
    }
  }

  if (!contract.ctaAllowed && /\b(llama|ll[aá]menos|contacta|cont[aá]ctanos|pide presupuesto|solicita presupuesto)\b/i.test(text)) {
    issues.push({ code: 'CTA_OUT_OF_PLACE', severity: 'warning', message: 'CTA detectado en una sección no pensada para conversión.', blockId: contract.sectionId });
  }

  return issues;
}

export function repairBlockHtmlSemantics(html: string, contract: SectionQualityContract): string {
  const $ = cheerio.load(html || '', { decodeEntities: false } as any);
  const root = $('body').length ? $('body') : $.root();

  (root.find('*') as any).contents().each((_: number, node: any) => {
    if (node.type !== 'text') return;
    let text = String(node.data || '');
    text = text.replace(/\ben\s+son\b/gi, `en ${contract.city} son`);
    text = text.replace(/\bEn\s*[,.;:]/g, `En ${contract.city},`);
    text = text.replace(/\ben\s*[,.;:]/g, `en ${contract.city},`);
    text = text.replace(/\bes una ciudad con un gran potencial para\s+[^.]+\./gi, `en ${contract.city} requiere una respuesta clara, técnica y adaptada a cada instalación.`);
    text = text.replace(/ahoranos/gi, 'ahora');
    text = text.replace(/cont[aá]ctanosnos/gi, 'contáctanos');
    text = text.replace(/ll[aá]manosnos/gi, 'llámanos');
    text = text.replace(/cons[uú]ltanosnos/gi, 'consúltanos');
    text = text.replace(/\[(?:ciudad|nicho|servicio|empresa|nombre|tel[eé]fono|phone|url|placeholder)[^\]]*\]/gi, contract.city);
    node.data = sanitizeLegalRiskClaims(text, contract.niche).html;
  });

  const currentText = normalizeText(root.text());
  const missingCity = contract.mustMentionCity && contract.city && !includesLoose(currentText, contract.city);
  const missingNiche = contract.mustMentionNiche && contract.niche && !includesLoose(currentText, String(contract.niche).split(/\s+/)[0] || contract.niche);
  const termHits = contract.requiredTerms.filter((term) => includesLoose(currentText, term));
  const needsTerms = contract.requiredTerms.length > 0 && termHits.length < Math.min(contract.minTechnicalTerms, contract.requiredTerms.length);

  if (missingCity || missingNiche || needsTerms) {
    const terms = contract.requiredTerms.slice(0, Math.max(contract.minTechnicalTerms, 2)).join(', ');
    const addition = [
      missingCity ? `En ${contract.city},` : '',
      missingNiche ? `este servicio de ${contract.niche}` : 'el servicio',
      needsTerms && terms ? `se revisa con criterios técnicos como ${terms}` : 'se revisa con criterio técnico',
      'para evitar diagnósticos genéricos y ajustar la solución al caso real.',
    ].filter(Boolean).join(' ');
    root.append(`<p>${escapeHtml(addition)}</p>`);
  }

  return $('body').length ? String($('body').html() || '') : $.html();
}

export function createSemanticFallbackBlock(args: {
  section: unknown;
  contract: SectionQualityContract;
  reason: string;
}): ContentBlock {
  const terms = args.contract.requiredTerms.slice(0, 4);
  const termSentence = terms.length ? ` En la revisión se consideran elementos como ${terms.join(', ')} para evitar soluciones genéricas.` : '';
  const h2 = String(args.section?.h2 || args.contract.h2 || `Servicio de ${args.contract.niche} en ${args.contract.city}`);
  const html = [
    `<section data-fallback="semantic" data-block="${escapeHtml(args.contract.blockType)}">`,
    `<h2>${escapeHtml(h2)}</h2>`,
    `<p>En ${escapeHtml(args.contract.city)}, un servicio de ${escapeHtml(args.contract.niche)} debe partir de un diagnóstico claro, explicar el alcance de la intervención y priorizar una solución segura para el cliente.${escapeHtml(termSentence)}</p>`,
    `<p>Este bloque se ha generado como respaldo controlado porque el contenido inicial no superó las comprobaciones semánticas: ${escapeHtml(args.reason)}.</p>`,
    args.contract.ctaAllowed ? `<p><strong>¿Necesitas una valoración?</strong> Contacta para revisar el caso y recibir una orientación concreta.</p>` : '',
    `</section>`,
  ].join('');

  return {
    id: args.contract.sectionId,
    h2,
    html,
    wordCount: wordCount(html),
    metadata: {
      block_type: args.contract.blockType,
      sectionIndex: 0,
      degraded: true,
      semantic_fallback: true,
      fallback_reason: args.reason,
    },
  };
}

export function guardContentBlock(args: {
  block: ContentBlock;
  contract: SectionQualityContract;
  fallbackSection?: unknown;
}): { block: ContentBlock; issues: SemanticIssue[]; repaired: boolean; fallback: boolean } {
  const initialIssues = validateBlockSemantics(args.block.html, args.contract);
  const hasCritical = initialIssues.some((issue) => issue.severity === 'critical');
  let repairedHtml = repairBlockHtmlSemantics(args.block.html, args.contract);
  let repairedIssues = validateBlockSemantics(repairedHtml, args.contract);

  if (hasCritical && repairedIssues.some((issue) => issue.severity === 'critical')) {
    const fallback = createSemanticFallbackBlock({
      section: args.fallbackSection || { h2: args.block.h2 },
      contract: args.contract,
      reason: repairedIssues.map((issue) => issue.code).join(', '),
    });
    return { block: fallback, issues: initialIssues.concat(repairedIssues), repaired: true, fallback: true };
  }

  const block: ContentBlock = {
    ...args.block,
    html: repairedHtml,
    wordCount: wordCount(repairedHtml),
    metadata: {
      ...args.block.metadata,
      semantic_guard_issues: repairedIssues.map((issue) => issue.code),
      semantic_guard_repaired: repairedHtml !== args.block.html,
    },
  };

  return { block, issues: initialIssues.concat(repairedIssues), repaired: repairedHtml !== args.block.html, fallback: false };
}

export function enforceDraftSemanticCoherence(draft: ContentDraft, context: NormalizedContext, plan?: PagePlan): ContentDraft {
  const sections = plan?.sections || [];
  const blocks = draft.blocks.map((block, index) => {
    const section = sections[index] || sections.find((candidate: any) => candidate.section_id === block.id) || { h2: block.h2, block_type: block.metadata?.block_type || 'content' };
    const contract = buildSectionQualityContract({ section, sectionId: block.id, index, totalSections: draft.blocks.length, context });
    return guardContentBlock({ block, contract, fallbackSection: section }).block;
  });
  return { ...draft, blocks, totalWords: blocks.reduce((acc, block) => acc + (block.wordCount || wordCount(block.html)), 0) };
}

export function validateRenderedSemanticQuality(html: string, args: { city: string; niche: string; canonical?: string; businessName?: string; phone?: string }): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const $ = cheerio.load(html || '');
  const visibleText = normalizeText($('body').text());

  if (!args.city || !includesLoose(visibleText, args.city)) {
    issues.push({ code: 'CITY_MISSING_IN_RENDERED_PAGE', severity: 'critical', message: `La página final no menciona la ciudad esperada: ${args.city}.` });
  }

  const nicheHead = String(args.niche || '').split(/\s+/)[0] || args.niche;
  if (nicheHead && !includesLoose(visibleText, nicheHead)) {
    issues.push({ code: 'NICHE_MISSING_IN_RENDERED_PAGE', severity: 'error', message: `La página final no menciona el nicho esperado: ${args.niche}.` });
  }

  for (const pattern of BROKEN_SPANISH_PATTERNS) {
    if (pattern.re.test(visibleText)) {
      issues.push({ code: pattern.code, severity: 'critical', message: pattern.message });
    }
  }

  const canonical = $('link[rel="canonical"]').attr('href') || args.canonical || '';
  const ogUrl = $('meta[property="og:url"]').attr('content') || '';
  if (!canonical || canonical.trim() === '') issues.push({ code: 'CANONICAL_EMPTY', severity: 'critical', message: 'Canonical vacío o ausente.' });
  if (!ogUrl || ogUrl.trim() === '') issues.push({ code: 'OG_URL_EMPTY', severity: 'error', message: 'og:url vacío o ausente.' });

  const ctaText = $('a, button, .cta, [class*="cta"]').text();
  if (/ahoranos|cont[aá]ctanosnos|ll[aá]manosnos/i.test(ctaText)) {
    issues.push({ code: 'CTA_COPY_CORRUPTED', severity: 'critical', message: 'CTA corrupto en el HTML final.' });
  }

  const usted = /\busted\b|\ble atenderemos\b|\bll[aá]menos\b/i.test(visibleText);
  const tu = /\bt[uú]\b|\bte ayudamos\b|\bll[aá]manos\b|\bcont[aá]ctanos\b/i.test(visibleText);
  if (usted && tu) issues.push({ code: 'TONE_MIX_USTED_TU', severity: 'warning', message: 'Mezcla de trato formal e informal en la página.' });

  return issues;
}

export function repairRenderedSemanticQuality(html: string, args: { city: string; niche: string; canonical?: string; businessName?: string; phone?: string }): string {
  const $ = cheerio.load(html || '', { decodeEntities: false } as any);
  if (!$('html').length) $.root().append('<html><head></head><body></body></html>');
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');

  ($('body *') as any).contents().each((_: number, node: any) => {
    if (node.type !== 'text') return;
    let text = String(node.data || '');
    text = text.replace(/\ben\s+son\b/gi, `en ${args.city} son`);
    text = text.replace(/\bEn\s*[,.;:]/g, `En ${args.city},`);
    text = text.replace(/\ben\s*[,.;:]/g, `en ${args.city},`);
    text = text.replace(/\bes una ciudad con un gran potencial para\s+[^.]+\./gi, `en ${args.city} es clave contar con una respuesta técnica, clara y ajustada al caso real.`);
    text = text.replace(/ahoranos/gi, 'ahora');
    text = text.replace(/cont[aá]ctanosnos/gi, 'contáctanos');
    text = text.replace(/ll[aá]manosnos/gi, 'llámanos');
    text = text.replace(/cons[uú]ltanosnos/gi, 'consúltanos');
    text = text.replace(/\[(?:ciudad|nicho|servicio|empresa|nombre|tel[eé]fono|phone|url|placeholder)[^\]]*\]/gi, args.city);
    node.data = sanitizeLegalRiskClaims(text, args.niche).html;
  });

  const fallbackCanonical = args.canonical || buildFallbackCanonical(args.niche, args.city);
  if (!$('link[rel="canonical"]').length) $('head').append(`<link rel="canonical" href="${escapeAttr(fallbackCanonical)}">`);
  $('link[rel="canonical"]').each((_: number, el: any) => {
    if (!String($(el).attr('href') || '').trim()) $(el).attr('href', fallbackCanonical);
  });

  if (!$('meta[property="og:url"]').length) $('head').append(`<meta property="og:url" content="${escapeAttr(fallbackCanonical)}">`);
  $('meta[property="og:url"]').each((_: number, el: any) => {
    if (!String($(el).attr('content') || '').trim()) $(el).attr('content', fallbackCanonical);
  });

  const visibleText = normalizeText($('body').text());
  if (args.city && !includesLoose(visibleText, args.city)) {
    $('body').prepend(`<p class="sr-only">Servicio de ${escapeHtml(args.niche)} en ${escapeHtml(args.city)}.</p>`);
  }
  if (args.niche && !includesLoose(visibleText, String(args.niche).split(/\s+/)[0] || args.niche)) {
    $('body').prepend(`<p class="sr-only">${escapeHtml(args.niche)} disponibles en ${escapeHtml(args.city)}.</p>`);
  }

  return $.html();
}

export function finalizeRenderedPageSemantics(page: RenderedPage, args: { mission: GenerationMission; pagePlan?: PagePlan; context?: NormalizedContext; canonical?: string }): RenderedPage {
  const city = args.context?.city || args.mission.city;
  const niche = args.context?.niche || args.mission.niche;
  const canonical = args.canonical || (page.metadata?.seo as any)?.canonical || (args.pagePlan?.seoBrief as any)?.canonicalSlug;
  const legalSafeHtml = sanitizeLegalRiskClaims(page.html, niche).html;
  const repairedHtml = repairRenderedSemanticQuality(legalSafeHtml, {
    city,
    niche,
    canonical,
    businessName: args.mission.local_nap?.business_name,
    phone: args.mission.local_nap?.phone,
  });
  const issues = validateRenderedSemanticQuality(repairedHtml, {
    city,
    niche,
    canonical,
    businessName: args.mission.local_nap?.business_name,
    phone: args.mission.local_nap?.phone,
  });
  return {
    ...page,
    html: repairedHtml,
    metadata: {
      ...page.metadata,
      validation_errors: Array.from(new Set([...(page.metadata?.validation_errors || []), ...issues.map((issue) => issue.code)])),
      semantic_guard: {
        passed: !issues.some((issue) => issue.severity === 'critical'),
        issues,
      },
    },
  };
}

export function buildFallbackCanonical(niche: string, city: string): string {
  const slug = `${niche}-${city}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `/${slug}/`;
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
