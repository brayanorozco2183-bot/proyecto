
import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { IntentModel } from '../types/pipeline_v2.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { ArchitectLinkContext } from '../internal-linking/types.js';
import { BLOCK_VISUAL_SPECS } from '../config/blockVisualSpecs.js';
import { PAGE_ARCHETYPES } from '../config/pageArchetypes.js';
import { buildSeed, pickSeeded, rotateSeeded, uniqueStrings } from '../utils/designSeed.js';

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

/**
 * ContentArchitectAgent - Phase B: Planning (Master Blueprint).
 * This agent designs the rhythmic structure and intent of the page
 * before any word is written.
 */
export class ContentArchitectAgent extends BaseAgent {
    private pickResolvedVariant(section: any, spec: any, input: ArchitectInput, preferredFormat: string, layoutHint: string): string {
        const allowed = Array.isArray(spec?.allowedVisualVariants) ? spec.allowedVisualVariants : [];
        const candidatePool = Array.isArray(section.candidate_visual_variants)
            ? section.candidate_visual_variants.filter((v: string) => allowed.includes(v))
            : [];

        const normalizedDirectVariant =
            allowed.includes(section.visual_variant)
                ? section.visual_variant
                : this.findClosestMatch(section.visual_variant, allowed, spec.defaultVisualVariant || 'default');

        const pool = uniqueStrings([
            ...candidatePool,
            normalizedDirectVariant,
            spec.defaultVisualVariant,
            ...rotateSeeded(allowed, buildSeed(input.niche, input.city, section.block_type, section.section_id, preferredFormat, layoutHint))
        ]);

        return pickSeeded(
            pool.length ? pool : ['default'],
            buildSeed(input.niche, input.city, section.section_id, section.block_type, preferredFormat, layoutHint)
        );
    }

    private reorderSectionsByArchetype(pageType: string, sections: any[], input: ArchitectInput): any[] {
        const archetypes = PAGE_ARCHETYPES[pageType] || PAGE_ARCHETYPES.service;
        const archetype = pickSeeded(archetypes, buildSeed(input.niche, input.city, pageType, input.intentModel?.primaryKeyword));

        const byType = new Map<string, any[]>();

        for (const section of sections) {
            const key = section.block_type || 'unknown';
            if (!byType.has(key)) byType.set(key, []);
            byType.get(key)!.push(section);
        }

        const ordered: any[] = [];

        for (const blockType of archetype.orderedBlockTypes) {
            const bucket = byType.get(blockType) || [];
            if (bucket.length) {
                ordered.push(bucket.shift()!);
            }
        }

        const leftovers = Array.from(byType.values()).flat();

        const result = [...ordered, ...leftovers].map((section, index) => ({
            ...section,
            order_hint: index,
            structural_archetype: archetype.id
        }));

        return result;
    }

    private enrichBlueprintWithArchetypeMeta(blueprint: any, pageType: string, input: ArchitectInput): any {
        const archetypes = PAGE_ARCHETYPES[pageType] || PAGE_ARCHETYPES.service;
        const archetype = pickSeeded(archetypes, buildSeed(input.niche, input.city, pageType, input.intentModel?.primaryKeyword));

        blueprint.page_skeleton = blueprint.page_skeleton || archetype.pageSkeleton;
        blueprint.layout_archetype = archetype.id;
        blueprint.pageComposition = archetype.pageComposition;
        blueprint.cadencePattern = archetype.cadencePattern;
        blueprint.proofStrategy = archetype.proofStrategy;
        blueprint.ctaStrategy = archetype.ctaStrategy;

        if (blueprint.hero) {
            blueprint.hero.hero_template = archetype.heroTemplate;
        }

        return blueprint;
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

        const isFormatValid = spec.allowedFormats.includes(section.preferred_format);
        const preferred_format = isFormatValid
            ? section.preferred_format
            : this.findClosestMatch(section.preferred_format, spec.allowedFormats, spec.defaultFormat);

        const isLayoutValid = spec.allowedLayouts.includes(section.layout_hint);
        const layout_hint = isLayoutValid
            ? section.layout_hint
            : this.findClosestMatch(section.layout_hint, spec.allowedLayouts, spec.defaultLayout);

        const content_density =
            section.content_density === 'compact' ||
                section.content_density === 'standard' ||
                section.content_density === 'rich'
                ? section.content_density
                : spec.densityBias;

        const resolvedVisualVariant = this.pickResolvedVariant(
            section,
            spec,
            input,
            preferred_format,
            layout_hint
        );

        if (section.preferred_format && section.preferred_format !== preferred_format) {
            this.logThought(`Normalized preferred_format for ${section.block_type}: ${section.preferred_format} -> ${preferred_format}`);
        }

        if (section.layout_hint && section.layout_hint !== layout_hint) {
            this.logThought(`Normalized layout_hint for ${section.block_type}: ${section.layout_hint} -> ${layout_hint}`);
        }

        if (section.visual_variant && section.visual_variant !== resolvedVisualVariant) {
            this.logThought(`Normalized visual_variant for ${section.block_type}: ${section.visual_variant} -> ${resolvedVisualVariant}`);
        }

        return {
            ...section,
            preferred_format,
            layout_hint,
            content_density,
            visual_variant: resolvedVisualVariant,
            visual_spec: {
                spacingProfile: spec.spacingProfile,
                emphasis: spec.emphasis,
                mobilePattern: spec.mobilePattern,
                decorativeLevel: spec.decorativeLevel
            }
        };
    }

