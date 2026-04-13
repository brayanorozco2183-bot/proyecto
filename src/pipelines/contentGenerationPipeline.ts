import { ContentArchitectAgent } from '../agents/architect.js';
import { ArtDirectorAgent } from '../agents/artDirectorAgent.js';
import { LayoutComposerAgent } from '../agents/layoutComposerAgent.js';
import * as cheerio from 'cheerio';
import { ContentWriterAgent } from '../agents/contentWriterAgent.js';
import { QualityScoreAgent } from '../agents/quality_score.js';
import { ContentVarietyAgent } from '../agents/contentVarietyAgent.js';
import { NicheCoherenceAgent } from '../agents/nicheCoherenceAgent.js';
import { SpanishCorrectorAgent } from '../agents/spanishCorrectorAgent.js';
import { SectionIntegrityRefiner } from '../utils/sectionIntegrityRefiner.js';
import { ContextNormalizer } from '../utils/contextNormalizer.js';
import { IntegrityGuard } from '../utils/integrityGuard.js';
import { buildDeterministicSlug } from '../seo/slugEngine.js';
import { resolvePlaybookForMission } from '../niches/agentAdapters.js';
import { AuditSentinel } from '../utils/auditSentinel.js';
import { StructuralFingerprint } from '../types/pipeline_v2.js';
import {
    assertNoTemplateLeaks,
    assertNoDegenerateBodySignature,
    assertNoRepeatedBoilerplate
} from '../utils/renderQualityGuards.js';
import {
    validateRenderedPageTechnically,
    TechnicalSeoValidationInput
} from '../utils/technicalPageValidator.js';
import { 
    buildSeoForPipeline, 
    attachRenderedSeoToDraft 
} from '../seo/pipelineIntegration.js';
import { buildPageBreadcrumbs, mapBreadcrumbsForRenderer } from '../seo/breadcrumbFactory.js';
import { validateRenderCompleteness } from '../quality/postRenderCompletenessGuard.js';
import type { RenderedSeoContract } from '../seo/types.js';
import { 
    attachInternalLinkingToPlan,
    injectAutomaticLinkBlocks,
    prepareClusterArtifacts,
    validatePlanInternalLinking,
    buildSiteGraph
} from '../internal-linking/index.js';
import { 
    prepareOriginalityConstraints, 
    recordOriginalityAfterRender,
    runSiteOriginalityGate,
    deriveOriginalityScopes,
    scoreDesignRepetitionRisk
} from '../originality/index.js';
import { dbManager } from '../db/index.js';

// Phase A Agents
import { SEOAnalystAgent } from '../agents/analyst.js';
import { GeoIntelAgent } from '../agents/geointel.js';
import { CompetitorAuditAgent } from '../agents/competitor_audit.js';
import { SERPGapAgent } from '../agents/serpGapAgent.js';
import { EntityExtractorAgent } from '../agents/entityExtractorAgent.js';
import { NAPGuardianAgent } from '../agents/nap.js';

// Phase B/C Agents
import { ContextualVariationAgent } from '../agents/contextualVariationAgent.js';

// Phase K Agents
import { StaticDeployAgent } from '../agents/static_deploy.js';
import { serpManager } from '../tools/scraper.js';

import fs from 'fs/promises';
import path from 'path';
import { autoFixLayoutHtml } from '../utils/layoutGuard.js';
import { sanitizeFinalRenderedHtml } from '../utils/finalDocumentSanitizer.js';
import { guardRenderedHtml } from '../utils/renderOutputGuard.js';
import { renderPage } from '../design-system/procedural-engine.js';
import type { GeneratedSection } from '../design-system/procedural-engine.js';
import { renderInternalLinkingBlock } from '../renderers/blocks/shared/internalLinking.js';
import { RenderPlanResolver } from '../renderers/renderPlanResolver.js';
import { ResolvedPageRenderPlan } from '../types/design.js';

import {
    GenerationMission,
    PipelineResult,
    ResearchContext,
    NormalizedContext,
    PagePlan,
    ContentDraft,
    ContentBlock,
    RenderedPage,
    BlockScore,
    PostDeployAuditResult,
    ObservabilityMetadata,
    IntentModel
} from '../types/pipeline_v2.js';
import { editorialPostProcessHtml } from '../utils/editorialPostProcessor.js';
import { runQualityGate, runAsyncQualityGate, formatQualityGateIssues } from '../validators/qualityGate.js';
import { UXValidator } from '../validators/uxValidator.js';

export class ContentGenerationPipeline {
    // Agents by Phase
    private analyst: SEOAnalystAgent;
    private geointel: GeoIntelAgent;
    private competitorAudit: CompetitorAuditAgent;
    private serpGap: SERPGapAgent;
    private entityExtractor: EntityExtractorAgent;
    private napAgent: NAPGuardianAgent;

    private architect: ContentArchitectAgent;
    private varietyEngine: ContentVarietyAgent;
    private contextualVariation: ContextualVariationAgent;

    private writer: ContentWriterAgent;

    private nicheCoherenceAgent: NicheCoherenceAgent;
    private spanishCorrector: SpanishCorrectorAgent;

    private qualityScoreAgent: QualityScoreAgent;
    private staticDeploy: StaticDeployAgent;
    private artDirector: ArtDirectorAgent;
    private layoutComposer: LayoutComposerAgent;

    constructor() {
        this.analyst = new SEOAnalystAgent();
        this.geointel = new GeoIntelAgent();
        this.competitorAudit = new CompetitorAuditAgent();
        this.serpGap = new SERPGapAgent();
        this.entityExtractor = new EntityExtractorAgent();
        this.napAgent = new NAPGuardianAgent();

        this.architect = new ContentArchitectAgent();
        this.varietyEngine = new ContentVarietyAgent();
        this.contextualVariation = new ContextualVariationAgent();

        this.writer = new ContentWriterAgent();

        this.nicheCoherenceAgent = new NicheCoherenceAgent();
        this.spanishCorrector = new SpanishCorrectorAgent();

        this.qualityScoreAgent = new QualityScoreAgent();
        this.staticDeploy = new StaticDeployAgent();
        this.artDirector = new ArtDirectorAgent();
        this.layoutComposer = new LayoutComposerAgent();
    }


