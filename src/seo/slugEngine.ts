import type { CanonicalBuildResult, PageIdentity, PageType, SearchIntent } from './types.js';

const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'en', 'para', 'por', 'y', 'con', 'sin',
  'una', 'un', 'unos', 'unas', 'servicio', 'servicios', 'guia', 'guía', 'urgencia',
  'urgencias', 'faq', 'preguntas', 'frecuentes', 'comparativa', 'comparativas'
]);

function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifySegment(value: string): string {
  return normalizeText(value)
    .replace(/[\s/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripCityFromKeyword(keyword: string, city: string): string {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedCity = normalizeText(city);
  if (!normalizedCity) return normalizedKeyword;
  return normalizedKeyword
    .replace(new RegExp(`\\b${normalizedCity.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactIntentPhrase(value: string): string {
  const pieces = normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOPWORDS.has(token));

  return pieces.join(' ');
}

function resolvePageType(pagePlan: any, mission: any): PageType {
  return (
    pagePlan?.intentModel?.pageType ||
    mission?.contextual_data?.pageType ||
    pagePlan?.pageType ||
    'service'
  ) as PageType;
}

function resolveIntent(pagePlan: any, mission: any): SearchIntent {
  return (
    pagePlan?.intentModel?.primaryIntent ||
    mission?.contextual_data?.primaryIntent ||
    'transactional'
  ) as SearchIntent;
}

function inferPrimaryKeyword(pagePlan: any, mission: any): string {
  return (
    pagePlan?.intentModel?.primaryKeyword ||
    mission?.contextual_data?.primaryKeyword ||
    mission?.niche ||
    pagePlan?.h1 ||
    ''
  );
}

function inferServiceSlug(pagePlan: any, mission: any, city: string): string {
  const candidate = compactIntentPhrase(
    stripCityFromKeyword(
      inferPrimaryKeyword(pagePlan, mission) || mission?.niche || pagePlan?.h1 || '',
      city,
    ),
  );

  const fallback = compactIntentPhrase(mission?.niche || pagePlan?.intentModel?.primaryKeyword || 'servicio');
  return slugifySegment(candidate || fallback || 'servicio');
}

function inferZoneSlug(pagePlan: any, mission: any): string | undefined {
  const candidates = [
    mission?.contextual_data?.zone,
    mission?.contextual_data?.serviceArea,
    pagePlan?.seoBrief?.localModifiers?.find((item: string) => item && item !== mission?.city),
    pagePlan?.zone,
  ].filter(Boolean);

  const value = candidates[0];
  return value ? slugifySegment(String(value)) : undefined;
}

function inferTopicSlug(pagePlan: any, mission: any, city: string): string | undefined {
  const candidates = [
    mission?.contextual_data?.guideTopic,
    mission?.contextual_data?.topic,
    pagePlan?.guideTopic,
    stripCityFromKeyword(inferPrimaryKeyword(pagePlan, mission), city),
  ].filter(Boolean);

  const value = compactIntentPhrase(String(candidates[0] || ''));
  return value ? slugifySegment(value) : undefined;
}

function inferCluster(pagePlan: any, mission: any): string {
  return slugifySegment(
    mission?.cluster_folder_name ||
      mission?.clusterFolderName ||
      mission?.city ||
      pagePlan?.intentModel?.pageType ||
      'default',
  );
}

export function buildPageIdentity(pagePlan: any, mission: any): PageIdentity {
  const city = mission?.city || pagePlan?.city || 'madrid';
  const pageType = resolvePageType(pagePlan, mission);
  const identity: PageIdentity = {
    pageType,
    intent: resolveIntent(pagePlan, mission),
    primaryKeyword: inferPrimaryKeyword(pagePlan, mission),
    city,
    serviceSlug: inferServiceSlug(pagePlan, mission, city),
    citySlug: slugifySegment(city),
    zoneSlug: inferZoneSlug(pagePlan, mission),
    topicSlug: inferTopicSlug(pagePlan, mission, city),
    cluster: inferCluster(pagePlan, mission),
  };

  return identity;
}

export function buildDeterministicSlug(pagePlan: any, mission: any): string {
  const identity = buildPageIdentity(pagePlan, mission);

  switch (identity.pageType) {
    case 'service':
      return `${identity.serviceSlug}/${identity.citySlug}`;
    case 'urgent':
      return `urgencias/${identity.serviceSlug}/${identity.citySlug}`;
    case 'service_area':
      return `${identity.serviceSlug}/${identity.zoneSlug || 'zona'}/${identity.citySlug}`;
    case 'guide':
      return `guia/${identity.topicSlug || identity.serviceSlug}/${identity.citySlug}`;
    case 'comparison':
      return `comparativa/${identity.topicSlug || identity.serviceSlug}/${identity.citySlug}`;
    case 'faq':
      return `faq/${identity.topicSlug || identity.serviceSlug}/${identity.citySlug}`;
    case 'category':
      return `categoria/${identity.topicSlug || identity.serviceSlug}/${identity.citySlug}`;
    case 'home_local':
      return identity.citySlug;
    default:
      return `${identity.serviceSlug}/${identity.citySlug}`;
  }
}

export function buildCanonical(baseUrl: string, slug: string): string {
  const trimmedBase = String(baseUrl || '').replace(/\/$/, '');
  const trimmedSlug = String(slug || '').replace(/^\//, '').replace(/\/$/, '');
  return `${trimmedBase}/${trimmedSlug}/`.replace(/([^:]\/)\/+/g, '$1');
}

export function buildCanonicalForPage(pagePlan: any, mission: any, baseUrl: string): CanonicalBuildResult {
  const slug = pagePlan?.seoBrief?.canonicalSlug
    ? String(pagePlan.seoBrief.canonicalSlug).replace(/^\//, '').replace(/\/$/, '')
    : buildDeterministicSlug(pagePlan, mission);

  return {
    slug,
    canonical: buildCanonical(baseUrl, slug),
    identity: buildPageIdentity(pagePlan, mission),
  };
}

export function isSlugCoherentWithIntent(slug: string, pageType: PageType): boolean {
  const normalized = String(slug || '').replace(/^\//, '').replace(/\/$/, '');
  const parts = normalized.split('/').filter(Boolean);

  switch (pageType) {
    case 'service':
      return parts.length === 2 && parts[0] !== 'guia' && parts[0] !== 'urgencias';
    case 'urgent':
      return parts.length === 3 && parts[0] === 'urgencias';
    case 'service_area':
      return parts.length === 3 && parts[0] !== 'guia' && parts[0] !== 'urgencias';
    case 'guide':
      return parts.length === 3 && parts[0] === 'guia';
    case 'comparison':
      return parts.length === 3 && parts[0] === 'comparativa';
    case 'faq':
      return parts.length === 3 && parts[0] === 'faq';
    case 'category':
      return parts.length === 3 && parts[0] === 'categoria';
    case 'home_local':
      return parts.length === 1;
    default:
      return parts.length >= 1;
  }
}