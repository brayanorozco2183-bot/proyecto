import type { SeoFallbackGroup, SeoFallbackPick, SeoFallbackPickInput, SeoPageType } from './seoFallbackTypes.js';
import { SEO_FALLBACK_GROUPS, SEO_FALLBACK_GROUPS_BY_NICHE } from './seoFallbackSeeds.js';

function normalize(value?: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function pick<T>(items: T[], seed: string, offset = 0): T {
  if (!items.length) throw new Error('Cannot pick from an empty SEO fallback array');
  return items[(hashSeed(seed) + offset) % items.length];
}

function replaceTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => tokens[key] || '');
}

function scoreGroup(group: SeoFallbackGroup, input: SeoFallbackPickInput): number {
  let score = 0;
  const niche = normalize(input.niche);
  const intent = normalize(input.intent);
  const pageType = normalize(input.pageType);
  const service = normalize(input.serviceKeyword);

  if (normalize(group.niche) === niche) score += 100;
  if (intent && normalize(group.intent) === intent) score += 40;
  if (pageType && group.pageTypes.some((pt) => normalize(pt) === pageType)) score += 16;
  if (service && group.serviceKeywords.some((kw) => normalize(kw).includes(service) || service.includes(normalize(kw)))) score += 12;
  return score;
}

export function getSeoFallbackGroups(niche?: string): SeoFallbackGroup[] {
  const key = normalize(niche);
  if (!key) return SEO_FALLBACK_GROUPS;
  return SEO_FALLBACK_GROUPS_BY_NICHE[key] || SEO_FALLBACK_GROUPS.filter((group) => normalize(group.niche).includes(key));
}

export function findSeoFallbackGroup(input: SeoFallbackPickInput): SeoFallbackGroup {
  const scoped = getSeoFallbackGroups(input.niche);
  const candidates = scoped.length ? scoped : SEO_FALLBACK_GROUPS;
  const seed = `${input.niche || 'generic'}|${input.city || ''}|${input.neighborhood || ''}|${input.intent || ''}|${input.pageType || ''}|${input.seedHint || ''}`;

  return [...candidates]
    .sort((a, b) => {
      const delta = scoreGroup(b, input) - scoreGroup(a, input);
      if (delta !== 0) return delta;
      return (hashSeed(`${seed}|${a.groupId}`) % 997) - (hashSeed(`${seed}|${b.groupId}`) % 997);
    })[0];
}

export function pickSeoFallback(input: SeoFallbackPickInput = {}): SeoFallbackPick {
  const group = findSeoFallbackGroup(input);
  const seed = `${group.groupId}|${input.city || ''}|${input.neighborhood || ''}|${input.serviceKeyword || ''}|${input.seedHint || ''}`;
  const serviceKeyword = input.serviceKeyword || pick(group.serviceKeywords, seed, 1);
  const trustPhrase = pick(group.trustPhrases, seed, 2);
  const localAngle = pick(group.localAngles, seed, 3);
  const customerType = pick(group.customerTypes, seed, 4);
  const city = input.city || 'tu zona';
  const neighborhood = input.neighborhood || localAngle;
  const longTailKeyword = replaceTokens(pick(group.longTailKeywords, seed, 5), { city, neighborhood, service_keyword: serviceKeyword, trust_phrase: trustPhrase, local_angle: localAngle, customer_type: customerType });

  const tokens: Record<string, string> = {
    city,
    neighborhood,
    service_keyword: serviceKeyword,
    trust_phrase: trustPhrase,
    local_angle: localAngle,
    customer_type: customerType,
    long_tail_keyword: longTailKeyword,
  };

  const faqQuestion = pick(group.faqSeeds, seed, 9);
  const faqAnswer = pick(group.faqSeeds, seed, 10);

  return {
    group,
    title: replaceTokens(pick(group.titles, seed, 6), tokens).replace(/\s+/g, ' ').trim(),
    metaDescription: replaceTokens(pick(group.metaDescriptions, seed, 7), tokens).replace(/\s+/g, ' ').trim(),
    h1: replaceTokens(pick(group.h1s, seed, 8), tokens).replace(/\s+/g, ' ').trim(),
    serviceKeyword,
    longTailKeyword,
    trustPhrase,
    localAngle,
    customerType,
    faq: {
      question: replaceTokens(faqQuestion.question, tokens).replace(/\s+/g, ' ').trim(),
      answerAngle: replaceTokens(faqAnswer.answerAngle, tokens).replace(/\s+/g, ' ').trim(),
    },
    cta: replaceTokens(pick(group.ctas, seed, 11), tokens).replace(/\s+/g, ' ').trim(),
    avoidClaims: group.avoidClaims,
    schemaType: group.schemaType,
    tokens,
  };
}

export function buildSeoMetaFallback(input: SeoFallbackPickInput = {}): {
  title: string;
  description: string;
  h1: string;
  schemaType: string;
  keywords: string[];
  faq: { question: string; answerAngle: string };
  cta: string;
  avoidClaims: string[];
  groupId: string;
} {
  const picked = pickSeoFallback(input);
  return {
    title: picked.title,
    description: picked.metaDescription,
    h1: picked.h1,
    schemaType: picked.schemaType,
    keywords: Array.from(new Set([picked.serviceKeyword, picked.longTailKeyword, ...picked.group.serviceKeywords.slice(0, 4)])),
    faq: picked.faq,
    cta: picked.cta,
    avoidClaims: picked.avoidClaims,
    groupId: picked.group.groupId,
  };
}

export function inferSeoPageType(pageType?: string): SeoPageType {
  const value = normalize(pageType);
  if (value.includes('neighborhood') || value.includes('barrio')) return 'neighborhood';
  if (value.includes('service')) return 'service-city';
  if (value.includes('city') || value.includes('ciudad')) return 'city';
  return 'generic';
}