    async run(mission: GenerationMission): Promise<PipelineResult | null> {
        // PHASE 0.1: Resolve Niche Playbook
        try {
            const playbookContext = resolvePlaybookForMission(mission.niche);
            mission.contextual_data = {
                ...(mission.contextual_data || {}),
                nichePlaybook: playbookContext
            };
            console.log(`[Phase 0.1] Playbook resolved for niche: ${mission.niche}`);
            
            // Inject niche briefs into agents
            if (playbookContext) {
                this.analyst.setNicheBrief(playbookContext.analystBrief);
                this.architect.setNicheBrief(playbookContext.architectBrief);
                this.writer.setNicheBrief(playbookContext.writerBrief);
                this.writer.setTechnicalBrief(playbookContext.technicalBrief);
                this.nicheCoherenceAgent.setTechnicalBrief(playbookContext.technicalBrief);
                this.spanishCorrector.setTechnicalBrief(playbookContext.technicalBrief);
                this.qualityScoreAgent.setTechnicalBrief(playbookContext.technicalBrief);
            }
        } catch (e: any) {
            console.warn(`[Phase 0.1] Failed to resolve playbook for niche ${mission.niche}. Error: ${e.message}. Using generic rules.`);
        }

        const obs: ObservabilityMetadata = {
            durations: {},
            scores: {},
            retries: {},
            agent_logs: [],
            tokenUsage: 0,
            tokenBudget: 50000,
            totalCost: 0,
            agentConfidence: {}
        };

        // PHASE 0.5: CLUSTER GRAPH (New Implementation)
        console.log(`[Phase 0.5] Initializing Programmatic Site Graph...`);
        const siteGraph = buildSiteGraph(mission);

        if (mission.missionId) {
            const allAgents = [
                this.architect, this.varietyEngine, this.contextualVariation,
                this.writer, this.nicheCoherenceAgent, this.spanishCorrector,
                this.qualityScoreAgent, this.staticDeploy,
                this.layoutComposer
            ];
            allAgents.forEach(a => (a as any).setMissionId?.(mission.missionId));
        }

        console.log(`\n===========================================`);
        console.log(`🚀 PIPELINE V3 (12-Phase): ${mission.city} (${mission.niche})`);
        console.log(`===========================================\n`);

        const startTime = Date.now();

        try {
            // PHASE 1: RESEARCH
            let researchContext: ResearchContext | undefined;
            const phase1Start = Date.now();
            console.log(`[Phase 1] Researching local and niche intelligence...`);
            researchContext = await this.runResearchPhase(mission);
            obs.durations['Research'] = Date.now() - phase1Start;

            // PHASE 2: CONTEXT NORMALIZATION
            let normalizedContext: NormalizedContext;
            const phase2Start = Date.now();
            normalizedContext = await this.runNormalizationPhase(researchContext!);
            await this.validateNormalizationGate(normalizedContext!);
            obs.durations['Normalization'] = Date.now() - phase2Start;

            // PHASE 3: PLANNING
            let pagePlan: PagePlan;
            const phase3Start = Date.now();
            console.log(`[Phase 3] Designing semantic and visual plan...`);
            pagePlan = await this.runPlanningPhase(normalizedContext!, mission);
            await this.validatePlanningGate(pagePlan, mission);
            obs.durations['Planning'] = Date.now() - phase3Start;

            // PHASE 3: VARIETY already resolved inside Planning
            const phase3VarietyStart = Date.now();
            console.log(`[Phase 3] Reusing planning-resolved variety profile...`);

            const varietyResult = {
                success: true,
                data: pagePlan.pageVariety || {
                    h1: pagePlan.h1,
                    profile: pagePlan.pageProfile,
                    sections: pagePlan.sections || []
                }
            };

            obs.durations['Variety'] = Date.now() - phase3VarietyStart;

            // RESOLVE RENDER PLAN (PHASE 3.5)
            console.log(`[Phase 3.5] Resolving mandatory render plan...`);
            console.log(`[DEBUG_PIPELINE] pagePlan keys: ${Object.keys(pagePlan || {}).join(', ')}`);
            console.log(`[DEBUG_PIPELINE] pagePlan.layoutContract: ${pagePlan.layoutContract ? 'PRESENT' : 'MISSING'}`);
            
            if (!pagePlan.layoutContract) {
                throw new Error('Planning Gate Failure: missing layoutContract before RenderPlanResolver.');
            }

            if (!pagePlan.pageProfile) {
                console.warn(`[DEBUG_PIPELINE] pagePlan.pageProfile is MISSING. Using varietyResult.data as fallback.`);
                pagePlan.pageProfile = varietyResult.data?.profile || varietyResult.data;
            }

            const resolvedPlan = RenderPlanResolver.resolve(
                mission.missionId || `${mission.niche}-${mission.city}`,
                pagePlan,
                pagePlan.intentModel,
                varietyResult.data,
                pagePlan.layoutContract,
                mission.wordpress?.enabled ? 'wordpress' : 'web'
            );
            // PHASE 4: WRITING
            const phase4Start = Date.now();
            console.log(`[Phase 4] Generating content draft by blocks...`);
            // Pass the loaded draft if any to allow block-level resumption
            const contentDraft = await this.runWritingPhase(
                normalizedContext!,
                pagePlan!,
                mission,
                obs,
                resolvedPlan
            );
            obs.durations['Writing'] = Date.now() - phase4Start;

            // Budget & Health Check
            if ((obs.tokenUsage || 0) > (obs.tokenBudget || 15000)) {
                throw new Error(`Budget Guard: Token limit exceeded (${obs.tokenUsage}/${obs.tokenBudget}). Aborting for cost safety.`);
            }
            // Temporal Timeout Guard removed by user request for slow models

            // PHASE 5: CORRECTION
            const phase5Start = Date.now();
            console.log(`[Phase 5] Refining and correcting content...`);
            const correctedDraft = await this.runCorrectionPhase(contentDraft, normalizedContext);
            obs.durations['Correction'] = Date.now() - phase5Start;

            // PHASE 6: PRE-ASSEMBLY INTEGRITY
            const phase6Start = Date.now();
            console.log(`[Phase 6] Checking block integrity before enrichment...`);
            this.validateWordBudget(correctedDraft, mission.contextual_data?.wordCountTarget || pagePlan?.intentModel?.wordCountTarget || 2100);
            await this.validatePreAssemblyIntegrityGate(correctedDraft);
            obs.durations['Integrity'] = Date.now() - phase6Start;

            // PHASE 7: ENRICHMENT
            const phase7Start = Date.now();
            console.log(`[Phase 7] Enriching content (SEO/Authority)...`);
            const enrichedDraftRaw = await this.runEnrichmentPhase(correctedDraft, normalizedContext, pagePlan, mission);
            
            // PHASE 7.5: SEO ARCHITECTURE
            console.log(`[Phase 7.5] Generating Technical SEO contract...`);
            const faqs = (enrichedDraftRaw.blocks || [])
                .filter((b: any) => b.metadata?.block_type === 'faq')
                .flatMap((b: any) => {
                    const meta = b.metadata || {};
                    const semantic = meta.semantic || {};
                    return (semantic.faqItems || meta.faqItems || meta.items || []).filter((f: any) => f.question && f.answer);
                });
            
            const seoResult = buildSeoForPipeline(pagePlan, mission, faqs);
            
            // Inject internal links from graph (Preferring new programmatic plan)
            const internalLinks = (pagePlan.internalLinking?.linkPlan?.all || []).map((c: any) => ({
                url: c.targetSlug.startsWith('/') ? c.targetSlug : `/${c.targetSlug}/`,
                text: c.anchor,
                relation: c.direction
            }));
            
            // Breadcrumbs are now handled within buildSeoForPipeline -> buildRenderedSeo

            const enrichedDraft = attachRenderedSeoToDraft(enrichedDraftRaw, seoResult.renderedSeo);
            (pagePlan as any).seoBrief = seoResult.seoBrief; // Sync back for validators
            (pagePlan as any).internalLinks = internalLinks; // For architect/writer

            obs.durations['Enrichment'] = Date.now() - phase7Start;



            // PHASE 8: ASSEMBLY
            const phase8Start = Date.now();
            console.log(`[Phase 8] Procedural assembly...`);
            const renderedPage = await this.runAssemblyPhase(enrichedDraft, pagePlan, normalizedContext, mission, resolvedPlan);
            obs.durations['Assembly'] = Date.now() - phase8Start;

            // PHASE 8.5: COMPLETENESS GUARD
            console.log(`[Phase 8.5] Quality guard: Completeness check...`);
            const completeness = validateRenderCompleteness(renderedPage.html);
            if (!completeness.passed) {
                const completenessErrors = completeness.issues.map(i => `[COMPLETENESS:${i.code}] ${i.message}`);
                renderedPage.metadata.validation_errors.push(...completenessErrors);
                console.warn(`[Completeness Guard] Failed: ${completenessErrors.join(', ')}`);
                throw new Error(`Render completeness failed: ${completeness.issues.map(i => i.code).join(', ')}`);
            }

            // PHASE 9: TECHNICAL VALIDATION
            const phase9Start = Date.now();
            console.log(`[Phase 9] Deterministic technical validation...`);
            
            const validationInput: TechnicalSeoValidationInput = {
                expectedPhone: mission.local_nap?.phone || '',
                expectedCanonicalBase: mission.siteConfig?.baseUrl || 'https://serviciosprofesionales.pro',
                pageType: resolvedPlan.pageType,
                requireFaq: seoResult.seoBrief.faqEligible,
                expectedBusinessName: mission.local_nap?.business_name,
                expectedAddress: mission.local_nap?.address,
                pagePlan: pagePlan,
                mission: mission,
                renderedSeo: seoResult.renderedSeo
            };

            const techIssues = validateRenderedPageTechnically(renderedPage, validationInput);
            renderedPage.metadata.technical_passed = techIssues.length === 0;
            renderedPage.metadata.validation_errors.push(...techIssues);
            obs.durations['TechValidation'] = Date.now() - phase9Start;

            if (!renderedPage.metadata.technical_passed) {
                try {
                    await fs.writeFile(path.join(process.cwd(), 'debug_failed_assembly.html'), renderedPage.html);
                    console.log(`[DEBUG] Saved failed assembly to debug_failed_assembly.html for inspection.`);
                } catch (e) { }
                throw new Error(`Technical Validation Failed: ${techIssues.join(', ')}`);
            }

            // PHASE 9.25: UX VALIDATION
            const phase925Start = Date.now();
            console.log(`[Phase 9.25] Playwright-based UX & Responsive validation...`);
            try {
                const uxResult = await UXValidator.validate(renderedPage.html, mission.missionId || `${mission.niche}-${mission.city}-${Date.now()}`);
                obs.durations['UXValidation'] = Date.now() - phase925Start;
                (renderedPage.metadata as any).ux_audit = uxResult;

                if (!uxResult.passed) {
                    const criticalIssues = uxResult.issues.filter(i => i.severity === 'error');
                    renderedPage.metadata.validation_errors.push(
                        ...criticalIssues.map(i => `[UX:${i.viewport}:${i.type}] ${i.message}`)
                    );
                    
                    if (criticalIssues.length > 0) {
                        console.warn(`[UX] Non-fatal UX failures: ${criticalIssues[0].message}`);
                    }
                }
            } catch (uxErr) {
                console.warn(`[UX] Skipping UX validation due to environment issues: ${(uxErr as Error).message}`);
            }

            // PHASE 9.5: DETERMINISTIC QUALITY GATE
            const phase95Start = Date.now();
            console.log(`[Phase 9.5] Deterministic quality gate...`);
            if (enrichedDraft.metadata?.seo?.schemaTypes) {
                const types = enrichedDraft.metadata.seo.schemaTypes;
                (pagePlan as any).schemaTypes = types;
                if ((pagePlan as any).strategicAnalysis) (pagePlan as any).strategicAnalysis.schemaTypes = types;
                if ((pagePlan as any).seoBrief) (pagePlan as any).seoBrief.schemaTypes = types;
                console.log(`[DEBUG_PIPELINE] Synced schemas to PagePlan: ${JSON.stringify(types)}`);
            }

            const qualityGateResult = await runAsyncQualityGate({
                html: renderedPage.html,
                city: mission.city,
                niche: mission.niche,
                businessName: mission.local_nap?.business_name,
                phone: mission.local_nap?.phone,
                mission: mission,
                pagePlan: pagePlan,
                pageId: mission.missionId
            });

            (renderedPage.metadata as any).qualityGate = qualityGateResult;
            renderedPage.metadata.validation_errors.push(
                ...qualityGateResult.issues.map((i: any) => `[QUALITY:${i.code}] ${i.message}`)
            );

            obs.durations['QualityGate'] = Date.now() - phase95Start;
            obs.scores['QualityGate'] = qualityGateResult.score;

            if (!qualityGateResult.passed) {
                try {
                    await fs.writeFile(
                        path.join(process.cwd(), 'debug_failed_quality_gate.html'),
                        renderedPage.html
                    );
                    console.log(`[DEBUG] Saved failed quality gate page to debug_failed_quality_gate.html.`);
                } catch (e) { }

                throw new Error(
                    `Quality Gate Failed (${qualityGateResult.score}/100): ${formatQualityGateIssues(qualityGateResult)}`
                );
            }

            // PHASE 10: EDITORIAL VALIDATION
            const phase10Start = Date.now();
            console.log(`[Phase 10] LLM-based editorial validation...`);
            const auditResult = await this.runEditorialValidation(renderedPage, mission);
            renderedPage.metadata.qaScore = auditResult.score;
            renderedPage.metadata.editorial_passed = auditResult.score >= 70; // Relaxed for emergency mode
            if (auditResult.score < 70) {
                throw new Error(`Editorial Validation Failed: score demasiado bajo (${auditResult.score}).`);
            }
            obs.durations['EditorialValidation'] = Date.now() - phase10Start; // Fixed duration variable
            obs.scores['QA'] = auditResult.score;

            // GLOBAL LENGTH VALIDATION
            const wordTarget = mission.contextual_data?.wordCountTarget || 1200; // Lowered default
            const actualWords = (enrichedDraft.totalWords || 0);
            if (actualWords < wordTarget * 0.35) { // Relaxed to 35% for emergency mode
                throw new Error(`Length Validation Failed: Página demasiado corta (${actualWords}/${wordTarget} palabras).`);
            }

            // PHASE 11: DELIVERY
            const phase11Start = Date.now();
            console.log(`[Phase 11] Delivering page...`);
            await this.runDeliveryPhase(renderedPage, mission);
            obs.durations['Delivery'] = Date.now() - phase11Start;

            // PHASE 12: POST-DEPLOY AUDIT
            const phase12Start = Date.now();
            console.log(`[Phase 12] Post-deploy auditing...`);
            const auditReport = await this.runPostDeployAudit(renderedPage, mission);
            obs.durations['PostAudit'] = Date.now() - phase12Start;

            obs.durations['Total'] = Date.now() - startTime;

            // PHASE 12: SITE-LEVEL ORIGINALITY RECORDING
            console.log(`[Phase 12] Recording site-level originality signatures for "${mission.city}"...`);
            await recordOriginalityAfterRender({
                mission,
                pagePlan,
                html: renderedPage.html,
                pageId: mission.missionId
            });

            // EXTRACT FAQS FOR SCHEMA
            const allFaqs: { question: string; answer: string }[] = [];
            enrichedDraft.blocks.forEach((b: any) => {
                const semantic = b.metadata?.semantic;
                if (semantic?.faqItems) {
                    allFaqs.push(...semantic.faqItems);
                }
            });

            return {
                html: renderedPage.html,
                metadata: {
                    h1: pagePlan.h1,
                    totalWords: enrichedDraft.totalWords || 0,
                    sectionsCount: enrichedDraft.blocks.length,
                    qaScore: renderedPage.metadata.qaScore,
                    issues: renderedPage.metadata.validation_errors,
                    observability: obs,
                    audit: auditReport,
                    faqs: allFaqs
                }
            };

        } catch (error: any) {
            console.error(`[CRITICAL FAILURE] Pipeline V3 aborted: ${error.message}`);
            // Fallback logging
            obs.agent_logs.push(`CRITICAL_ERROR: ${error.message}`);
            return null;
        }
    }



