import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';
import { IntentModel } from '../types/pipeline_v2.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { ArchitectLinkContext } from '../internal-linking/types.js';
import { BLOCK_VISUAL_SPECS } from '../config/blockVisualSpecs.js';
import { PAGE_ARCHETYPES } from '../config/pageArchetypes.js';
import { buildSeed, pickSeeded, rotateSeeded, uniqueStrings } from '../utils/designSeed.js';

const ALLOWED_BLOCK_TYPES = new Set([
    'hero_trust',
    'services_grid',
    'urgency_panel',
    'local_proof',
    'faq',
    'cta_panel',
    'price_guidance',
    'process_steps',
    'trust_band',
    'map',
    'case_story',
    'comparison_table',
    'checklist',
    'before_after',
    'objections',
    'feature_spotlight',
    'service_matrix',
    'testimonial_quote',
    'micro_cta',
    'authority_note',
    'internal_linking'
]);

export interface ArchitectInput {
    niche: string;
    city: string;
    silo_structure: string[];
    word_count_target: number;
    entities: string[];
    cluster_data?: any;
    local_nap?: {
        business_name: string;
        address: string;
        phone: string;
    };
    intentModel: IntentModel;
    strategicAnalysis?: any;
    linkingContext?: ArchitectLinkContext;
    originalityDirective?: string;
}

export class ContentArchitectAgent extends BaseAgent {
    constructor() {
        super('Content_Architect_01', 'Planning Lead', 'Arquitecto de Contenidos', 'Diseñador de estructuras semánticas y blue-prints de conversión.', vault.OLLAMA_MODEL_RESEARCH);
    }

    private truncate(value: any, max = 400): string {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        return text.length > max ? `${text.slice(0, max)}…` : text;
    }

    private uniqueNormalizedStrings(values: any[], limit = 8): string[] {
        const seen = new Set<string>();
        const out: string[] = [];

        for (const value of Array.isArray(values) ? values : []) {
            const item = String(value || '').replace(/^[-•*]\s*/, '').replace(/\s+/g, ' ').trim();
            if (!item) continue;
            const key = item.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(item);
            if (out.length >= limit) break;
        }

        return out;
    }

