import { PageDesignDNA, ResolvedPageRenderPlan, HeroRenderContract, SectionRenderContract, ResponsivePlan } from '../types/design.js';
import { VarietyResult, SectionVariety } from '../agents/contentVarietyAgent.js';
import { IntentModel, LayoutContract } from '../types/pipeline_v2.js';
import { getFamilyDefinition } from '../design-system/families/index.js';
import { resolveThemeFromDna } from '../design-system/themes/index.js';
import { buildSeed, pickSeeded } from '../utils/designSeed.js';
import { 
    resolveHeroVariant,
    resolveServicesGridVariant,
    resolveLocalProofVariant,
    resolveTrustBandVariant,
    resolveProcessStepsVariant,
    resolvePriceGuidanceVariant,
    resolveFaqVariant,
    resolveCtaPanelVariant,
    resolveComparisonTableVariant,
    resolveMapVariant
} from './blocks/index.js';
import { selectGravityMasterclass, applyMasterclassBlockVariants } from '../design-system/masterclassRegistry.js';
import { enforceDeterministicResolvedRenderPlan } from '../design-system/deterministicAiKernel.js';


/**
 * RenderPlanResolver
 * 
 * Este módulo toma el output de los agentes estratégicos (Architect, Art Director, Variety, Composer)
 * y lo resuelve en un plan de renderizado firme y obligatorio.
 */
export class RenderPlanResolver {
    private static resolveHeroTemplate(
        dna: PageDesignDNA,
        layout: LayoutContract | undefined,
        profile: VarietyResult['profile']
    ): HeroRenderContract['template'] {
        const raw = (dna.heroTreatment || layout?.heroTemplate || profile.hero_variant || 'split').toString().trim();

        if (raw === 'proof-first') return 'proof_first';
        if (raw === 'cta-heavy') return 'cta_heavy';
        if (raw === 'proof_first' || raw === 'cta_heavy' || raw === 'split' || raw === 'centered' || raw === 'stacked') {
            return raw as HeroRenderContract['template'];
        }

        if (raw === 'conversion' || raw === 'binary_cta') return 'cta_heavy';
        if (raw === 'proof' || raw === 'form-first') return 'proof_first';
        if (raw === 'local' || raw === 'educational') return 'stacked';

        return 'split';
    }

    private static resolveHeroMediaMode(template: HeroRenderContract['template']): HeroRenderContract['mediaMode'] {
        if (template === 'split') return 'photo_slot';
        if (template === 'centered') return 'shape';
        if (template === 'proof_first') return 'illustration';
        return 'none';
    }

    private static resolveHeroMobileBehavior(template: HeroRenderContract['template'], ctaWeight: HeroRenderContract['ctaWeight']): HeroRenderContract['mobileBehavior'] {
        if (ctaWeight === 'high') return 'cta_first';
        if (template === 'proof_first') return 'content_first';
        return 'stack';
    }

    private static resolveWidthMode(layoutHint?: string, blockType?: string): SectionRenderContract['widthMode'] {
        if (layoutHint === 'full_width_text') return 'wide';
        if (layoutHint === 'minimal_centered') return 'narrow';
        if (blockType === 'map') return 'full_bleed';
        return 'standard';
    }

    private static resolveFlow(
        layoutHint?: string,
        lcFlow?: string,
        blockType?: string,
        familyDef?: any
    ): SectionRenderContract['flow'] {
        if (lcFlow && ['stack', 'split', 'zigzag', 'asymmetric', 'centered'].includes(lcFlow)) {
            const familyPreferred = familyDef?.layoutRules?.preferredFlowsByBlockType?.[blockType || ''];
            if (Array.isArray(familyPreferred) && familyPreferred.length > 0) {
                const candidate = familyPreferred[0];
                if (['stack', 'split', 'zigzag', 'asymmetric', 'centered'].includes(candidate)) {
                    return candidate as SectionRenderContract['flow'];
                }
            }
            return lcFlow as SectionRenderContract['flow'];
        }
        if (layoutHint === 'split_feature') return 'split';
        if (layoutHint === 'minimal_centered') return 'centered';
        if (layoutHint === 'two_column_trust') return 'split';
        if (layoutHint === 'boxed_content') return 'stack';
        return 'stack';
    }