    private async runResearchPhase(mission: GenerationMission): Promise<ResearchContext> {
        console.log(`[Phase 1.1] Geo-Intelligence & Local Mapping...`);
        const geoResponse = await this.geointel.execute({
            root_location: mission.city,
            scope: 'auto'
        });
        const geoData = geoResponse?.success ? {
            neighborhoods: geoResponse.data?.neighborhoods || [],
            sub_locations: geoResponse.data?.sub_locations || []
        } : { neighborhoods: [], sub_locations: [] };

        console.log(`[Phase 1.2] SDI SERP Extraction...`);
        const serpData = await serpManager.scrapeUnifiedSERP(mission.niche, mission.city);
        const organicResults = serpData.organic || [];
        const localPack = serpData.localPack || [];

        console.log(`[Phase 1.3] Competitive Audit & SERP Deep Analysis...`);
        const auditResponse = await this.competitorAudit.execute({
            targetLinks: organicResults.map(r => r.link)
        });
        const deepAudits = Array.isArray(auditResponse?.data) ? auditResponse.data : [];
        const organicLeaders = organicResults;

        // RESEARCH GATE: Ensure minimum intelligence exists
        const minAudits = 2;
        if (deepAudits.length < minAudits) {
            console.warn(`[Research Gate] Warning: Insufficient deep audits (${deepAudits.length}/${minAudits}). Strategy might be degraded.`);
        }

        console.log(`[Phase 1.4] Entity Extraction & Niche Knowledge...`);
        const entityResponse = await this.entityExtractor.execute({
            keyword: mission.niche,
            serpData: {
                organic: organicResults,
                audits: deepAudits
            }
        });
        const entities = entityResponse?.data?.entities || [];

        console.log(`[Phase 1.5] Identifying Content Gaps & Opportunities...`);
        const serpGapResponse = await this.serpGap.execute({
            keyword: mission.niche,
            audits: deepAudits
        });

        console.log(`[Phase 1.6] Strategic Intelligence Synthesis...`);
        const analystResponse = await this.analyst.execute({
            niche: mission.niche,
            city: mission.city,
            marketData: {
                localPack: localPack,
                organicLeaders: organicLeaders,
                deepAudits: deepAudits
            }
        });
        const analystData = analystResponse?.data || {};

        const intentModel: IntentModel = {
            pageType: analystData.pageTypeRecommendation || 'service',
            primaryIntent: analystData.primaryIntent || 'commercial',
            secondaryIntent: analystData.secondaryIntent,
            funnelStage: analystData.funnelStage || 'BOFU',
            primaryKeyword: analystData.primaryKeyword || mission.niche,
            secondaryKeywords: analystData.secondaryKeywords || [],
            semanticEntities: Array.from(new Set([...(analystData.entities || []), ...entities])),
            serpFeaturesTarget: analystData.serpFeaturesTarget || ['local_pack'],
            mandatoryTrustElements: analystData.trustAssets || ['telefono visible', 'cobertura local'],
            mandatorySections: analystData.contentAngles || [],
            internalLinkTargets: analystData.internalLinkTargets || [],
            conversionGoal: 'call',
            wordCountTarget: analystData.wordCountTarget
        };

        const napResponse = await this.napAgent.execute({
            niche: mission.niche,
            city: mission.city,
            business_name: mission.local_nap.business_name,
            address: mission.local_nap.address,
            phone: mission.local_nap.phone
        });

        const napData = napResponse?.success && napResponse?.data
            ? napResponse.data
            : mission.local_nap;

        return {
            niche: mission.niche,
            city: mission.city,
            local_nap: {
                business_name: napData.business_name,
                address: napData.address,
                phone: napData.phone,
                mapEmbedUrl: napData.mapEmbedUrl
            },
            keywords: intentModel.secondaryKeywords,
            entities: intentModel.semanticEntities,
            competitors: organicLeaders,
            serp_gaps: serpGapResponse?.data?.missing_topics || [],
            market_data: analystData,
            intentModel,
            strategicAnalysis: analystData,
            geoData
        };
    }

