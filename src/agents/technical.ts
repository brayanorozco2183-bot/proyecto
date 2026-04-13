import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';

/**
 * Technical_Lead_05 V7 - Zero-Hallucination Engine.
 * All metadata, schema and authority links are generated programmatically.
 * The LLM is NOT used for any structural output. Only a curated list of verified URLs is tested.
 */
export class TechnicalLeadAgent extends BaseAgent {
    constructor() {
        super('Technical_Specialist_05', 'Technical Lead', 'Lider Técnico', 'Especialista en estructuración de datos Schema.org, metadatos y optimización de código para Google.');
    }

    /**
     * Verifies if a URL returns HTTP 200. Used to filter out 404 authority links.
     */
    private async verifyUrl(url: string): Promise<boolean> {
        try {
            const res = await axios.get(url, {
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                maxRedirects: 5,
                validateStatus: (s) => s < 400
            });
            return res.status < 400;
        } catch {
            return false;
        }
    }

    async execute(input: {
        niche: string;
        city: string;
        keywords: string[];
        entities: any[];
        business_data?: any;
        faqs?: { question: string; answer: string }[];
    }): Promise<AgentResponse<any>> {
        this.logThought(`[V7] Generando assets técnicos programáticos para ${input.niche} en ${input.city}`);
        const knowledge = await this.getPersistentKnowledge({ city: input.city, niche: input.niche });
        if (knowledge) this.logThought(`[V7] Aplicando reglas de conocimiento: ${knowledge.substring(0, 50)}...`);

        const slug = input.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
        const nicheSlug = input.niche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

        // ── 1. Metadatos dinámicos y editoriales ──
        const main_entity = input.entities?.[0] || input.niche;
        let meta_title = `${input.niche} en ${input.city} | ${main_entity}`;
        
        const entities_str = input.entities?.slice(0, 2).join(', ');
        let meta_description = `Expertos en ${input.niche} en ${input.city}. ${entities_str ? entities_str + '. ' : ''}Servicio profesional, rápido y con garantía local en toda la zona de ${input.city}. ¡Llámanos!`.substring(0, 160);

        // ENFORCE TECHNICAL RULES from brief
        if (this.technicalBrief) {
            if (this.technicalBrief.toLowerCase().includes('garantía por escrito') || this.technicalBrief.toLowerCase().includes('no mención de años')) {
                meta_description = meta_description.replace(/\d+\s*(?:años|meses)/gi, 'garantía por escrito');
            }
        }

        // ── 2. JSON-LD LocalBusiness (100% plantilla TypeScript) ──
        const napData = input.business_data || {};
        const phone = napData.phone || "+34 900 000 000";
        const addressName = napData.address || "Centro Ciudad";
        const companyName = napData.business_name || `${input.niche} en ${input.city}`;

        // Price Range enforcement
        let priceRange = "€€";
        if (this.technicalBrief && (this.technicalBrief.toLowerCase().includes('no precios exactos') || this.technicalBrief.toLowerCase().includes('precio cerrado'))) {
            priceRange = "Consultar"; // Or keep it generic €€
        }

        const graph: any[] = [
            {
                "@type": ["LocalBusiness", "Service"],
                "@id": `#organization`,
                "name": companyName,
                "description": meta_description,
                "url": `./`,
                "telephone": phone,
                "priceRange": priceRange,
                "openingHours": "Mo-Su 00:00-23:59",
                "areaServed": input.city,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": addressName,
                    "addressLocality": input.city,
                    "addressCountry": "ES"
                },
                "hasMap": `https://maps.google.com/?q=${encodeURIComponent(companyName + ' ' + input.city)}`,
                "sameAs": [
                    `https://maps.google.com/?q=${encodeURIComponent(companyName + ' ' + input.city)}`
                ]
            },
            {
                "@type": "Service",
                "serviceType": `Servicio de ${input.niche} Profesional`,
                "provider": { "@id": `#organization` },
                "areaServed": { "@type": "City", "name": input.city }
            }
        ];

        // ── 3. FAQPage condicional (Solo si hay FAQs reales) ──
        if (input.faqs && input.faqs.length > 0) {
            graph.push({
                "@id": `#faq`,
                "@type": "FAQPage",
                "mainEntity": input.faqs.map(f => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": f.answer
                    }
                }))
            });
        }

        const schema = {
            "@context": "https://schema.org",
            "@graph": graph
        };

        // ── 4. Verificación real de enlaces (sin inventar) ──
        const candidateLinks = [
            { label: `Ayuntamiento de ${input.city}`, url: `https://www.${slug}.es/` },
            { label: `Portal de Turismo de ${input.city}`, url: `https://turismo.${slug}.es/` },
            { label: 'Seguridad en el Hogar - OCU', url: 'https://www.ocu.org/' },
            { label: 'Consejos de Seguridad - Policía Nacional', url: 'https://www.policia.es/' },
            { label: 'Información de España - Spain.info', url: 'https://www.spain.info/' }
        ];

        const verifiedLinks: { label: string; url: string }[] = [];
        for (const candidate of candidateLinks) {
            if (verifiedLinks.length >= 3) break; // Máximo 3 enlaces de autoridad
            this.logThought(`[VERIFY] Comprobando enlace: ${candidate.url}`);
            const isAlive = await this.verifyUrl(candidate.url);
            if (isAlive) {
                verifiedLinks.push(candidate);
                this.logThought(`[VERIFY] ✅ Enlace VIVO: ${candidate.url}`);
            } else {
                this.logThought(`[VERIFY] ❌ Enlace 404/Failed: ${candidate.url} — descartado.`);
            }
        }

        return {
            success: true,
            data: {
                meta_title,
                meta_description,
                schema,
                authority_links: verifiedLinks,
                internal_linking: [`/${nicheSlug}-en-${slug}/`]
            },
            thoughts: `Assets técnicos generados dinámicamente. Schema limpio (Rating/Reviews eliminados). Enlaces de autoridad verificados: ${verifiedLinks.length}.`
        };
    }
}