    private extractBriefItems(sectionLabel: string, limit = 8): string[] {
        const brief = String(this.nicheBrief || '');
        if (!brief || !sectionLabel) return [];

        const escaped = sectionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escaped}\\s*:\\n([\\s\\S]*?)(?:\\n[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s]+:|$)`, 'i');
        const match = brief.match(regex);
        if (!match?.[1]) return [];

        const items = match[1]
            .split(/\n+/)
            .map(line => line.trim())
            .filter(line => /^[-•*]/.test(line))
            .map(line => line.replace(/^[-•*]\s*/, '').trim());

        return this.uniqueNormalizedStrings(items, limit);
    }


    private getGeoAreas(input?: ArchitectInput, limit = 6): string[] {
        if (!input) return [];
        const cityKey = String(input.city || '').toLowerCase().trim();
        const raw = [
            ...((input.cluster_data?.geo || []).map((item: any) => item?.name)),
            ...((input.linkingContext?.localAreas || []) as string[]),
        ];

        return this.uniqueNormalizedStrings(raw, limit)
            .map((item) => item.replace(/^.*?\ben\s+/i, '').trim())
            .filter((item) => item && item.toLowerCase() !== cityKey);
    }

    private getTopicalAnchors(input?: ArchitectInput, limit = 6): string[] {
        if (!input) return [];
        const raw = [
            ...((input.cluster_data?.topical || []).map((item: any) => item?.name)),
            ...((input.linkingContext?.clusterKeywords || []) as string[]),
            ...((input.linkingContext?.suggestedAnchors || []) as string[]),
        ];
        return this.uniqueNormalizedStrings(raw, limit);
    }

    private buildLocalProofHeadings(input?: ArchitectInput): string[] {
        const city = String(input?.city || '').trim();
        const geoAreas = this.getGeoAreas(input, 6); // Use more if available
        
        if (geoAreas.length >= 3) {
            return [
                `Cobertura real en ${geoAreas.slice(0, 3).join(', ')} y todo ${city}`,
                `Cómo se organiza la asistencia técnica en ${geoAreas[0]} y alrededores`,
                `Soporte directo para vecinos de ${city}`
            ];
        }

        if (geoAreas.length === 2) {
            return [
                `Dónde solemos intervenir entre ${geoAreas[0]} y ${geoAreas[1]}`,
                `Cómo coordinamos cobertura desde ${city}`,
                `Qué confirmar antes de desplazar equipo`
            ];
        }

        if (geoAreas.length === 1) {
            return [
                `Cobertura habitual en ${geoAreas[0]} y zonas próximas`,
                `Cómo se organiza la agenda local en ${city}`,
                `Qué conviene validar antes de confirmar cobertura`
            ];
        }

        return [
            `Dónde solemos intervenir en ${city}`,
            'Cómo se organiza la agenda local asistencial',
            'Qué conviene validar antes de confirmar cobertura'
        ];
    }

    private buildLocalFaqQuestion(input?: ArchitectInput): string | undefined {
        const geoAreas = this.getGeoAreas(input, 2);
        if (geoAreas.length >= 2) return `¿También atendéis ${geoAreas[0]} y ${geoAreas[1]}?`;
        if (geoAreas.length === 1) return `¿También atendéis la zona de ${geoAreas[0]}?`;
        return undefined;
    }


    private sanitizePlanningCopy(value: any, input?: ArchitectInput): string {
        let text = String(value || '').replace(/\s+/g, ' ').trim();
        if (!text) return '';

        text = text
            .replace(/^La página debe explicar\s*/i, '')
            .replace(/^La página explica\s*/i, '')
            .replace(/^Se explica\s*/i, '')
            .replace(/^La estructura prioriza\s*/i, '')
            .replace(/^La comparativa ordena\s*/i, '')
            .replace(/^La página aclara\s*/i, '');

        if (input?.city) {
            text = text.replace(/\bEn\s*,/g, `En ${input.city},`);
            text = text.replace(/\ben\s+compensa\b/gi, `en ${input.city} compensa`);
        }

        text = text.replace(/^servicios,\s*/i, '');
        return text.trim().replace(/^[a-záéíóúñ]/, c => c.toUpperCase());
    }

    private buildHeroSubtitle(input: ArchitectInput, pageType: string): string {
        const city = String(input.city || '').trim();
        const geoAreas = this.getGeoAreas(input, 2);

        switch (pageType) {
            case 'urgent':
                return `Atención prioritaria en ${city} con diagnóstico claro, explicación técnica y una salida útil cuando el caso no puede esperar.`;
            case 'service_area':
                return geoAreas.length
                    ? `Cobertura operativa en ${city} y zonas próximas como ${geoAreas.join(' y ')}, con criterios claros sobre disponibilidad, desplazamiento y tipo de intervención.`
                    : `Cobertura operativa en ${city} con criterios claros sobre disponibilidad, desplazamiento y tipo de intervención.`;
            case 'comparison':
                return `Comparativa útil para elegir en ${city} con mejor criterio técnico, sin promesas absolutas ni copy genérico de plantilla.`;
            case 'guide':
                return `Guía práctica en ${city} para entender opciones, errores frecuentes y decisiones útiles antes de contratar.`;
            default:
                return geoAreas.length
                    ? `Servicio de ${input.niche} en ${city} con proceso claro, señales de confianza verificables y cobertura útil en zonas como ${geoAreas.join(' y ')}.`
                    : `Servicio de ${input.niche} en ${city} con proceso claro, señales de confianza verificables y orientación útil antes de contratar.`;
        }
    }

    private buildMetaDescription(input: ArchitectInput, pageType: string): string {
        const city = String(input.city || '').trim();
        const niche = String(input.niche || '').trim().toLowerCase();

        switch (pageType) {
            case 'urgent':
                return `${input.niche} en ${city} con atención prioritaria, diagnóstico claro y proceso explicado sin promesas irreales.`;
            case 'comparison':
                return `Comparativa de ${niche} en ${city} con criterios técnicos, factores que cambian el servicio y siguiente paso claro.`;
            case 'guide':
                return `Guía de ${niche} en ${city} con dudas frecuentes, criterios de decisión y orientación útil antes de contratar.`;
            default:
                return `${input.niche} en ${city} con proceso claro, cobertura real y señales de confianza útiles antes de contratar.`;
        }
    }

    private resolveHeroTrustBullets(input: ArchitectInput): string[] {
        const strategyTrust = this.uniqueNormalizedStrings(input.strategicAnalysis?.trustAssets || [], 4);
        const briefTrust = this.extractBriefItems('SEÑALES DE CONFIANZA REALES', 4);
        const fallback = ['Medición previa en obra', 'Materiales y herrajes definidos', 'Garantía por escrito'];
        return this.uniqueNormalizedStrings([...strategyTrust, ...briefTrust, ...fallback], 3).slice(0, 3);
    }

    private buildDefaultSchemaTypes(input: ArchitectInput, sections: any[] = []): string[] {
        const fromStrategy = Array.isArray(input.strategicAnalysis?.schemaTypes) ? input.strategicAnalysis.schemaTypes : [];
        const hasFaq = (Array.isArray(sections) ? sections : []).some((section: any) => section?.block_type === 'faq');
        return this.uniqueNormalizedStrings([
            ...fromStrategy,
            'LocalBusiness',
            'Service',
            'WebPage',
            'BreadcrumbList',
            ...(hasFaq ? ['FAQPage'] : [])
        ], 6);
    }

    private buildDefaultContentRules(input: ArchitectInput): any {
        return {
            prohibitedClaims: this.uniqueNormalizedStrings([
                '20 minutos garantizados',
                'llegamos en 15 minutos',
                'apertura siempre sin daños',
                'sin romper nunca',
                'garantía de 10 años',
                'precio exacto por teléfono',
                'somos los más baratos'
            ], 7),
            factOnlyFields: ['address', 'phone'],
            maxBrandMentionsPerSection: 1,
            differentiationRequirements: this.uniqueNormalizedStrings([
                'incluir proceso técnico claro',
                'explicar factores que cambian el presupuesto',
                'repartir pruebas de confianza verificables',
                'evitar claims absolutos o tiempos inventados'
            ], 4)
        };
    }

    private summarizeLinks(linkingContext?: ArchitectLinkContext): string {
        if (!linkingContext) return 'sin enlaces relevantes';

        const out: string[] = [];
        const pushPair = (label: string, items: any[]) => {
            const cleaned = (Array.isArray(items) ? items : [])
                .map((item: any) => item?.anchor || item?.slug || item?.url || item?.label || item?.title)
                .filter(Boolean)
                .slice(0, 4);
            if (cleaned.length) out.push(`${label}: ${cleaned.join(', ')}`);
        };

        pushPair('ascendentes', (linkingContext as any).upwardLinks || []);
        pushPair('laterales', (linkingContext as any).lateralLinks || []);
        pushPair('money', (linkingContext as any).moneyLinks || []);
        pushPair('relacionados', (linkingContext as any).relatedLinks || []);

        if (Array.isArray((linkingContext as any).localAreas) && (linkingContext as any).localAreas.length) {
            out.push(`zonas: ${(linkingContext as any).localAreas.slice(0, 4).join(', ')}`);
        }

        if (Array.isArray((linkingContext as any).clusterKeywords) && (linkingContext as any).clusterKeywords.length) {
            out.push(`targets cluster: ${(linkingContext as any).clusterKeywords.slice(0, 4).join(', ')}`);
        }

        return out.length ? out.join(' | ') : 'sin enlaces relevantes';
    }

    private findClosestMatch(value: string, allowed: string[], fallback: string): string {
        if (!allowed?.length) return fallback;
        if (!value) return fallback;

        const normalized = String(value).toLowerCase().trim();
        if (allowed.includes(normalized)) return normalized;

        const scored = allowed.map(option => {
            const candidate = option.toLowerCase().trim();
            let score = 0;
            if (candidate === normalized) score += 100;
            if (candidate.includes(normalized)) score += 40;
            if (normalized.includes(candidate)) score += 30;
            for (const token of normalized.split(/[_\-\s]+/)) {
                if (candidate.split(/[_\-\s]+/).includes(token)) score += 10;
            }
            return { option, score };
        }).sort((a, b) => b.score - a.score);

        return scored[0]?.score > 0 ? scored[0].option : fallback;
    }

    private pickResolvedVariant(section: any, spec: any, input: ArchitectInput, preferredFormat: string, layoutHint: string): string {
        const allowed = Array.isArray(spec?.allowedVisualVariants) ? spec.allowedVisualVariants : [];
        const candidatePool = Array.isArray(section?.candidate_visual_variants)
            ? section.candidate_visual_variants.filter((v: string) => allowed.includes(v))
            : [];

        const normalizedDirectVariant = allowed.includes(section?.visual_variant)
            ? section.visual_variant
            : this.findClosestMatch(section?.visual_variant, allowed, spec?.defaultVisualVariant || 'default');

        const pool = uniqueStrings([
            ...candidatePool,
            normalizedDirectVariant,
            spec?.defaultVisualVariant,
            ...rotateSeeded(allowed, buildSeed(input.niche, input.city, section?.block_type, section?.section_id, preferredFormat, layoutHint))
        ]);

        return pickSeeded(pool.length ? pool : ['default'], buildSeed(input.niche, input.city, section?.section_id, section?.block_type, preferredFormat, layoutHint));
    }

    private normalizeSectionVisualContract(section: any, input: ArchitectInput): any {
        const spec = BLOCK_VISUAL_SPECS[section.block_type as keyof typeof BLOCK_VISUAL_SPECS];

        if (!spec) {
            return {
                ...section,
                preferred_format: section.preferred_format || 'prose',
                layout_hint: section.layout_hint || 'full_width_text',
                content_density: section.content_density || 'standard',
                visual_variant: section.visual_variant || 'default'
            };
        }

        const preferred_format = spec.allowedFormats.includes(section.preferred_format)
            ? section.preferred_format
            : this.findClosestMatch(section.preferred_format, spec.allowedFormats, spec.defaultFormat);

        const layout_hint = spec.allowedLayouts.includes(section.layout_hint)
            ? section.layout_hint
            : this.findClosestMatch(section.layout_hint, spec.allowedLayouts, spec.defaultLayout);

        const content_density = ['compact', 'standard', 'rich'].includes(section.content_density)
            ? section.content_density
            : spec.densityBias;

        return {
            ...section,
            preferred_format,
            layout_hint,
            content_density,
            visual_variant: this.pickResolvedVariant(section, spec, input, preferred_format, layout_hint),
            visual_spec: {
                spacingProfile: spec.spacingProfile,
                emphasis: spec.emphasis,
                mobilePattern: spec.mobilePattern,
                decorativeLevel: spec.decorativeLevel
            }
        };
    }

    private sanitizeBlueprintSections(sections: any[]): any[] {
        if (!Array.isArray(sections)) return [];

        return sections
            .map((section: any) => ({
                ...section,
                block_type: String(section?.block_type || section?.blockType || '').toLowerCase().trim(),
                blockType: String(section?.block_type || section?.blockType || '').toLowerCase().trim(),
            }))
            .filter((section: any) => ALLOWED_BLOCK_TYPES.has(section.block_type));
    }

    private buildHero(input: ArchitectInput, pageType: string): any {
        const niche = String(input.niche || '').trim();
        const city = String(input.city || '').trim();
        const lowered = niche.toLowerCase();
        const variants: Record<string, { h1: string; subtitle: string; cta_text: string; }> = {
            urgent: {
                h1: `${niche} en ${city} con prioridad operativa y criterio técnico`,
                subtitle: this.buildHeroSubtitle(input, 'urgent'),
                cta_text: 'Solicitar atención urgente'
            },
            service_area: {
                h1: `${niche} en ${city} con cobertura real por zonas`,
                subtitle: this.buildHeroSubtitle(input, 'service_area'),
                cta_text: 'Consultar cobertura'
            },
            comparison: {
                h1: `Cómo valorar ${lowered} en ${city} con criterio técnico`,
                subtitle: this.buildHeroSubtitle(input, 'comparison'),
                cta_text: 'Pedir orientación'
            },
            guide: {
                h1: `Guía práctica de ${lowered} en ${city}`,
                subtitle: this.buildHeroSubtitle(input, 'guide'),
                cta_text: 'Hablar con un especialista'
            },
            service: {
                h1: `${niche} en ${city} con diagnóstico claro y cobertura real`,
                subtitle: this.buildHeroSubtitle(input, 'service'),
                cta_text: 'Solicitar presupuesto'
            }
        };

        const selected = variants[pageType] || variants.service;

        return {
            h1: selected.h1,
            subtitle: selected.subtitle,
            trust_bullets: this.resolveHeroTrustBullets(input),
            cta_text: selected.cta_text,
            hero_role: 'conversion',
            visual_intent: 'high_impact'
        };
    }


    private buildFaqQuestions(niche: string, city: string, input?: ArchitectInput): string[] {
        const normalizedNiche = String(niche || '').trim().toLowerCase();
        const realFaqs = this.extractBriefItems('FAQS REALES A PRIORIZAR', 6);
        if (realFaqs.length) {
            return rotateSeeded(realFaqs, buildSeed(niche, city, 'faq_questions')).slice(0, 4);
        }

        const localQuestion = this.buildLocalFaqQuestion(input);

        const generic = [
            `¿Qué incluye el servicio de ${normalizedNiche}?`,
            `¿Cómo se organiza una intervención en ${city}?`,
            '¿Qué conviene preparar antes de contratar?',
            '¿Qué diferencias suele haber entre casos?',
            `¿Qué influye en el presupuesto de ${normalizedNiche}?`,
            `¿Cuándo conviene reparar y cuándo sustituir una pieza de ${normalizedNiche}?`
        ];

        const pool = localQuestion ? [localQuestion, ...generic] : generic;
        return rotateSeeded(pool, buildSeed(niche, city, 'faq_questions')).slice(0, 4);
    }

    private generateMandatorySection(type: string, niche: string, city: string, input?: ArchitectInput): any {
        const n = niche.charAt(0).toUpperCase() + niche.slice(1);

        switch (type) {
            case 'services_grid':
                return {
                    section_id: 'servicios',
                    h2: `Qué resolvemos en ${city}`,
                    h3s: [
                        `Asistencia técnica de ${n.toLowerCase()} en ${city}`,
                        `Atención de casos habituales en ${city}`,
                        `Diagnóstico y soluciones de ${n.toLowerCase()}`,
                        `Criterios para una intervención segura`
                    ],
                    block_type: 'services_grid',
                    preferred_format: 'cards',
                    content_density: 'standard',
                    factuality_level: 'editorial',
                    mobile_priority: 'high',
                    layout_hint: 'boxed_content',
                    objective: 'Explicar la oferta principal con claridad comercial.',
                    target_words: 420,
                    expansion_slots: 5,
                    evidence_requirements: ['criterio_tecnico', 'caso_tipico', 'microprueba'],
                    depth_mode: 'deep',
                    visual_intent: 'editorial',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['grid_cards', 'stacked_cards']
                };
            case 'process_steps':
                return {
                    section_id: 'como-trabajamos',
                    h2: `Cómo se organiza una intervención de ${n.toLowerCase()} en ${city}`,
                    h3s: [
                        'Contacto inicial y toma de datos',
                        'Valoración del estado y propuesta técnica',
                        'Ejecución con materiales adecuados',
                        'Verificación final y entrega'
                    ],
                    block_type: 'process_steps',
                    preferred_format: 'bullets',
                    content_density: 'standard',
                    factuality_level: 'strict',
                    mobile_priority: 'high',
                    layout_hint: 'split_feature',
                    objective: 'Reducir incertidumbre explicando el proceso.',
                    target_words: 280,
                    expansion_slots: 4,
                    evidence_requirements: ['criterio_tecnico', 'error_comun', 'microprueba'],
                    depth_mode: 'standard',
                    visual_intent: 'editorial',
                    silence_priority: 'low',
                    candidate_visual_variants: ['steps_split', 'timeline_compact']
                };
            case 'urgency_panel':
                return {
                    section_id: 'urgencia',
                    h2: `Atención prioritaria cuando el caso no puede esperar`,
                    h3s: ['Qué se prioriza', 'Cómo pedir ayuda', 'Qué preparar antes de llamar'],
                    block_type: 'urgency_panel',
                    preferred_format: 'bullets',
                    content_density: 'compact',
                    factuality_level: 'strict',
                    mobile_priority: 'high',
                    layout_hint: 'split_feature',
                    objective: 'Captar intención urgente sin prometer tiempos falsos.',
                    target_words: 150,
                    expansion_slots: 3,
                    evidence_requirements: ['objecion', 'decision_factor', 'microprueba'],
                    depth_mode: 'compact',
                    visual_intent: 'high-tension',
                    silence_priority: 'low',
                    candidate_visual_variants: ['alert_panel', 'priority_split']
                };
            case 'local_proof':
                return {
                    section_id: 'zonas',
                    h2: `Cobertura real en ${city}`,
                    h3s: this.buildLocalProofHeadings(input),
                    block_type: 'local_proof',
                    preferred_format: 'trust_cards',
                    content_density: 'standard',
                    factuality_level: 'strict',
                    mobile_priority: 'normal',
                    layout_hint: 'two_column_trust',
                    objective: 'Demostrar presencia local sin inventar datos.',
                    target_words: 220,
                    expansion_slots: 3,
                    evidence_requirements: ['microprueba', 'caso_tipico', 'decision_factor'],
                    depth_mode: 'standard',
                    visual_intent: 'supporting',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['evidence_stack', 'list_detailed']
                };
            case 'price_guidance':
                return {
                    section_id: 'guia-precios',
                    h2: `Qué influye en el presupuesto de ${n.toLowerCase()} en ${city}`,
                    h3s: ['Qué cambia según materiales y medidas', 'Cómo comparar propuestas sin fijarte solo en el precio', 'Qué errores encarecen un proyecto'],
                    block_type: 'price_guidance',
                    preferred_format: 'prose',
                    content_density: 'standard',
                    factuality_level: 'editorial',
                    mobile_priority: 'normal',
                    layout_hint: 'full_width_text',
                    objective: 'Resolver objeciones sobre presupuesto sin dar precios exactos.',
                    target_words: 240,
                    expansion_slots: 4,
                    evidence_requirements: ['decision_factor', 'objecion', 'microprueba'],
                    depth_mode: 'standard',
                    visual_intent: 'supporting',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['editorial_text', 'highlight_panel']
                };
            case 'faq':
                return {
                    section_id: 'faq',
                    h2: `Preguntas frecuentes sobre ${n.toLowerCase()} en ${city}`,
                    h3s: this.buildFaqQuestions(n, city, input),
                    block_type: 'faq',
                    preferred_format: 'faq',
                    content_density: 'standard',
                    factuality_level: 'editorial',
                    mobile_priority: 'normal',
                    layout_hint: 'boxed_content',
                    objective: 'Resolver dudas y frenos de compra.',
                    target_words: 320,
                    expansion_slots: 5,
                    evidence_requirements: ['objecion', 'caso_tipico', 'error_comun'],
                    depth_mode: 'standard',
                    visual_intent: 'editorial',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['accordion_clean', 'faq_cards']
                };
            case 'trust_band':
                return {
                    section_id: 'senales-confianza',
                    h2: `Señales de confianza que conviene exigir antes de contratar`,
                    h3s: ['Garantía por escrito', 'Materiales y herrajes verificables', 'Presupuesto detallado tras visita'],
                    block_type: 'trust_band',
                    preferred_format: 'trust_cards',
                    content_density: 'compact',
                    factuality_level: 'strict',
                    mobile_priority: 'high',
                    layout_hint: 'two_column_trust',
                    objective: 'Repartir pruebas de confianza fuera del CTA final.',
                    target_words: 130,
                    expansion_slots: 3,
                    evidence_requirements: ['microprueba', 'decision_factor'],
                    depth_mode: 'compact',
                    visual_intent: 'supporting',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['signal_grid', 'static_pills']
                };
            case 'comparison_table':
                return {
                    section_id: 'comparativa',
                    h2: `Cómo comparar opciones de ${n.toLowerCase()} en ${city}`,
                    h3s: ['Qué cambia según el caso', 'Qué aporta valor', 'Cómo decidir'],
                    block_type: 'comparison_table',
                    preferred_format: 'table',
                    content_density: 'standard',
                    factuality_level: 'editorial',
                    mobile_priority: 'normal',
                    layout_hint: 'boxed_content',
                    objective: 'Facilitar una comparación útil sin claims agresivos.',
                    target_words: 240,
                    expansion_slots: 3,
                    evidence_requirements: ['decision_factor', 'objecion'],
                    depth_mode: 'standard',
                    visual_intent: 'editorial',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['comparison_table_standard']
                };
            case 'checklist':
                return {
                    section_id: 'checklist',
                    h2: `Qué revisar antes de contratar ${n.toLowerCase()} en ${city}`,
                    h3s: ['Puntos mínimos', 'Errores comunes', 'Verificación final'],
                    block_type: 'checklist',
                    preferred_format: 'bullets',
                    content_density: 'standard',
                    factuality_level: 'strict',
                    mobile_priority: 'normal',
                    layout_hint: 'boxed_content',
                    objective: 'Aportar valor informativo accionable.',
                    target_words: 220,
                    expansion_slots: 3,
                    evidence_requirements: ['error_comun', 'decision_factor'],
                    depth_mode: 'standard',
                    visual_intent: 'editorial',
                    silence_priority: 'medium',
                    candidate_visual_variants: ['checklist_standard']
                };
            case 'map':
                return {
                    section_id: 'donde-estamos',
                    h2: `Cobertura y ubicación operativa en ${city}`,
                    h3s: this.getGeoAreas(input, 4).length > 0 ? this.getGeoAreas(input, 4) : [`Zonas norte de ${city}`, `Área central y centro histórico`, `Zonas sur y periferia de ${city}`],
                    block_type: 'map',
                    preferred_format: 'prose',
                    content_density: 'compact',
                    factuality_level: 'strict',
                    mobile_priority: 'low',
                    layout_hint: 'full_width_text',
                    objective: 'Dar apoyo visual a la cobertura local.',
                    target_words: 30,
                    expansion_slots: 2,
                    evidence_requirements: ['microprueba'],
                    depth_mode: 'compact',
                    visual_intent: 'supporting',
                    silence_priority: 'high',
                    candidate_visual_variants: ['spotlight_card', 'boxed_with_text']
                };
            case 'cta_panel':
            default:
                return {
                    section_id: 'contacto',
                    h2: `Solicita orientación profesional en ${city}`,
                    h3s: ['Cuéntanos el caso y las medidas', 'Te orientamos sin promesas irreales'],
                    block_type: 'cta_panel',
                    preferred_format: 'prose',
                    content_density: 'compact',
                    factuality_level: 'strict',
                    mobile_priority: 'high',
                    layout_hint: 'minimal_centered',
                    objective: 'Cerrar la página con una llamada a la acción clara.',
                    target_words: 90,
                    expansion_slots: 2,
                    evidence_requirements: ['microprueba'],
                    depth_mode: 'compact',
                    visual_intent: 'high-tension',
                    silence_priority: 'low',
                    candidate_visual_variants: ['cta_compact', 'cta_centered']
                };
        }
    }

    private reorderSectionsByArchetype(pageType: string, sections: any[], input: ArchitectInput): any[] {
        const archetypes = PAGE_ARCHETYPES[pageType] || PAGE_ARCHETYPES.service;
        const archetype = pickSeeded(archetypes, buildSeed(input.niche, input.city, pageType, input.intentModel?.primaryKeyword));
        const buckets = new Map<string, any[]>();

        for (const section of sections) {
            const key = section.block_type;
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(section);
        }

        const ordered: any[] = [];
        for (const type of archetype.orderedBlockTypes || []) {
            const bucket = buckets.get(type) || [];
            if (bucket.length) ordered.push(bucket.shift()!);
        }

        const leftovers = Array.from(buckets.values()).flat();
        return [...ordered, ...leftovers].map((section, index) => ({
            ...section,
            order_hint: index,
            structural_archetype: archetype.id
        }));
    }

    private ensureMapAfterLocalProof(sections: any[], input: ArchitectInput): any[] {
        const localIdx = sections.findIndex((s: any) => s.block_type === 'local_proof');
        const mapIdx = sections.findIndex((s: any) => s.block_type === 'map');

        if (localIdx === -1) return sections;

        if (mapIdx === -1) {
            sections.splice(localIdx + 1, 0, this.generateMandatorySection('map', input.niche, input.city, input));
            return sections;
        }

        if (mapIdx !== localIdx + 1) {
            const [mapSection] = sections.splice(mapIdx, 1);
            sections.splice(localIdx + 1, 0, mapSection);
        }

        return sections;
    }

    private distributeExtraWordsByQuality(sections: any[], contentBudget: number): any[] {
        if (!Array.isArray(sections) || sections.length === 0) return sections;

        const expandableWeights: Record<string, number> = {
            services_grid: 0.32,
            process_steps: 0.24,
            price_guidance: 0.18,
            faq: 0.18,
            local_proof: 0.08
        };

        const hardCaps: Record<string, number> = {
            services_grid: 700,
            process_steps: 520,
            price_guidance: 420,
            faq: 560,
            local_proof: 320,
            urgency_panel: 180,
            cta_panel: 120,
            trust_band: 180,
            map: 40
        };

        const currentTotal = sections.reduce((sum, section) => sum + Number(section?.target_words || 0), 0);
        if (currentTotal >= contentBudget) return sections;

        const extra = Math.max(0, contentBudget - currentTotal);
        const eligible = sections.filter(section => Object.prototype.hasOwnProperty.call(expandableWeights, section.block_type));
        if (!eligible.length) return sections;

        for (const section of eligible) {
            const weight = expandableWeights[section.block_type] || 0;
            const add = Math.round(extra * weight);
            const cap = hardCaps[section.block_type] || section.target_words + add;
            section.target_words = Math.min(Number(section.target_words || 0) + add, cap);
        }

        return sections;
    }

    private buildDeterministicBlueprint(input: ArchitectInput, pageType: string): any {
        const keyword = input.intentModel?.primaryKeyword || `${input.niche} ${input.city}`;
        const hero = this.buildHero(input, pageType);

        const sectionMatrix: Record<string, string[]> = {
            service: ['services_grid', 'process_steps', 'urgency_panel', 'local_proof', 'price_guidance', 'faq', 'trust_band', 'cta_panel'],
            urgent: ['urgency_panel', 'services_grid', 'process_steps', 'local_proof', 'faq', 'cta_panel'],
            service_area: ['local_proof', 'map', 'services_grid', 'process_steps', 'faq', 'cta_panel'],
            comparison: ['comparison_table', 'services_grid', 'price_guidance', 'local_proof', 'faq', 'cta_panel'],
            guide: ['process_steps', 'checklist', 'services_grid', 'faq', 'local_proof', 'cta_panel'],
            faq: ['faq', 'services_grid', 'local_proof', 'price_guidance', 'cta_panel'],
            home_local: ['local_proof', 'services_grid', 'process_steps', 'price_guidance', 'faq', 'trust_band', 'cta_panel'],
            category: ['services_grid', 'process_steps', 'local_proof', 'faq', 'cta_panel']
        };

        const selectedTypes = sectionMatrix[pageType] || sectionMatrix.service;
        let sections = selectedTypes.map(type => this.generateMandatorySection(type, input.niche, input.city, input)).filter(Boolean);

        sections = this.reorderSectionsByArchetype(pageType, sections, input);
        sections = this.ensureMapAfterLocalProof(sections, input);
        sections = this.sanitizeBlueprintSections(sections.map(section => this.normalizeSectionVisualContract(section, input)));
        sections = this.distributeExtraWordsByQuality(sections, Math.max(1200, Number(input.word_count_target || 1800) - 180));

        return {
            degraded: false,
            degradationReason: undefined,
            h1: hero.h1,
            meta_title: this.truncate(hero.h1, 60),
            meta_description: this.buildMetaDescription(input, pageType),
            page_skeleton: pageType === 'guide' ? 'editorial-longform' : 'conversion-funnel',
            hero,
            sections,
            seoBrief: {
                titleStrategy: `${keyword} + beneficio real + ${input.city}`,
                metaDescriptionStrategy: 'Beneficio local + proceso claro + CTA',
                canonicalSlug: '',
                schemaTypes: this.buildDefaultSchemaTypes(input, sections),
                faqEligible: true,
                localModifiers: [input.city]
            },
            contentRules: this.buildDefaultContentRules(input)
        };
    }

    private cleanBlueprintText(value: any, fallback = ''): string {
        const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
        return cleaned || fallback;
    }

    private cityRegex(city: string): RegExp {
        const escaped = String(city || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp('\\b' + escaped + '\\b', 'i');
    }

    private shouldFallbackHeadline(headline: string, city: string): boolean {
        const current = this.cleanBlueprintText(headline);
        if (!current) return true;
        if (!this.cityRegex(city).test(current)) return true;
        return /(protege tu propiedad|soluciones personalizadas|expertos?\b|compromiso total|calidad garantizada)/i.test(current);
    }

    private harmonizeBlueprint(input: ArchitectInput, pageType: string, raw: any): any {
        const base = this.buildDeterministicBlueprint(input, pageType);
        const rawHero = typeof raw?.hero === 'object' && raw?.hero ? raw.hero : {};

        let h1 = this.cleanBlueprintText(rawHero.h1 || raw?.h1, base.h1);
        if (this.shouldFallbackHeadline(h1, input.city)) {
            h1 = base.h1;
        }

        const hero = {
            ...base.hero,
            ...rawHero,
            h1,
            subtitle: this.sanitizePlanningCopy(this.cleanBlueprintText(rawHero.subtitle, base.hero.subtitle), input) || base.hero.subtitle,
            trust_bullets: this.uniqueNormalizedStrings([
                ...(Array.isArray(rawHero.trust_bullets) ? rawHero.trust_bullets : []),
                ...base.hero.trust_bullets
            ], 3),
            cta_text: this.cleanBlueprintText(rawHero.cta_text, base.hero.cta_text),
            hero_role: 'conversion',
            visual_intent: this.cleanBlueprintText(rawHero.visual_intent, base.hero.visual_intent)
        };

        let sections = this.sanitizeBlueprintSections(
            Array.isArray(raw?.sections) && raw.sections.length ? raw.sections : base.sections
        ).map((section) => this.normalizeSectionVisualContract(section, input));

        if (sections.length < Math.max(5, base.sections.length - 2)) {
            sections = base.sections;
        } else {
            const existing = new Set(sections.map((section: any) => section.block_type));
            for (const fallbackSection of base.sections) {
                if (!existing.has(fallbackSection.block_type)) {
                    sections.push(fallbackSection);
                }
            }
            sections = this.reorderSectionsByArchetype(pageType, sections, input);
            sections = this.ensureMapAfterLocalProof(sections, input);
            sections = this.sanitizeBlueprintSections(sections.map((section) => this.normalizeSectionVisualContract(section, input)));
            sections = this.distributeExtraWordsByQuality(sections, Math.max(1200, Number(input.word_count_target || 1800) - 180));
        }

        const schemaTypes = this.uniqueNormalizedStrings([
            ...(Array.isArray(raw?.seoBrief?.schemaTypes) ? raw.seoBrief.schemaTypes : []),
            ...this.buildDefaultSchemaTypes(input, sections)
        ], 6);
        const hasFaq = sections.some((section: any) => section?.block_type === 'faq');
        const metaTitleCandidate = this.cleanBlueprintText(raw?.meta_title, '');

        return {
            ...base,
            ...raw,
            degraded: false,
            degradationReason: undefined,
            h1,
            meta_title: this.truncate(
                metaTitleCandidate && this.cityRegex(input.city).test(metaTitleCandidate)
                    ? metaTitleCandidate
                    : h1,
                60
            ),
            meta_description: this.sanitizePlanningCopy(this.cleanBlueprintText(raw?.meta_description, base.meta_description), input) || base.meta_description,
            hero,
            sections,
            page_skeleton: this.cleanBlueprintText(raw?.page_skeleton, base.page_skeleton),
            seoBrief: {
                ...base.seoBrief,
                ...(raw?.seoBrief || {}),
                schemaTypes,
                faqEligible: hasFaq,
                localModifiers: [input.city]
            },
            contentRules: {
                ...base.contentRules,
                ...(raw?.contentRules || {})
            }
        };
    }

    private buildLeanPrompt(input: ArchitectInput, knowledge: string, pageType: string): string {
        const entities = (input.entities || []).slice(0, 8).join(', ') || 'sin entidades relevantes';
        const links = this.summarizeLinks(input.linkingContext);
        const originality = this.truncate(input.originalityDirective, 260) || 'sin restricciones adicionales';
        const nicheBrief = this.truncate(this.nicheBrief, 700);
        const knowledgeBrief = this.truncate(knowledge, 900);

        return `
Eres un arquitecto SEO local. Devuelve SOLO JSON válido.

CONTEXTO
- Nicho: ${input.niche}
- Ciudad: ${input.city}
- PageType: ${pageType}
- Intent: ${input.intentModel?.primaryIntent}
- Keyword: ${input.intentModel?.primaryKeyword || input.niche}
- Objetivo total: ${input.word_count_target} palabras
- Entidades: ${entities}
- Enlaces disponibles: ${links}
- Originalidad: ${originality}

GUARDRAILS
${knowledgeBrief}
${nicheBrief}

REGLAS
- Usa SOLO block_type permitidos: services_grid, process_steps, urgency_panel, local_proof, faq, cta_panel, price_guidance, trust_band, map, comparison_table, checklist.
- Para service incluye obligatoriamente: services_grid, process_steps, urgency_panel, local_proof, price_guidance, faq, trust_band y cta_panel.
- Para service prioriza una arquitectura rica de 7 a 9 secciones útiles, no una versión mínima.
- No repitas block_type.
- target_words realistas y repartidos con intención editorial.
- El hero debe evitar clichés como "soluciones personalizadas", "protege tu propiedad", "expertos" o bullets vacíos tipo "confianza" y "seguridad".
- El hero debe traer 3 trust_bullets concretos y verificables.
- La FAQ debe priorizar preguntas reales del nicho si están disponibles en los guardrails.
- No precios exactos.
- No tiempos inventados.
- Devuelve hero separado.

JSON
{
  "h1": "...",
  "meta_title": "...",
  "meta_description": "...",
  "page_skeleton": "conversion-funnel",
  "hero": {
    "h1": "...",
    "subtitle": "...",
    "trust_bullets": ["...", "..."],
    "cta_text": "...",
    "hero_role": "conversion",
    "visual_intent": "high_impact"
  },
  "sections": [
    {
      "section_id": "...",
      "h2": "...",
      "h3s": ["...", "...", "..."],
      "block_type": "...",
      "preferred_format": "...",
      "content_density": "standard",
      "factuality_level": "editorial",
      "mobile_priority": "normal",
      "layout_hint": "...",
      "objective": "...",
      "target_words": 200,
      "expansion_slots": 3,
      "evidence_requirements": ["..."],
      "visual_variant": "..."
    }
  ],
  "seoBrief": {
    "titleStrategy": "...",
    "metaDescriptionStrategy": "...",
    "schemaTypes": ["..."]
  },
  "contentRules": {
     "differentiationRequirements": ["..."],
     "prohibitedClaims": ["..."]
  }
}
`;
    }

    async execute(input: ArchitectInput): Promise<AgentResponse> {
        this.log(`Procesando arquitectura para: ${input.city} (${input.niche})`);

        const pageType = String(input.intentModel?.pageType || 'service').toLowerCase();
        
        // Deterministic Fallback if needed or requested
        if (vault.FORCE_DETERMINISTIC_PLANNING) {
            return {
                success: true,
                data: this.harmonizeBlueprint(input, pageType, this.buildDeterministicBlueprint(input, pageType))
            };
        }

        try {
            const knowledge = await this.getRelevantKnowledge(input.niche, input.city, [input.intentModel?.primaryKeyword || input.niche]);
            const prompt = this.buildLeanPrompt(input, knowledge, pageType);

            const startTime = Date.now();
            const response = await this.callModel(prompt, this.model, {
                temperature: 0.2,
                numPredict: 2800,
                timeoutMs: Number(vault.ARCHITECT_TIMEOUT_MS || 120000),
                json: true
            });

            const duration = Date.now() - startTime;
            const parsed = safeJsonParse(response);

            if (!parsed || !parsed.sections) {
                throw new Error('Invalid architect response format');
            }

            const finalBlueprint = this.harmonizeBlueprint(input, pageType, parsed);

            return {
                success: true,
                data: finalBlueprint,
                observability: {
                    duration,
                    model: this.model,
                    tokenUsage: response.length / 4 // approximation
                }
            };

        } catch (error: any) {
            this.log(`Error en Architect (LLM): ${error.message}. Activando fallback determinista.`);
            await this.rememberFailure({
                errorMessage: error.message,
                failureType: 'llm_fallback',
                niche: input.niche,
                city: input.city,
                lessonTitle: 'Caída a fallback determinista en Architect',
                lessonText: `Se generó timeout o error de estructura al generar blueprint. Se aplicó layout determinista.`,
            });
            return {
                success: true,
                data: this.harmonizeBlueprint(input, pageType, this.buildDeterministicBlueprint(input, pageType))
            };
        }
    }
}



