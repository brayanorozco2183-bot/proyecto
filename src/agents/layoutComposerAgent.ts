import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';
import { safeJsonParse, pickAllowed, pickBoolean } from '../utils/jsonRecovery.js';
import { scoreDesignRepetitionRisk as scoreRepetitionRisk, deriveOriginalityScopes } from '../originality/index.js';
import { dbManager } from '../db/index.js';
import { PAGE_ARCHETYPES } from '../config/pageArchetypes.js';
import { selectVisualIdentityContract } from '../config/visualIdentityContracts.js';
import { buildSeed, pickSeeded } from '../utils/designSeed.js';
import {
    SectionLayoutContract,
    LayoutContract,
    SectionShell,
    ContentFlow,
    MediaPolicy,
    CtaWeight,
    TrustDistribution,
    DesignSeed,
    StructuralFingerprint
} from '../types/pipeline_v2.js';

function diversifyContractByRisk(contract: LayoutContract, dna?: any, pageType = 'service', niche = '', city = ''): LayoutContract {
    const risk = Number(dna?.repetitionRisk || 0);
    if (risk <= 0.72) return contract;

    const seed = buildSeed(niche, city, pageType, dna?.family, dna?.heroTreatment, 'risk-reroll');
    const archetypes = PAGE_ARCHETYPES[pageType] || PAGE_ARCHETYPES.service;
    const archetype = pickSeeded(archetypes, seed);

    const diversifiedSections: Record<string, SectionLayoutContract> = {};
    (contract.orderedSectionIds || []).forEach((id: string, index: number) => {
        const section = contract.sections[id];
        if (!section) return;

        const variantsByFlow: Record<string, string[]> = {
            split: ['section_two_column_story', 'hero_split_left', 'section_quote_proof'],
            centered: ['section_minimal', 'cta_inline', 'section_quote_proof'],
            stack: ['section_stacked_cards', 'section_minimal'],
            zigzag: ['section_zigzag', 'section_two_column_story'],
            asymmetric: ['hero_split_left', 'section_zigzag', 'section_quote_proof']
        };

        const flow = index % 4 === 0 && archetype.cadencePattern === 'contrast-bursts'
            ? 'asymmetric'
            : section.flow;

        const patternPool = variantsByFlow[flow] || [section.pattern || 'section_minimal'];

        diversifiedSections[id] = {
            ...section,
            flow,
            pattern: pickSeeded(patternPool, `${seed}::${id}::pattern`),
            shell: index % 3 === 0 ? 'editorial' : section.shell,
            density: archetype.pageComposition === 'editorial' ? 'rich' : section.density,
            cta: archetype.ctaStrategy === 'hero-heavy' && index < 2 ? 'high' : section.cta,
            trust: archetype.proofStrategy === 'early' && index < 2 ? 'mixed' : section.trust
        };
    });

    return {
        ...contract,
        pageComposition: archetype.pageComposition as any,
        heroTemplate: archetype.heroTemplate as any,
        cadencePattern: archetype.cadencePattern as any,
        proofStrategy: archetype.proofStrategy as any,
        ctaStrategy: archetype.ctaStrategy as any,
        pageSkeleton: archetype.pageSkeleton as any,
        sections: diversifiedSections
    };
}

interface BlueprintSectionRef {
    section_id: string;
    block_type?: string;
    format?: string;
}

interface BlueprintInput {
    sections: BlueprintSectionRef[];
}

interface DnaInput {
    pageComposition?: string;
    visualSystem?: string;
    heroTreatment?: string;
    sectionCadence?: string;
    family?: string;
    seed?: DesignSeed;
    [key: string]: any;
}

export interface LayoutComposerInput {
    blueprint: BlueprintInput;
    dna?: DnaInput;
    niche: string;
    city: string;
    pageType: string;
}

interface RawLayoutContract {
    pageComposition?: string;
    visualRhythm?: string;
    widthAlternation?: boolean;
    heroTemplate?: string;
    cadencePattern?: string;
    proofStrategy?: string;
    ctaStrategy?: string;
    pageSkeleton?: string;
    orderedSectionIds?: string[];
    sections?: Record<string, any>;
}

