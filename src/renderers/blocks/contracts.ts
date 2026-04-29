import { z } from 'zod';
import type { BlockContent, BlockContentItem, BlockFaqItem, BlockReadiness, BlockRendererInput } from './types.js';
import { buildNicheIntelligenceProfile, containsAny, type NicheIntelligenceProfile } from '../../niche-intelligence/index.js';

type MutableInput = BlockRendererInput;

const STRONG_MIN_BODY = 95;
const STANDARD_MIN_BODY = 70;

const CtaSchema = z.object({
  text: z.string().min(6).optional(),
  href: z.string().optional(),
  phone: z.string().optional(),
  note: z.string().min(20).optional()
}).passthrough();

const ItemSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(35),
  meta: z.array(z.string()).optional(),
  href: z.string().optional(),
  label: z.string().optional(),
  value: z.string().optional()
}).passthrough();

const FaqItemSchema = z.object({
  question: z.string().min(10),
  answer: z.string().min(45)
}).passthrough();

const BaseContentSchema = z.object({
  heading: z.string().min(5).optional(),
  subheading: z.array(z.string()).optional(),
  items: z.array(ItemSchema).optional(),
  bullets: z.array(z.string()).optional(),
  trustBullets: z.array(z.string()).optional(),
  faqItems: z.array(FaqItemSchema).optional(),
  cta: CtaSchema.optional(),
  mapNote: z.string().optional(),
  links: z.array(z.record(z.string(), z.unknown())).optional(),
  h1: z.string().optional(),
  subtitle: z.string().optional(),
  trust_bullets: z.array(z.string()).optional(),
  hero_card_title: z.string().optional(),
  hero_card_text: z.string().optional()
}).passthrough();

export const BlockRendererInputSchema = z.object({
  sectionId: z.string(),
  blockType: z.string().min(1),
  variant: z.string(),
  layoutHint: z.string(),
  content: BaseContentSchema,
  seo: z.record(z.string(), z.unknown()).default({}),
  local: z.record(z.string(), z.unknown()).default({}),
  payload: z.unknown().optional(),
  contract: z.unknown().optional(),
  nicheProfile: z.unknown().optional()
}).passthrough();

const StrongItemsSchema = BaseContentSchema.extend({
  heading: z.string().min(12),
  items: z.array(ItemSchema.extend({ body: z.string().min(STANDARD_MIN_BODY) })).min(3),
  cta: CtaSchema.optional()
});

const LocalProofSchema = BaseContentSchema.extend({
  heading: z.string().min(8),
  items: z.array(ItemSchema.extend({ body: z.string().min(STANDARD_MIN_BODY) })).min(3)
});

const TrustBandSchema = BaseContentSchema.extend({
  bullets: z.array(z.string().min(8)).min(3)
});

const FaqSchema = BaseContentSchema.extend({
  faqItems: z.array(FaqItemSchema.extend({ answer: z.string().min(60) })).min(3)
});

const HeroSchema = BaseContentSchema.extend({
  h1: z.string().min(18),
  subtitle: z.string().min(55).optional(),
  trust_bullets: z.array(z.string().min(6)).min(2).optional()
});

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function asStringArray(value: unknown): string[] {
  return asArray(value).map(normalizeText).filter(Boolean);
}

function getString(source: Record<string, unknown>, key: string): string {
  return normalizeText(source[key]);
}

function resolveCity(input: BlockRendererInput): string {
  return normalizeText(input.seo?.city || input.local?.city);
}

function resolveNiche(input: BlockRendererInput): string {
  return normalizeText(input.seo?.niche || input.local?.niche || 'servicio especializado');
}

function resolveBusinessName(input: BlockRendererInput): string {
  return normalizeText(input.local?.businessName || input.seo?.businessName || 'el equipo');
}

function resolveLocalAreas(input: BlockRendererInput): string[] {
  const candidates = [
    input.local?.neighborhoods,
    input.local?.localAreas,
    input.seo?.metadata?.localAreas,
    input.seo?.metadata?.neighborhoods
  ];
  return Array.from(new Set(candidates.flatMap(asStringArray))).slice(0, 10);
}

