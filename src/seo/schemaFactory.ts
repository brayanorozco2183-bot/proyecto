import type { BreadcrumbItem, SchemaBuildResult, SupportedSchemaType } from './types.js';
import { sanitizeBrandName, repairBrokenLocalFragments } from '../utils/brandGuard.js';
import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';
import { sanitizeFaqQuestion, sanitizeFaqAnswer } from '../utils/faqSanitizer.js';

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeComparable(value: any): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizePhone(value: any): string {
  const raw = normalizeText(value);
  if (!raw) return '';
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return '';
  if (/^(\d)\1+$/.test(digits)) return '';
  if (!hasPlus && digits.length === 11 && digits.startsWith('34')) return `+${digits}`;
  return hasPlus ? `+${digits}` : digits;
}

function normalizeCanonical(value: any): string {
  const raw = normalizeText(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    url.protocol = url.protocol.toLowerCase();
    url.pathname = url.pathname.replace(/\/+/g, '/');
    return url.toString();
  } catch {
    return raw;
  }
}

function hasRealFaqs(faqs: Array<{ question: string; answer: string }> = []): boolean {
  return faqs.some((faq) => sanitizeFaqQuestion(faq?.question).trim() && sanitizeFaqAnswer(faq?.answer).trim());
}

function resolveSafeBusinessName(mission: any): string {
  return sanitizeBrandName(
    mission?.local_nap?.business_name || mission?.siteConfig?.brandName || mission?.niche || 'Empresa local',
    { niche: mission?.niche, city: mission?.city, fallbackSuffix: 'Pro' },
  );
}

function looksLikePlaceholderPhone(value: any): boolean {
  const raw = normalizeText(value);
  const digits = raw.replace(/\D/g, '');
  return !raw
    || /\+\s*34\s*\+\s*34/i.test(raw)
    || /0{6,}/.test(digits)
    || /^(?:34)?(?:600000000|666666666|999999999|960000000|910000000|900000000)$/.test(digits)
    || /^(\d)\1+$/.test(digits);
}

function isTrustedNapSource(mission: any): boolean {
  return process.env.GRAVITY_ALLOW_UNVERIFIED_NAP_SCHEMA === 'true'
    || mission?.local_nap?.verified === true
    || mission?.local_nap?.isVerified === true
    || mission?.local_nap?.source === 'user'
    || mission?.siteConfig?.napVerified === true;
}

function resolveSafePhone(mission: any): string | undefined {
  const sitePhone = normalizePhone(mission?.siteConfig?.phone || mission?.siteConfig?.brandPhone || '');
  if (sitePhone && !looksLikePlaceholderPhone(mission?.siteConfig?.phone || mission?.siteConfig?.brandPhone)) return sitePhone;

  if (!isTrustedNapSource(mission)) return undefined;
  const phone = normalizePhone(mission?.local_nap?.phone || '');
  if (!phone || looksLikePlaceholderPhone(mission?.local_nap?.phone)) return undefined;
  return phone;
}

function resolvePostalAddress(mission: any): Record<string, any> | undefined {
  const cityAddress = mission?.city ? { '@type': 'PostalAddress', addressLocality: mission.city, addressCountry: 'ES' } : undefined;
  if (!isTrustedNapSource(mission)) return cityAddress;
  const address = normalizeText(mission?.local_nap?.address || '');
  if (!address || /Calle\s+de\s+Col[oó]n,?\s*10/i.test(address)) return cityAddress;
  return {
    '@type': 'PostalAddress',
    streetAddress: address,
    addressLocality: mission?.city || undefined,
    addressCountry: 'ES',
  };
}

function resolveContactPoint(mission: any, canonical: string): Record<string, any> | undefined {
  const phone = resolveSafePhone(mission);
  if (!phone) return undefined;
  return {
    '@type': 'ContactPoint',
    telephone: phone,
    contactType: 'customer support',
    areaServed: mission?.city || undefined,
    availableLanguage: ['es'],
    url: canonical,
  };
}

function buildOrganizationNode(mission: any, canonical: string): Record<string, any> {
  const name = resolveSafeBusinessName(mission);
  const phone = resolveSafePhone(mission);
  const postalAddress = resolvePostalAddress(mission);
  const contactPoint = resolveContactPoint(mission, canonical);

  return {
    '@type': 'Organization',
    '@id': `${canonical}#organization`,
    name,
    url: canonical,
    telephone: phone || undefined,
    address: postalAddress,
    contactPoint: contactPoint ? [contactPoint] : undefined,
    areaServed: mission?.city ? { '@type': 'City', name: mission.city } : undefined,
  };
}

function buildLocalBusinessNode(mission: any, canonical: string, organizationId: string): Record<string, any> {
  return {
    '@type': 'LocalBusiness',
    '@id': `${canonical}#local-business`,
    name: resolveSafeBusinessName(mission),
    url: canonical,
    telephone: resolveSafePhone(mission) || undefined,
    address: resolvePostalAddress(mission),
    areaServed: mission?.city ? { '@type': 'City', name: mission.city } : undefined,
    parentOrganization: { '@id': organizationId },
  };
}

function stripTrailingSeoSuffix(value: string): string {
  return normalizeText(value).replace(/\s+\|\s+[^|]+$/, '').trim();
}

