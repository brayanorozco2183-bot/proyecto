import type { SeoFallbackPick } from './seoFallbackTypes.js';

export interface JsonLdInput {
    businessName: string;
    city: string;
    neighborhood?: string;
    niche: string;
    schemaType: string;
    url: string;
    phone?: string;
    description: string;
    faq?: { question: string; answer: string }[];
}

export function buildDeterministicJsonLd(input: JsonLdInput): string {
    const { businessName, city, neighborhood, niche, schemaType, url, phone, description, faq } = input;
    
    const organizationId = `${url}#organization`;
    const localBusinessId = `${url}#local-business`;
    const serviceId = `${url}#service`;
    const webpageId = `${url}#webpage`;

    const graph = [
        {
            "@type": "Organization",
            "@id": organizationId,
            "name": businessName,
            "url": url,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": neighborhood ? `${neighborhood}, ${city}` : city,
                "addressLocality": city,
                "addressCountry": "ES"
            },
            "areaServed": {
                "@type": "City",
                "name": city
            }
        },
        {
            "@type": "LocalBusiness",
            "@id": localBusinessId,
            "name": businessName,
            "url": url,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": neighborhood ? `${neighborhood}, ${city}` : city,
                "addressLocality": city,
                "addressCountry": "ES"
            },
            "areaServed": {
                "@type": "City",
                "name": city
            },
            "parentOrganization": { "@id": organizationId }
        },
        {
            "@type": "Service",
            "@id": serviceId,
            "name": businessName,
            "serviceType": niche,
            "areaServed": {
                "@type": "City",
                "name": city
            },
            "provider": { "@id": localBusinessId }
        },
        {
            "@type": "WebPage",
            "@id": webpageId,
            "name": description.split('.')[0], // Usamos la primera frase como headline
            "headline": `${niche.charAt(0).toUpperCase() + niche.slice(1)} en ${city}`,
            "description": description,
            "url": url,
            "inLanguage": "es-ES"
        }
    ];

    // Inyectar el tipo específico si existe (ej: Locksmith)
    if (schemaType && schemaType !== 'LocalBusiness') {
        const specificBusiness = {
            "@type": schemaType,
            "@id": `${url}#specific-business`,
            "name": businessName,
            "url": url,
            "address": graph[1].address,
            "areaServed": graph[1].areaServed
        };
        graph.push(specificBusiness as any);
    }

    // Inyectar FAQs si existen
    if (faq && faq.length > 0) {
        graph.push({
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            "mainEntity": faq.map(f => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.answer
                }
            }))
        } as any);
    }

    return JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graph
    }, null, 2);
}
