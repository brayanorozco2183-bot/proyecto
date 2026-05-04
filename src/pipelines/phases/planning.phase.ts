import { ContentArchitectAgent } from '../../agents/architect.js';
import { ArtDirectorAgent } from '../../agents/artDirectorAgent.js';
import { LayoutComposerAgent } from '../../agents/layoutComposerAgent.js';
import { ContentVarietyAgent } from '../../agents/contentVarietyAgent.js';
import { dbManager } from '../../db/index.js';
import { 
    prepareClusterArtifacts, 
    attachInternalLinkingToPlan 
} from '../../internal-linking/index.js';
import {
    prepareOriginalityConstraints,
    scoreDesignRepetitionRisk,
    deriveOriginalityScopes,
    buildOriginalityDirective
} from '../../originality/index.js';
import { 
    GenerationMission, 
    NormalizedContext, 
    PagePlan, 
    StructuralFingerprint 
} from '../../types/pipeline_v2.js';
import { enforceDeterministicPagePlan } from '../../design-system/deterministicAiKernel.js';

export class PlanningPhase {
    constructor(
        private architect: ContentArchitectAgent,
        private artDirector: ArtDirectorAgent,
        private layoutComposer: LayoutComposerAgent,
        private varietyEngine: ContentVarietyAgent
    ) {}

    async run(research: NormalizedContext, mission: GenerationMission): Promise<PagePlan> {
        console.log(`[Phase 3] Iniciando planificación arquitectónica para ${research.city}...`);
        let attempts = 0;
        let successfulPlan: PagePlan | null = null;
        let originalityDirective: string | undefined;

        while (attempts < 2 && !successfulPlan) {
            attempts++;

            const cluster = prepareClusterArtifacts(
                mission,
                research.intentModel?.pageType || 'service',
                research.intentModel?.primaryKeyword || mission.niche,
                research.strategicAnalysis?.internalLinkTargets || [],
            );

            const architectResult = await this.architect.execute({
                niche: research.niche,
                city: research.city,
                silo_structure: research.clustered_keywords?.map(c => c.cluster) || [],
                word_count_target: mission.contextual_data?.wordCountTarget || Math.max(1500, research.intentModel?.wordCountTarget || 0),
                entities: research.deduplicated_entities || [],
                cluster_data: mission.cluster_data,
                local_nap: research.clean_nap,
                intentModel: research.intentModel!,
                strategicAnalysis: research.strategicAnalysis,
                serpInsights: research.serpInsights,
                serpEvidence: research.serp_evidence,
                researchMode: research.researchConfig?.mode,
                linkingContext: cluster.architectContext,
                originalityDirective,
            });

            if (architectResult.success) {
                let blueprint = architectResult.data;
                blueprint = attachInternalLinkingToPlan(blueprint, cluster);

                if (!blueprint.intentModel) blueprint.intentModel = research.intentModel;
                if (!blueprint.seoBrief) {
                    blueprint.seoBrief = {
                        titleStrategy: '',
                        metaDescriptionStrategy: '',
                        canonicalSlug: '',
                        schemaTypes: ['LocalBusiness'],
                        faqEligible: true,
                        localModifiers: [research.city]
                    };
                }
                
                const artDirectorResult = await this.artDirector.execute({
                    intentModel: research.intentModel,
                    blueprint,
                    strategicAnalysis: research.strategicAnalysis,
                    serpInsights: research.serpInsights,
                    serpEvidence: research.serp_evidence,
                    city: mission.city,
                    niche: mission.niche
                });
                const dna = artDirectorResult.success ? artDirectorResult.data : undefined;

                const varietyResult = await this.varietyEngine.execute({
                    h1: blueprint.h1,
                    pageType: blueprint.intentModel?.pageType || 'service',
                    intentModel: blueprint.intentModel,
                    sections: blueprint.sections,
                    designDNA: dna
                });

                const layoutContract = await this.callLayoutComposerWithFastFallback({
                    blueprint,
                    dna: artDirectorResult.data,
                    niche: mission.niche,
                    city: mission.city,
                    pageType: research.intentModel?.pageType || 'service'
                });

                if (layoutContract && dna) {
                    const db = await dbManager.getDB();
                    const scopes = deriveOriginalityScopes(mission);
                    const scopeKeys = scopes.map(s => s.key);

                    const structuralSignature: StructuralFingerprint = {
                        hero: layoutContract.heroTemplate || 'split',
                        order: layoutContract.orderedSectionIds || [],
                        shells: (layoutContract.orderedSectionIds || []).map((id: string) => layoutContract.sections?.[id]?.shell || 'plain'),
                        cadence: layoutContract.cadencePattern || 'alternating',
                        density: dna.seed?.densityProfile || 'standard',
                        composition: layoutContract.pageComposition || 'conversion',
                        patterns: (layoutContract.orderedSectionIds || []).map((id: string) => layoutContract.sections?.[id]?.pattern || 'none')
                    };

                    const repetitionScore = await scoreDesignRepetitionRisk(db, scopeKeys, {
                        heroSignature: dna.heroTreatment,
                        blockVariants: dna.tensionCurve || [],
                        blockSequence: layoutContract.orderedSectionIds || [],
                        structural: structuralSignature
                    });

                    if (repetitionScore > 0.72) {
                        layoutContract.pageComposition = layoutContract.pageComposition === 'editorial' ? 'conversion' : 'editorial';
                        layoutContract.heroTemplate = layoutContract.heroTemplate === 'split' ? 'centered' : 'split';
                        layoutContract.cadencePattern = layoutContract.cadencePattern === 'calm' ? 'cinematic' : 'calm';
                    }
                }

                const finalPlan: PagePlan = {
                    ...blueprint,
                    design: { dna },
                    layoutContract,
                    pageVariety: varietyResult.data,
                    pageProfile: varietyResult.data?.profile
                } as any;

                const originalityResult = await prepareOriginalityConstraints({ mission, pagePlan: finalPlan });
                finalPlan.originalityPlan = originalityResult;

                if (!originalityResult.passed && attempts === 1) {
                    originalityDirective = buildOriginalityDirective(originalityResult) || "Riesgo de repetición estructural detectado.";
                    continue;
                }

                successfulPlan = enforceDeterministicPagePlan(finalPlan, {
                    niche: mission.niche,
                    city: mission.city,
                    pageType: research.intentModel?.pageType || 'service'
                });
            }
        }

        if (!successfulPlan) throw new Error("Phase 3 Architecture Failure.");
        return successfulPlan;
    }

