import * as cheerio from 'cheerio';
import { MissionLike, OriginalitySnapshot, PagePlanLike, StructuralFingerprint } from './types.js';
import { deriveOriginalityScopes, deriveServiceKey } from './clusterScope.js';

function unique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean as any))];
}

export function normalizeText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function firstWordsSignature(input: string, words = 6): string {
  const normalized = normalizeText(input);
  if (!normalized) return '';
  return normalized.split(' ').slice(0, words).join(' ');
}

export function simpleHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export function serializeSignature(parts: Array<string | undefined | null>): string {
  return simpleHash(parts.filter(Boolean).join(' || '));
}

export function buildStructuralFingerprint(pagePlan: PagePlanLike): StructuralFingerprint {
  const ordered = pagePlan.layoutContract?.orderedSectionIds || [];
  return {
    hero: pagePlan.layoutContract?.heroTemplate || pagePlan.design?.dna?.heroTreatment || 'split',
    order: ordered,
    shells: ordered.map(id => pagePlan.layoutContract?.sections?.[id]?.shell || 'plain'),
    cadence: pagePlan.layoutContract?.cadencePattern || pagePlan.design?.dna?.sectionCadence || 'alternating',
    density: pagePlan.design?.dna?.seed?.densityProfile || 'standard',
    composition: pagePlan.layoutContract?.pageComposition || 'conversion',
    patterns: ordered.map(id => pagePlan.layoutContract?.sections?.[id]?.pattern || 'none')
  };
}

export function getBlockSequence(pagePlan: PagePlanLike): string[] {
  const byId = pagePlan.layoutContract?.sections || {};
  const ordered = pagePlan.layoutContract?.orderedSectionIds || [];

  if (ordered.length > 0) {
    return ordered.map(id => byId[id]?.blockType || byId[id]?.block_type || id);
  }

  return (pagePlan.sections || []).map(section => section.block_type || section.section_id || 'unknown');
}

export function getBlockVariants(pagePlan: PagePlanLike): string[] {
  const byId = pagePlan.layoutContract?.sections || {};
  const ordered = pagePlan.layoutContract?.orderedSectionIds || [];

  if (ordered.length > 0) {
    return ordered.map(id => byId[id]?.visualVariant || byId[id]?.visual_variant || 'default');
  }

  return (pagePlan.sections || []).map(section => section.visual_variant || 'default');
}

export function getH2OpeningsFromPlan(pagePlan: PagePlanLike): string[] {
  return unique((pagePlan.sections || []).map(section => firstWordsSignature(section.h2 || '', 6)).filter(Boolean));
}

export function getFaqOpeningsFromPlan(pagePlan: PagePlanLike): string[] {
  const faqSection = (pagePlan.sections || []).find(section => section.block_type === 'faq');
  const h3s = faqSection?.h3s || [];
  return unique(h3s.map(item => firstWordsSignature(item, 6)).filter(Boolean));
}

export function getLocalProofOpeningsFromPlan(pagePlan: PagePlanLike): string[] {
  const localSection = (pagePlan.sections || []).find(section => section.block_type === 'local_proof');
  const h3s = localSection?.h3s || [];
  return unique(h3s.map(item => firstWordsSignature(item, 5)).filter(Boolean));
}

export function getHeroSignatureFromPlan(pagePlan: PagePlanLike): string {
  const hero = pagePlan.hero || {};
  return serializeSignature([
    pagePlan.layoutContract?.heroTemplate || pagePlan.design?.dna?.heroTreatment || 'split',
    firstWordsSignature(hero.h1 || pagePlan.h1 || '', 6),
    firstWordsSignature(hero.subtitle || '', 7),
    firstWordsSignature(hero.cta_text || '', 4),
    hero.visual_intent || ''
  ]);
}

export function getNavPatternSignatureFromPlan(pagePlan: PagePlanLike): string {
  const sections = getBlockSequence(pagePlan);
  return serializeSignature(sections.slice(0, 6));
}

export function getCtaPatternSignatureFromPlan(pagePlan: PagePlanLike): string {
  const ctaSection = [...(pagePlan.sections || [])].reverse().find(section => /cta/.test(section.block_type || ''));
  return serializeSignature([
    ctaSection?.block_type || 'none',
    firstWordsSignature(ctaSection?.h2 || '', 5),
    pagePlan.design?.dna?.heroTreatment || ''
  ]);
}

