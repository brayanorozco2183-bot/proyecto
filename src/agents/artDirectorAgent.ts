import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { PageDesignDNA } from '../types/design.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { dbManager } from '../db/index.js';
import { deriveOriginalityScopes, scoreDesignRepetitionRisk, getRecentSiteStructureMemory } from '../originality/index.js';
import { PAGE_ARCHETYPES } from '../config/pageArchetypes.js';
import { buildSeed, pickSeeded, uniqueStrings } from '../utils/designSeed.js';

export interface ArtDirectorInput {
    intentModel: any;
    blueprint: any;
    strategicAnalysis: any;
    city: string;
    niche: string;
}

function normalizeFamilyId(id: any, seed = 'default'): string {
    const allowed = [
        'editorial',
        'conversion_heavy',
        'local_trust',
        'technical_grid',
        'asymmetric_premium',
        'minimal_authority'
    ];

    const s = String(id || '').toLowerCase().trim();

    if (s === 'editorial') return 'editorial';
    if (s === 'conversion_heavy') return 'conversion_heavy';
    if (s === 'local_trust') return 'local_trust';
    if (s === 'technical_grid') return 'technical_grid';
    if (s === 'asymmetric_premium') return 'asymmetric_premium';
    if (s === 'minimal_authority') return 'minimal_authority';

    if (s.includes('editorial')) return 'editorial';
    if (s.includes('conversion')) return 'conversion_heavy';
    if (s.includes('local')) return 'local_trust';
    if (s.includes('technical')) return 'technical_grid';
    if (s.includes('asymmetric') || s.includes('premium')) return 'asymmetric_premium';
    if (s.includes('minimal') || s.includes('authority')) return 'minimal_authority';

    return pickSeeded(allowed, seed);
}

function pickMissionAlignedFamily(input: ArtDirectorInput, seed: string): 'editorial' | 'conversion_heavy' | 'local_trust' | 'technical_grid' | 'asymmetric_premium' | 'minimal_authority' {
    const pageType = String(input.intentModel?.pageType || '').toLowerCase();
    const primaryIntent = String(input.intentModel?.primaryIntent || '').toLowerCase();
    const niche = String(input.niche || input.blueprint?.niche || '').toLowerCase();

    const isTechnicalLocalService = /cerraj|fontan|electric|carpint|repar|instal|persian|desatas|seguridad|climat|caldera|termo|electro|ascensor/.test(niche);
    const isDecorativeService = /pintor|pintura|decor|interiorismo|reforma|fachada|impermeabil|barniz|lacado|albañil|jardin|limpieza/.test(niche);
    const isTransactional = primaryIntent === 'transactional' || ['service', 'urgent', 'service_area', 'category', 'home_local', 'comparison'].includes(pageType);

    if (pageType === 'guide' || pageType === 'faq') {
        return pickSeeded(['editorial', 'minimal_authority'], `${seed}::informationalFamily`) as any;
    }

    if (pageType === 'urgent') {
        return pickSeeded(['conversion_heavy', 'technical_grid', 'asymmetric_premium'], `${seed}::urgentFamily`) as any;
    }

    if (pageType === 'service_area') {
        return pickSeeded(['local_trust', 'asymmetric_premium', 'minimal_authority'], `${seed}::areaFamily`) as any;
    }

    if (isTechnicalLocalService && isTransactional) {
        return pickSeeded(['technical_grid', 'asymmetric_premium', 'local_trust', 'conversion_heavy'], `${seed}::technicalFamily`) as any;
    }

    if (isDecorativeService && isTransactional) {
        return pickSeeded(['editorial', 'asymmetric_premium', 'minimal_authority', 'local_trust'], `${seed}::decorativeFamily`) as any;
    }

    if (isTransactional) {
        return pickSeeded(['asymmetric_premium', 'local_trust', 'conversion_heavy', 'minimal_authority'], `${seed}::transactionalFamily`) as any;
    }

    return pickSeeded(
        ['editorial', 'minimal_authority', 'local_trust', 'asymmetric_premium', 'technical_grid', 'conversion_heavy'],
        `${seed}::genericFamily`
    ) as any;
}