const ALLOWED_SHELLS = ['plain', 'panel', 'band', 'editorial', 'hero-bridge'] as const;
const ALLOWED_FLOWS = ['stack', 'split', 'zigzag', 'asymmetric', 'centered'] as const;
const ALLOWED_MEDIA = ['none', 'iconic', 'illustrated', 'map', 'proof'] as const;
const ALLOWED_CTA = ['low', 'medium', 'high'] as const;
const ALLOWED_TRUST = ['embedded', 'separate', 'mixed'] as const;
const ALLOWED_DENSITY = ['standard', 'compact', 'rich'] as const;
const ALLOWED_RHYTHMS = ['dynamic', 'calm', 'cinematic'] as const;
const ALLOWED_HERO_TEMPLATES = ['split', 'centered', 'proof-first', 'form-first', 'conversion', 'local', 'urgency', 'educational', 'binary_cta'] as const;
const ALLOWED_CADENCE_PATTERNS = ['alternating', 'stacked', 'contrast-bursts', 'cinematic', 'calm'] as const;
const ALLOWED_PROOF_STRATEGIES = ['early', 'mid', 'distributed', 'none'] as const;
const ALLOWED_CTA_STRATEGIES = ['terminal', 'distributed', 'hero-heavy', 'minimal'] as const;
const ALLOWED_PAGE_SKELETONS = ['editorial-longform', 'conversion-funnel', 'local-directory', 'premium-showcase', 'technical-comparison', 'emergency-dispatch', 'technical-diagnosis', 'local-newspaper', 'neighborhood-directory', 'premium_studio_case', 'minimal_quote_first', 'before_after_showcase'] as const;
const ALLOWED_PATTERNS = [
    'hero_split_left', 'hero_split_right', 'hero_center_stack', 'hero_proof_first', 'hero_cta_heavy',
    'section_banded', 'section_panelled', 'section_editorial', 'section_zigzag', 'section_dense_grid',
    'section_minimal', 'section_two_column_story', 'section_stacked_cards', 'section_comparison_table',
    'section_quote_proof', 'cta_inline', 'cta_floating', 'cta_terminal', 'mosaic', 'directory', 'timeline', 'diagnostic_rows', 'coverage_map_panel', 'dispatch_timeline', 'compact_decision_tree', 'status_console', 'icon_table', 'evidence_panel', 'inspection_protocol', 'report_qa', 'estimate_matrix', 'feature_article', 'editorial_service_rows', 'neighborhood_notes', 'masonry_tiles', 'atelier_steps', 'cards_faq', 'area_directory_rows', 'large_zone_map', 'horizontal_rows', 'minimal_columns', 'before_after_tiles'
] as const;


function orderSectionsByVisualIdentity(sections: BlueprintSectionRef[], preferredBlockTypes: string[]): string[] {
    const remaining = [...sections];
    const ordered: string[] = [];
    for (const preferred of preferredBlockTypes || []) {
        const index = remaining.findIndex((section) => String(section.block_type || section.format || '').toLowerCase() === preferred);
        if (index >= 0) {
            ordered.push(remaining[index].section_id);
            remaining.splice(index, 1);
        }
    }
    for (const section of remaining) ordered.push(section.section_id);
    return ordered.filter(Boolean);
}

function patternForDialect(dialect: string | undefined, fallback: string): string {
    const allowed = new Set<string>(ALLOWED_PATTERNS as readonly string[] as any);
    if (!dialect) return fallback;
    return allowed.has(dialect) ? dialect : fallback;
}

function avoidAdjacentRepetition(contract: LayoutContract, orderedSections: { section_id: string }[]): void {
    let prevShell: string | null = null;
    let prevFlow: string | null = null;

    for (let i = 0; i < orderedSections.length; i++) {
        const section = orderedSections[i];
        const current = contract.sections[section.section_id];
        if (!current) continue;

        if (prevShell && current.shell === prevShell) {
            const shellAlternatives = ALLOWED_SHELLS.filter(s => s !== prevShell);
            if (shellAlternatives.length > 0) {
                current.shell = shellAlternatives[i % shellAlternatives.length] as any;
            }
        }

        if (prevFlow && current.flow === prevFlow) {
            const flowAlternatives = ALLOWED_FLOWS.filter(f => f !== prevFlow);
            if (flowAlternatives.length > 0) {
                current.flow = flowAlternatives[i % flowAlternatives.length] as any;
            }
        }

        prevShell = current.shell;
        prevFlow = current.flow;
    }
}