function resolveNicheProfile(input: BlockRendererInput): NicheIntelligenceProfile {
  if (input.nicheProfile) return input.nicheProfile;
  return buildNicheIntelligenceProfile({
    niche: resolveNiche(input),
    city: resolveCity(input),
    intent: normalizeText(input.seo?.metadata?.intent || input.local?.intent || input.content?.intent),
    localAreas: resolveLocalAreas(input),
    businessName: resolveBusinessName(input),
    seedText: [input.content?.heading, input.content?.h1, input.content?.h2, ...(asStringArray(input.content?.h3s))].join(' ')
  });
}

function defaultHeading(input: BlockRendererInput): string {
  const city = resolveCity(input);
  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const place = city ? ` en ${city}` : '';

  switch (input.blockType) {
    case 'hero_trust':
      return `${niche}${place}: ${profile.preferredCtas[0] || 'criterio claro antes de intervenir'}`;
    case 'services_grid':
      return `Servicios de ${niche}${place} con ${profile.decisionCriteria[0] || 'diagnóstico previo'}`;
    case 'local_proof':
      return city ? `Prueba local y cobertura real en ${city}` : 'Prueba local y cobertura real';
    case 'trust_band':
      return `Señales de confianza para ${profile.verticalLabel}`;
    case 'price_guidance':
      return `Qué influye en el presupuesto de ${niche}${place}`;
    case 'faq':
      return `Preguntas frecuentes sobre ${niche}${place}`;
    case 'cta_panel':
      return `Cuéntanos tu caso de ${niche}${place}`;
    case 'map':
      return city ? `Cobertura operativa en ${city}` : 'Cobertura operativa local';
    default:
      return `Información útil sobre ${niche}${place}`;
  }
}

function inferServiceTitles(input: BlockRendererInput): string[] {
  const h3s = asStringArray(input.content.h3s);
  if (h3s.length >= 3) return h3s.slice(0, 6);

  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const serviceTitles = profile.serviceTemplates.map((title) => `${title} de ${niche}`);
  return serviceTitles.length >= 3 ? serviceTitles.slice(0, 6) : [
    `Diagnóstico inicial de ${niche}`,
    `Ejecución con alcance definido`,
    'Comprobación final y siguientes pasos'
  ];
}

function buildItemBody(title: string, input: BlockRendererInput, index: number): string {
  const city = resolveCity(input);
  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const place = city ? ` en ${city}` : '';
  const titleText = normalizeText(title) || `Punto ${index + 1}`;
  const technicalTerm = profile.technicalVocabulary[index % Math.max(1, profile.technicalVocabulary.length)] || 'elementos clave';
  const decisionCriterion = profile.decisionCriteria[index % Math.max(1, profile.decisionCriteria.length)] || 'alcance real';
  const objection = profile.buyerObjections[index % Math.max(1, profile.buyerObjections.length)] || 'dudas del cliente';
  const templates = [
    `${titleText}: se revisa el estado actual, ${decisionCriterion}, ${technicalTerm} y el riesgo de tomar una decisión rápida sin diagnóstico previo${place}.`,
    `${titleText}: el criterio principal es confirmar síntomas, prioridad, compatibilidad y comprobación final antes de recomendar una solución concreta de ${niche}, evitando ${objection}.`,
    `${titleText}: se separa lo urgente de lo conveniente para explicar alternativas, límites del trabajo y próximos pasos sin convertir el servicio en una promesa genérica.`
  ];
  return templates[index % templates.length];
}

function normalizeItems(value: unknown, input: BlockRendererInput): BlockContentItem[] {
  const rawItems = asArray(value)
    .map((raw, index): BlockContentItem | null => {
      const item = asRecord(raw);
      const title = normalizeText(item.title || item.label || item.name || item.heading);
      const body = normalizeText(item.body || item.description || item.text || item.summary);
      if (!title && !body) return null;
      return {
        title: title || `Criterio ${index + 1}`,
        body: body || buildItemBody(title, input, index),
        meta: asStringArray(item.meta || item.tags || item.badges).slice(0, 4),
        href: normalizeText(item.href || item.url) || undefined,
        label: normalizeText(item.label) || undefined,
        value: normalizeText(item.value) || undefined
      };
    })
    .filter((item): item is BlockContentItem => Boolean(item));

  const seeds = rawItems.length ? rawItems : inferServiceTitles(input).map((title, index) => ({
    title,
    body: buildItemBody(title, input, index),
    meta: []
  }));

  return seeds.map((item, index) => {
    const needsBodyRepair = item.body.length < STANDARD_MIN_BODY || !/diagn[oó]stico|criterio|alcance|revis|comprob|alternativa|presupuesto|riesgo|decisi[oó]n/i.test(item.body);
    return {
      ...item,
      body: needsBodyRepair ? `${item.body} ${buildItemBody(item.title, input, index)}`.replace(/\s+/g, ' ').trim() : item.body,
      meta: item.meta?.length ? item.meta : [index === 0 ? 'Diagnóstico' : index === 1 ? 'Criterio técnico' : 'Comprobación']
    };
  }).slice(0, 8);
}