    private findClosestMatch(value: string, allowed: string[], fallback: string): string {
        if (!allowed || allowed.length === 0) return fallback;
        if (!value) return fallback;

        const normalizedValue = value.toLowerCase().trim();

        if (allowed.includes(normalizedValue as any)) {
            return normalizedValue;
        }

        const scored = allowed.map(option => {
            const normalizedOption = option.toLowerCase().trim();

            let score = 0;

            if (normalizedOption === normalizedValue) score += 100;
            if (normalizedOption.includes(normalizedValue)) score += 40;
            if (normalizedValue.includes(normalizedOption)) score += 30;

            const valueParts = normalizedValue.split(/[_\-\s]+/);
            const optionParts = normalizedOption.split(/[_\-\s]+/);

            valueParts.forEach(vp => {
                if (optionParts.includes(vp)) score += 10;
            });

            return { option, score };
        });

        scored.sort((a, b) => b.score - a.score);

        return scored[0]?.score > 0 ? scored[0].option : fallback;
    }
    constructor() {
        super('Content_Architect_01', 'Planning Lead', 'Arquitecto de Contenidos', 'Diseñador de estructuras semánticas y blue-prints de conversión.', vault.OLLAMA_MODEL_RESEARCH);
    }

    private generateMandatorySection(type: string, niche: string, city: string): any {
        const n = niche.charAt(0).toUpperCase() + niche.slice(1);
        switch (type) {
            case 'urgency_panel':
                const urgencyH2 = pickSeeded(['Asistencia Inmediata', 'Servicio de Urgencia', 'Atención 24 Horas'], buildSeed(niche, city, 'urgency_h2'));
                return {
                    section_id: 'urgencia',
                    h2: urgencyH2,
                    h3s: ["Atención Inmediata", "Disponibilidad Total", "Servicio Técnico Especializado"],
                    block_type: "urgency_panel",
                    preferred_format: "bullets",
                    content_density: "compact",
                    factuality_level: "strict",
                    mobile_priority: "high",
                    layout_hint: "split_feature",
                    target_words: 150
                };
            case 'comparison_table':
                return {
                    section_id: 'comparativa-servicios',
                    h2: `Comparativa de opciones de ${n} en ${city}`,
                    h3s: ["Diferencias clave", "Qué cambia según el caso", "Cómo elegir"],
                    block_type: "comparison_table",
                    preferred_format: "table",
                    content_density: "standard",
                    factuality_level: "editorial",
                    mobile_priority: "normal",
                    layout_hint: "boxed_content",
                    target_words: 240
                };

            case 'case_story':
                return {
                    section_id: 'caso-real',
                    h2: `Situaciones reales de ${n} que solemos resolver en ${city}`,
                    h3s: ["Situación inicial", "Solución aplicada", "Resultado final"],
                    block_type: "case_story",
                    preferred_format: "prose",
                    content_density: "rich",
                    factuality_level: "editorial",
                    mobile_priority: "normal",
                    layout_hint: "split_feature",
                    target_words: 260
                };

            case 'objections':
                return {
                    section_id: 'objeciones',
                    h2: `Qué conviene revisar antes de contratar ${n} en ${city}`,
                    h3s: ["Tiempo", "Coste", "Proceso"],
                    block_type: "objections",
                    preferred_format: "faq",
                    content_density: "standard",
                    factuality_level: "editorial",
                    mobile_priority: "normal",
                    layout_hint: "minimal_centered",
                    target_words: 220
                };

            case 'micro_cta':
                return {
                    section_id: 'paso-siguiente',
                    h2: `Habla con un especialista en ${city}`,
                    h3s: ["Habla con nosotros"],
                    block_type: "micro_cta",
                    preferred_format: "prose",
                    content_density: "compact",
                    factuality_level: "strict",
                    mobile_priority: "high",
                    layout_hint: "minimal_centered",
                    target_words: 60
                };
            case 'services_grid':
                const servicesH2 = pickSeeded(['Qué resolvemos en ' + city, 'Servicios de ' + n + ' que más se solicitan en ' + city, 'Intervenciones habituales de ' + n + ' en ' + city], buildSeed(niche, city, 'services_h2'));
                return {
                    section_id: 'servicios',
                    h2: servicesH2,
                    h3s: [`Especialistas en ${n}`, "Soluciones Técnicas", "Mantenimiento Integral"],
                    block_type: "services_grid",
                    preferred_format: "cards",
                    content_density: "standard",
                    factuality_level: "editorial",
                    mobile_priority: "high",
                    layout_hint: "boxed_content",
                    target_words: 420
                };
            case 'local_proof':
                const localH2 = pickSeeded(['Cobertura real en ' + city, 'Dónde intervenimos en ' + city, 'Servicio local de ' + n + ' en ' + city], buildSeed(niche, city, 'local_h2'));
                return {
                    section_id: 'zonas',
                    h2: localH2,
                    h3s: ["Servicio en toda la zona", "Técnicos de Proximidad", "Asistencia Local"],
                    block_type: "local_proof",
                    preferred_format: "trust_cards",
                    content_density: "standard",
                    factuality_level: "strict",
                    mobile_priority: "normal",
                    layout_hint: "two_column_trust",
                    target_words: 220
                };
            case 'faq':
                const faqH2 = pickSeeded(['Preguntas frecuentes antes de contratar', 'Dudas habituales del servicio', 'Lo que más nos preguntan en ' + city], buildSeed(niche, city, 'faq_h2'));
                return {
                    section_id: 'faq',
                    h2: faqH2,
                    h3s: [
                        `¿Qué incluye vuestro servicio de ${n.toLowerCase()}?`,
                        `¿Cómo trabajáis cada proyecto en ${city}?`,
                        `¿Qué debo tener en cuenta antes de contratar ${n.toLowerCase()}?`
                    ],
                    block_type: "faq",
                    preferred_format: "faq",
                    content_density: "standard",
                    factuality_level: "editorial",
                    mobile_priority: "normal",
                    layout_hint: "boxed_content",
                    target_words: 300
                };
            case 'cta_panel':
                return {
                    section_id: 'contacto',
                    h2: `Pide orientación profesional en ${city}`,
                    h3s: ["Presupuesto sin compromiso", "Atención directa"],
                    block_type: "cta_panel",
                    preferred_format: "prose",
                    content_density: "compact",
                    factuality_level: "strict",
                    mobile_priority: "high",
                    layout_hint: "minimal_centered",
                    target_words: 80
                };
            case 'map':
                return {
                    section_id: 'donde-estamos',
                    h2: `Cobertura y Ubicación en ${city}`,
                    h3s: [],
                    block_type: "map",
                    preferred_format: "prose",
                    content_density: "compact",
                    factuality_level: "strict",
                    mobile_priority: "low",
                    layout_hint: "full_width_text",
                    target_words: 30
                };
            case 'checklist':
                return {
                    section_id: 'checklist-verificacion',
                    h2: `Qué revisar antes de contratar ${n} en ${city}`,
                    h3s: ["Puntos a revisar", "Criterios de calidad", "Verificación final"],
                    block_type: "checklist",
                    preferred_format: "bullets",
                    content_density: "standard",
                    factuality_level: "strict",
                    mobile_priority: "normal",
                    layout_hint: "boxed_content",
                    target_words: 200
                };
            case 'authority_note':
                return {
                    section_id: 'nota-autoridad',
                    h2: `Compromiso de Calidad en ${city}`,
                    h3s: ["Nuestra Filosofía", "Estándares Técnicos"],
                    block_type: "authority_note",
                    preferred_format: "prose",
                    content_density: "compact",
                    factuality_level: "strict",
                    mobile_priority: "low",
                    layout_hint: "minimal_centered",
                    target_words: 140
                };
            case 'price_guidance':
                const priceH2 = pickSeeded([
                    `Cómo valorar la calidad de ${n} en ${city}`,
                    `Guía de transparencia: ${n} en ${city}`,
                    `Lo que influye en el presupuesto de ${n.toLowerCase()} en ${city}`
                ], buildSeed(niche, city, 'price_h2'));
                return {
                    section_id: 'guia-precios',
                    h2: priceH2,
                    h3s: ["Qué influye en el presupuesto", "Qué cambia según el caso", "Cómo evitar sorpresas"],
                    block_type: "price_guidance",
                    preferred_format: "prose",
                    content_density: "standard",
                    factuality_level: "editorial",
                    mobile_priority: "normal",
                    layout_hint: "full_width_text",
                    target_words: 240,
                    visual_intent: "supporting"
                };

            case 'process_steps':
                return {
                    section_id: 'como-trabajamos',
                    h2: `Cómo se organiza una intervención de ${n} en ${city}`,
                    h3s: ["Diagnóstico", "Intervención", "Verificación final"],
                    block_type: "process_steps",
                    preferred_format: "bullets",
                    content_density: "standard",
                    factuality_level: "strict",
                    mobile_priority: "high",
                    layout_hint: "split_feature",
                    target_words: 280
                };

            case 'trust_band':
                const trustH2 = pickSeeded([
                    `Qué transmite confianza real antes de intervenir`,
                    `Por qué elegir nuestra asistencia de ${n.toLowerCase()} en ${city}`,
                    `Compromisos de calidad en cada servicio de ${n.toLowerCase()}`
                ], buildSeed(niche, city, 'trust_h2'));
                return {
                    section_id: 'senales-confianza',
                    h2: trustH2,
                    h3s: ["Atención profesional", "Transparencia", "Cobertura local"],
                    block_type: "trust_band",
                    preferred_format: "trust_cards",
                    content_density: "compact",
                    factuality_level: "strict",
                    mobile_priority: "high",
                    layout_hint: "two_column_trust",
                    target_words: 120,
                    visual_intent: "supporting"
                };
            default: return null;
        }
    }
    /**
     * Ensures proximity between local evidence and the map.
     */
    private enforceMapAfterLocalProof(sections: any[]): any[] {
        const localProofIdx = sections.findIndex(s => (s.block_type || s.blockType) === 'local_proof');
        const mapIdx = sections.findIndex(s => (s.block_type || s.blockType) === 'map');

        if (localProofIdx !== -1) {
            // Si el mapa ya existe pero no está justo después, lo movemos
            if (mapIdx !== -1 && mapIdx !== localProofIdx + 1) {
                const [mapSection] = sections.splice(mapIdx, 1);
                // Re-find index since it might have shifted
                const newLocalIdx = sections.findIndex(s => (s.block_type || s.blockType) === 'local_proof');
                sections.splice(newLocalIdx + 1, 0, mapSection);
            }
            // Si no existe el mapa, lo inyectamos
            else if (mapIdx === -1) {
                sections.splice(localProofIdx + 1, 0, {
                    block_type: 'map',
                    blockType: 'map', // Compatibility
                    h2: 'Donde nos encontramos',
                    section_id: 'donde-estamos',
                    target_words: 40,
                    preferred_format: 'prose',
                    layout_hint: 'full_width_text',
                    visual_intent: 'supporting',
                    content_density: 'compact'
                });
            }
        }
        return sections;
    }