function hardenCommercialDna(input: ArtDirectorInput, dna: PageDesignDNA, seed: string): PageDesignDNA {
    const pageType = String(input.intentModel?.pageType || '').toLowerCase();
    const primaryIntent = String(input.intentModel?.primaryIntent || '').toLowerCase();
    const niche = String(input.niche || input.blueprint?.niche || '').toLowerCase();
    const isTechnicalLocalService = /cerraj|fontan|electric|carpint|repar|instal|persian|desatas|seguridad|climat|caldera|termo|electro|ascensor/.test(niche);
    const isDecorativeService = /pintor|pintura|decor|interiorismo|reforma|fachada|impermeabil|barniz|lacado|albañil|jardin|limpieza/.test(niche);
    const isCommercial = primaryIntent === 'transactional' || primaryIntent === 'commercial' || ['service', 'urgent', 'service_area', 'comparison', 'category', 'home_local'].includes(pageType);
    const blockTypes = Array.isArray(input.blueprint?.sections)
        ? input.blueprint.sections.map((s: any) => String(s?.block_type || '').toLowerCase())
        : [];
    const cardHeavyCount = blockTypes.filter((bt: string) =>
        ['services_grid', 'local_proof', 'trust_band', 'faq', 'process_steps'].includes(bt)
    ).length;

    if (!isCommercial) return dna;

    const preferredFamily = pickMissionAlignedFamily(input, `${seed}::harden`);
    const forceTechnical = isTechnicalLocalService || pageType === 'urgent';

    if (!dna.family || dna.family === 'editorial' || dna.family === 'minimal_authority') {
        dna.family = preferredFamily as any;
    }

    if (forceTechnical) {
        dna.personality = dna.family === 'local_trust' ? 'organic' : (dna.family === 'asymmetric_premium' ? 'luxury' : 'modern_tech');
        dna.pageComposition = pageType === 'service_area' ? 'trust_first' : 'conversion';
        dna.visualSystem = dna.family === 'local_trust' ? 'panelled' : (dna.family === 'asymmetric_premium' ? 'mixed' : 'grid');
        dna.pageSkeleton = pageType === 'urgent' ? 'premium-showcase' : (pageType === 'service_area' ? 'local-directory' : 'conversion-funnel');
        dna.heroTreatment = pickSeeded(['proof_first', 'split'], `${seed}::technicalHero`);
        dna.heroTemplate = dna.heroTreatment;
        dna.surfaceStyle = 'tinted';
        dna.cardTreatment = dna.family === 'asymmetric_premium' ? 'elevated' : 'outlined';
        dna.navbarTreatment = 'glass';
        dna.footerTreatment = 'minimal';
        dna.ornamentPolicy = dna.ornamentPolicy === 'none' ? 'subtle' : (dna.ornamentPolicy || 'subtle');
        dna.spacingScale = dna.spacingScale === 'compact' ? 'balanced' : (dna.spacingScale || 'balanced');
    } else if (isDecorativeService) {
        dna.personality = dna.family === 'asymmetric_premium' ? 'luxury' : 'editorial';
        dna.pageComposition = pickSeeded(['editorial', 'trust_first'], `${seed}::decorativeComposition`) as any;
        dna.visualSystem = dna.family === 'local_trust' ? 'panelled' : 'mixed';
        dna.pageSkeleton = pickSeeded(['editorial-longform', 'premium-showcase'], `${seed}::decorativeSkeleton`) as any;
        dna.heroTreatment = pickSeeded(['split', 'stacked', 'centered'], `${seed}::decorativeHero`) as any;
        dna.heroTemplate = dna.heroTreatment;
        dna.surfaceStyle = pickSeeded(['paper', 'flat', 'tinted'], `${seed}::decorativeSurface`) as any;
        dna.cardTreatment = pickSeeded(['editorial', 'elevated', 'outlined'], `${seed}::decorativeCards`) as any;
        dna.navbarTreatment = pickSeeded(['minimal', 'solid', 'glass'], `${seed}::decorativeNav`) as any;
        dna.footerTreatment = pickSeeded(['editorial', 'minimal'], `${seed}::decorativeFooter`) as any;
        dna.ornamentPolicy = dna.ornamentPolicy === 'none' ? 'subtle' : (dna.ornamentPolicy || 'subtle');
        dna.spacingScale = dna.spacingScale === 'compact' ? 'luxury' : (dna.spacingScale || 'luxury');
    }

    if (cardHeavyCount >= 4 && dna.family === 'technical_grid') {
        dna.family = 'asymmetric_premium' as any;
        dna.personality = 'luxury' as any;
        dna.visualSystem = 'mixed' as any;
        dna.cardTreatment = 'elevated' as any;
    }

    if (!dna.ctaStrategy || dna.ctaStrategy === 'minimal') {
        dna.ctaStrategy = (pageType === 'urgent' ? 'hero-heavy' : 'distributed') as any;
    }

    if (!dna.visualSystem || dna.visualSystem === 'minimal') {
        dna.visualSystem = (forceTechnical ? 'panelled' : (dna.family === 'editorial' ? 'editorial' : 'mixed')) as any;
    }

    if (cardHeavyCount >= 4 && dna.spacingScale === 'compact') {
        dna.spacingScale = 'balanced' as any;
    }

    dna.fingerprint = uniqueStrings([
        ...(dna.fingerprint || []),
        dna.family,
        dna.heroTreatment,
        dna.pageComposition,
        dna.visualSystem,
        dna.pageSkeleton
    ]);

    return dna;
}

