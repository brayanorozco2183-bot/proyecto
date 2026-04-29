import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { PageType, IntentModel } from '../types/pipeline_v2.js';
import { PAGE_TYPE_DESIGN_PRESETS } from '../config/designPresets.js';
import { BLOCK_VISUAL_SPECS } from '../config/blockVisualSpecs.js';

import { PageDesignDNA } from '../types/design.js';

export interface VarietyInput {
    h1: string;
    pageType?: PageType;
    intentModel?: IntentModel;
    designDNA?: PageDesignDNA;
    visual_variant?: string;
    visual_intent?: string;
    silence_priority?: string;
    visual_spec?: {
        spacingProfile?: 'tight' | 'normal' | 'airy';
        emphasis?: 'content' | 'trust' | 'cta';
        mobilePattern?: 'stack' | 'split-collapse' | 'cards';
        decorativeLevel?: 'none' | 'soft' | 'strong';
        sectionShell?: 'plain' | 'panel' | 'band' | 'editorial';
    };
    sections: Array<{
        h2: string;
        h3s: string[];
        block_type?: string;
        layout_hint?: string;
        pattern_hint?: string;
        preferred_format?: string;
        content_density?: string;
        visual_weight?: 'light' | 'medium' | 'heavy';
        emphasis?: 'content' | 'trust' | 'cta';
        target_words?: number;
        visual_intent?: string;
        silence_priority?: string;
        candidate_visual_variants?: string[];
    }>;
}


export interface SectionVariety {
    h2: string;
    h3s: string[];
    section_id?: string;
    introduction_style: 'explicación técnica' | 'caso práctico' | 'lista de problemas' | 'guía paso a paso' | 'recomendaciones directas';
    structure_type: 'listas' | 'párrafos cortos' | 'bloques de valor' | 'preguntas y respuestas' | 'técnico';

    block_type?: string;
    layout_hint?: string;
    pattern_hint?: string;
    preferred_format?: string;
    content_density?: string;
    visual_weight?: 'light' | 'medium' | 'heavy';
    emphasis?: 'content' | 'trust' | 'cta';
    target_words?: number;
    visual_variant?: string;
    visual_intent?: string;
    silence_priority?: string;
    visual_spec?: any;
}

export interface PageProfile {
    tone: 'tecnico' | 'consultivo' | 'urgencias' | 'preventivo' | 'informativo' | 'institucional';
    narrative_model: 'problema-solucion' | 'guia-practica' | 'errores-frecuentes' | 'casos-habituales' | 'prevencion' | 'checklist-local';
    editorial_angle: 'legado-local' | 'fiabilidad-extrema' | 'elite-tecnica' | 'rapidez-critica' | 'transparencia-total';
    content_density: 'compacto' | 'equilibrado' | 'detallado';
    cta_style: 'solicitar asistencia' | 'contactar ahora' | 'hablar con un tecnico' | 'pedir ayuda urgente' | 'consultar disponibilidad';
    paragraph_style: 'corto-directo' | 'medio-explicativo' | 'mixto-con-listas' | 'tecnico';
    local_focus: string[];
    page_composition: 'editorial' | 'conversion' | 'local_dense' | 'trust_first';
    hero_variant: 'split' | 'centered' | 'stacked' | 'cta_heavy' | 'proof_first';
    section_patterns: string[];
    section_count_mode: 'compacta' | 'normal' | 'extendida';
    art_direction?: string;
    navbar_variant?: 'solid' | 'glass' | 'minimal';
    card_variant?: 'elevated' | 'outlined' | 'flat' | 'editorial';
    footer_variant?: 'directory' | 'minimal' | 'editorial';
    section_cadence?: 'calm' | 'alternating' | 'contrast' | 'cinematic';
    designDNA?: PageDesignDNA;
}

export interface VarietyResult {
    h1: string;
    profile: PageProfile;
    sections: SectionVariety[];
}

/**
 * ContentVarietyAgent - The Variation Engine.
 * Introduces structural and stylistic diversity to avoid repetitive patterns.
 */
