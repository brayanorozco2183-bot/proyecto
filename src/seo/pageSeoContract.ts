import { SchemaFactory } from './schemaFactory.js';
import { buildCanonicalForPage } from './slugEngine.js';
import type {
  IndexationPolicy,
  RenderedSeoContract,
  SeoBrief,
  SeoBuildInput,
  SupportedSchemaType,
} from './types.js';
import { buildPageBreadcrumbs } from './breadcrumbFactory.js';
import { sanitizeBrandName, repairBrokenLocalFragments } from '../utils/brandGuard.js';

const TITLE_BAD_PATTERNS = [
  /^expertos en /i,
  /^servicio de /i,
  /\|\s*[A-Za-zÁÉÍÓÚÑáéíóúñ\s-]+$/,
  /profesionales de confianza/i,
  /soluciones personalizadas/i,
  /protege tu propiedad/i,
];

const META_BAD_PATTERNS = [
  /^expertos en /i,
  /soluciones profesionales,? rápidas y garantizadas/i,
  /presupuesto sin compromiso\.?$/i,
  /descubre las mejores soluciones/i,
  /nuestros .* expertos/i,
];

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeComparable(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimToLength(value: string, max: number): string {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 1).trimEnd() + '…';
}

function capitalizeFirst(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return normalized;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function stripCityFromKeyword(keyword: string, city: string): string {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedCity = normalizeText(city);
  if (!normalizedCity) return normalizedKeyword;
  return normalizeText(
    normalizedKeyword.replace(new RegExp(`\\b${escapeRegex(normalizedCity)}\\b`, 'ig'), ' '),
  );
}

function buildKeywordLabel(keyword: string, city: string): string {
  const stripped = stripCityFromKeyword(keyword, city) || keyword;
  return capitalizeFirst(stripped || 'servicio local');
}

function looksOverloadedServiceTitle(value: string): boolean {
  const current = normalizeText(value);
  const comparable = normalizeComparable(current);
  if (!current) return false;
  const serviceSignals = [
    /urgente|24h|24 horas|inmediat/.test(comparable),
    /apertura|abrir puerta/.test(comparable),
    /cambio|sustitucion/.test(comparable),
    /cerradura|bombin|cilindro/.test(comparable),
    /persiana|cierre metalico|comercio/.test(comparable),
  ].filter(Boolean).length;
  const separatorHits = (current.match(/[|\-–—]/g) || []).length;
  return serviceSignals >= 3 || (serviceSignals >= 2 && separatorHits >= 1);
}

function stripTrailingSeoSuffix(value: string): string {
  return normalizeText(value).replace(/\s+\|\s+[^|]+$/, '').trim();
}

function buildDeterministicTitle(pagePlan: any, city: string, keyword: string): string {
  const pageType = String(pagePlan?.intentModel?.pageType || pagePlan?.pageType || 'service').toLowerCase();
  const label = buildKeywordLabel(keyword, city);

  switch (pageType) {
    case 'urgent':
      return `Urgencias de ${label.toLowerCase()} en ${city} | Atención local`;
    case 'guide':
      return `Guía de ${label.toLowerCase()} en ${city} | Criterio técnico`;
    case 'faq':
      return `FAQ de ${label.toLowerCase()} en ${city} | Dudas resueltas`;
    case 'comparison':
      return `Comparativa de ${label.toLowerCase()} en ${city} | Qué valorar`;
    case 'service_area':
      return `${label} en ${city} | Cobertura por zonas`;
    default:
      return `${label} en ${city} con diagnóstico claro y cobertura real`;
  }
}

function buildDeterministicMetaDescription(pagePlan: any, city: string, keyword: string): string {
  const pageType = String(pagePlan?.intentModel?.pageType || pagePlan?.pageType || 'service').toLowerCase();
  const label = buildKeywordLabel(keyword, city).toLowerCase();

  switch (pageType) {
    case 'urgent':
      return `Urgencias de ${label} en ${city} con valoración clara, criterio técnico y atención directa según el caso.`;
    case 'guide':
      return `Guía de ${label} en ${city} con criterios claros, pasos útiles y recomendaciones para decidir sin promesas artificiales.`;
    case 'faq':
      return `Respondemos dudas frecuentes sobre ${label} en ${city} con criterios técnicos, contexto útil y contacto directo.`;
    case 'comparison':
      return `Compara opciones de ${label} en ${city} con criterios técnicos, señales de confianza y una decisión mejor orientada.`;
    case 'service_area':
      return `${capitalizeFirst(label)} en ${city} con cobertura real por zonas, proceso claro y contacto directo para validar el servicio.`;
    default:
      return `${capitalizeFirst(label)} en ${city} con diagnóstico claro, cobertura local y contacto directo para valorar el caso.`;
  }
}

function shouldPreferDeterministicTitle(candidate: string, city: string, keyword: string, pageType = 'service'): boolean {
  const current = normalizeText(candidate);
  if (!current) return true;
  if (current.includes('…')) return true;
  if (TITLE_BAD_PATTERNS.some((regex) => regex.test(current))) return true;
  if (['service', 'home_local', 'service_area', 'category'].includes(String(pageType || 'service').toLowerCase()) && looksOverloadedServiceTitle(current)) return true;

  const comparable = normalizeComparable(current);
  const cityComparable = normalizeComparable(city);
  const keywordComparable = normalizeComparable(stripCityFromKeyword(keyword, city) || keyword);

  if (!comparable.includes(cityComparable)) return true;
  if (keywordComparable && !comparable.includes(keywordComparable.split(' ')[0])) return true;
  return false;
}

function shouldPreferDeterministicMeta(candidate: string, city: string, keyword: string, pageType = 'service'): boolean {
  const current = normalizeText(candidate);
  if (!current) return true;
  if (current.includes('…')) return true;
  if (META_BAD_PATTERNS.some((regex) => regex.test(current))) return true;
  if (['service', 'home_local', 'service_area', 'category'].includes(String(pageType || 'service').toLowerCase()) && looksOverloadedServiceTitle(current)) return true;

  const comparable = normalizeComparable(current);
  const cityComparable = normalizeComparable(city);
  const keywordComparable = normalizeComparable(stripCityFromKeyword(keyword, city) || keyword);

  if (!comparable.includes(cityComparable)) return true;
  if (keywordComparable && !comparable.includes(keywordComparable.split(' ')[0])) return true;
  return false;
}

export function normalizeSeoBrief(pagePlan: any, mission: any): SeoBrief {
  const current = pagePlan?.seoBrief || {};
  const fallbackSchemas: SupportedSchemaType[] = ['WebPage', 'BreadcrumbList', 'Organization'];

  return {
    titleStrategy:
      current.titleStrategy ||
      `Keyword principal + ${mission?.city || pagePlan?.city || 'ciudad'} + beneficio`,
    metaDescriptionStrategy:
      current.metaDescriptionStrategy ||
      `Acción + propuesta de valor + CTA + ${mission?.city || pagePlan?.city || 'ciudad'}`,
    canonicalSlug: current.canonicalSlug,
    schemaTypes: (current.schemaTypes || fallbackSchemas) as SupportedSchemaType[],
    faqEligible: Boolean(current.faqEligible ?? pagePlan?.sections?.some((s: any) => s.block_type === 'faq')),
    localModifiers: current.localModifiers || [mission?.city || pagePlan?.city].filter(Boolean),
    indexationHint: current.indexationHint || 'index',
    reason: current.reason,
  };
}

function sanitizeTitle(title: string, city: string): string {
  let current = normalizeText(title);
  if (!current) current = `Servicio local en ${city}`;

  current = current.replace(/^Expertos en\s+/i, '');
  current = current.replace(/de confianza/gi, '');
  current = current.replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito');
  current = current.replace(/\s{2,}/g, ' ').trim();

  if (TITLE_BAD_PATTERNS.some((regex) => regex.test(current))) {
    current = current.replace(/profesionales de confianza/gi, 'solución profesional');
  }

  current = repairBrokenLocalFragments(current, city);
  return trimToLength(current, 60);
}

function sanitizeMetaDescription(meta: string, city: string, keyword: string): string {
  let current = normalizeText(meta);
  if (!current) {
    current = `Resolvemos ${keyword} en ${city} con atención local, criterio técnico y contacto directo.`;
  }

  current = current.replace(/^Expertos en\s+/i, 'Resolvemos ');
  current = current.replace(/servicio especializado de/gi, 'Atendemos');
  current = current.replace(/garant[ií]a(?:\s+oficial)?\s+por\s+escrito\s+de\s+\d+\s*(?:meses?|a[nñ]os?)/gi, 'garantía por escrito');
  current = current.replace(/\s{2,}/g, ' ').trim();

  if (META_BAD_PATTERNS.some((regex) => regex.test(current))) {
    current = `Resolvemos ${keyword} en ${city} con técnicos locales, criterios claros y atención directa desde el primer contacto.`;
  }

  current = repairBrokenLocalFragments(current, city);
  return trimToLength(current, 155);
}

function stripFaqBoilerplate(answer: string, city: string, keyword: string): string {
  let current = normalizeText(answer);
  if (!current) return current;

  const cityEscaped = escapeRegex(normalizeText(city));
  const keywordEscaped = escapeRegex(normalizeText(stripCityFromKeyword(keyword, city) || keyword));
  const patterns = [
    new RegExp(`\\s*En ${cityEscaped}, este trabajo de ${keywordEscaped} conviene resolverlo con una valoraci[oó]n previa y una propuesta ajustada al alcance real\\.?$`, 'i'),
    new RegExp(`\\s*En ${cityEscaped}, el servicio de ${keywordEscaped} se explica con alcance claro, criterios t[eé]cnicos y una expectativa realista de intervenci[oó]n\\.?$`, 'i'),
    new RegExp(`\\s*En ${cityEscaped}, el servicio de ${keywordEscaped} se organiza con valoraci[oó]n previa, criterio t[eé]cnico y una ejecuci[oó]n proporcionada al caso\\.?$`, 'i'),
  ];

  for (const pattern of patterns) {
    current = current.replace(pattern, '').trim();
  }

  current = current.replace(/\s{2,}/g, ' ').trim();
  return current;
}

function sanitizeFaqPairs(faqs: Array<{ question: string; answer: string }>, city: string, keyword: string) {
  const seen = new Set<string>();
  const cleaned: Array<{ question: string; answer: string }> = [];

  for (const faq of Array.isArray(faqs) ? faqs : []) {
    const question = normalizeText(faq?.question || '');
    let answer = stripFaqBoilerplate(faq?.answer || '', city, keyword);
    answer = normalizeText(answer);

    const key = normalizeComparable(question);
    if (!question || !answer || answer.length < 30 || seen.has(key)) continue;

    seen.add(key);
    cleaned.push({ question, answer });
  }

  return cleaned;
}

function resolveIndexationPolicy(pagePlan: any, mission: any, schemaTypes: SupportedSchemaType[]): IndexationPolicy {
  if (pagePlan?.seoBrief?.indexationHint === 'noindex') {
    return {
      mode: 'noindex',
      follow: true,
      allowInSitemap: false,
      reason: 'seo brief requested noindex',
      cluster: String(mission?.cluster_folder_name || mission?.city || 'default'),
    };
  }

  if (pagePlan?.degraded || mission?.contextual_data?.noindex) {
    return {
      mode: 'noindex',
      follow: true,
      allowInSitemap: false,
      reason: pagePlan?.degraded ? 'page degraded fallback' : 'mission requested noindex',
      cluster: String(mission?.cluster_folder_name || mission?.city || 'default'),
    };
  }

  if (!pagePlan?.intentModel?.primaryKeyword || schemaTypes.length === 0) {
    return {
      mode: 'noindex',
      follow: true,
      allowInSitemap: false,
      reason: 'missing primary keyword or schema',
      cluster: String(mission?.cluster_folder_name || mission?.city || 'default'),
    };
  }

  return {
    mode: 'index',
    follow: true,
    allowInSitemap: true,
    reason: 'default indexable page',
    cluster: String(mission?.cluster_folder_name || mission?.city || 'default'),
  };
}

export function buildRenderedSeo(input: SeoBuildInput): { seoBrief: SeoBrief; renderedSeo: RenderedSeoContract } {
  const { pagePlan, mission, faqs = [] } = input;
  const baseUrl = String(input.baseUrl || mission?.siteConfig?.baseUrl || 'https://serviciosprofesionales.pro').replace(/\/$/, '');
  const seoBrief = normalizeSeoBrief(pagePlan, mission);

  const { slug, canonical } = buildCanonicalForPage({ ...pagePlan, seoBrief }, mission, baseUrl);
  const city = mission?.city || pagePlan?.city || 'Ciudad';
  const keyword = pagePlan?.intentModel?.primaryKeyword || mission?.niche || pagePlan?.h1 || 'servicio local';

  const pageType = String(pagePlan?.intentModel?.pageType || pagePlan?.pageType || 'service').toLowerCase();
  const rawTitle = pagePlan?.meta_title || pagePlan?.h1 || keyword;
  const rawMeta = pagePlan?.meta_description || '';
  const titleSource = shouldPreferDeterministicTitle(rawTitle, city, keyword, pageType)
    ? buildDeterministicTitle(pagePlan, city, keyword)
    : rawTitle;
  const metaSource = shouldPreferDeterministicMeta(rawMeta, city, keyword, pageType)
    ? buildDeterministicMetaDescription(pagePlan, city, keyword)
    : rawMeta;

  const title = sanitizeTitle(titleSource, city);
  const metaDescription = sanitizeMetaDescription(metaSource, city, keyword);
  const breadcrumbTitle = normalizeText(
    !shouldPreferDeterministicTitle(pagePlan?.h1 || '', city, keyword, pageType)
      ? stripTrailingSeoSuffix(pagePlan?.h1 || '')
      : stripTrailingSeoSuffix(title),
  ) || buildKeywordLabel(keyword, city);

  const breadcrumbsRaw = buildPageBreadcrumbs({
    baseUrl,
    city,
    niche: mission?.niche || 'servicio',
    pageTitle: breadcrumbTitle,
    pageType: pagePlan?.intentModel?.pageType,
    pageUrlOverride: canonical,
  });

  const breadcrumbs = breadcrumbsRaw.map((b, idx) => ({
    name: b.name,
    url: b.url,
    position: idx + 1,
  }));

  const sanitizedFaqs = sanitizeFaqPairs(faqs as Array<{ question: string; answer: string }>, city, keyword);
  const schemaBuild = SchemaFactory.build({ ...pagePlan, seoBrief }, mission, sanitizedFaqs, { canonical, breadcrumbs });
  const indexationPolicy = resolveIndexationPolicy(pagePlan, mission, schemaBuild.schemaTypes);
  const robots = `${indexationPolicy.mode}, ${indexationPolicy.follow ? 'follow' : 'nofollow'}`;

  const openGraph = {
    type: pagePlan?.intentModel?.pageType === 'guide' ? 'article' as const : 'website' as const,
    title,
    description: metaDescription,
    url: canonical,
    image: input.ogImage || mission?.siteConfig?.defaultOgImage,
    siteName: sanitizeBrandName(input.siteName || mission?.siteConfig?.brandName || mission?.local_nap?.business_name, { niche: mission?.niche, city: city, fallbackSuffix: 'Pro' }),
    locale: input.locale || 'es_ES',
  };

  const twitter = {
    card: (openGraph.image ? 'summary_large_image' : 'summary') as 'summary' | 'summary_large_image',
    title,
    description: metaDescription,
    image: openGraph.image,
  };

  return {
    seoBrief: {
      ...seoBrief,
      canonicalSlug: slug,
      schemaTypes: schemaBuild.schemaTypes,
      indexationHint: indexationPolicy.mode,
    },
    renderedSeo: {
      slug,
      canonical,
      title,
      metaDescription,
      robots,
      breadcrumbs,
      openGraph,
      twitter,
      schemaTypes: schemaBuild.schemaTypes,
      schemaList: schemaBuild.schemaList,
      schemaJsonLd: schemaBuild.schemaJsonLd,
      indexationPolicy,
      metadata: {
        preferredH1: stripTrailingSeoSuffix(title),
        pageType,
        canonicalKeyword: buildKeywordLabel(keyword, city),
        napTruthLevel: mission?.local_nap?.truth_level,
        authorityLinks: Array.isArray(mission?.local_nap?.authority_links) ? mission.local_nap.authority_links : [],
        trustEvidence: Array.isArray(mission?.local_nap?.trust_evidence) ? mission.local_nap.trust_evidence : [],
        hasVerifiedReviews: Array.isArray(mission?.local_nap?.reviews)
          ? mission.local_nap.reviews.some((review: any) => review?.isVerified && review?.text && review?.author)
          : false,
      },

    },
  };
}