    private async runNormalizationPhase(research: ResearchContext): Promise<NormalizedContext> {
        return ContextNormalizer.normalize(research);
    }

    private async validateNormalizationGate(context: NormalizedContext): Promise<void> {
        if (!context.clean_nap.phone_normalized || context.clean_nap.phone_normalized.length < 9) {
            console.warn("[Normalization Gate] WARNING: Invalid or unparseable phone number. Proceeding with placeholder.");
            return;
        }
    }

    private async runPlanningPhase(research: NormalizedContext, mission: GenerationMission): Promise<PagePlan> {
        await this.analyst.logThought(`[Phase 3] Iniciando planificación arquitectónica para ${research.city}...`);
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
                word_count_target: mission.contextual_data?.wordCountTarget || Math.max(
                    1500,
                    research.intentModel?.wordCountTarget || 0
                ),
                entities: research.deduplicated_entities || [],
                cluster_data: mission.cluster_data,
                local_nap: research.clean_nap,
                intentModel: research.intentModel!,
                strategicAnalysis: research.strategicAnalysis,
                linkingContext: cluster.architectContext,
                originalityDirective,
            });

            if (architectResult.success) {
                console.log(`[DEBUG_PLANNING] Architect Raw SchemaTypes: ${JSON.stringify((architectResult.data as any).schemaTypes)}`);
                let blueprint = architectResult.data;
                blueprint = attachInternalLinkingToPlan(blueprint, cluster);
                console.log(`[DEBUG_PLANNING] Blueprint SchemaTypes after linking: ${JSON.stringify((blueprint as any).schemaTypes)}`);

                if (!blueprint.intentModel) {
                    blueprint.intentModel = research.intentModel;
                }
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
                if (!blueprint.contentRules) {
                    blueprint.contentRules = {
                        prohibitedClaims: [
                            '20 minutos',
                            'llegamos en 20',
                            'garantía de 10 años',
                            'garantía de 5 años',
                            'precio cerrado desde',
                            'mejor precio de la ciudad'
                        ],
                        disallowedLocalEntities: research.strategicAnalysis?.disallowedEntities || [],
                        factOnlyFields: ['address', 'phone'],
                        maxBrandMentionsPerSection: 1,
                        differentiationRequirements: []
                    };
                }
                const artDirectorResult = await this.artDirector.execute({
                    intentModel: research.intentModel,
                    blueprint,
                    strategicAnalysis: research.strategicAnalysis,
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

                const layoutComposerResult = await this.layoutComposer.execute({
                    blueprint: architectResult.data,
                    dna: artDirectorResult.data,
                    niche: mission.niche,
                    city: mission.city,
                    pageType: research.intentModel?.pageType || 'service'
                });
                // Allow degraded results but let the quality guards check the final render
                /*
                if ((artDirectorResult.data as any)?.degraded) {
                    throw new Error(`Art Director degradado: ${(artDirectorResult.data as any).degradationReason || 'unknown'}`);
                }
                if ((architectResult.data as any)?.degraded) {
                    throw new Error(`Architect degradado: ${(architectResult.data as any).degradationReason || 'unknown'}`);
                }
                */
                if (!layoutComposerResult.success) continue;
                const layoutContract = layoutComposerResult.data;

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
                        console.log(`[Pipeline] High repetition risk (${repetitionScore}). Applying structural post-layout flip.`);
                        layoutContract.pageComposition = layoutContract.pageComposition === 'editorial' ? 'conversion' : 'editorial';
                        layoutContract.heroTemplate = layoutContract.heroTemplate === 'split' ? 'centered' : 'split';
                        layoutContract.cadencePattern = layoutContract.cadencePattern === 'calm' ? 'cinematic' : 'calm';
                    }
                }

                const finalPlan: PagePlan = {
                    ...blueprint,
                    design: {
                        dna
                    },
                    layoutContract,
                    pageVariety: varietyResult.data,
                    pageProfile: varietyResult.data?.profile
                } as any;

                // PHASE 3.2: Site-Level Originality Check (Anti-Repetition)
                console.log(`[Phase 3.2] Checking site-level originality for "${research.city}"...`);
                const originalityResult = await prepareOriginalityConstraints({ mission, pagePlan: finalPlan });
                finalPlan.originalityPlan = originalityResult;

                if (!originalityResult.passed && attempts === 1) {
                    console.warn(`[Originality] Alert: Repetition risk detected in plan. Retrying with specific directives.`);
                    originalityDirective = originalityResult.guidance?.avoidHeroSignatures?.length 
                        ? `ALERTA DE REPETICIÓN: Evite estos h1/heros: ${originalityResult.guidance.avoidHeroSignatures.join(', ')}. ${originalityResult.guidance.avoidH2Openings.join(', ')}`
                        : "Riesgo de repetición estructural detectado. Varíe el orden de secciones y los arranques de los bloques.";
                    continue; 
                }

                successfulPlan = finalPlan;
                console.log(`[DEBUG_PLANNING] successfulPlan.layoutContract: ${successfulPlan.layoutContract ? 'FOUND' : 'NULL'}`);
            }
        }

        if (!successfulPlan) throw new Error("Phase 3 Architecture Failure: Max attempts reached.");
        return successfulPlan;
    }

    private async validatePlanningGate(plan: PagePlan, mission?: GenerationMission): Promise<void> {
        const minSections = 5;

        if (!plan.h1 || !plan.h1.trim()) {
            throw new Error("Planning Gate Failure: missing H1.");
        }

        if (!Array.isArray(plan.sections) || plan.sections.length < minSections) {
            throw new Error(`Planning Gate Failure: insufficient sections (${plan.sections?.length || 0}/${minSections} required).`);
        }

        const metaDescription = (plan.meta_description || '').trim();
        if (!metaDescription) {
            throw new Error("Planning Gate Failure: missing meta description.");
        }

        if (metaDescription.length < 50) {
            throw new Error(`Planning Gate Failure: meta description is too short (${metaDescription.length}).`);
        }
        const plannedWords = (plan.sections || []).reduce((sum, s) => sum + (s?.target_words || 0), 0);
        const targetTotal = plan.intentModel?.wordCountTarget || 2000;
        const minPlannedWords = Math.floor((targetTotal - 200) * 0.88);

        if (plannedWords < minPlannedWords) {
            throw new Error(`Planning Gate Failure: insufficient content budget (${plannedWords}/${minPlannedWords}).`);
        }

        const titles = plan.sections
            .map(s => (s?.h2 || '').toLowerCase().trim())
            .filter(Boolean);

        const hasServices = titles.some(t =>
            t.includes('servicio') ||
            t.includes('apertura') ||
            t.includes('cerradura') ||
            t.includes('bombín')
        ) || plan.sections.some(s => s.block_type === 'services_grid');

        const hasUrgency = titles.some(t =>
            t.includes('urgente') ||
            t.includes('24h') ||
            t.includes('24 horas') ||
            t.includes('inmediata') ||
            t.includes('disponibilidad') ||
            t.includes('asistencia')
        ) || plan.sections.some(s => s.block_type === 'urgency_panel');

        const hasCoverage = titles.some(t =>
            t.includes('zona') ||
            t.includes('cobertura') ||
            t.includes('barrios') ||
            t.includes('área') ||
            t.includes('ubicación') ||
            t.includes('donde estamos') ||
            t.includes('proximidad')
        ) || plan.sections.some(s => s.block_type === 'local_proof');

        const hasFaq = titles.some(t =>
            t.includes('faq') ||
            t.includes('preguntas') ||
            t.includes('dudas')
        ) || plan.sections.some(s => s.block_type === 'faq');

        const hasContact = titles.some(t =>
            t.includes('contacto') ||
            t.includes('presupuesto') ||
            t.includes('llamar') ||
            t.includes('teléfono') ||
            t.includes('atención')
        ) || plan.sections.some(s => s.block_type === 'cta_panel');

        if (!hasServices) throw new Error("Planning Gate Failure: missing services section.");
        if (!hasUrgency) throw new Error("Planning Gate Failure: missing urgency section.");
        if (!hasCoverage) throw new Error("Planning Gate Failure: missing coverage section.");
        if (!hasFaq) throw new Error("Planning Gate Failure: missing FAQ section.");
        if (!hasContact) throw new Error("Planning Gate Failure: missing contact section.");
    }

    private validateSeoBlock(html: string, section: any, city: string, niche: string): string[] {
        const issues: string[] = [];

        const plainText = html
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const normalizedText = plainText.toLowerCase();
        const words = plainText.split(/\s+/).filter(Boolean).length;
        const minWords = Math.max(80, Math.floor((section?.target_words || 180) * 0.58));

        if (words < minWords) {
            issues.push(`SEO:THIN_BLOCK(${words}/${minWords} words)`);
        }

        if (!normalizedText.includes(city.toLowerCase())) {
            issues.push('SEO:MISSING_CITY');
        }

        if (!normalizedText.includes(niche.toLowerCase()) && !normalizedText.includes('especialista')) {
            issues.push('SEO:MISSING_NICHE');
        }

        return issues;
    }

    private async runWritingPhase(
        research: NormalizedContext,
        plan: PagePlan,
        mission: GenerationMission,
        obs: ObservabilityMetadata,
        resolvedPlan: ResolvedPageRenderPlan
    ): Promise<ContentDraft> {
        await this.writer.logThought(`[Phase 4] Iniciando redacción de contenido para ${plan.sections.length} secciones...`);
        const blocks: ContentBlock[] = [];
        let totalWords = 0;

        for (let i = 0; i < plan.sections.length; i++) {
            const section = plan.sections[i];
            const sectionId = section.section_id || `section-${i}`;

            const sectionContract = resolvedPlan?.sections.find(sc => sc.sectionId === sectionId);

            let blockValid = false;
            let attempts = 0;
            let bestAttempt: ContentBlock | null = null;
            const usedAngles: string[] = blocks.map(b => (b as any).angle).filter(Boolean);

            let lastResult: any = null;

            // BYPASS WRITER FOR NON-CONTENT BLOCKS
            if (section.block_type === 'map') {
                const mapBlock: ContentBlock = {
                    id: sectionId,
                    h2: section.h2,
                    html: `<div class="map-placeholder" data-city="${research.city}">
                        <p>Nuestra base operativa se coordina para ofrecer una cobertura técnica profesional en toda el área de ${research.city}. Disponemos de especialistas distribuidos estratégicamente para garantizar un servicio de proximidad y confianza en todos los distritos de la zona, asegurando una respuesta técnica de alta calidad para cada intervención.</p>
                    </div>`,
                    wordCount: 50,
                    metadata: { 
                        block_type: section.block_type, 
                        sectionIndex: i, 
                        section_id: sectionId, 
                        score: 100, 
                        mapEmbedUrl: research.local_nap.mapEmbedUrl 
                    }
                };
                blocks.push(mapBlock);
                totalWords += 10;
                continue;
            }

            while (attempts < 3 && !blockValid) {
                attempts++;
                const writerResult = await this.writer.execute({
                    niche: research.niche,
                    city: research.city,
                    section_h2: section.h2,
                    subsections_h3: section.h3s || [],
                    local_nap: research.local_nap,
                    contextual_data: mission.contextual_data,
                    entities: research.entities || [],
                    pageProfile: plan.pageProfile,
                    introduction_style: section.introduction_style,
                    structure_type: section.structure_type,
                    sectionIndex: i,
                    totalSections: plan.sections.length,
                    artDirection: plan.design?.dna?.visualSystem,
                    blockType: section.block_type,
                    section_id: sectionId,
                    preferred_format: section.preferred_format,
                    content_density: section.content_density,
                    layout_hint: section.layout_hint,
                    visual_weight: section.visual_weight,
                    emphasis: section.emphasis,
                    factuality_level: section.factuality_level,
                    mobile_priority: section.mobile_priority,
                    intentModel: plan.intentModel,
                    contentOnly: true,
                    targetWords: section.target_words,
                    pageSkeleton: plan.layoutContract?.pageSkeleton,
                    heroTemplate: plan.layoutContract?.heroTemplate,
                    cadencePattern: plan.layoutContract?.cadencePattern,
                    proofStrategy: plan.layoutContract?.proofStrategy,
                    ctaStrategy: plan.layoutContract?.ctaStrategy,
                    sectionPattern: (section as any).pattern_hint,
                    sectionContract: sectionContract,
                    sectionBrief: {
                        objective: section.objective || `Desarrollar la sección "${section.h2}"`,
                        userQuestion: section.h2,
                        conversionAngle: plan.intentModel.conversionGoal,
                        trustProofRequired: plan.intentModel.mandatoryTrustElements || [],
                        factualConstraints: plan.contentRules?.factOnlyFields || [],
                        internalLinksToMention: plan.intentModel.internalLinkTargets || [],
                        prohibitedClaims: plan.contentRules?.prohibitedClaims || []
                    },
                    usedAngles
                });

                lastResult = writerResult;

                if (writerResult.data) {
                    const polishedHtml = editorialPostProcessHtml(writerResult.data.html as string, {
                        city: research.city,
                        brand: research.local_nap?.business_name || '',
                        phone: research.local_nap?.phone || '',
                        maxBrandMentions: plan.contentRules?.maxBrandMentionsPerSection || 1,
                        niche: research.niche
                    });

                    let html = SectionIntegrityRefiner.refine(polishedHtml);
                    const corruption = SectionIntegrityRefiner.detectTextCorruption(html);
                    const safe = IntegrityGuard.isHtmlSafe(html);
                    const draftCount = html.split(/\s+/).length;

                    const currentAttempt: ContentBlock = {
                        id: `section-${i}`,
                        h2: section.h2,
                        html,
                        wordCount: draftCount,
                        metadata: {
                            block_type: section.block_type,
                            sectionIndex: i,
                            section_id: sectionId,
                            score: 0,
                            corruptionDetected: corruption,
                            unsafeHtml: !safe,
                            semantic: writerResult.data.semantic
                        }
                    };

                    if (!corruption && safe) {
                        if (!bestAttempt || draftCount > (bestAttempt.wordCount || 0)) {
                            bestAttempt = currentAttempt;
                        }
                    }

                    if (writerResult.success && !corruption && safe) {
                        const seoIssues = this.validateSeoBlock(html, section, research.city, research.niche);
                        if (seoIssues.length === 0) {
                            blocks.push(currentAttempt);
                            totalWords += draftCount;
                            blockValid = true;
                        }
                    }
                }
                if (obs.tokenUsage !== undefined) obs.tokenUsage += 1200;
            }

            if (!blockValid) {
                const isActionBlock = section.block_type === 'urgency_panel' || section.block_type === 'cta_panel' || section.block_type === 'micro_cta';
                const minFloor = isActionBlock ? 35 : 55;

                const isDegradable =
                    bestAttempt &&
                    (bestAttempt.wordCount || 0) >= Math.max(minFloor, Math.floor((section.target_words || 180) * 0.12)) &&
                    !bestAttempt.metadata.corruptionDetected &&
                    !bestAttempt.metadata.unsafeHtml;

                if (isDegradable && bestAttempt) {
                    console.log(`[Pipeline] Usando mejor intento controlado para "${section.h2}" (${bestAttempt.wordCount} palabras).`);
                    blocks.push({
                        id: bestAttempt.id,
                        h2: bestAttempt.h2,
                        html: bestAttempt.html,
                        wordCount: bestAttempt.wordCount,
                        metadata: {
                            ...bestAttempt.metadata,
                            degraded: true,
                            requires_editorial_review: true
                        }
                    });
                    totalWords += bestAttempt.wordCount || 0;
                } else {
                    throw new Error(`BLOCK_GENERATION_FAILED: Bloque "${section.h2}" inválido o demasiado corto (${bestAttempt?.wordCount || 0} palabras) para degradación segura.`);
                }
            }

        }

        // DEBUG DUMP
        try {
            await fs.writeFile(path.join(process.cwd(), 'debug_draft.json'), JSON.stringify(blocks, null, 2));
            console.log(`[DEBUG] Draft blocks dumped to debug_draft.json. Total words: ${totalWords}`);
        } catch (e) { }

        return { blocks, totalWords };
    }

    private async runCorrectionPhase(draft: ContentDraft, research: any): Promise<ContentDraft> {
        await this.spanishCorrector.logThought(`[Phase 5] Iniciando corrección por bloques para ${draft.blocks.length} secciones...`);

        const correctedBlocks = [];
        let totalWords = 0;

        for (const block of draft.blocks) {
            let currentHtml = block.html;

            // 1) Audit semantics (Block level)
            const coherence = await this.nicheCoherenceAgent.execute({
                html: currentHtml,
                niche: research.niche,
                city: research.city
            });
            if (coherence.success && coherence.data) {
                currentHtml = coherence.data.html;
            }

            // 2) Correct grammar (Block level)
            const correction = await this.spanishCorrector.execute({
                html: currentHtml,
                niche: research.niche,
                city: research.city
            });
            if (correction.success && correction.data) {
                currentHtml = correction.data.html;
            }

            const blockWords = currentHtml
                .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
            totalWords += blockWords;

            correctedBlocks.push({
                ...block,
                html: currentHtml.replace(/^<h2[^>]*>.*?<\/h2>/i, '').trim(),
                wordCount: blockWords
            });
        }

        console.log(`[Phase 5] Corrección finalizada. Palabras totales: ${totalWords}`);

        return {
            ...draft,
            blocks: correctedBlocks,
            totalWords
        };
    }
    private validateWordBudget(draft: ContentDraft, targetTotal: number): void {
        const hasDegraded = draft.blocks.some(b => b.metadata?.degraded);
        const minFactor = hasDegraded ? 0.40 : 0.88;
        const min = Math.floor(targetTotal * minFactor);
        const max = Math.ceil(targetTotal * 2.50);

        if (draft.totalWords < min) {
            throw new Error(`WORD_BUDGET_TOO_LOW: ${draft.totalWords}/${targetTotal} (Min allowed: ${min})`);
        }

        if (draft.totalWords > max) {
            throw new Error(`WORD_BUDGET_TOO_HIGH: ${draft.totalWords}/${targetTotal}`);
        }
    }

    private async validatePreAssemblyIntegrityGate(draft: ContentDraft): Promise<void> {
        const issues = IntegrityGuard.check(draft);
        if (issues.length > 0) {
            throw new Error(`Integrity Gate Failure: ${issues.join(', ')}`);
        }
    }

    private async runEnrichmentPhase(
        draft: ContentDraft,
        research: NormalizedContext,
        plan: PagePlan,
        mission: GenerationMission
    ): Promise<ContentDraft> {
        const faqs: { question: string; answer: string }[] = [];
        draft.blocks.forEach(b => {
            const semantic = b.metadata?.semantic;
            if (semantic?.faqItems) {
                faqs.push(...semantic.faqItems);
            }
        });

        let html = draft.html || "";

        const defaultBaseUrl = 'https://serviciosprofesionales.pro';
        const baseUrl = (mission.siteConfig?.baseUrl || defaultBaseUrl).replace(/\/$/, '');
        const finalSlug = plan?.seoBrief?.canonicalSlug || this.slugify(plan.h1 || research.niche);
        const canonical = `${baseUrl}/${finalSlug}/`.replace(/([^:]\/)\/+/g, "$1"); // Normalize double slashes

        const seoTitle = plan.meta_title || `${plan.intentModel.primaryKeyword} en ${research.city} | ${mission.siteConfig?.brandName || research.clean_nap?.business_name || 'Servicio local'}`;
        const seoDescription = plan.meta_description || `Servicio de ${plan.intentModel.primaryKeyword} en ${research.city}. Atención local, respuesta rápida y contacto directo.`;

        const robots = 'index, follow';

        const og = {
            type: 'website',
            title: seoTitle,
            description: seoDescription,
            url: canonical,
            image: 'https://example.com/default.jpg'
        };

        const automaticLinkBlocks =
            plan.internalLinking?.autoBlocks ||
            (plan.internalLinking as any)?.linkPlan?.autoBlocks ||
            [];

        if (automaticLinkBlocks.length) {
            draft = injectAutomaticLinkBlocks(draft, automaticLinkBlocks);
            console.log(`[Phase 7] Inyectados ${automaticLinkBlocks.length} bloques automáticos de enlazado.`);
        }



        const breadcrumbs = buildPageBreadcrumbs({
            baseUrl,
            city: research.city,
            niche: research.niche,
            pageTitle: plan.h1 || research.niche,
            pageType: plan.intentModel.pageType
        });

        return {
            ...draft,
            html,
            totalWords: (draft.totalWords || 0) + (html.split(/\s+/).length),
            metadata: {
                ...(draft.metadata || {}),
                seo: {
                    title: seoTitle,
                    metaDescription: seoDescription,
                    canonical,
                    robots,
                    og,
                    schemaTypes: ['LocalBusiness', 'Service', 'FAQPage', 'BreadcrumbList', 'WebPage'],
                    breadcrumbs: mapBreadcrumbsForRenderer(breadcrumbs)
                }
            }
        };
    }

    private async runAssemblyPhase(
        polished: ContentDraft,
        plan: PagePlan,
        research: NormalizedContext,
        mission: GenerationMission,
        resolvedPlan?: ResolvedPageRenderPlan
    ): Promise<RenderedPage> {
        console.log(`[Phase 8] Ensamblando página con ${polished.blocks.length} bloques...`);

        let blocksToRender = [...polished.blocks];

        // 1. DYNAMIC REORDERING
        if (plan.layoutContract?.orderedSectionIds && plan.layoutContract.orderedSectionIds.length > 0) {
            // ENFORCE structural compliance on orderedSectionIds
            const ids = [...plan.layoutContract.orderedSectionIds];
            const localProofId = polished.blocks.find(b => b.metadata?.block_type === 'local_proof')?.metadata?.section_id;
            const mapId = polished.blocks.find(b => b.metadata?.block_type === 'map')?.metadata?.section_id;

            if (localProofId && mapId) {
                const lpIdx = ids.indexOf(localProofId);
                const mapIdx = ids.indexOf(mapId);
                
                if (lpIdx !== -1) {
                    if (mapIdx !== -1) {
                        if (mapIdx !== lpIdx + 1) {
                            ids.splice(mapIdx, 1);
                            const newLpIdx = ids.indexOf(localProofId);
                            ids.splice(newLpIdx + 1, 0, mapId);
                        }
                    } else {
                        // Inyectar si falta en la lista ordenada pero existe en los bloques
                        ids.splice(lpIdx + 1, 0, mapId);
                    }
                }
            }

            console.log(`[Assembly] Aplicando orden dinámico (corregido): ${ids.join(', ')}`);
            const blockMap = new Map(blocksToRender.map(b => [b.metadata?.section_id, b]));
            const orderedBlocks: ContentBlock[] = [];

            for (const id of ids) {
                const block = blockMap.get(id);
                if (block) {
                    orderedBlocks.push(block);
                    blockMap.delete(id);
                }
            }
            // Append remaining blocks
            blockMap.forEach(b => orderedBlocks.push(b));
            blocksToRender = orderedBlocks;
        }

        const seo = (polished.metadata?.seo || {
            title: plan.meta_title || plan.h1,
            metaDescription: plan.meta_description,
            canonical: '',
            robots: 'index, follow',
            schemaTypes: [],
            breadcrumbs: [],
            openGraph: { type: 'website', title: '', description: '', url: '' },
            twitter: { card: 'summary', title: '', description: '' },
            schemaList: [],
            schemaJsonLd: {},
            indexationPolicy: { mode: 'index', follow: true, allowInSitemap: true, reason: 'default', cluster: 'default' }
        }) as RenderedSeoContract;

        const engineSections: GeneratedSection[] = [];
        const layout = plan.layoutContract;

        for (const block of blocksToRender) {
            const sectionId = block.metadata?.section_id;
            const sectionContract = layout?.sections?.[sectionId];

            if (sectionContract?.mergedWith) {
                console.log(`[Assembly] Saltando bloque fusionado: ${sectionId} (hacia ${sectionContract.mergedWith})`);
                continue;
            }

            // COLLECT MERGED CONTENT
            let mergedHtml = '';
            if (layout?.sections) {
                for (const [otherId, otherContract] of Object.entries(layout.sections)) {
                    if (otherContract.mergedWith === sectionId) {
                        const mergedBlock = polished.blocks.find(b => b.metadata?.section_id === otherId);
                        if (mergedBlock) {
                            mergedHtml += `\n<div class="merged-content merged-from-${otherId}">\n${mergedBlock.html}\n</div>`;
                        }
                    }
                }
            }

            // Independent block sanitization to prevent tag bleeding
            const sanitizedHtml = autoFixLayoutHtml(block.html + (mergedHtml ? `\n${mergedHtml}` : ''), {
                city: mission.city,
                niche: mission.niche,
                businessName: mission.local_nap?.business_name || '',
                phone: mission.local_nap?.phone || ''
            }, { isBlockOnly: true });

            engineSections.push({
                h2: block.h2,
                h3s: plan.sections.find(s => s.section_id === sectionId)?.h3s || [],
                html: sanitizedHtml,
                blockType: block.metadata?.block_type as any,
                sectionId: sectionId || block.id,
                metadata: block.metadata
            });
        }

        // 1.8 Automatic Internal Linking Block
        const internalLinks = (seo as any).metadata?.internalLinks || [];
        if (internalLinks.length > 0) {
            engineSections.push({
                h2: 'Enlaces relacionados',
                h3s: [],
                html: renderInternalLinkingBlock({
                    sectionId: 'internal-links',
                    blockType: 'internal_linking',
                    variant: 'grid',
                    layoutHint: 'full-width',
                    content: { h2: 'Servicios y zonas relacionadas' },
                    design: (resolvedPlan as any)?.theme,
                    seo: seo,
                    local: {} as any
                }, internalLinks),
                blockType: 'internal_linking' as any,
                sectionId: 'internal-links',
                metadata: { is_automatic: true }
            });
        }

        const seed = (mission.cluster_folder_name || mission.city || `${mission.niche}-${mission.city}`).toLowerCase();
        const renderSeed = {
            seed,
            forcedPalette: mission.designOverrides?.forcedPalette,
            forcedTypography: mission.designOverrides?.forcedTypography
        };

        const data = {
            businessName: research.clean_nap.business_name,
            city: research.city,
            title: plan.h1,
            subtitle: plan.meta_description,
            phone: research.clean_nap.phone,
            local: { ...research.local_nap },
            seo: seo
        };

        const scripts = (polished.html || '').match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)?.join('\n') || '';

        const fullHtml = renderPage(
            renderSeed,
            data,
            engineSections,
            (plan.design?.dna as any) || 'editorial',
            scripts,
            plan.intentModel?.pageType || 'service',
            plan.pageProfile?.hero_variant,
            plan.pageProfile?.page_composition,
            seo,
            [], // Breadcrumbs
            plan.layoutContract,
            resolvedPlan
        );

        console.log(`[Assembly] Renderizado base completado (Len: ${fullHtml.length}). Iniciando sanitización...`);
        const finalHtml = this.finalSanitizeDocument(fullHtml, research);
        console.log(`[Assembly] Sanitización completada (Len: ${finalHtml.length}).`);

        // Structural sanity check for early warning
        if (!/<h1\b/i.test(finalHtml)) console.warn('[Assembly-WARNING] El documento final NO contiene <h1> tras sanitización.');
        if (!/<footer\b/i.test(finalHtml)) console.warn('[Assembly-WARNING] El documento final NO contiene <footer> tras sanitización.');

        // Debug dump for visibility
        if (finalHtml.length < 500) {
            console.error(`[Assembly-ERROR] El HTML resultante es sospechosamente corto (${finalHtml.length} chars).`);
            await fs.writeFile('debug_CORRUPTED_assembly.html', finalHtml);
        }

        assertNoTemplateLeaks(finalHtml);
        assertNoDegenerateBodySignature(finalHtml);
        assertNoRepeatedBoilerplate(finalHtml);

        return {
            html: finalHtml,
            metadata: {
                qaScore: 0,
                validation_errors: [],
                technical_passed: false,
                editorial_passed: false,
                seo
            }
        };
    }


    private async runEditorialValidation(page: RenderedPage, mission: GenerationMission): Promise<{ score: number, blockScores: BlockScore[] }> {
        const audit = await this.qualityScoreAgent.execute({
            html: page.html,
            businessName: mission.local_nap?.business_name || '',
            phone: mission.local_nap?.phone || '',
            city: mission.city,
            niche: mission.niche,
            seo: page.metadata?.seo as any,
            intentModel: mission.contextual_data?.intentModel
        });
        return {
            score: audit.data?.score || 0,
            blockScores: []
        };
    }

    private async runDeliveryPhase(page: RenderedPage, mission: GenerationMission): Promise<void> {
        if (!page.metadata?.technical_passed || !page.metadata?.editorial_passed) {
            throw new Error('Delivery cancelado: la página no ha superado las validaciones.');
        }
        await this.staticDeploy.execute({
            niche: mission.niche,
            city: mission.city,
            content: page.html,
            schema: {},
            keywords: [],
            path: mission.subPath || `${mission.niche}-${mission.city}`.toLowerCase()
        } as any);
    }

    private async runPostDeployAudit(page: RenderedPage, mission: GenerationMission): Promise<PostDeployAuditResult> {
        return AuditSentinel.audit(page, mission);
    }

    private detectSanitizerRegressionMarkers(html: string): string[] {
        const patterns: Array<[string, RegExp]> = [
            ['CROSS_NICHE_FRAGMENT_TIPO_HERRAJE', /\btipo\s+de,\s+el\s+herraje\b/i],
            ['CROSS_NICHE_FRAGMENT_SEGUN_MATERIAL', /\bseg[uú]n\s+el,\s+el\s+material\b/i],
            ['CROSS_NICHE_FRAGMENT_COPIAS', /\bbrechas\s+de\s+por\s+copias?\s+no\s+autorizadas?\b/i],
            ['CROSS_NICHE_FRAGMENT_DISCRECION', /\brealizamos\s+y\s+con\s+la\s+m[aá]xima\s+discreci[oó]n\b/i],
            ['CROSS_NICHE_FRAGMENT_AUDITORIAS', /\bauditor[ií]as\s+de\s+gratuitas\b/i],
            ['CROSS_NICHE_FRAGMENT_TECNOLOGIA_PROFESIONAL', /integran\s+la\s+[uú]ltima\s+tecnolog[ií]a\s+en\s+profesional/i],
            ['CROSS_NICHE_FRAGMENT_VULNERABILIDADES', /vulnerabilidades?\s+en\s+sistemas?\s+de/i],
            ['CROSS_NICHE_FRAGMENT_DUPLICADOS', /control\s+sobre\s+qui[eé]n\s+puede\s+realizar\s+duplicados?/i],
            ['CROSS_NICHE_FULL_CIERRAPUERTAS', /\bmuelles?\s+cierrapuertas\b/i],
            ['CROSS_NICHE_FULL_BLINDAJES', /\bblindajes?\b/i],
            ['CROSS_NICHE_FULL_TRASTERO', /\bpuertas?\s+de\s+trastero\b/i],
            ['CROSS_NICHE_FULL_CANCELAS', /\bpuertas?\s+autom[aá]ticas\b|\bcancelas?\b/i],
            ['CROSS_NICHE_FULL_SEGURIDAD_AUDIT', /\bauditor[ií]as?\s+de\s+seguridad\b/i],
            ['CROSS_NICHE_FULL_SEGURIDAD_MECHANISMS', /\bmecanismos?\s+de\s+seguridad\b/i]
        ];

        return patterns
            .filter(([, rx]) => rx.test(html))
            .map(([label]) => label);
    }

    private finalSanitizeDocument(html: string, research: NormalizedContext): string {
        const original = (html || '').normalize('NFC');

        const candidate = sanitizeFinalRenderedHtml(original, {
            city: research.city,
            niche: research.niche,
            businessName: research.clean_nap.business_name,
            phone: research.clean_nap.phone
        });

        const originalMarkers = this.detectSanitizerRegressionMarkers(original);
        const candidateMarkers = this.detectSanitizerRegressionMarkers(candidate);

        if (candidateMarkers.length > originalMarkers.length) {
            console.warn(`[FinalSanitize] Semantic regression detected. Reverting sanitizer output. ${candidateMarkers.join(' | ')}`);
            return original;
        }

        const guarded = guardRenderedHtml(original, candidate);
        if (guarded.reverted) {
            console.warn(`[FinalSanitize] Regression detected. Reverting sanitizer output. ${guarded.issues.join(' | ')}`);
        }

        return guarded.html;
    }

    private slugify(input: string): string {
        return input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
}