function resolvePageName(pagePlan: any): string {
  return repairBrokenLocalFragments(stripTrailingSeoSuffix(normalizeText(pagePlan?.renderedSeo?.title || pagePlan?.meta_title || pagePlan?.h1 || pagePlan?.intentModel?.primaryKeyword || 'Página')), pagePlan?.city || pagePlan?.renderedSeo?.metadata?.city);
}

function resolvePageDescription(pagePlan: any): string | undefined {
  const value = repairBrokenLocalFragments(normalizeText(pagePlan?.meta_description || ''), pagePlan?.city || pagePlan?.renderedSeo?.metadata?.city);
  return value || undefined;
}

function buildServiceNode(pagePlan: any, mission: any, canonical: string, providerId: string): Record<string, any> {
  const canonicalService = normalizeText(getCanonicalNicheLabel(mission?.niche || pagePlan?.intentModel?.primaryKeyword || pagePlan?.h1 || 'Servicio local').replace(/^de\s+/i, '')) || 'Servicio local';
  return {
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: canonicalService,
    serviceType: canonicalService,
    areaServed: mission?.city ? { '@type': 'City', name: mission.city } : undefined,
    provider: { '@id': providerId },
  };
}

function buildFaqNode(canonical: string, faqs: Array<{ question: string; answer: string }>): Record<string, any> {
  return {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: faqs
      .map((faq) => ({ question: sanitizeFaqQuestion(faq?.question), answer: sanitizeFaqAnswer(faq?.answer) }))
      .filter((faq) => faq.question && faq.answer)
      .map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
  };
}

function buildBreadcrumbNode(canonical: string, breadcrumbs: BreadcrumbItem[]): Record<string, any> {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumbs`,
    itemListElement: breadcrumbs.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: normalizeCanonical(item.url),
    })),
  };
}

function buildWebPageNode(pagePlan: any, canonical: string): Record<string, any> {
  const name = resolvePageName(pagePlan);
  return {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name,
    headline: normalizeText(pagePlan?.h1 || name),
    description: resolvePageDescription(pagePlan),
    url: canonical,
    inLanguage: 'es-ES',
  };
}

function buildArticleNode(pagePlan: any, mission: any, canonical: string, organizationId: string): Record<string, any> {
  return {
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: normalizeText(pagePlan?.h1 || resolvePageName(pagePlan)),
    description: resolvePageDescription(pagePlan),
    mainEntityOfPage: canonical,
    author: { '@id': organizationId },
    publisher: { '@id': organizationId },
    about: mission?.niche || pagePlan?.intentModel?.primaryKeyword || undefined,
    contentLocation: mission?.city || undefined,
  };
}

function inferRequestedSchemas(pagePlan: any, faqs: Array<{ question: string; answer: string }>): SupportedSchemaType[] {
  const pageType = pagePlan?.intentModel?.pageType || 'service';
  const requested = new Set<SupportedSchemaType>(['WebPage', 'BreadcrumbList', 'Organization']);
  if (['service', 'urgent', 'service_area', 'home_local', 'category', 'comparison'].includes(pageType)) {
    requested.add('LocalBusiness');
    requested.add('Service');
  }
  if (pageType === 'guide') requested.add('Article');
  if ((pagePlan?.seoBrief?.faqEligible || false) && hasRealFaqs(faqs)) requested.add('FAQPage');
  for (const schemaType of pagePlan?.seoBrief?.schemaTypes || []) requested.add(schemaType);
  return Array.from(requested);
}

export class SchemaFactory {
  static build(
    pagePlan: any,
    mission: any,
    faqs: Array<{ question: string; answer: string }> = [],
    options?: { canonical?: string; breadcrumbs?: BreadcrumbItem[] },
  ): SchemaBuildResult {
    const canonical = normalizeCanonical(options?.canonical || pagePlan?.renderedSeo?.canonical || '');
    const breadcrumbs = options?.breadcrumbs || [];
    const requested = inferRequestedSchemas(pagePlan, faqs);

    const nodes: Record<string, any>[] = [];
    const orgNode = buildOrganizationNode(mission, canonical);
    nodes.push(orgNode);

    if (requested.includes('LocalBusiness')) nodes.push(buildLocalBusinessNode(mission, canonical, orgNode['@id']));
    if (requested.includes('Service')) nodes.push(buildServiceNode(pagePlan, mission, canonical, `${canonical}#local-business`));
    if (requested.includes('WebPage')) nodes.push(buildWebPageNode(pagePlan, canonical));
    if (requested.includes('BreadcrumbList') && breadcrumbs.length > 0) nodes.push(buildBreadcrumbNode(canonical, breadcrumbs));
    if (requested.includes('Article')) nodes.push(buildArticleNode(pagePlan, mission, canonical, orgNode['@id']));
    if (requested.includes('FAQPage') && hasRealFaqs(faqs)) nodes.push(buildFaqNode(canonical, faqs));

    const schemaTypes = unique(nodes.flatMap((node) => Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']]).filter(Boolean)) as SupportedSchemaType[];

    return {
      schemaTypes,
      schemaList: nodes,
      schemaJsonLd: {
        '@context': 'https://schema.org',
        '@graph': nodes,
      },
    };
  }
}