    /**
     * Prevents consecutive blocks of the same type.
     */
    private deduplicateConsecutiveTypes(sections: any[]): any[] {
        if (!sections || sections.length < 2) return sections;
        return sections.filter((section, idx) => {
            if (idx === 0) return true;
            const prev = sections[idx - 1];
            return (section.block_type || section.blockType) !== (prev.block_type || prev.blockType);
        });
    }

    private scaleExpandableSections(sections: any[], contentBudget: number): any[] {
        if (!Array.isArray(sections) || sections.length === 0) return sections;

        const expandable = new Set(['services_grid', 'process_steps', 'price_guidance', 'faq']);
        const compact = new Set(['urgency_panel', 'cta_panel', 'map', 'micro_cta']);

        const currentTotal = sections.reduce((sum, s) => sum + (s.target_words || 0), 0);
        if (currentTotal <= 0 || currentTotal >= contentBudget) return sections;

        let remaining = contentBudget - currentTotal;

        const expandableSections = sections.filter((s: any) => expandable.has(s.block_type));
        if (expandableSections.length === 0) return sections;

        const totalExpandable = expandableSections.reduce((sum, s) => sum + (s.target_words || 0), 0) || 1;

        sections.forEach((s: any) => {
            if (expandable.has(s.block_type)) {
                const weight = (s.target_words || 0) / totalExpandable;
                s.target_words = Math.round((s.target_words || 0) + remaining * weight);
            } else if (compact.has(s.block_type)) {
                s.target_words = Math.min(s.target_words || 0, s.block_type === 'map' ? 40 : s.target_words || 0);
            }
        });

        return sections;
    }