export class ContentVarietyAgent extends BaseAgent {
    constructor() {
        super(
            'Content_Variety_01',
            'Variation Engine',
            'Motor de Variedad',
            'Introduce diversidad estructural y narrativa sin alterar datos críticos.',
            vault.OLLAMA_MODEL_RESEARCH
        );
    }

    private seededShuffle<T>(items: T[], seedString: string): T[] {
        const arr = [...items];
        let seed = 0;
        for (let i = 0; i < seedString.length; i++) {
            seed = (seed * 31 + seedString.charCodeAt(i)) >>> 0;
        }

        const random = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };

        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }

        return arr;
    }
    private normalizeHeroVariant(value?: string): 'split' | 'centered' | 'stacked' | 'cta_heavy' | 'proof_first' {
        const v = (value || 'split').toLowerCase().trim();
        if (v === 'cta-heavy') return 'cta_heavy';
        if (v === 'proof-first') return 'proof_first';
        if (v === 'cta_heavy' || v === 'proof_first' || v === 'split' || v === 'centered' || v === 'stacked') {
            return v as any;
        }
        return 'split';
    }

    private normalizePageComposition(value?: string): 'editorial' | 'conversion' | 'local_dense' | 'trust_first' {
        const v = (value || 'conversion').toLowerCase().trim();
        if (v === 'editorial' || v === 'conversion' || v === 'local_dense' || v === 'trust_first') {
            return v as any;
        }
        return 'conversion';
    }

    private normalizeSectionCadence(value?: string): 'calm' | 'alternating' | 'contrast' | 'cinematic' {
        const v = (value || 'alternating').toLowerCase().trim();
        if (v === 'calm' || v === 'alternating' || v === 'contrast' || v === 'cinematic') {
            return v as any;
        }
        return 'alternating';
    }

    async execute(input: VarietyInput): Promise<AgentResponse<VarietyResult>> {
        this.logThought("Executing SemanticDrift Engine...");

        const h1 = input.h1 || 'Generated Page';
        const driftSeed = [
            input.h1 || '',
            input.pageType || input.intentModel?.pageType || '',
            input.designDNA?.designId || '',
            input.designDNA?.family || '',
            input.designDNA?.pageSkeleton || '',
            input.sections?.map(s => `${s.block_type}:${s.layout_hint}:${s.visual_intent}`).join('|') || '',
        ].join('::');
        const normalizedNiche = (input.h1 || '').toLowerCase();
        const angles: PageProfile['editorial_angle'][] =
            /cerraj|cerradura|apertura|seguridad/i.test(normalizedNiche)
                ? ['legado-local', 'fiabilidad-extrema', 'elite-tecnica', 'rapidez-critica', 'transparencia-total']
                : ['legado-local', 'elite-tecnica', 'rapidez-critica', 'transparencia-total', 'fiabilidad-extrema'];

        const selectedAngle = angles[Math.abs(driftSeed.length) % angles.length];

        const dna = input.designDNA;
        const pageType = input.pageType || input.intentModel?.pageType || 'service';
        const preset = PAGE_TYPE_DESIGN_PRESETS[pageType as keyof typeof PAGE_TYPE_DESIGN_PRESETS] || PAGE_TYPE_DESIGN_PRESETS.service;
        const profile: PageProfile = {
            tone: preset.tone || 'consultivo',
            narrative_model: preset.narrative_model || 'problema-solucion',
            editorial_angle: selectedAngle,
            content_density: preset.content_density || 'equilibrado',
            cta_style: preset.cta_style || 'contactar ahora',
            paragraph_style: preset.paragraph_style || 'medio-explicativo',
            local_focus: [],
            page_composition: this.normalizePageComposition((dna as any)?.pageComposition || preset.page_composition || 'conversion'),
            hero_variant: ((dna?.heroTreatment as any) || preset.hero_variant || 'split') === 'cta-heavy'
                ? 'cta_heavy'
                : (((dna?.heroTreatment as any) || preset.hero_variant || 'split') === 'proof-first'
                    ? 'proof_first'
                    : ((dna?.heroTreatment as any) || preset.hero_variant || 'split')),
            section_patterns: [],
            section_count_mode: preset.section_count_mode || 'normal',
            art_direction: dna?.artDirection || preset.art_direction,
            navbar_variant: dna?.navbarTreatment as any || preset.navbar_variant,
            card_variant: dna?.cardTreatment as any || preset.card_variant,
            footer_variant: dna?.footerTreatment as any || preset.footer_variant,
            section_cadence: this.normalizeSectionCadence(dna?.sectionCadence as any || preset.section_cadence),
            designDNA: dna
        };

        const patternPresetsByComposition: Record<string, string[]> = {
            editorial: [
                'full_width_text',
                'image_left_text_right',
                'text_left_image_right',
                'minimal_centered',
                'stacked_image_top',
                'boxed_content',
                'immersive_quote',
                'asymmetric_story',
                'timeline_story'
            ],
            conversion: [
                'split_feature',
                'boxed_content',
                'minimal_centered',
                'text_left_image_right',
                'form_focus',
                'proof_stack',
                'cta_banner',
                'comparison_split'
            ],
            local_dense: [
                'boxed_content',
                'full_width_text',
                'stacked_image_bottom',
                'image_left_text_right',
                'map_focus',
                'area_grid',
                'trust_strip'
            ],
            trust_first: [
                'full_width_text',
                'split_feature',
                'boxed_content',
                'testimonial_wall',
                'proof_first',
                'authority_band',
                'stacked_image_top'
            ]
        };

        const basePatterns = patternPresetsByComposition[profile.page_composition] || patternPresetsByComposition.conversion;
        const shuffledPatterns = this.seededShuffle(basePatterns, driftSeed);
        profile.section_patterns = (input.sections || []).map((_, i) => shuffledPatterns[i % shuffledPatterns.length]);
        const variedSections: SectionVariety[] = (input.sections || []).map((section, index) => {
            const spec = BLOCK_VISUAL_SPECS[section.block_type as keyof typeof BLOCK_VISUAL_SPECS];

            const introStyles: Record<PageProfile['editorial_angle'], SectionVariety['introduction_style']> = {
                'legado-local': 'caso práctico',
                'fiabilidad-extrema': 'lista de problemas',
                'elite-tecnica': 'explicación técnica',
                'rapidez-critica': 'recomendaciones directas',
                'transparencia-total': 'guía paso a paso'
            };

            return {
                section_id: (section as any).section_id,
                h2: section.h2,
                h3s: section.h3s,
                introduction_style: introStyles[selectedAngle],
                structure_type: selectedAngle === 'elite-tecnica' ? 'técnico' : 'bloques de valor',
                block_type: section.block_type || 'prose_intro',
                layout_hint: section.layout_hint || 'full_width_text',
                pattern_hint: profile.section_patterns[index], preferred_format: section.preferred_format || (spec ? spec.defaultFormat : 'prose'),
                content_density: section.content_density || (spec ? spec.densityBias : 'standard'),
                visual_weight: section.visual_intent === 'high_impact' ? 'heavy' : 'medium',
                emphasis: section.emphasis || (spec ? spec.emphasis : 'content'),
                target_words: section.target_words,
                visual_variant: (section as any).visual_variant || spec?.defaultVisualVariant || 'default',
                visual_intent: section.visual_intent,
                silence_priority: section.silence_priority,
                visual_spec: {
                    spacingProfile: spec?.spacingProfile,
                    emphasis: spec?.emphasis,
                    mobilePattern: spec?.mobilePattern,
                    decorativeLevel: spec?.decorativeLevel
                }
            };
        });

        const result: VarietyResult = {
            h1: input.h1,
            profile,
            sections: variedSections
        };

        this.logThought(`SemanticDrift applied: Angle=${profile.editorial_angle}`);

        return {
            success: true,
            data: result,
            thoughts: `Página generada con ángulo editorial '${profile.editorial_angle}' para maximizar la unicidad.`
        };
    }
}