
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

    private normalizePhone(phone?: string): string {
        const raw = String(phone || '').trim();
        if (!raw) return '';
        if (/(?:consultar|pendiente|no\s+disponible|n\/d|sin\s+telefono)/i.test(raw)) return '';

        const hasPlus = raw.startsWith('+');
        const digits = raw.replace(/\D/g, '');

        if (digits.length < 9 || digits.length > 15) return '';
        if (/^(\d)\1+$/.test(digits)) return '';
        if (!hasPlus && digits.length === 11 && digits.startsWith('34')) return `+${digits}`;

        return hasPlus ? `+${digits}` : digits;
    }

    private normalizeSlug(value: string): string {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .trim();
    }

    private normalizeText(value: unknown): string {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    private titleCase(value: string): string {
        return this.normalizeText(value)
            .split(' ')
            .filter(Boolean)
            .map((token) => {
                const lower = token.toLowerCase();
                if (['de', 'del', 'en', 'y', 'la', 'el', 'los', 'las'].includes(lower)) return lower;
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            })
            .join(' ');
    }

    private buildSafeBusinessName(niche: string, city: string, provided?: string): string {
        const raw = this.normalizeText(provided || '');
        if (raw && !/pendiente|fallback|undefined|null|servicio\s+de/i.test(raw)) return this.titleCase(raw);
        const cleanNiche = this.titleCase(niche.replace(/^de\s+/i, '')) || 'Servicio Local';
        const cleanCity = this.titleCase(city) || 'España';
        return `${cleanNiche} ${cleanCity} Pro`;
    }

    private buildAuthorityCandidates(niche: string, city: string): { label: string; url: string }[] {
        const slug = this.normalizeSlug(city);
        const base = [
            { label: `Ayuntamiento de ${city}`, url: `https://www.${slug}.es/` },
            { label: 'Administración General del Estado', url: 'https://administracion.gob.es/' },
            { label: 'Consumo y derechos de usuarios en España', url: 'https://www.consumo.gob.es/' }
        ];
        const normalized = this.normalizeSlug(niche);
        if (/electric|instalacion-electrica|boletin/.test(normalized)) {
            base.splice(1, 0, { label: 'Ministerio de Industria y Turismo', url: 'https://industria.gob.es/' });
        } else if (/fontaner|agua|desatasc/.test(normalized)) {
            base.splice(1, 0, { label: 'Información pública sobre consumo de agua', url: 'https://www.miteco.gob.es/' });
        } else if (/cerraj|seguridad|cerradur/.test(normalized)) {
            base.splice(1, 0, { label: 'Policía Nacional - seguridad ciudadana', url: 'https://www.policia.es/' });
        } else if (/reforma|obra|arquitect|construccion/.test(normalized)) {
            base.splice(1, 0, { label: 'Código Técnico de la Edificación', url: 'https://www.codigotecnico.org/' });
        }
        return base;
    }

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

        const slug = this.normalizeSlug(input.city);
        const nicheSlug = this.normalizeSlug(input.niche);

        // ── 1. Metadatos dinámicos y editoriales ──
        const main_entity = input.entities?.[0] || input.niche;
        let meta_title = `${input.niche} en ${input.city} | ${main_entity}`;
        
        const entities_str = input.entities?.slice(0, 2).join(', ');
        let meta_description = `Servicio de ${input.niche} en ${input.city}. ${entities_str ? entities_str + '. ' : ''}Proceso claro, cobertura real y orientación útil antes de contratar.`.substring(0, 160);

        // ENFORCE TECHNICAL RULES from brief
        if (this.technicalBrief) {
            if (this.technicalBrief.toLowerCase().includes('garantía por escrito') || this.technicalBrief.toLowerCase().includes('no mención de años')) {
                meta_description = meta_description.replace(/\d+\s*(?:años|meses)/gi, 'garantía por escrito');
            }
        }

        // ── 2. JSON-LD LocalBusiness (100% plantilla TypeScript) ──
        const napData = input.business_data || {};
        const phone = this.normalizePhone(napData.phone);
        const addressName = this.normalizeText(napData.address || '');
        const companyName = this.buildSafeBusinessName(input.niche, input.city, napData.business_name);

        // Price Range enforcement
        let priceRange = "€€";
        if (this.technicalBrief && (this.technicalBrief.toLowerCase().includes('no precios exactos') || this.technicalBrief.toLowerCase().includes('precio cerrado'))) {
            priceRange = "Consultar"; // Or keep it generic €€
        }

        const organizationNode: any = {
            "@type": ["LocalBusiness", "Service"],
            "@id": `#organization`,
            "name": companyName,
            "description": meta_description,
            "url": `./`,
            "priceRange": priceRange,
            "areaServed": { "@type": "City", "name": input.city },
            "address": {
                "@type": "PostalAddress",
                ...(addressName ? { "streetAddress": addressName } : {}),
                "addressLocality": input.city,
                "addressCountry": "ES"
            },
            "hasMap": `https://maps.google.com/?q=${encodeURIComponent(companyName + ' ' + input.city)}`,
            "sameAs": [
                `https://maps.google.com/?q=${encodeURIComponent(companyName + ' ' + input.city)}`
            ]
        };

        if (phone) {
            organizationNode.telephone = phone;
        }

        const graph: any[] = [
            organizationNode,
            {
                "@type": "WebSite",
                "@id": "#website",
                "name": companyName,
                "url": "./",
                "inLanguage": "es-ES"
            },
            {
                "@type": "WebPage",
                "@id": "#webpage",
                "name": meta_title,
                "description": meta_description,
                "url": "./",
                "inLanguage": "es-ES",
                "isPartOf": { "@id": "#website" }
            },
            {
                "@type": "BreadcrumbList",
                "@id": "#breadcrumb",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "/" },
                    { "@type": "ListItem", "position": 2, "name": `${input.niche} en ${input.city}`, "item": "./" }
                ]
            },
            {
                "@type": "Service",
                "@id": "#service",
                "name": input.niche,
                "serviceType": `Servicio de ${input.niche} Profesional`,
                "provider": { "@id": `#organization` },
                "areaServed": { "@type": "City", "name": input.city }
            }
        ];

        // ── 3. FAQPage condicional (Solo si hay FAQs reales y no navegación/CTA) ──
        const cleanFaqs = (input.faqs || []).filter((f) => {
            const question = String(f?.question || '').replace(/\s+/g, ' ').trim();
            const answer = String(f?.answer || '').replace(/\s+/g, ' ').trim();
            if (!question || question.length < 12 || !/[¿?]/.test(question)) return false;
            if (/^(menú|menu|inicio|servicios|áreas|areas|dudas|contacto|llamar ahora)$/i.test(question)) return false;
            if (!answer || answer.length < 20) return false;
            return true;
        }).slice(0, 8);

        if (cleanFaqs.length > 0) {
            graph.push({
                "@id": `#faq`,
                "@type": "FAQPage",
                "mainEntity": cleanFaqs.map(f => ({
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
        const candidateLinks = this.buildAuthorityCandidates(input.niche, input.city);

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