    private static resolveShell(
        sv: SectionVariety,
        profile: VarietyResult['profile'],
        lc: any,
        familyDef: any
    ): SectionRenderContract['shell'] {
        const familyId = familyDef?.id;

        if (familyId === 'conversion_heavy') {
            if (sv.block_type === 'urgency_panel' || sv.block_type === 'cta_panel' || sv.block_type === 'trust_band') return 'band';
            if (sv.block_type === 'local_proof' || sv.block_type === 'faq' || sv.block_type === 'price_guidance') return 'panel';
            return 'plain';
        }

        if (familyId === 'local_trust') {
            if (sv.block_type === 'cta_panel' || sv.block_type === 'trust_band') return 'band';
            if (['services_grid', 'local_proof', 'faq', 'price_guidance', 'map'].includes(sv.block_type)) return 'panel';
            return sv.block_type === 'process_steps' ? 'plain' : 'panel';
        }

        if (familyId === 'technical_grid') {
            if (sv.block_type === 'urgency_panel' || sv.block_type === 'cta_panel') return 'band';
            if (['services_grid', 'local_proof', 'faq', 'price_guidance', 'map'].includes(sv.block_type)) return 'panel';
            return 'plain';
        }

        if (familyId === 'editorial') {
            if (sv.block_type === 'editorial_quote') return 'editorial';
            if (sv.block_type === 'hero_bridge') return 'plain';
            return 'editorial';
        }

        if (sv.block_type === 'hero_bridge') return 'plain';
        if (sv.block_type === 'trust_band') return 'band';
        if (sv.block_type === 'cta_panel') return 'band';
        if (sv.block_type === 'local_proof' || sv.block_type === 'faq' || sv.block_type === 'map') return 'panel';
        if (sv.block_type === 'comparison_table') return 'comparison';

        return 'plain';
    }

    private static resolveCardStyle(
        sv: SectionVariety,
        profile: VarietyResult['profile'],
        familyDef: any
    ): SectionRenderContract['cardStyle'] {
        const familyId = familyDef?.id;
        if (familyId === 'asymmetric_premium') return 'editorial';
        if (familyId === 'conversion_heavy') return 'elevated';

        const variant = (sv.visual_variant || profile.card_variant || 'elevated').toString().trim();
        if (variant === 'outlined' || variant === 'flat' || variant === 'editorial' || variant === 'elevated') {
            return variant as SectionRenderContract['cardStyle'];
        }
        const fallback = familyDef?.surfaces?.defaultCardStyle || 'elevated';
        const allowed = familyDef?.surfaces?.allowedCardStyles || ['elevated'];

        if (allowed.includes(variant)) {
            return variant as SectionRenderContract['cardStyle'];
        }

        return fallback as SectionRenderContract['cardStyle'];
    }

    private static resolveOrnamentLevel(dna: PageDesignDNA, sv: SectionVariety, familyId?: string): SectionRenderContract['ornamentLevel'] {
        if (familyId === 'minimal_authority') return 'none';
        if (familyId === 'conversion_heavy') return 'strong';
        if (dna.ornamentPolicy === 'none') return 'none';
        if (sv.visual_spec?.decorativeLevel === 'strong') return 'strong';
        if (sv.visual_spec?.decorativeLevel === 'soft') return 'soft';
        if (dna.ornamentPolicy === 'hero_and_cta') return 'strong';
        return 'soft';
    }