function buildSeededFallbackDna(input: ArtDirectorInput): PageDesignDNA {
    const pageType = input.intentModel?.pageType || 'service';
    const archetypes = PAGE_ARCHETYPES[pageType] || PAGE_ARCHETYPES.service;
    const seed = buildSeed(
        input.blueprint?.niche,
        input.blueprint?.city,
        pageType,
        input.intentModel?.primaryKeyword,
        input.intentModel?.primaryIntent
    );

    const archetype = pickSeeded(archetypes, seed);

    const family = pickMissionAlignedFamily(input, seed);

    const personalityByFamily: Record<string, string> = {
        editorial: 'editorial',
        conversion_heavy: 'modern_tech',
        local_trust: 'organic',
        technical_grid: 'modern_tech',
        asymmetric_premium: 'luxury'
    };

    const visualSystemByFamily: Record<string, string> = {
        editorial: 'editorial',
        conversion_heavy: 'grid',
        local_trust: 'panelled',
        technical_grid: 'grid',
        asymmetric_premium: 'mixed'
    };

    return {
        designId: `seeded-${Date.now()}`,
        pageType,
        personality: personalityByFamily[family] as any,
        family: family as any,
        artDirection: `Use ${family} direction with strong differentiation from recent outputs.`,
        contrastModel: pickSeeded(['soft', 'balanced', 'dramatic'], `${seed}::contrast`) as any,
        tensionCurve: ['low', 'medium', 'high', 'medium', 'low'],
        heroTreatment: archetype.heroTemplate as any,
        heroDisposition: pickSeeded(['content_left', 'content_center', 'content_right'], `${seed}::heroDisposition`) as any,
        pageSkeleton: archetype.pageSkeleton as any,
        heroTemplate: archetype.heroTemplate as any,
        cadencePattern: archetype.cadencePattern as any,
        proofStrategy: archetype.proofStrategy as any,
        ctaStrategy: archetype.ctaStrategy as any,
        surfaceStyle: pickSeeded(['flat', 'tinted', 'glass', 'paper'], `${seed}::surface`) as any,
        cardTreatment: pickSeeded(['elevated', 'outlined', 'flat', 'editorial'], `${seed}::cards`) as any,
        navbarTreatment: pickSeeded(['solid', 'glass', 'minimal'], `${seed}::nav`) as any,
        footerTreatment: pickSeeded(['directory', 'minimal', 'editorial'], `${seed}::footer`) as any,
        ornamentPolicy: pickSeeded(['none', 'subtle', 'hero_only', 'hero_and_cta'], `${seed}::ornament`) as any,
        spacingScale: pickSeeded(['compact', 'balanced', 'luxury'], `${seed}::spacing`) as any,
        sectionCadence: archetype.cadencePattern === 'calm' ? 'calm' : archetype.cadencePattern === 'cinematic' ? 'cinematic' : 'alternating',
        pageComposition: archetype.pageComposition as any,
        visualSystem: visualSystemByFamily[family] as any,
        sectionFlow: uniqueStrings([
            archetype.cadencePattern === 'cinematic' ? 'immersive' : 'compact',
            archetype.pageComposition === 'editorial' ? 'dialogue' : 'framed',
            family === 'asymmetric_premium' ? 'immersive' : 'compact'
        ]) as any,
        fingerprint: [
            family,
            archetype.heroTemplate,
            archetype.pageComposition,
            visualSystemByFamily[family],
            archetype.cadencePattern,
            archetype.pageSkeleton,
            archetype.ctaStrategy
        ],
        seed: {
            compositionFamily: family,
            heroVariant: archetype.heroTemplate,
            sectionRhythm: archetype.cadencePattern === 'contrast-bursts' ? 'contrast' : archetype.cadencePattern as any,
            cardStyle: pickSeeded(['elevated', 'outlined', 'flat', 'editorial'], `${seed}::seedCard`) as any,
            densityProfile: pickSeeded(['compact', 'standard', 'rich'], `${seed}::density`) as any,
            proofStyle: archetype.proofStrategy as any,
            ctaModel: archetype.ctaStrategy as any,
            asymmetryLevel: family === 'asymmetric_premium' ? 8 : family === 'editorial' ? 5 : 3,
            pageSkeleton: archetype.pageSkeleton
        }
    };
}