    private attachBlueprintContext(blueprint: any, input: ArchitectInput): any {
        blueprint.niche = input.niche;
        blueprint.city = input.city;
        return blueprint;
    }

    private distributeExtraWordsByQuality(sections: any[], contentBudget: number): any[] {
        if (!Array.isArray(sections) || sections.length === 0) return sections;

        const expandableWeights: Record<string, number> = {
            services_grid: 0.32,
            process_steps: 0.26,
            price_guidance: 0.20,
            faq: 0.22
        };

        const hardCaps: Record<string, number> = {
            services_grid: 700,
            process_steps: 520,
            price_guidance: 420,
            faq: 560,
            urgency_panel: 180,
            cta_panel: 120,
            map: 40,
            trust_band: 180,
            local_proof: 320
        };

        const currentTotal = sections.reduce((sum, s) => sum + (s.target_words || 0), 0);
        if (currentTotal >= contentBudget) return sections;

        let extra = contentBudget - currentTotal;

        const expandableSections = sections.filter((s: any) =>
            Object.prototype.hasOwnProperty.call(expandableWeights, s.block_type)
        );

        if (expandableSections.length === 0) return sections;

        for (const section of sections) {
            if (hardCaps[section.block_type]) {
                section.target_words = Math.min(section.target_words || 0, hardCaps[section.block_type]);
            }
        }

        const grouped = new Map<string, any[]>();
        for (const s of expandableSections) {
            if (!grouped.has(s.block_type)) grouped.set(s.block_type, []);
            grouped.get(s.block_type)!.push(s);
        }

        for (const [blockType, items] of grouped.entries()) {
            const weight = expandableWeights[blockType] || 0;
            let bucket = Math.round(extra * weight);

            const perSection = Math.max(40, Math.round(bucket / items.length));

            for (const item of items) {
                const max = hardCaps[item.block_type] || (item.target_words || 0) + perSection;
                item.target_words = Math.min((item.target_words || 0) + perSection, max);
            }
        }

        return sections;
    }
    async execute(input: ArchitectInput): Promise<AgentResponse<any>> {
        const businessName = input.local_nap?.business_name || 'Nuestra Empresa';
        const businessPhone = input.local_nap?.phone || '900 000 000';
        const pageType = input.intentModel?.pageType || 'service';


        const knowledge = await this.getPersistentKnowledge({
            city: input.city,
            niche: input.niche,
            brand: businessName
        });

        this.logThought(`Phase B: Designing strategic blueprint for ${input.city}...`);

        try {
            const planPrompt = `
Eres el Architecto SEO Local principal. Tu misión es diseñar el BLUEPRINT ESTRATÉGICO para "${input.niche}" en "${input.city}".
No te limites a listar secciones; debes definir la INTENCIÓN EDITORIAL y el RITMO VISUAL de la página.

${knowledge}

${this.nicheBrief}

CONTEXTO:
- Empresa: ${businessName}
- Teléfono: ${businessPhone}
- Cluster Data: ${JSON.stringify(input.cluster_data)}
- Page Type: ${pageType}
- Intención: ${input.intentModel.primaryIntent}
- Keyword: ${input.intentModel.primaryKeyword}

LINKS DISPONIBLES PARA ESTA PÁGINA:
${JSON.stringify(input.linkingContext || {}, null, 2)}

ORIGINALIDAD DE CLUSTER (OBLIGATORIO):
${input.originalityDirective || "- No hay restricciones adicionales en esta iteración."}

REGLAS DE ENLAZADO INTERNO:
- Usa los enlaces disponibles como universo permitido para enlazado contextual.
- No inventes URLs o slugs que no estén en la lista anterior.
- Reserva 2 o 3 oportunidades de enlazado útil dentro de la página.
- Debes planificar anchors contextuales fluidos, no "clique aquí".
- Incluye conceptualmente 1 enlace ascendente (Home), 1 lateral (Servicios/Zonas) y, si la intención no es BOFU, 1 enlace hacia la money page (BOFU).
- Si no hay enlaces disponibles en el JSON, ignora esta sección.
- NO diseñes bloques manuales de interlinking ni inventes anchors/URLs en el cuerpo: el interlinking visual final se inyecta automáticamente solo si existen destinos válidos.

TAXONOMÍA DE BLOQUES (Usa solo estos en block_type):
- hero_trust
- services_grid
- urgency_panel
- local_proof
- faq
- cta_panel
- price_guidance
- process_steps
- trust_band
- map
- case_story
- comparison_table
- checklist
- before_after
- objections
- feature_spotlight
- service_matrix
- testimonial_quote
- micro_cta
- authority_note

LAYOUT HINTS (Usa solo estos en layout_hint):
- split_feature
- boxed_content
- full_width_text
- minimal_centered
- two_column_trust

REQUISITOS OBLIGATORIOS DE ESTRUCTURA:
Debes diseñar una página de aproximadamente ${input.word_count_target} palabras en TOTAL.
1. HERO (Objeto separado): Define el gancho comercial, H1 y subheadline. NO lo incluyas en la lista de 'sections'.
2. SECCIONES (Lista 'sections'): Detalle del cuerpo de la página. 
   - SERVICIOS: Detalle profundo de la oferta técnica.
   - URGENCIA: Enfoque en disponibilidad inmediata.
   - PRUEBA LOCAL: Cobertura en ${input.city}.
   - FAQ: Resolución de dudas semánticas.
   - CONTACTO: Cierre y llamada a la acción.

REGLAS CRÍTICAS:
- Máximo 1 bloque de cada tipo (block_type). NO repitas tipos de bloque.
- Prioriza la calidad y la diversidad sobre el relleno.
- Cada sección debe tener un 'objective' único y un 'visual_intent' que aporte contraste.
- EVITA MONOTONÍA: no encadenes más de dos bloques card-heavy consecutivos (services_grid, local_proof, trust_band, faq).
- El bloque de mapa no puede quedar visualmente desnudo: debe tener copy de apoyo y suficiente peso visual.
- La sección final debe cerrar con claridad premium; evita CTA finales demasiado débiles o demasiado cortos.
IMPORTANTE: La suma de 'target_words' de todas las secciones debe aproximarse a ${input.word_count_target - 200}.

REGLAS DE NEGOCIO:
1. PROHIBIDO mencionar meses o años específicos de garantía (ej: "10 años"). Usa siempre "garantía por escrito".
2. PROHIBIDO mencionar precios exactos. Usa "precios justos", "tarifas competitivas" o "presupuesto transparente".
4. TABLAS: No incluyas columnas de "Garantía" o "Precio" si van a contener valores específicos. Cámbialas por "Compromiso" o "Ventaja".

REGLAS DE ORIGINALIDAD EXTRA (ANTI-REPETICIÓN):
- Prohibido repetir una secuencia completa de bloques ya usada en páginas vecinas del cluster.
- Prohibido repetir los mismos arranques de FAQ/local proof vetados por la memoria de originalidad.
- Si hay riesgo alto de clonación, cambia drásticamente el hero, la navegación semántica y el cierre de la página (CTA).

REGLA DE DISPERSIÓN DE CONFIANZA (Trust Scattering):
- Prohibido concentrar toda la prueba social en un solo bloque. Debes forzar que al menos dos bloques (por ejemplo, 'services_grid' y 'urgency_panel') incluyan micro-viñetas de confianza (trust_bullets) y que se incluya un bloque price_guidance sin precios exactos, centrado en la transparencia profesional.

POLÍTICA DE LONGITUDES (TARGET_WORDS):
- hero: 100-160
- services_grid: 320-520
- process_steps: 220-380
- urgency_panel: 140-220
- local_proof: 180-300
- trust_band: 120-220
- price_guidance: 180-320
- faq: 55-85 por cada respuesta
- cta_panel: 70-120
- map: 20-40

REGLA DE EXPANSIÓN CON CALIDAD:
- Si la página supera 1800 palabras, el crecimiento debe concentrarse en services_grid, process_steps, price_guidance y faq.
- urgency_panel, cta_panel y map deben mantenerse compactos.
- No alargues una sección repitiendo beneficios; expándela con más especificidad técnica, casos, criterios de decisión, objeciones y micropruebas.

CADA SECCIÓN EN EL JSON DEBE RESPONDER A ESTE CONTRATO:
- section_id: ID estable y único para anchors (ej: 'servicios', 'urgencia', 'zonas-cobertura').
- h2: Título de la sección (Sencillo, sin prefijos como "Hero:").
- h3s: Subtítulos requeridos.
  - MÍNIMO 3-4 para secciones estándar.
  - Si target_words >= 320, usa 4-6 h3s.
  - Si target_words >= 420, usa 5-7 h3s.
  - Cada h3 debe abrir un ángulo NUEVO: criterio técnico, caso frecuente, error habitual, objeción, variante de servicio, validación o prueba.
  - Prohibido usar h3s redundantes o reformulaciones del mismo beneficio.
- block_type: Tipo de bloque de la taxonomía.
- preferred_format: cards | bullets | prose | faq | trust_cards | table.
- content_density: compact | standard | rich.
- factuality_level: strict | editorial.
- mobile_priority: high | normal | low.
- layout_hint: Sugerencia visual.
- objective: Qué queremos que el usuario sienta o haga.
- target_words: Longitud específica (obligatorio para cumplir el total).
- expansion_slots: número de subbloques internos a desarrollar (2-6 según longitud).
- evidence_requirements: ["microprueba", "criterio_tecnico", "objecion", "caso_tipico", "error_comun", "decision_factor"].
- depth_mode: compact | standard | deep.
- visual_intent: editorial | high-tension | supporting (DINA-compatible)
- silence_priority: low | medium | high
- candidate_visual_variants: ["...", "..."]

REGLA DE CONTRATO VISUAL:
- block_type es obligatorio y manda sobre el diseño.
- preferred_format y layout_hint son solo una PROPUESTA; el sistema las normalizará.
- No inventes formatos ni layouts fuera de la taxonomía.
- Para 'faq' usa preferred_format='faq'.
- Para 'map' usa preferred_format='prose' y layout_hint='full_width_text'.

REGLAS DE CALIDAD EDITORIAL (CRÍTICO):
1. H1: Prohibido usar el formato "Servicio en Ciudad". Busca algo con más garra: "Soluciones definitivas de ${input.niche} en ${input.city}", "Especialistas en ${input.niche} para particulares y empresas en ${input.city}", "Recupera la seguridad de tu instalación: ${input.niche} en ${input.city}".
2. META TITLE: Máximo 60 caracteres. Prohibido repetir la ciudad al final como "| ${input.city}". Ejemplo pro: "${input.niche} en ${input.city}: Asistencia Técnica con Garantía por Escrito".
3. META DESCRIPTION: Prohibido empezar con "Expertos en...". Usa verbos de acción y beneficios reales. Ejemplo: "Resolvemos tu incidencia de ${input.niche} en ${input.city} hoy mismo. Técnicos locales, materiales homologados y presupuesto cerrado sin compromiso. ¡Llámanos!"
4. TONO: Evita el sonar a "sistema". Usa lenguaje que demuestre que conoces el oficio y la zona.
5. COHERENCIA DE NICHO: Prohibido introducir ejemplos, materiales, averías o terminología propia de otros oficios. Todo ejemplo debe pertenecer al nicho exacto de ${input.niche}.

RESPONDE ÚNICAMENTE EN JSON:
{
  "h1": "...",
  "meta_title": "...",
  "meta_description": "...",
  "page_skeleton": "editorial-longform | conversion-funnel | local-directory | premium-showcase | technical-comparison",
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
  "h3s": ["...", "..."],
  "block_type": "...",
  "target_words": 280,
  "expansion_slots": 4,
  "depth_mode": "deep",
  "evidence_requirements": ["criterio_tecnico", "objecion", "microprueba"],
  "visual_intent": "editorial"
    }
  ]
}
`;

            const rawResponse = await this.callModel(planPrompt);
            const blueprint = safeJsonParse<any>(rawResponse, {
                h1: `Soluciones técnicas de ${input.niche} en ${input.city}`,
                meta_title: `${input.niche} en ${input.city}: Atención Técnica Profesional`,
                meta_description: `Resolvemos ${input.niche} en ${input.city} con criterio técnico, garantía por escrito y atención clara desde el primer contacto.`,
                sections: [],
                global_tone: 'trust'
            });

            this.attachBlueprintContext(blueprint, input);
            blueprint.intentModel = input.intentModel;

            if (input.linkingContext) {
                blueprint.internalLinking = {
                    currentNodeId: input.linkingContext.currentNodeId,
                    architectContext: input.linkingContext,
                };
            }

            let sections = Array.isArray(blueprint.sections) ? blueprint.sections : [];

            sections = sections.filter((section: any) => {
                const blockType = String(section?.block_type || '').toLowerCase();
                const sectionId = String(section?.section_id || '').toLowerCase();
                return blockType !== 'hero_trust' && sectionId !== 'hero';
            });

            // NICHE-AGNOSTIC ENFORCEMENT
            const mandatoryTypesByPageType: Record<string, string[]> = {
                service: ['services_grid', 'cta_panel'],
                urgent: ['urgency_panel', 'cta_panel'],
                service_area: ['local_proof', 'cta_panel'],
                comparison: ['comparison_table', 'cta_panel'],
                guide: ['process_steps', 'cta_panel'],
                home_local: ['local_proof', 'services_grid', 'cta_panel'],
                category: ['services_grid', 'cta_panel'],
                faq: ['faq', 'cta_panel']
            };

            const mandatoryTypes = [...(mandatoryTypesByPageType[pageType] || ['services_grid', 'cta_panel'])];

            // Conditionally add based on intent
            if (input.intentModel.primaryIntent === 'informational' || input.intentModel.primaryIntent === 'commercial') {
                if (!mandatoryTypes.includes('faq')) mandatoryTypes.push('faq');
            }
            if (input.intentModel.primaryIntent === 'transactional') {
                if (!mandatoryTypes.includes('trust_band')) mandatoryTypes.push('trust_band');
            }
            if (input.intentModel.primaryIntent === 'navigational') {
                if (!mandatoryTypes.includes('map')) mandatoryTypes.push('map');
            }

            mandatoryTypes.forEach(type => {
                const exists = sections.some((s: any) => s.block_type === type);
                if (!exists) {
                    this.logThought(`Auto-repairing blueprint: Adding missing '${type}' section.`);
                    const newSection = this.generateMandatorySection(type, input.niche, input.city);
                    if (newSection) sections.push(newSection);
                }
            });
            const stillMissing = mandatoryTypes.filter(type => !sections.some((s: any) => s.block_type === type));
            if (stillMissing.length > 0) {
                await this.logThought(`Mandatory block factory missing for: ${stillMissing.join(', ')}`);
            }
        // 4. Strategic Archetype Reordering
        sections = this.reorderSectionsByArchetype(pageType, sections, input);

        // 5. Final Contract Enforcement (Apply AFTER reordering to ensure adjacency)
        sections = this.enforceMapAfterLocalProof(sections);
        console.log(`[DEBUG_ARCHITECT] Sections after enforceMap: ${sections.map(s => s.block_type).join(', ')}`);

        // 6. Technical Repair & Deduplication
        sections = this.deduplicateConsecutiveTypes(sections);
        console.log(`[DEBUG_ARCHITECT] Sections after deduplicate: ${sections.map(s => s.block_type).join(', ')}`);

            this.enrichBlueprintWithArchetypeMeta(blueprint, pageType, input);

            // Normalization & Scaling
            sections.forEach((s: any, idx: number) => {
                s.section_id = s.section_id || `${s.block_type}-${idx}`;
                s.preferred_format = s.preferred_format || 'prose';

                if (!s.depth_mode) {
                    s.depth_mode =
                        (s.target_words || 0) >= 420 ? 'deep' :
                            (s.target_words || 0) >= 260 ? 'standard' :
                                'compact';
                }

                if (!s.expansion_slots) {
                    s.expansion_slots =
                        s.block_type === 'services_grid' ? 5 :
                            s.block_type === 'process_steps' ? 4 :
                                s.block_type === 'price_guidance' ? 4 :
                                    s.block_type === 'faq' ? 5 :
                                        s.block_type === 'local_proof' ? 3 :
                                            2;
                }

                if (!s.evidence_requirements) {
                    s.evidence_requirements =
                        s.block_type === 'services_grid'
                            ? ['criterio_tecnico', 'caso_tipico', 'microprueba']
                            : s.block_type === 'process_steps'
                                ? ['criterio_tecnico', 'error_comun', 'validacion']
                                : s.block_type === 'price_guidance'
                                    ? ['decision_factor', 'objecion', 'microprueba']
                                    : s.block_type === 'faq'
                                        ? ['objecion', 'caso_tipico']
                                        : ['microprueba'];
                }
            });

            const normalizedSections = sections.map((s: any) => this.normalizeSectionVisualContract(s, input));

            const invalidLayoutSections = normalizedSections.filter((s: any) => !s.layout_hint);
            if (invalidLayoutSections.length > 0) {
                await this.logThought(`Sections without resolved layout_hint: ${invalidLayoutSections.map((s: any) => s.section_id).join(', ')}`);
            }
            // De-duplication
            const blockTypeCounter = new Map<string, number>();

            blueprint.sections = normalizedSections.filter((s: any) => {
                const count = blockTypeCounter.get(s.block_type) || 0;
                if (count >= 1) {
                    console.log(`[DEBUG_ARCHITECT] Filtering duplicate block: ${s.block_type}`);
                    return false; 
                }
                blockTypeCounter.set(s.block_type, count + 1);
                return true;
            });
            console.log(`[DEBUG_ARCHITECT] Final blueprint sections: ${blueprint.sections.map((s: any) => s.block_type).join(', ')}`);



            // Scaling Logic (Quality-preserving)
            const totalTarget = input.word_count_target || 2000;
            const contentBudget = totalTarget - 200;

            blueprint.sections = this.distributeExtraWordsByQuality(blueprint.sections, contentBudget);

            // Hardening sections
            if (!blueprint.sections || !Array.isArray(blueprint.sections)) {
                blueprint.sections = [];
            }

            if (!blueprint.seoBrief) {
                blueprint.seoBrief = {
                    titleStrategy: 'Define un title tag único (60-70 caracteres). No abuses de "${input.city}". Usa beneficios reales.',
                    metaDescriptionStrategy: 'Gancho emocional fuerte + Propuesta de Valor + CTA. Evita que parezca spam.',
                    canonicalSlug: '',
                    schemaTypes: ['LocalBusiness'],
                    faqEligible: true,
                    localModifiers: [input.city]
                };
            }
            if (!blueprint.contentRules) {
                blueprint.contentRules = {
                    prohibitedClaims: [],
                    factOnlyFields: ['address', 'phone'],
                    maxBrandMentionsPerSection: 1,
                    differentiationRequirements: []
                };
            }
            // Sanitización básica
            // blueprint.h1 = blueprint.h1.split(/[|\-:]/)[0].trim(); // Removed for mission compatibility
            blueprint.repairReport = {
                enforcedMapAfterLocalProof: blueprint.sections.some((s: any, idx: number, arr: any[]) =>
                    s.block_type === 'local_proof' && arr[idx + 1]?.block_type === 'map'
                ),
                totalSections: blueprint.sections.length,
                blockTypes: blueprint.sections.map((s: any) => s.block_type)
            };
            return {
                success: true,
                data: blueprint,
                thoughts: `Strategic blueprint finalized for ${input.city}. Sections: ${blueprint.sections.length}.`
            };

        } catch (error: any) {
            this.logThought(`Error in Architect: ${error.message}. Using emergency fallback blueprint.`);

            // EMERGENCY FALLBACK BLUEPRINT
            const niche = input.niche || 'Servicios';
            const city = input.city || 'Madrid';
            const fallbackBlueprint: any = {
                degraded: true,
                degradationReason: 'architect_llm_failure',
                h1: `Resolvemos ${niche} en ${city} con criterio técnico y atención local`,
                meta_title: `${niche} en ${city}: criterio técnico y atención local`,
                meta_description: `Atendemos ${niche} en ${city} con diagnóstico claro, intervención profesional y garantía por escrito cuando corresponde.`,
                page_skeleton: pageType === 'guide' ? 'editorial-longform' : 'conversion-funnel',
                hero: {
                    h1: `Servicio de ${niche} en ${city} con respuesta profesional y criterio técnico`,
                    subtitle: `Atendemos ${niche.toLowerCase()} en ${city} con un enfoque claro: diagnosticar bien, intervenir sin improvisar y dejar una solución sólida.`,
                    trust_bullets: ["Certificación Técnica", "Garantía por Escrito", "Disponibilidad Local"],
                    cta_text: "Contactar con un Especialista",
                    hero_role: "conversion",
                    visual_intent: "high_impact"
                },
                sections: []
            };

            const mandatoryTypesByPageType: Record<string, string[]> = {
                service: ['services_grid', 'process_steps', 'price_guidance', 'urgency_panel', 'local_proof', 'faq', 'cta_panel', 'trust_band'],
                urgent: ['urgency_panel', 'local_proof', 'faq', 'cta_panel', 'process_steps', 'price_guidance'],
                default: ['services_grid', 'process_steps', 'price_guidance', 'urgency_panel', 'local_proof', 'faq', 'cta_panel']
            };

            const types = mandatoryTypesByPageType[pageType] || mandatoryTypesByPageType.default;

            fallbackBlueprint.sections = types.map(type => this.generateMandatorySection(type, niche, city)).filter(Boolean);

            this.attachBlueprintContext(fallbackBlueprint, input);
            fallbackBlueprint.intentModel = input.intentModel;

            return {
                success: true,
                data: fallbackBlueprint,
                thoughts: "Architectural planning using emergency fallback due to LLM failure."
            };
        }
    }
}