    private static resolveVariant(
        blockType: string,
        visualVariant?: string,
        familyId?: string,
        pageType?: string,
        pageId?: string
    ): string {
        const seed = buildSeed(pageId || 'page', familyId || 'family', pageType || 'pageType', blockType, visualVariant || 'auto');

        const familyPools: Record<string, Partial<Record<string, string[]>>> = {
            technical_grid: {
                services_grid: ['editorial_columns', 'clean_cards'],
                process_steps: ['grid_steps', 'numbered_list'],
                local_proof: ['list_detailed', 'cards_minimal'],
                urgency_panel: ['command_center', 'sidebar_alert'],
                faq: ['editorial_list', 'accordion_clean'],
                cta_panel: ['luxury_banner', 'minimal_phone_bar'],
                map: ['boxed_with_text', 'spotlight_card']
            },
            asymmetric_premium: {
                services_grid: ['editorial_columns', 'clean_cards'],
                process_steps: ['timeline_vertical', 'numbered_list'],
                local_proof: ['cards_minimal', 'list_detailed'],
                faq: ['editorial_list', 'accordion_clean'],
                cta_panel: ['luxury_banner', 'minimal_phone_bar'],
                price_guidance: ['cards_price', 'list_transparent'],
                trust_band: ['minimal_icons', 'static_pills'],
                map: ['spotlight_card', 'boxed_with_text']
            },
            local_trust: {
                services_grid: ['editorial_columns', 'clean_cards'],
                process_steps: ['grid_steps', 'numbered_list'],
                local_proof: ['list_detailed', 'cards_minimal'],
                faq: ['editorial_list', 'accordion_clean'],
                cta_panel: ['luxury_banner', 'minimal_phone_bar'],
                price_guidance: ['list_transparent', 'cards_price'],
                trust_band: ['minimal_icons', 'static_pills'],
                map: ['boxed_with_text', 'spotlight_card']
            },
            conversion_heavy: {
                services_grid: ['clean_cards', 'icon_tiles'],
                process_steps: ['grid_steps', 'timeline_vertical'],
                urgency_panel: ['command_center', 'sidebar_alert'],
                faq: ['accordion_clean', 'editorial_list'],
                cta_panel: ['luxury_banner', 'minimal_phone_bar'],
                trust_band: ['minimal_icons', 'static_pills'],
                map: ['boxed_with_text', 'spotlight_card']
            },
            editorial: {
                services_grid: ['editorial_columns', 'clean_cards'],
                process_steps: ['numbered_list', 'timeline_vertical'],
                local_proof: ['list_detailed', 'cards_minimal'],
                faq: ['editorial_list', 'accordion_clean'],
                cta_panel: ['luxury_banner', 'minimal_phone_bar'],
                trust_band: ['minimal_icons', 'static_pills'],
                map: ['spotlight_card', 'boxed_with_text']
            },
            minimal_authority: {
                services_grid: ['editorial_columns', 'clean_cards'],
                process_steps: ['numbered_list', 'grid_steps'],
                local_proof: ['cards_minimal', 'list_detailed'],
                faq: ['editorial_list', 'accordion_clean'],
                cta_panel: ['luxury_banner', 'minimal_phone_bar'],
                map: ['boxed_with_text', 'minimal_embed']
            }
        };

        const pool = familyPools[familyId || '']?.[blockType] || [];
        const seededVariant = pool.length ? pickSeeded(pool, seed) : visualVariant;

        switch (blockType) {
            case 'hero_trust': return resolveHeroVariant(seededVariant || visualVariant);
            case 'services_grid': return resolveServicesGridVariant(seededVariant || visualVariant);
            case 'local_proof': return resolveLocalProofVariant(seededVariant || visualVariant);
            case 'trust_band': return resolveTrustBandVariant(seededVariant || visualVariant);
            case 'urgency_panel': return seededVariant || visualVariant || 'sidebar_alert';
            case 'process_steps': return resolveProcessStepsVariant(seededVariant || visualVariant);
            case 'price_guidance': return resolvePriceGuidanceVariant(seededVariant || visualVariant);
            case 'faq': return resolveFaqVariant(seededVariant || visualVariant);
            case 'cta_panel': {
                const safeCtaVariant =
                    seededVariant === 'minimal_phone_bar' && pageType !== 'guide' && pageType !== 'faq'
                        ? 'luxury_banner'
                        : (seededVariant || visualVariant);
                return resolveCtaPanelVariant(safeCtaVariant);
            }
            case 'comparison_table': return resolveComparisonTableVariant(seededVariant || visualVariant);
            case 'map': {
                const safeMapVariant =
                    seededVariant === 'minimal_embed' && pageType !== 'guide' && pageType !== 'faq'
                        ? 'boxed_with_text'
                        : (seededVariant || visualVariant);
                return resolveMapVariant(safeMapVariant);
            }
            default: return seededVariant || visualVariant || 'default';
        }
    }