function defaultSectionContract(type: string, family: string): SectionLayoutContract {
    const fallbacks: SectionLayoutContract = {
        shell: family === 'editorial' ? 'editorial' : 'plain',
        flow: family === 'asymmetric_premium' ? 'asymmetric' : 'stack',
        media: 'none',
        cta: 'medium',
        trust: 'embedded',
        density: 'standard',
        pattern: family === 'conversion_heavy' ? 'section_panelled' : 'section_minimal',
        visualVariant: 'default'
    };

    if (type === 'hero') {
        fallbacks.shell = 'hero-bridge';
        fallbacks.flow = 'split';
        fallbacks.media = 'illustrated';
        fallbacks.pattern = 'hero_split_left';
    }
    if (type === 'services') {
        fallbacks.shell = 'panel';
        fallbacks.flow = 'zigzag';
        fallbacks.pattern = 'section_zigzag';
    }
    if (type === 'testimonials') {
        fallbacks.trust = 'separate';
        fallbacks.pattern = 'section_quote_proof';
    }
    if (type === 'map') {
        fallbacks.shell = 'band';
        fallbacks.media = 'map';
        fallbacks.pattern = 'section_minimal';
    }

    if (type === 'comparison_table') {
        fallbacks.shell = 'panel';
        fallbacks.flow = 'centered';
        fallbacks.pattern = 'section_comparison_table';
    }

    if (type === 'case_story') {
        fallbacks.shell = 'editorial';
        fallbacks.flow = 'split';
        fallbacks.pattern = 'section_two_column_story';
    }

    if (type === 'micro_cta') {
        fallbacks.shell = 'plain';
        fallbacks.flow = 'centered';
        fallbacks.pattern = 'cta_inline';
    }

    if (type === 'objections') {
        fallbacks.shell = 'panel';
        fallbacks.flow = 'stack';
        fallbacks.pattern = 'section_stacked_cards';
    }

    // Family-based overrides
    if (family === 'asymmetric_premium') {
        fallbacks.flow = 'asymmetric';
    }

    return fallbacks;
}

function normalizeSectionContract(raw: any, fallback: SectionLayoutContract): SectionLayoutContract {
    if (!raw) return fallback;
    return {
        shell: pickAllowed(raw.shell, ALLOWED_SHELLS, fallback.shell),
        flow: pickAllowed(raw.flow, ALLOWED_FLOWS, fallback.flow),
        media: pickAllowed(raw.media, ALLOWED_MEDIA, fallback.media),
        cta: pickAllowed(raw.cta, ALLOWED_CTA, fallback.cta),
        trust: pickAllowed(raw.trust, ALLOWED_TRUST, fallback.trust),
        density: pickAllowed(raw.density, ALLOWED_DENSITY, fallback.density),
        pattern: raw.pattern || fallback.pattern,
        visualVariant: raw.visualVariant || fallback.visualVariant,
        mergedWith: raw.mergedWith || undefined
    };
}

export class LayoutComposerAgent extends BaseAgent {
    constructor() {
        super(
            'Layout_Composer_01',
            'Structural Architect',
            'Compositor de Layouts',
            'Diseña el contrato estructural de la página, definiendo shells, flows y ritmos visuales.',
            vault.OLLAMA_MODEL_RESEARCH
        );
    }

