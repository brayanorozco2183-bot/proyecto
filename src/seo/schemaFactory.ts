import type { BreadcrumbItem, SchemaBuildResult, SupportedSchemaType } from './types.js';

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function hasRealFaqs(faqs: Array<{ question: string; answer: string }> = []): boolean {
  return faqs.some((faq) => faq?.question?.trim() && faq?.answer?.trim());
}

function buildOrganizationNode(mission: any, canonical: string): Record<string, any> {
  const name = mission?.local_nap?.business_name || mission?.siteConfig?.brandName || mission?.niche || 'Empresa local';
  const address = mission?.local_nap?.address || '';
  const phone = mission?.local_nap?.phone || '';

  return {
    '@type': 'Organization',
    '@id': `${canonical}#organization`,
    name,
    url: canonical,
    telephone: phone || undefined,
    address: address && address.toLowerCase() !== (mission?.city || '').toLowerCase()
      ? {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: mission?.city || undefined,
          addressCountry: 'ES',
        }
      : undefined,
  };
}

function buildLocalBusinessNode(mission: any, canonical: string, organizationId: string): Record<string, any> {
  return {
    '@type': 'LocalBusiness',
    '@id': `${canonical}#local-business`,
    name: mission?.local_nap?.business_name || mission?.siteConfig?.brandName || mission?.niche || 'Empresa local',
    url: canonical,
    telephone: mission?.local_nap?.phone || undefined,
    address: mission?.local_nap?.address && mission?.local_nap?.address.toLowerCase() !== (mission?.city || '').toLowerCase()
      ? {
          '@type': 'PostalAddress',
          streetAddress: mission.local_nap.address,
          addressLocality: mission?.city || undefined,
          addressCountry: 'ES',
        }
      : undefined,
    areaServed: mission?.city
      ? {
          '@type': 'City',
          name: mission.city,
        }
      : undefined,
    parentOrganization: {
      '@id': organizationId,
    },
  };
}

function buildServiceNode(pagePlan: any, mission: any, canonical: string, providerId: string): Record<string, any> {
  const serviceName = pagePlan?.intentModel?.primaryKeyword || mission?.niche || pagePlan?.h1 || 'Servicio local';
  return {
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: serviceName,
    serviceType: serviceName,
    areaServed: mission?.city
      ? {
          '@type': 'City',
          name: mission.city,
        }
      : undefined,
    provider: {
      '@id': providerId,
    },
  };
}

function buildFaqNode(canonical: string, faqs: Array<{ question: string; answer: string }>): Record<string, any> {
  return {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: faqs
      .filter((faq) => faq?.question?.trim() && faq?.answer?.trim())
      .map((faq) => ({
        '@type': 'Question',
        name: faq.question.trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer.trim(),
        },
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
      item: item.url,
    })),
  };
}

function buildWebPageNode(pagePlan: any, canonical: string): Record<string, any> {
  return {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: pagePlan?.meta_title || pagePlan?.h1 || pagePlan?.intentModel?.primaryKeyword || 'Página',
    description: pagePlan?.meta_description || undefined,
    url: canonical,
    inLanguage: 'es-ES',
  };
}

function buildArticleNode(pagePlan: any, mission: any, canonical: string, organizationId: string): Record<string, any> {
  return {
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: pagePlan?.h1 || pagePlan?.meta_title || pagePlan?.intentModel?.primaryKeyword || 'Guía local',
    description: pagePlan?.meta_description || undefined,
    mainEntityOfPage: canonical,
    author: {
      '@id': organizationId,
    },
    publisher: {
      '@id': organizationId,
    },
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

  if (pageType === 'guide') {
    requested.add('Article');
  }

  if ((pagePlan?.seoBrief?.faqEligible || false) && hasRealFaqs(faqs)) {
    requested.add('FAQPage');
  }

  for (const schemaType of pagePlan?.seoBrief?.schemaTypes || []) {
    requested.add(schemaType);
  }

  return Array.from(requested);
}

export class SchemaFactory {
  static build(
    pagePlan: any,
    mission: any,
    faqs: Array<{ question: string; answer: string }> = [],
    options?: { canonical?: string; breadcrumbs?: BreadcrumbItem[] },
  ): SchemaBuildResult {
    const canonical = options?.canonical || pagePlan?.renderedSeo?.canonical || '';
    const breadcrumbs = options?.breadcrumbs || [];
    const requested = inferRequestedSchemas(pagePlan, faqs);

    const nodes: Record<string, any>[] = [];
    const orgNode = buildOrganizationNode(mission, canonical);
    nodes.push(orgNode);

    if (requested.includes('LocalBusiness')) {
      nodes.push(buildLocalBusinessNode(mission, canonical, orgNode['@id']));
    }

    if (requested.includes('Service')) {
      nodes.push(buildServiceNode(pagePlan, mission, canonical, `${canonical}#local-business`));
    }

    if (requested.includes('WebPage')) {
      nodes.push(buildWebPageNode(pagePlan, canonical));
    }

    if (requested.includes('BreadcrumbList') && breadcrumbs.length > 0) {
      nodes.push(buildBreadcrumbNode(canonical, breadcrumbs));
    }

    if (requested.includes('Article')) {
      nodes.push(buildArticleNode(pagePlan, mission, canonical, orgNode['@id']));
    }

    if (requested.includes('FAQPage') && hasRealFaqs(faqs)) {
      nodes.push(buildFaqNode(canonical, faqs));
    }

    const schemaTypes = unique(
      nodes.flatMap((node) => {
        const type = node?.['@type'];
        if (!type) return [];
        return Array.isArray(type) ? type : [type];
      }),
    ) as SupportedSchemaType[];

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