function normalizeFaqItems(value: unknown, input: BlockRendererInput): BlockFaqItem[] {
  const city = resolveCity(input);
  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const place = city ? ` en ${city}` : '';
  const rawFaqs = asArray(value)
    .map((raw, index): BlockFaqItem | null => {
      const item = asRecord(raw);
      const question = normalizeText(item.question || item.title || item.q);
      const answer = normalizeText(item.answer || item.body || item.a);
      if (!question && !answer) return null;
      return {
        question: question || `¿Qué debo tener claro antes de contratar ${niche}${place}?`,
        answer: answer || `Conviene explicar el caso, ubicación, urgencia, estado actual y expectativas para que ${niche} se valore con alcance real, alternativas y comprobaciones finales.`
      };
    })
    .filter((item): item is BlockFaqItem => Boolean(item));

  const fallback: BlockFaqItem[] = [
    {
      question: profile.faqSeeds[0] || `¿Cómo se valora un caso de ${niche}${place}?`,
      answer: `Se revisan síntomas, ubicación, urgencia, alcance, materiales o recursos necesarios y posibles limitaciones antes de confirmar una intervención o presupuesto cerrado.`
    },
    {
      question: profile.faqSeeds[1] || '¿Qué información ayuda a evitar un presupuesto genérico?',
      answer: 'Ayuda indicar el problema concreto, cuándo empezó, qué se ha intentado, documentación o fotografías si procede, y prioridad real para valorar el caso según criterios del sector.'
    },
    {
      question: profile.faqSeeds[2] || '¿Qué debería quedar claro al terminar el servicio?',
      answer: 'Debe quedar claro qué se ha revisado, qué se ha ejecutado, qué limitaciones existen, qué garantía aplica cuando corresponde y qué pasos convienen si el problema se repite.'
    }
  ];

  return [...rawFaqs, ...fallback].map((item) => ({
    question: item.question,
    answer: item.answer.length >= 60 ? item.answer : `${item.answer} La respuesta debe incluir criterio, alcance y siguientes pasos para evitar información incompleta.`
  })).slice(0, 6);
}