    async execute(input: LayoutComposerInput): Promise<AgentResponse<LayoutContract>> {
        this.logThought(`Designing structural layout with dynamic rhythm for ${input.city} (${input.niche})...`);

        const sections = Array.isArray(input.blueprint?.sections) ? input.blueprint.sections : [];
        const sectionSummary = sections.map((s) => ({
            id: s.section_id,
            type: s.block_type || s.format || 'unknown'
        }));

        const pageType = input.pageType || 'service';
        const archetypes = PAGE_ARCHETYPES[pageType] || PAGE_ARCHETYPES.service;
        const seed = buildSeed(input.niche, input.city, pageType, input.dna?.family, input.dna?.heroTreatment);
        const fallbackArchetype = pickSeeded(archetypes, seed);
        const visualIdentity = input.dna?.visualIdentityContract || selectVisualIdentityContract({ niche: input.niche, city: input.city, pageType, primaryIntent: input.dna?.primaryIntent, salt: seed });

        const pageComposition = input.dna?.pageComposition || fallbackArchetype.pageComposition;
        const heroTreatment = input.dna?.heroTreatment || fallbackArchetype.heroTemplate;
        const sectionCadence = input.dna?.sectionCadence || fallbackArchetype.cadencePattern;
        const family = input.dna?.family || 'conversion_heavy';

        const prompt = `
Eres el Layout Composer Senior. Tu misión es transformar un Blueprint y un ADN Visual en un CONTRATO ESTRUCTURAL FUERTE y DINÁMICO.
No piensas en colores ni fuentes. Piensas en SECCIONES, SHELLS, FLOWS, ORDEN y RITMO.

CONTEXTO:
- Nicho: ${input.niche}
- Ciudad: ${input.city}
- Blueprint: ${JSON.stringify(sectionSummary)}
- ADN Visual (family): ${family}
- DESIGN SEED: ${input.dna?.seed ? JSON.stringify(input.dna.seed) : 'None'}

REGLAS DE ORO DEL SEED:
Si el SEED existe, DEBES SEGUIRLO:
1. 'sectionRhythm' manda sobre 'visualRhythm'.
2. 'densityProfile' manda sobre 'density' de las secciones.
3. 'ctaModel' manda sobre 'ctaStrategy'.
4. 'proofStyle' manda sobre 'proofStrategy'.
5. Si 'asymmetryLevel' > 7, usa flows 'asymmetric' o 'zigzag' en al menos 3 secciones.

CONFIGURACIÓN DE RITMO (EJEMPLOS DE SECUENCIA A-T):
A: Hero, Urgencia, Servicios, Prueba local, FAQ, CTA, Mapa
B: Hero, Trust band, Servicios, Pasos, Precios, FAQ, Prueba+Mapa, CTA Final
C: Hero proof-first, Servicios, Comparativa, Cobertura, CTA Medio, FAQ corto, CTA Final
D: Hero, Servicios, Urgencia, Resultados, Prueba Local, FAQ, Mapa, CTA Final
E: Hero, Prueba local, Servicios, Trust band, FAQ, CTA, Mapa
F: Hero, Urgencia, Servicios, Pasos, CTA Intermedio, Prueba local, FAQ, Mapa, CTA Final
G: Hero, Comparativa, Servicios, Urgencia, Prueba local, CTA, FAQ, Mapa
H: Hero, Servicios, Precios, FAQ, Prueba local, Mapa, CTA Final
I: Hero proof-first, Trust band, Servicios, Urgencia, FAQ corto, CTA, Mapa
J: Hero, Cobertura, Mapa integrado, Servicios, Prueba local, FAQ, CTA Final
K: Hero, Servicios, Prueba local, Pasos, Urgencia, FAQ, CTA, Mapa
L: Hero, Urgencia, Trust band, Servicios, FAQ, CTA Intermedio, Mapa, CTA Final
M: Hero, Servicios, Comparativa, Precios, Prueba local, FAQ corto, CTA Final, Mapa
N: Hero, Prueba local, Urgencia, Servicios, FAQ, Mapa, CTA Final
O: Hero, Servicios, CTA Intermedio, Trust band, Cobertura, FAQ, Mapa, CTA Final
P: Hero proof-first, Servicios, Urgencia, Precios, Prueba+Mapa, FAQ corto, CTA Final
Q: Hero, Trust band, Comparativa, Servicios, Prueba local, FAQ, CTA, Mapa
R: Hero, Servicios, Pasos, Urgencia, Cobertura, Mapa, FAQ, CTA Final
S: Hero, Urgencia, Servicios, Trust band, CTA Medio, FAQ, Prueba local, Mapa, CTA Final
T: Hero, Servicios, Prueba local, Comparativa, FAQ corto, CTA, Mapa

Misión: Decide el 'orderedSectionIds' basándote en estos ritmos o crea uno similar de alto impacto.
SKELETON: ${input.dna?.pageSkeleton || 'editorial-longform'}

REGLAS DE PATRONES (pattern):
- Si el skeleton es 'local-directory', usa pattern 'directory' en Prueba Local.
- Si el skeleton es 'premium-showcase', usa pattern 'mosaic' en Servicios.
- Si el skeleton es 'technical-comparison', usa pattern 'comparison_table' en Servicios o Precios.
- Si el skeleton es 'editorial-longform', usa pattern 'timeline' en Proceso.

VARIACIONES DE HERO: 'conversion', 'proof', 'local', 'urgency', 'educational', 'binary_cta', 'split', 'centered', 'cta-heavy'.

JSON SCHEMA:
{
  "pageComposition": "${pageComposition}",
  "visualRhythm": "dynamic|calm|cinematic",
  "widthAlternation": true,
  "pageSkeleton": "${input.dna?.pageSkeleton || 'editorial-longform'}",
  "heroTemplate": "conversion|proof|local|urgency|educational|binary_cta|split|centered|cta-heavy",
  "cadencePattern": "alternating|stacked|contrast-bursts",
  "proofStrategy": "early|mid|distributed",
  "ctaStrategy": "terminal|distributed|hero-heavy",
  "orderedSectionIds": ["id1", "id2", ...],
  "sections": {
    "section_id": {
      "pattern": "hero_split_left|hero_split_right|hero_center_stack|hero_proof_first|hero_cta_heavy|mosaic|directory|timeline|section_zigzag|...",
      "visualVariant": "default|...",
      "shell": "plain|panel|band|editorial|hero-bridge",
      "flow": "stack|split|zigzag|asymmetric|centered",
      "media": "none|iconic|illustrated|map|proof",
      "cta": "low|medium|high",
      "trust": "embedded|separate|mixed",
      "density": "standard|compact|rich",
      "mergedWith": "parent_id"
    }
  }
}
`;

        try {
            const responseText = await AIFacade.callOllama(this.name, prompt, this.model, { json: true });

            const raw = safeJsonParse<RawLayoutContract>(responseText, {
                pageComposition,
                visualRhythm: 'dynamic',
                widthAlternation: true,
                heroTemplate: 'split',
                cadencePattern: 'alternating',
                proofStrategy: 'distributed',
                ctaStrategy: 'terminal',
                orderedSectionIds: sections.map(s => s.section_id),
                sections: {}
            });

            const contract: LayoutContract = {
                pageComposition: raw.pageComposition || pageComposition,
                visualRhythm: pickAllowed(raw.visualRhythm as any, ALLOWED_RHYTHMS, (input.dna?.seed?.sectionRhythm as any) || 'dynamic'),
                widthAlternation: pickBoolean(raw.widthAlternation, true),
                heroTemplate: pickAllowed(raw.heroTemplate as any, ALLOWED_HERO_TEMPLATES, (input.dna?.seed?.heroVariant as any) || 'split'),
                pageSkeleton: pickAllowed(raw.pageSkeleton as any, ALLOWED_PAGE_SKELETONS, (input.dna?.seed?.pageSkeleton as any) || (input.dna?.pageSkeleton as any) || 'editorial-longform'),
                cadencePattern: pickAllowed(raw.cadencePattern as any, ALLOWED_CADENCE_PATTERNS, 'alternating'),
                proofStrategy: pickAllowed(raw.proofStrategy as any, ALLOWED_PROOF_STRATEGIES, (input.dna?.seed?.proofStyle as any) || 'distributed'),
                ctaStrategy: pickAllowed(raw.ctaStrategy as any, ALLOWED_CTA_STRATEGIES, (input.dna?.seed?.ctaModel as any) || 'terminal'),
                orderedSectionIds: orderSectionsByVisualIdentity(sections, visualIdentity?.orderedBlockTypes || fallbackArchetype.orderedBlockTypes),
                sections: {}
            };

            for (const section of sections) {
                const sectionType = section.block_type || section.format || 'unknown';
                const fallback = defaultSectionContract(sectionType, family);
                const rawSection = raw.sections?.[section.section_id];
                const normalized = normalizeSectionContract(rawSection, fallback);
                const blockDialect = visualIdentity?.blockDialects?.[String(sectionType).toLowerCase()];
                normalized.visualVariant = blockDialect || normalized.visualVariant;
                normalized.pattern = patternForDialect(blockDialect, normalized.pattern);

                // Seed-based overrides
                if (input.dna?.seed?.densityProfile) {
                    normalized.density = input.dna.seed.densityProfile as any;
                }

                contract.sections[section.section_id] = normalized;
            }

            // Anti-Repetition Check (Structural)
            const structuralFingerprint: StructuralFingerprint = {
                hero: contract.heroTemplate || 'split',
                order: contract.orderedSectionIds || [],
                shells: (contract.orderedSectionIds || []).map(id => contract.sections[id]?.shell || 'plain'),
                cadence: contract.cadencePattern || 'alternating',
                density: input.dna?.seed?.densityProfile || 'standard',
                composition: contract.pageComposition,
                patterns: (contract.orderedSectionIds || []).map(id => contract.sections[id]?.pattern || 'none')
            };

            const db = await dbManager.getDB();
            const scopes = deriveOriginalityScopes({ niche: input.niche, city: input.city });
            const repetitionScore = await scoreRepetitionRisk(db as any, scopes.map(s => s.key), {
                pageType: input.pageType || 'service',
                heroSignature: contract.heroTemplate || 'split',
                blockSequence: contract.orderedSectionIds || [],
                structural: structuralFingerprint
            });

            if (repetitionScore > 0.65) {
                this.logThought(`High structural repetition detected (${repetitionScore}). Shuffling rhythmic order...`);
                // Reverse middle sections to break the fingerprint
                if (contract.orderedSectionIds && contract.orderedSectionIds.length > 3) {
                    const hero = contract.orderedSectionIds[0];
                    const tail = contract.orderedSectionIds[contract.orderedSectionIds.length - 1];
                    const middle = contract.orderedSectionIds.slice(1, -1).reverse();
                    contract.orderedSectionIds = [hero, ...middle, tail];
                }
            }

            const riskStabilized = diversifyContractByRisk(contract, input.dna, input.pageType, input.niche, input.city);
            avoidAdjacentRepetition(riskStabilized, riskStabilized.orderedSectionIds!.map(id => ({ section_id: id })));

            return {
                success: true,
                data: riskStabilized,
                thoughts: `Layout rhythm designed with sequences A-T influence. Structural score: ${repetitionScore}.`
            };
        } catch (error: any) {
            this.logThought(`Error in Layout Composer: ${error.message}. Using emergency layout contract.`);

            const family = input.dna?.family || 'general';
            const pageComposition = input.dna?.pageComposition || 'conversion';

            // EMERGENCY LAYOUT CONTRACT
            const fallbackContract: LayoutContract = {
                pageComposition: pageComposition,
                visualRhythm: 'dynamic',
                widthAlternation: true,
                heroTemplate: 'split',
                pageSkeleton: 'editorial-longform',
                cadencePattern: 'alternating',
                proofStrategy: 'distributed',
                ctaStrategy: 'terminal',
                orderedSectionIds: sections.map(s => s.section_id),
                sections: {}
            };

            for (const section of sections) {
                const sectionType = section.block_type || section.format || 'unknown';
                fallbackContract.sections[section.section_id] = defaultSectionContract(sectionType, family);
            }

            return {
                success: true,
                data: fallbackContract,
                thoughts: "Layout rhythm contract defined using emergency fallback due to LLM failure."
            };
        }
    }
}