    private static resolveConstraints(sv: SectionVariety, familyId?: string): SectionRenderContract['constraints'] {
        if (familyId === 'asymmetric_premium') {
             return { maxColumnsDesktop: 2, maxColumnsTablet: 1, maxColumnsMobile: 1, textMeasure: 'medium' };
        }
        if (sv.preferred_format === 'table') {
            return { maxColumnsDesktop: 4, maxColumnsTablet: 2, maxColumnsMobile: 1, textMeasure: 'wide' };
        }
        if (sv.block_type === 'services_grid' || sv.block_type === 'local_proof' || sv.block_type === 'trust_band' || sv.block_type === 'process_steps') {
            return { maxColumnsDesktop: 2, maxColumnsTablet: 2, maxColumnsMobile: 1, textMeasure: 'medium' };
        }
        if (sv.preferred_format === 'cards' || sv.preferred_format === 'trust_cards') {
            return { maxColumnsDesktop: 2, maxColumnsTablet: 2, maxColumnsMobile: 1, textMeasure: 'medium' };
        }
        if (sv.layout_hint === 'minimal_centered') {
            return { maxColumnsDesktop: 1, maxColumnsTablet: 1, maxColumnsMobile: 1, textMeasure: 'narrow' };
        }
        if (sv.layout_hint === 'full_width_text') {
            return { maxColumnsDesktop: 1, maxColumnsTablet: 1, maxColumnsMobile: 1, textMeasure: 'wide' };
        }
        return { maxColumnsDesktop: 2, maxColumnsTablet: 2, maxColumnsMobile: 1, textMeasure: 'medium' };
    }
    static resolve(
        pageId: string,
        blueprint: any,
        intentModel: IntentModel,
        variety: VarietyResult,
        layout?: LayoutContract,
        renderMode: 'web' | 'wordpress' = 'web'
    ): ResolvedPageRenderPlan {
        const profile = (variety as any)?.profile || (variety as any) || {};
        const dna = profile.designDNA || {} as PageDesignDNA;

        // --- Masterclass Diagnostic Patch Injection ---
        const selectedMasterclass = selectGravityMasterclass({
            niche: blueprint?.niche || intentModel.pageType,
            city: blueprint?.city || 'default',
            pageId
        });
        // ----------------------------------------------

        const familyId = dna.family || 'minimal_authority';
        const familyDef = getFamilyDefinition(familyId);

        // 1. Resolver el Contrato del Hero
        // Prioridad: DNA > Layout > Profile
        let heroTemplate = this.resolveHeroTemplate(dna, layout, profile);
        if (
            familyId === 'technical_grid' &&
            ['service', 'urgent', 'service_area', 'category', 'home_local'].includes(intentModel.pageType)
        ) {
            heroTemplate = 'proof_first';
        }
        const ctaWeight: HeroRenderContract['ctaWeight'] =
            (familyId === 'conversion_heavy') ? 'high' :
            (dna.ctaStrategy === 'hero-heavy' || layout?.ctaStrategy === 'hero-heavy')
                ? 'high'
                : (dna.ctaStrategy === 'minimal' || layout?.ctaStrategy === 'minimal')
                    ? 'low'
                    : 'medium';

        const proofPlacement: HeroRenderContract['proofPlacement'] =
            (familyId === 'asymmetric_premium') ? 'below_headline' :
            (dna.proofStrategy === 'early' || layout?.proofStrategy === 'early')
                ? 'below_headline'
                : (dna.proofStrategy === 'distributed' || layout?.proofStrategy === 'distributed')
                    ? 'inline'
                    : 'right_column';

        const hero: HeroRenderContract = {
            template: heroTemplate,
            contentDisposition:
                familyId === 'asymmetric_premium' ? 'right' :
                dna.heroDisposition === 'content_left'
                    ? 'left'
                    : dna.heroDisposition === 'content_right'
                        ? 'right'
                        : 'center',
            ctaWeight,
            proofPlacement,
            mediaMode: this.resolveHeroMediaMode(heroTemplate),
            spacingProfile:
                familyId === 'asymmetric_premium' ? 'luxury' :
                profile.content_density === 'compacto'
                    ? 'compact'
                    : profile.content_density === 'detallado'
                        ? 'luxury'
                        : 'balanced',
            mobileBehavior: this.resolveHeroMobileBehavior(heroTemplate, ctaWeight)
        };

        // 2. Resolver Contratos de Sección
        const blueprintSections = Array.isArray(blueprint?.sections) ? blueprint.sections : [];
        const varietySectionsRaw = Array.isArray(variety?.sections) ? variety.sections : blueprintSections;

        // Reorder based on layout contract if available
        let varietySections = [...varietySectionsRaw];
        if (layout?.orderedSectionIds && layout.orderedSectionIds.length > 0) {
            const idMap = new Map(varietySections.map(s => [s.section_id || (s as any).id, s]));
            const reordered = layout.orderedSectionIds
                .map(id => idMap.get(id))
                .filter(Boolean) as SectionVariety[];
            
            // Add any sections that were missing from orderedSectionIds
            const reorderedIds = new Set(layout.orderedSectionIds);
            const leftovers = varietySections.filter(s => !reorderedIds.has(s.section_id || (s as any).id));
            
            varietySections = [...reordered, ...leftovers];
        }

        // --- ENFORCEMENT: Map after Local Proof ---
        const localProofIdx = varietySections.findIndex(s => {
            const bt = (s.block_type || (s as any).blockType || '').toString().toLowerCase();
            return bt === 'local_proof' || bt === 'local-proof';
        });
        const mapIdx = varietySections.findIndex(s => {
            const bt = (s.block_type || (s as any).blockType || '').toString().toLowerCase();
            return bt === 'map' || bt === 'google_map';
        });

        if (localProofIdx !== -1 && mapIdx !== -1 && mapIdx !== localProofIdx + 1) {
            const [mapSection] = varietySections.splice(mapIdx, 1);
            // Re-find because index changed
            const newLocalIdx = varietySections.findIndex(s => {
                const bt = (s.block_type || (s as any).blockType || '').toString().toLowerCase();
                return bt === 'local_proof' || bt === 'local-proof';
            });
            varietySections.splice(newLocalIdx + 1, 0, mapSection);
        }
        // ------------------------------------------

        const sections: SectionRenderContract[] = [];
        
        varietySections.forEach((sv: SectionVariety, idx: number) => {
            const sectionId = sv.section_id || (sv as any).id || `section-${idx}`;
            const lc = layout?.sections?.[sectionId];
            const bpSection = blueprintSections.find((s: any) => s.section_id === sectionId) || {};

            // PRUNING LOGIC: Skip generic/redundant sections
            if (sv.block_type === 'trust_band' || sv.block_type === 'trust_strip') {
                if (familyId === 'minimal_authority' || familyId === 'asymmetric_premium') {
                    console.log(`[Resolver] Pruning trust_band for ${familyId} family (minimalism focus).`);
                    return;
                }
            }

            const shell = this.resolveShell(sv, profile, lc, familyDef);
            let flow = this.resolveFlow(sv.layout_hint, lc?.flow, sv.block_type, familyDef);
            
            // ASYMMETRIC LOGIC: Reduce symmetry by forcing flows
            if (familyId === 'asymmetric_premium') {
                if (idx % 2 === 0 && flow === 'stack') flow = 'asymmetric';
                if (idx % 2 !== 0 && flow === 'stack') flow = 'split';
            }

            const density = (familyId === 'conversion_heavy') ? 'rich' : (lc?.density || sv.content_density || 'standard');
            const pattern = lc?.pattern || sv.pattern_hint || 'auto';
            const blockType = sv.block_type || bpSection.block_type || 'generic';
            const variant = this.resolveVariant(blockType, sv.visual_variant || bpSection.visual_variant, familyId, intentModel.pageType, pageId);
            const widthMode = this.resolveWidthMode(sv.layout_hint, sv.block_type);
            const constraints = this.resolveConstraints(sv, familyId);

            sections.push({
                sectionId,
                blockType,
                variant,
                shell,
                flow,
                widthMode,
                emphasis: (sv.emphasis || 'content') as SectionRenderContract['emphasis'],
                density: (density === 'rich' ? 'rich' : density === 'compact' ? 'compact' : 'standard') as SectionRenderContract['density'],
                cardStyle: this.resolveCardStyle(sv, profile, familyDef),
                ornamentLevel: this.resolveOrnamentLevel(dna, sv, familyId),
                sectionPattern: pattern,
                mobilePattern: (sv.visual_spec?.mobilePattern || 'stack') as SectionRenderContract['mobilePattern'],
                constraints
            });
        });

        // --- Apply Masterclass Block Variants ---
        const finalSections = applyMasterclassBlockVariants(sections, selectedMasterclass);
        // ----------------------------------------

        // 3. Plan Responsive Base
        const responsivePlan: ResponsivePlan = {
            breakpointDesktop: 1200,
            breakpointTablet: 768,
            breakpointMobile: 480,
            baseFontSize: 16,
            scalingFactor: 1.2
        };

        const theme = resolveThemeFromDna(dna);

        // 4. Consolidar el Plan Maestro
        const resolvedPlan = {
            pageId,
            pageType: intentModel.pageType,
            renderMode,
            visualSystem: {
                family: familyId,
                pageComposition: profile.page_composition || 'editorial',
                heroTreatment: dna.heroTreatment || layout?.ctaStrategy || 'split',
                cadence: dna.sectionCadence || 'alternating',
                contrastModel: dna.contrastModel || 'balanced',
                spacingScale: dna.spacingScale || 'balanced',
                surfaceStyle: dna.surfaceStyle || 'flat',
                cardTreatment: dna.cardTreatment || 'elevated',
                navbarTreatment: dna.navbarTreatment || (familyId === 'technical_grid' ? 'glass' : 'solid'),
                footerTreatment: dna.footerTreatment || 'directory',
                ornamentPolicy: dna.ornamentPolicy || 'none'
            },
            hero,
            sections: finalSections,
            theme,
            masterclass: selectedMasterclass as any, // Inyectar la masterclass para el ProceduralEngine
            themeId: theme.id,
            responsivePlan,
            outputFingerprintSeed: dna.fingerprint || []
        } as ResolvedPageRenderPlan;

        return enforceDeterministicResolvedRenderPlan(resolvedPlan, {
            niche: blueprint?.niche,
            city: blueprint?.city,
            pageType: intentModel.pageType
        });
    }
}