export function getFaqStructureSignatureFromPlan(pagePlan: PagePlanLike): string {
  const faqSection = (pagePlan.sections || []).find(section => section.block_type === 'faq');
  return serializeSignature([
    String((faqSection?.h3s || []).length),
    ...(faqSection?.h3s || []).map(item => firstWordsSignature(item, 4))
  ]);
}

export function getParagraphSignaturesFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const paragraphs = $('p')
    .map((_, el) => normalizeText($(el).text().trim()))
    .get()
    .filter(Boolean)
    .filter(item => item.length >= 80)
    .filter(item => item.split(/\s+/).length >= 12)
    .filter(item => !/^(rutas relacionadas dentro del mismo entorno|estas rutas pertenecen al mismo cluster|cobertura operativa en|presupuesto claro antes de intervenir)/i.test(item));

  return unique(paragraphs.map(item => firstWordsSignature(item, 10)).filter(Boolean)).slice(0, 24);
}

export function getH2OpeningsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const items = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  return unique(items.map(item => firstWordsSignature(item, 6)).filter(Boolean));
}

export function getFaqOpeningsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const faqQuestions = $('section#faq h3, .faq h3, .faq-question').map((_, el) => $(el).text().trim()).get();
  return unique(faqQuestions.map(item => firstWordsSignature(item, 6)).filter(Boolean));
}

export function getLocalProofOpeningsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const localSection = $('section#zonas, section#areas, section').filter((_, el) => {
    const text = normalizeText($(el).find('h2').first().text());
    return text.includes('zona') || text.includes('barrio') || text.includes('cobertura');
  }).first();

  const items = localSection.find('h3').map((_, el) => $(el).text().trim()).get();
  return unique(items.map(item => firstWordsSignature(item, 5)).filter(Boolean));
}

export function getNavPatternSignatureFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const navLinks = $('.nav__link, nav a[href^="#"]').map((_, el) => $(el).text().trim()).get();
  return serializeSignature(navLinks.map(item => firstWordsSignature(item, 3)));
}

export function getCtaPatternSignatureFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const cta = $('.cta-panel, section#contacto, [data-block-type="cta_panel"]').last();
  const heading = cta.find('h2, h3').first().text().trim();
  const button = cta.find('a, button').first().text().trim();
  return serializeSignature([firstWordsSignature(heading, 5), firstWordsSignature(button, 4)]);
}

export function getFaqStructureSignatureFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const questions = $('section#faq h3, .faq h3, .faq-question').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  return serializeSignature([String(questions.length), ...questions.map(item => firstWordsSignature(item, 4))]);
}

export function buildSnapshotFromPlan(input: {
  pagePlan: PagePlanLike;
  mission: MissionLike;
  pageId?: string;
}): OriginalitySnapshot {
  const { pagePlan, mission } = input;
  const pageId = input.pageId || `${mission.city}::${mission.niche}::${pagePlan.intentModel?.pageType || 'service'}`;
  const scopes = deriveOriginalityScopes(mission, pagePlan);
  const blockSequence = getBlockSequence(pagePlan);
  const blockVariants = getBlockVariants(pagePlan);

  return {
    pageId,
    scopes,
    pageType: pagePlan.intentModel?.pageType || 'service',
    funnelStage: pagePlan.intentModel?.funnelStage,
    city: mission.city,
    niche: mission.niche,
    serviceKey: deriveServiceKey(mission.niche, mission),
    heroSignature: getHeroSignatureFromPlan(pagePlan),
    blockSequence,
    blockVariants,
    blockSequenceSignature: serializeSignature(blockSequence),
    blockVariantsSignature: serializeSignature(blockVariants),
    navPatternSignature: getNavPatternSignatureFromPlan(pagePlan),
    ctaPatternSignature: getCtaPatternSignatureFromPlan(pagePlan),
    h2Openings: getH2OpeningsFromPlan(pagePlan),
    faqOpenings: getFaqOpeningsFromPlan(pagePlan),
    localProofOpenings: getLocalProofOpeningsFromPlan(pagePlan),
    paragraphSignatures: [],
    faqStructureSignature: getFaqStructureSignatureFromPlan(pagePlan),
    structural: buildStructuralFingerprint(pagePlan)
  };
}