    async validatePlanningGate(plan: PagePlan): Promise<void> {
        if (!plan.h1 || !plan.h1.trim()) throw new Error("Planning Gate Failure: missing H1.");
        if (!Array.isArray(plan.sections) || plan.sections.length < 5) throw new Error("Planning Gate Failure: insufficient sections.");
    }

    private async callLayoutComposerWithFastFallback(input: {
        blueprint: any;
        dna: any;
        niche: string;
        city: string;
        pageType: string;
    }): Promise<any> {
        const timeoutMs = 90000;
        const canSkipComposer = Boolean(
            input?.blueprint?.degraded
            || input?.dna?.degraded
            || String(process.env.LAYOUT_COMPOSER_FORCE_DETERMINISTIC || '').toLowerCase() === 'true'
            || ['service', 'urgent', 'service_area', 'comparison', 'category', 'home_local', 'faq'].includes(String(input?.pageType || '').toLowerCase())
        );

        if (canSkipComposer) {
            return this.buildEmergencyLayoutContract(input.blueprint, input.dna);
        }

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`timeout of ${timeoutMs}ms exceeded (pipeline fast-fallback)`)), timeoutMs)
            );
            const result: any = await Promise.race([
                this.layoutComposer.execute(input),
                timeoutPromise
            ]);
            if (result?.success && result?.data) return result.data;
            throw new Error(result?.error || 'layout composer returned no data');
        } catch (error: any) {
            console.warn(`[Pipeline] Layout Composer fast fallback activated: ${error.message}`);
            return this.buildEmergencyLayoutContract(input.blueprint, input.dna);
        }
    }

    private buildEmergencyLayoutContract(blueprint: any, dna: any): any {
        const sections = Array.isArray(blueprint?.sections) ? blueprint.sections : [];
        const fallbackSections: Record<string, any> = {};

        for (const section of sections) {
            const sectionId = section.section_id || String(section.block_type || 'section');
            fallbackSections[sectionId] = {
                shell: section.block_type === 'trust_band' ? 'band' : 'panel',
                density: section.content_density || 'standard',
                pattern: section.block_type === 'faq' ? 'accordion' : 'stack',
                emphasis: section.emphasis || 'content',
                layout: section.layout_hint || 'full_width_text'
            };
        }

        return {
            pageComposition: dna?.pageComposition || 'conversion',
            visualRhythm: 'dynamic',
            widthAlternation: true,
            heroTemplate: dna?.heroTemplate || 'split',
            pageSkeleton: dna?.pageSkeleton || 'editorial-longform',
            cadencePattern: dna?.cadencePattern || 'alternating',
            proofStrategy: dna?.proofStrategy || 'distributed',
            ctaStrategy: dna?.ctaStrategy || 'terminal',
            orderedSectionIds: sections.map((s: any) => s.section_id),
            sections: fallbackSections
        };
    }
}
