import { buildRenderedSeo } from '../seo/pageSeoContract.js';

const pagePlan: any = {
  meta_title: 'Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio',
  h1: 'Cerrajeros Urgentes en Getafe - Apertura Puertas | Cambio Cerraduras',
  intentModel: {
    pageType: 'service',
    primaryKeyword: 'cerrajeros',
  },
  seoBrief: { faqEligible: true },
  sections: [],
};

const mission: any = {
  city: 'Getafe',
  niche: 'cerrajeros',
  siteConfig: { baseUrl: 'https://serviciosprofesionales.pro', brandName: 'Cerrajeros Getafe 24h' },
  local_nap: { business_name: 'Cerrajeros Getafe 24h', address: 'Calle Mayor, 1, Getafe', phone: '910112233' },
};

const { renderedSeo } = buildRenderedSeo({ pagePlan, mission, faqs: [] } as any);

if (renderedSeo.title !== 'Cerrajeros en Getafe | Atención local y criterio técnico') {
  throw new Error(`Título no alineado: ${renderedSeo.title}`);
}

if (!/getafe/i.test(renderedSeo.metaDescription) || /urgenc|apertura|cambio/i.test(renderedSeo.metaDescription)) {
  throw new Error(`Meta description no alineada: ${renderedSeo.metaDescription}`);
}

console.log('OK: SEO title contract alinea páginas service genéricas.');