export class ArtDirectorAgent extends BaseAgent {
    constructor() {
        super(
            'Art_Director_01',
            'Visual Strategy Lead',
            'Director de Arte',
            'Decide la dirección visual premium y la coherencia estética de la página.',
            vault.OLLAMA_MODEL_RESEARCH
        );
    }

    async execute(input: ArtDirectorInput): Promise<AgentResponse<PageDesignDNA>> {
        this.logThought("Defining visual DNA for the page...");

        const db = await dbManager.getDB();
        const mission = { city: input.city, niche: input.niche, cluster_data: input.blueprint.cluster_data };
        const scopes = deriveOriginalityScopes(mission).map(s => s.key);
        
        const recentSignatures = await getRecentSiteStructureMemory(db, scopes, 15);
        const recentFingerprints = recentSignatures.map(r => ({
            pageType: r.page_type,
            heroTreatment: r.hero_signature,
            blockVariantSequence: JSON.parse(r.block_variants_json || '[]')
        }));

        const prompt = `
Eres el Director de Arte Senior. Tu misión es definir el ADN VISUAL (PageDesignDNA) para una página premium.
No redactes contenido. Tu único output es la estrategia visual.

CONTEXTO:
- Nicho: ${input.blueprint.niche}
- Ciudad: ${input.blueprint.city}
- Tipo de Página: ${input.intentModel.pageType}
- Intención Primaria: ${input.intentModel.primaryIntent}
- Secciones Propuestas: ${input.blueprint.sections.map((s: any) => s.block_type).join(', ')}

MEMORIA DE DISEÑO (Fingerprints recientes):
${JSON.stringify(recentFingerprints)}

REGLAS DE ORO:
1. Manten una calidad visual alta y coherente.
2. La página debe ser RECONOCIBLE como premium.
3. EVITA repetir la misma firma compositiva de las últimas páginas.
4. Selecciona una PERSONALIDAD adecuada: 'luxury' | 'modern_tech' | 'organic' | 'editorial'.
5. Define una CURVA DE TENSIÓN ('low' | 'medium' | 'high') para cada sección.
6. EVITA MONOTONÍA: no encadenes más de dos bloques card-heavy seguidos (services_grid, local_proof, trust_band, faq).
7. El bloque de mapa no puede sentirse vacío o de compromiso: debe tener presencia visual real y copy de apoyo.
8. El cierre debe sentirse premium y resolutivo: en páginas comerciales evita ctaStrategy='minimal' salvo justificación muy fuerte.

TAXONOMÍA DE DNA:
- personality: luxury | modern_tech | organic | editorial
- contrastModel: soft | balanced | dramatic
- surfaceStyle: flat | tinted | glass | paper
- cardTreatment: elevated | outlined | flat | editorial
- navbarTreatment: solid | glass | minimal
- footerTreatment: directory | minimal | editorial
- ornamentPolicy: none | subtle | hero_only | hero_and_cta
- spacingScale: compact | balanced | luxury
- family: editorial | conversion_heavy | local_trust | technical_grid | asymmetric_premium | minimal_authority
- sectionCadence: calm | alternating | contrast | cinematic

OOUTPUT DESEADO (JSON):
{
  "designId": "string-unico",
  "pageType": "${input.intentModel.pageType}",
  "personality": "luxury | modern_tech | organic | editorial",
  "family": "editorial | conversion_heavy | local_trust | technical_grid | asymmetric_premium | minimal_authority",
  "artDirection": "instrucciones_cortas_de_estilo",
  "contrastModel": "...",
  "tensionCurve": ["low", "medium", "high", "..."],
  "heroTreatment": "split | centered | stacked | proof_first | cta_heavy",
  "heroDisposition": "content_left | content_center | content_right",
  "pageSkeleton": "editorial-longform | conversion-funnel | local-directory | premium-showcase | technical-comparison",
  "heroTemplate": "split | centered | proof_first | form_first | cta_heavy",
  "cadencePattern": "alternating | stacked | contrast-bursts | cinematic | calm",
  "proofStrategy": "early | mid | distributed | none",
  "ctaStrategy": "terminal | distributed | hero-heavy | minimal",
  "surfaceStyle": "...",
  "cardTreatment": "...",
  "navbarTreatment": "...",
  "footerTreatment": "...",
  "ornamentPolicy": "...",
  "spacingScale": "...",
  "sectionCadence": "...",
  "pageComposition": "editorial | conversion | local_dense | trust_first",
  "visualSystem": "grid | editorial | panelled | minimal | mixed",
  "sectionFlow": ["immersive", "compact", "framed", "dialogue"],
  "fingerprint": ["family", "heroTreatment", "pageComposition", "visualSystem", "cadence", "pageSkeleton", "ctaStrategy", "..."],
  "seed": {
    "compositionFamily": "string (debe coincidir con family)",
    "heroVariant": "string (debe coincidir con heroTreatment)",
    "sectionRhythm": "calm | alternating | contrast | cinematic",
    "cardStyle": "elevated | outlined | flat | editorial",
    "densityProfile": "compact | standard | rich",
    "proofStyle": "early | mid | distributed",
    "ctaModel": "terminal | distributed | hero-heavy",
    "asymmetryLevel": "number (0-10)",
    "pageSkeleton": "string (debe coincidir con pageSkeleton)"
  }
}
`;

        try {
            const ollamaUrl = vault.OLLAMA_URL || 'http://localhost:11434';

            const res = await axios.post(`${ollamaUrl}/api/generate`, {
                model: this.model,
                prompt,
                stream: false,
                format: 'json'
            }, { timeout: 180000 });

            const seed = buildSeed(
                input.blueprint?.niche,
                input.blueprint?.city,
                input.intentModel?.pageType,
                input.intentModel?.primaryKeyword
            );

            const dna = safeJsonParse<PageDesignDNA>(res.data.response, buildSeededFallbackDna(input));

            dna.family = normalizeFamilyId(dna.family, `${seed}::family`) as any;
            dna.heroTreatment = (dna.heroTreatment || dna.heroTemplate || 'split') as any;
            dna.heroTemplate = (dna.heroTemplate || dna.heroTreatment || 'split') as any;
            dna.pageSkeleton = dna.pageSkeleton || input.blueprint?.page_skeleton || 'conversion-funnel';
            dna.fingerprint = uniqueStrings([
                ...(dna.fingerprint || []),
                dna.family,
                dna.heroTreatment,
                dna.pageComposition,
                dna.visualSystem,
                dna.cadencePattern,
                dna.pageSkeleton,
                dna.ctaStrategy
            ]);

            hardenCommercialDna(input, dna, seed);

            const repetitionScore = await scoreDesignRepetitionRisk(db, scopes, {
                heroSignature: dna.heroTreatment,
                blockVariants: dna.tensionCurve || [],
                blockSequence: (dna.fingerprint || []).slice(0, 5),
                structural: {
                    order: dna.fingerprint || [],
                    shells: [],
                    composition: dna.pageComposition || 'conversion',
                    cadence: dna.sectionCadence || 'alternating'
                }
            });

            dna.repetitionRisk = repetitionScore as any;

            if (repetitionScore > 0.72) {
                await this.logThought(`High repetition risk detected (${repetitionScore}). Applying strong diversification.`);

                const rerolled = buildSeededFallbackDna({
                    ...input,
                    blueprint: {
                        ...input.blueprint,
                        niche: `${input.blueprint?.niche}::reroll`,
                        city: input.blueprint?.city
                    }
                });

                dna.family = rerolled.family;
                dna.personality = rerolled.personality;
                dna.heroTreatment = rerolled.heroTreatment;
                dna.heroTemplate = rerolled.heroTemplate;
                dna.pageSkeleton = rerolled.pageSkeleton;
                dna.cadencePattern = rerolled.cadencePattern;
                dna.proofStrategy = rerolled.proofStrategy;
                dna.ctaStrategy = rerolled.ctaStrategy;
                dna.surfaceStyle = rerolled.surfaceStyle;
                dna.cardTreatment = rerolled.cardTreatment;
                dna.navbarTreatment = rerolled.navbarTreatment;
                dna.footerTreatment = rerolled.footerTreatment;
                dna.ornamentPolicy = rerolled.ornamentPolicy;
                dna.spacingScale = rerolled.spacingScale;
                dna.pageComposition = rerolled.pageComposition;
                dna.visualSystem = rerolled.visualSystem;
                dna.sectionFlow = rerolled.sectionFlow;
                dna.seed = rerolled.seed;
                dna.fingerprint = rerolled.fingerprint;
                hardenCommercialDna(input, dna, `${seed}::rerolled`);
            }
            return {
                success: true,
                data: dna,
                thoughts: `DNA Visual definido: ${dna.personality} con familia ${dna.family}.`
            };
        } catch (error: any) {
            this.logThought(`Error in Art Director: ${error.message}. Using emergency visual DNA.`);
            const fallbackDna = buildSeededFallbackDna(input) as PageDesignDNA;
            (fallbackDna as any).degraded = true;
            (fallbackDna as any).degradationReason = 'art_director_llm_failure';

            return {
                success: true,
                data: fallbackDna,
                thoughts: "Visual DNA defined using emergency fallback due to LLM failure."
            };
        }
    }
}