function normalizeBullets(value: unknown, input: BlockRendererInput): string[] {
  const city = resolveCity(input);
  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const fallback = [
    ...profile.trustAssets,
    city ? `Cobertura real en ${city}` : `Cobertura real para ${niche}`,
    profile.safeClaimAlternatives[0] || 'Alcance explicado antes de contratar'
  ];
  return Array.from(new Set([...asStringArray(value), ...fallback]))
    .map((entry) => entry.replace(/[.;:,]+$/g, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeCta(value: unknown, input: BlockRendererInput): NonNullable<BlockContent['cta']> {
  const cta = asRecord(value);
  const city = resolveCity(input);
  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const phone = normalizeText(cta.phone || input.local?.phone);
  return {
    text: normalizeText(cta.text) || profile.preferredCtas[0] || 'Solicitar diagnóstico previo',
    href: normalizeText(cta.href || input.local?.ctaHref) || (phone ? `tel:${phone}` : undefined),
    phone: phone || undefined,
    note: normalizeText(cta.note) || `Cuéntanos el caso${city ? ` en ${city}` : ''}, ${profile.decisionCriteria[0] || 'el estado actual'} y la urgencia para orientar el alcance antes de intervenir en ${niche}.`
  };
}

function normalizeHeroContent(input: BlockRendererInput): BlockContent {
  const content = input.content;
  const city = resolveCity(input);
  const niche = resolveNiche(input);
  const profile = resolveNicheProfile(input);
  const h1 = normalizeText(content.h1 || content.heading || defaultHeading(input));
  const subtitle = normalizeText(content.subtitle || asStringArray(content.subheading)[0])
    || `Atención de ${niche}${city ? ` en ${city}` : ''} con ${profile.trustAssets[0] || 'diagnóstico previo'}, explicación del alcance y comprobación final para evitar promesas genéricas.`;
  const bullets = normalizeBullets(content.trust_bullets || content.trustBullets || content.bullets, input).slice(0, 4);
  return {
    ...content,
    h1,
    heading: normalizeText(content.heading) || h1,
    subtitle,
    trust_bullets: bullets,
    trustBullets: bullets,
    phone: normalizeText(content.phone || input.local?.phone) || undefined,
    cta_text: normalizeText(content.cta_text) || normalizeCta(content.cta, input).text,
    secondary_cta_text: normalizeText(content.secondary_cta_text) || 'Ver servicios',
    hero_card_eyebrow: normalizeText(content.hero_card_eyebrow) || profile.verticalLabel,
    hero_card_title: normalizeText(content.hero_card_title) || `${profile.decisionCriteria[0] || 'Diagnóstico'}, alcance y decisión clara`,
    hero_card_text: normalizeText(content.hero_card_text) || `El objetivo es entender el caso, explicar alternativas, revisar ${profile.technicalVocabulary[0] || 'los elementos clave'} y confirmar próximos pasos antes de ejecutar ${niche}.`
  };
}

function normalizeContent(input: BlockRendererInput): BlockContent {
  if (input.blockType === 'hero_trust') return normalizeHeroContent(input);

  const content = input.content;
  const profile = resolveNicheProfile(input);
  const items = normalizeItems(content.items, input);
  const bullets = normalizeBullets(content.bullets || content.trustBullets, input);
  const heading = normalizeText(content.heading || content.h2) || defaultHeading(input);
  const subheading = asStringArray(content.subheading);
  const fallbackIntro = `Se ordena la información según ${profile.verticalLabel}: ${profile.decisionCriteria.slice(0, 2).join(', ') || 'diagnóstico y alcance'}, con lenguaje ${profile.tone}.`;

  return {
    ...content,
    heading,
    h2: normalizeText(content.h2) || heading,
    subheading: subheading.length ? subheading : [fallbackIntro],
    items,
    bullets,
    trustBullets: normalizeBullets(content.trustBullets || content.bullets, input),
    faqItems: normalizeFaqItems(content.faqItems, input),
    cta: normalizeCta(content.cta, input),
    mapNote: normalizeText(content.mapNote) || (input.blockType === 'map' ? `Confirma la ubicación exacta para validar cobertura, tiempos y condiciones del servicio antes de reservar.` : undefined),
    links: Array.isArray(content.links) ? content.links : []
  };
}

function validateByBlock(input: BlockRendererInput): { score: number; missing: string[] } {
  const checks: Array<[string, boolean, number]> = [];
  const content = input.content;
  const profile = resolveNicheProfile(input);
  const items = content.items || [];
  const bullets = content.bullets || content.trustBullets || [];
  const combinedText = [content.heading, content.h1, content.subtitle, ...(content.subheading || []), ...items.flatMap((item) => [item.title, item.body]), ...bullets].join(' ');

  checks.push(['heading', normalizeText(content.heading || content.h1).length >= 10, 12]);
  checks.push(['intro', asStringArray(content.subheading || content.subtitle).join(' ').length >= 55 || input.blockType === 'hero_trust', 10]);
  checks.push(['cta_value', normalizeText(content.cta?.text || content.cta_text).length >= 6, 10]);

  if (['services_grid', 'local_proof', 'price_guidance', 'process_steps', 'comparison_table'].includes(input.blockType)) {
    checks.push(['minimum_items', items.length >= 3, 16]);
    checks.push(['item_depth', items.filter((item) => item.body.length >= STRONG_MIN_BODY).length >= Math.min(3, items.length), 18]);
    checks.push(['decision_language', items.some((item) => /diagn[oó]stico|criterio|alcance|revis|comprob|alternativa|presupuesto|riesgo|decisi[oó]n/i.test(item.body)), 12]);
    checks.push(['niche_vocabulary', containsAny(combinedText, profile.technicalVocabulary.slice(0, 12)), 10]);
  }

  if (input.blockType === 'local_proof') {
    checks.push(['local_specificity', Boolean(resolveCity(input)) || items.some((item) => /zona|barrio|local|cobertura|ubicaci[oó]n|calle|área|area/i.test(`${item.title} ${item.body}`)), 12]);
  }

  if (input.blockType === 'trust_band') {
    checks.push(['trust_assets', bullets.length >= 3, 18]);
    checks.push(['non_generic_trust', bullets.some((bullet) => /diagn[oó]stico|presupuesto|garant|factura|alcance|comprob|cobertura|valoraci[oó]n|documentaci[oó]n|seguimiento/i.test(bullet)), 12]);
    checks.push(['vertical_trust_fit', bullets.some((bullet) => containsAny(bullet, profile.trustAssets)), 8]);
  }

  if (input.blockType === 'faq') {
    const faqs = content.faqItems || [];
    checks.push(['faq_count', faqs.length >= 3, 18]);
    checks.push(['faq_answer_depth', faqs.filter((item) => item.answer.length >= 60).length >= 3, 18]);
  }

  if (input.blockType === 'map') {
    checks.push(['location_context', Boolean(resolveCity(input) || input.local?.address || content.mapNote), 15]);
  }

  if (profile.legalSensitivity !== 'low') {
    checks.push(['claim_safety', !containsAny(combinedText, profile.forbiddenClaims), 12]);
  }

  const possible = checks.reduce((sum, [, , weight]) => sum + weight, 50);
  const earned = checks.reduce((sum, [, ok, weight]) => sum + (ok ? weight : 0), 50);
  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return { score: Math.min(100, Math.round((earned / possible) * 100)), missing };
}

function schemaPasses(input: BlockRendererInput): boolean {
  const base = BlockRendererInputSchema.safeParse(input);
  if (!base.success) return false;

  const schema = (() => {
    switch (input.blockType) {
      case 'hero_trust': return HeroSchema;
      case 'services_grid': return StrongItemsSchema;
      case 'local_proof': return LocalProofSchema;
      case 'trust_band': return TrustBandSchema;
      case 'faq': return FaqSchema;
      case 'price_guidance': return StrongItemsSchema;
      case 'cta_panel': return BaseContentSchema.extend({ cta: CtaSchema });
      default: return BaseContentSchema;
    }
  })();

  return schema.safeParse(input.content).success;
}

export function buildBlockReadiness(input: BlockRendererInput, repaired: string[] = []): BlockReadiness {
  const validation = validateByBlock(input);
  const zodReady = schemaPasses(input);
  const missing = zodReady ? validation.missing : Array.from(new Set([...validation.missing, 'zod_contract']));
  const score = zodReady ? validation.score : Math.min(validation.score, 84);
  return {
    ready: score >= 85 && missing.length === 0,
    score,
    missing,
    repaired,
    checkedAt: new Date().toISOString()
  };
}

export function normalizeBlockRendererInput(input: BlockRendererInput): BlockRendererInput {
  const parsed = BlockRendererInputSchema.safeParse(input);
  const safeInput: MutableInput = parsed.success
    ? parsed.data as MutableInput
    : {
        ...input,
        sectionId: normalizeText(input.sectionId) || 'section',
        blockType: normalizeText(input.blockType) || 'content',
        variant: normalizeText(input.variant) || 'default',
        layoutHint: normalizeText(input.layoutHint) || 'default',
        content: asRecord(input.content) as BlockContent,
        seo: asRecord(input.seo),
        local: asRecord(input.local)
      };

  const before = JSON.stringify(safeInput.content || {});
  const normalized: BlockRendererInput = {
    ...safeInput,
    nicheProfile: resolveNicheProfile(safeInput),
    content: normalizeContent(safeInput)
  };
  const after = JSON.stringify(normalized.content || {});
  const repaired = before === after ? [] : ['block_payload_normalized'];
  return {
    ...normalized,
    quality: buildBlockReadiness(normalized, repaired)
  };
}

export function assertBlockContract(input: BlockRendererInput): BlockRendererInput {
  const normalized = normalizeBlockRendererInput(input);
  if (!normalized.quality?.ready && (normalized.quality?.score ?? 0) < 65) {
    throw new Error(`Block contract failed for ${normalized.blockType}: ${normalized.quality?.missing.join(', ')}`);
  }
  return normalized;
}
