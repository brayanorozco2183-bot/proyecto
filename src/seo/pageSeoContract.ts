
import { SchemaFactory } from './schemaFactory.js';
import { buildCanonicalForPage } from './slugEngine.js';
import type {
  BreadcrumbItem,
  IndexationPolicy,
  RenderedSeoContract,
  SeoBrief,
  SeoBuildInput,
  SupportedSchemaType,
} from './types.js';
import { buildPageBreadcrumbs, mapBreadcrumbsForRenderer } from './breadcrumbFactory.js';

const TITLE_BAD_PATTERNS = [
  /^expertos en /i,
  /^servicio de /i,
  /\|\s*[A-Za-zÁÉÍÓÚÑáéíóúñ\s-]+$/,
  /profesionales de confianza/i,
];

const META_BAD_PATTERNS = [
  /^expertos en /i,
  /soluciones profesionales,? rápidas y garantizadas/i,
  /presupuesto sin compromiso\.?$/i,
];

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function trimToLength(value: string, max: number): string {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 1).trimEnd() + '…';
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

// Replaced by breadcrumbFactory

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

  return trimToLength(current, 155);
}

function resolveIndexationPolicy(pagePlan: any, mission: any, schemaTypes: SupportedSchemaType[]): IndexationPolicy {
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
  const title = sanitizeTitle(pagePlan?.meta_title || pagePlan?.h1 || keyword, city);
  const metaDescription = sanitizeMetaDescription(pagePlan?.meta_description || '', city, keyword);
  const breadcrumbsRaw = buildPageBreadcrumbs({
    baseUrl,
    city,
    niche: mission?.niche || 'servicio',
    pageTitle: pagePlan?.h1 || keyword,
    pageType: pagePlan?.intentModel?.pageType
  });

  const breadcrumbs = breadcrumbsRaw.map((b, idx) => ({ 
    name: b.name, 
    url: b.url, 
    position: idx + 1 
  }));

  const schemaBuild = SchemaFactory.build({ ...pagePlan, seoBrief }, mission, faqs, { canonical, breadcrumbs });
  const indexationPolicy = resolveIndexationPolicy(pagePlan, mission, schemaBuild.schemaTypes);
  const robots = `${indexationPolicy.mode}, ${indexationPolicy.follow ? 'follow' : 'nofollow'}`;

  const openGraph = {
    type: pagePlan?.intentModel?.pageType === 'guide' ? 'article' as const : 'website' as const,
    title,
    description: metaDescription,
    url: canonical,
    image: input.ogImage || mission?.siteConfig?.defaultOgImage,
    siteName: input.siteName || mission?.siteConfig?.brandName || mission?.local_nap?.business_name,
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
    },
  };
}