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
import { loadNichePlaybook, resolveNicheId, requireNichePlaybook } from '../niches/playbookLoader.js';
import { startDebugLogging, stopDebugLogging } from '../utils/debugLogger.js';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';
import { validateContentAgainstNichePlaybook } from '../niches/technicalValidation.js';
import { 
    savePhaseArtifact, 
    ensureRunArtifactsDir, 
    consolidateRunJsonFiles 
} from '../debug/phaseArtifactStore.js';
import { DebugPipelineState, DebugPhaseId } from '../debug/phaseDebugTypes.js';
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
    scoreDesignRepetitionRisk,
    buildOriginalityDirective
} from '../originality/index.js';
import { dbManager } from '../db/index.js';
import { vault } from '../tools/vault.js';

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
import { refinePremiumBlockCopy } from '../utils/premiumCopyGuard.js';
import { renderPage } from '../design-system/procedural-engine.js';
import type { GeneratedSection } from '../design-system/procedural-engine.js';
import { renderInternalLinkingBlock } from '../renderers/blocks/shared/internalLinking.js';
import { RenderPlanResolver } from '../renderers/renderPlanResolver.js';
import { finalHtmlPolish } from '../utils/finalHtmlPolish.js';
import { analyzeTechnicalIntegrity, formatTechnicalIntegrityIssues } from '../quality/technicalIntegrityGate.js';
import { runPhaseWithRepair } from '../repair/phaseRepairOrchestrator.js';
import { repairRenderedPageForPhase, validateRenderedPageForPhase, assertFinalPageReady } from '../repair/pageRepairKit.js';
import { ResolvedPageRenderPlan } from '../types/design.js';
import {
    buildResearchQualitySummary,
    extractLocalSignalsFromGeo,
    filterUsefulCompetitorAudits,
    filterUsefulOrganicResults
} from '../utils/researchQuality.js';

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
import { finalizePageImages } from '../images/finalizePageImages.js';
import { PageImageContext } from '../images/types.js';

import { ContentPipelineStateMachine } from '../pipeline-state/contentPipelineStateMachine.js';
import type { PipelineHostAdapter, PipelineRunOptions, PipelineState } from '../types/pipeline/state.js';
import type { CanonicalPipelinePhaseId } from '../types/pipeline/contracts.js';


function sanitizeOutputPathToken(value?: string): string {
    return String(value || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
}

function resolveMissionOutputSlug(mission: {
    niche?: string;
    city?: string;
    subPath?: string;
    clusterFolderName?: string;
    cluster_folder_name?: string;
}): string {
    const clusterFolder = sanitizeOutputPathToken(mission.cluster_folder_name || mission.clusterFolderName);
    const basePath = clusterFolder || `${sanitizeOutputPathToken(mission.niche)}-${sanitizeOutputPathToken(mission.city)}`;
    const subPath = sanitizeOutputPathToken(mission.subPath);

    return subPath ? path.posix.join(basePath, subPath) : basePath;
}

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

    private readonly FAST_DEBUG_MODE = process.env.PIPELINE_FAST_DEBUG === 'true';
    private readonly SOFT_MODE = process.env.PIPELINE_SOFT_MODE === 'true';
    private debugArtifactsDir?: string;
    private debugRunId?: string;



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

    private async saveDebugSnapshot(phaseId: DebugPhaseId, mission: GenerationMission, stateData: Partial<DebugPipelineState>, extra: { html?: string, summary?: any, notes?: string[] } = {}) {
        if (!mission.debugMode || !this.debugArtifactsDir) return;

        const fullState: DebugPipelineState = {
            mission,
            runId: this.debugRunId || 'unknown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            artifactsDir: this.debugArtifactsDir,
            phaseSummaries: [],
            observability: { durations: {}, scores: {}, retries: {}, agent_logs: [] },
            ...stateData
        } as any;

        await savePhaseArtifact(this.debugArtifactsDir, phaseId, fullState, extra);
    }

    private stripControlTokens(value: string | undefined): string {
        return String(value || '')
            .replace(/\[[A-Z0-9_:-]+\]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private normalizeCityCase(city: string | undefined): string {
        return String(city || '')
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }

    private canonicalizeMissionNiche(rawNiche: string | undefined): string {
        const cleaned = this.stripControlTokens(rawNiche)
            .replace(/^(?:misi[oó]n|mission|proyecto|brief|campa[nñ]a|landing|p[aá]gina|pagina|servicio|servicios)\s+de\s+/i, '')
            .replace(/^(?:misi[oó]n|mission|proyecto|brief|campa[nñ]a|landing|p[aá]gina|pagina)\s+/i, '')
            .replace(/\s+/g, ' ')
            .trim();

        const playbookId = resolveNicheId(cleaned);
        if (playbookId) {
            const playbook = loadNichePlaybook(playbookId);
            if (playbook?.displayName) return playbook.displayName.toLowerCase();
        }

        return cleaned;
    }

    private inferCityFromMission(mission: GenerationMission): string {
        const knownCities = [
            'Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia','Palma','Bilbao','Alicante',
            'Córdoba','Valladolid','Vigo','Gijón','Hospitalet','A Coruña','Granada','Vitoria','Elche','Oviedo'
        ];

        const haystack = [
            mission.city,
            mission.niche,
            mission.local_nap?.address,
            mission.local_nap?.business_name
        ].filter(Boolean).join(' ');

        const found = knownCities.find((city) => new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(haystack));
        return found || this.stripControlTokens(mission.city);
    }

    private sanitizeMission(mission: GenerationMission): GenerationMission {
        mission.niche = this.canonicalizeMissionNiche(mission.niche);
        mission.city = this.normalizeCityCase(this.stripControlTokens(mission.city));
        mission.local_nap = mission.local_nap || { business_name: '', address: '', phone: '' } as any;
        mission.local_nap.business_name = this.stripControlTokens(mission.local_nap.business_name);
        mission.local_nap.address = this.stripControlTokens(mission.local_nap.address);
        mission.local_nap.phone = String(mission.local_nap.phone || '').trim();

        if (!mission.city) {
            mission.city = this.normalizeCityCase(this.inferCityFromMission(mission));
        }

        if (!mission.city) {
            throw new Error('MISSION_CITY_UNRESOLVED: no se pudo resolver una ciudad válida para la misión.');
        }

        return mission;
    }

    private shouldUseSoftMode(mission: GenerationMission): boolean {
        const missionSoft = (mission as any)?.softMode === true || (mission as any)?.soft_mode === true;
        const debugSoft = Boolean(mission?.debugMode) || String((mission as any)?.mode || '').toLowerCase() === 'sandbox';
        const envDebugSoft = String(process.env.PIPELINE_FAIL_OPEN_ON_DEBUG || '').toLowerCase() === 'true';
        return this.SOFT_MODE || missionSoft || (debugSoft && envDebugSoft !== 'false');
    }

    private describeFailureContext(renderedPage?: any, auditResult?: any, qualityGateResult?: any): string[] {
        const notes: string[] = [];
        if (renderedPage?.metadata?.validation_errors?.length) {
            notes.push(...renderedPage.metadata.validation_errors.slice(0, 12));
        }
        if (qualityGateResult && qualityGateResult.passed === false) {
            notes.push(`QUALITY_GATE: ${formatQualityGateIssues(qualityGateResult)}`);
        }
        if (auditResult?.status && !['publishable', 'premium'].includes(String(auditResult.status))) {
            notes.push(`EDITORIAL_${String(auditResult.status).toUpperCase()}: ${String(auditResult.reasoning || '').slice(0, 240)}`);
        }
        return Array.from(new Set(notes.filter(Boolean)));
    }

    private normalizeUrl(value: string): string {
        try {
            const url = new URL(String(value || '').trim());
            const pathname = url.pathname.replace(/\/+$/, '') || '/';
            return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}`;
        } catch {
            return String(value || '').trim();
        }
    }

    private isBannedResearchUrl(value: string): boolean {
        try {
            const url = new URL(String(value || '').trim());
            const host = url.hostname.toLowerCase();
            if (/(^|\.)google\.[a-z.]+$/i.test(host)) return true;
            const banned = ['w3.org', 'schema.org', 'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'pinterest.com'];
            if (banned.some(domain => host === domain || host.endsWith(`.${domain}`))) return true;
            const pathname = url.pathname.toLowerCase();
            if (/\.pdf$/.test(pathname)) return true;
            if (/(^|\.)(jobtoday\.com|indeed\.com|infojobs\.net|jooble\.org)$/.test(host)) return true;
            if (/\/(?:trabajo|empleo|jobs?|oferta(?:s)?|career|careers|bvirtual|pdf|download)\b/i.test(`${pathname}${url.search.toLowerCase()}`)) return true;
            return false;
        } catch {
            return false;
        }
    }

    private filterOrganicResults(results: any[]): any[] {
        const seen = new Set<string>();
        return (results || []).filter((item: any) => {
            const link = String(item?.link || '');
            if (!link || this.isBannedResearchUrl(link)) return false;
            const normalized = this.normalizeUrl(link);
            if (!normalized || seen.has(normalized)) return false;
            seen.add(normalized);
            item.link = normalized;
            return true;
        });
    }

    private isLowSignalCompetitorAudit(item: any): boolean {
        const url = String(item?.url || '').trim();
        const title = String(item?.title || '').toLowerCase();
        const description = String(item?.description || '').toLowerCase();
        const headings = [...(item?.h1s || []), ...(item?.h2s || []), ...(item?.h3s || [])].join(' ').toLowerCase();
        const wordCount = Number(item?.wordCount || 0);
        const internalLinks = Number(item?.internalLinks || 0);
        const externalLinks = Number(item?.externalLinks || 0);
        const signals = `${title} ${description} ${headings}`;

        try {
            const host = new URL(url).hostname.toLowerCase();
            if (/(^|\.)wa\.link$/.test(host) || /whatsapp/.test(host)) return true;
            if (/(^|\.)(milanuncios\.com|habitissimo\.es|paginasamarillas\.es|facebook\.com|instagram\.com)$/.test(host)) return true;
        } catch {
            return true;
        }

        if (/compartir en whatsapp|whatsapp messenger|chatea en whatsapp|directorio|clasificados|anuncio/.test(signals)) return true;
        if (/\b(contacto|sobre nosotros|galeria|galería)\b/.test(signals) && wordCount < 450) return true;

        const locksmithSignals = /(cerrajer|cerradur|bomb[ií]n|cilindro|persiana|cierre|llave|amaestramiento)/.test(signals);
        if (!locksmithSignals && wordCount < 700) return true;
        if (wordCount < 350 && (internalLinks + externalLinks) <= 1) return true;

        return false;
    }

    private filterDeepAudits(audits: any[]): any[] {
        return (audits || []).filter((item: any) => {
            const url = String(item?.url || '');
            const wordCount = Number(item?.wordCount || 0);
            const title = String(item?.title || '').toLowerCase();
            const headings = [...(item?.h1s || []), ...(item?.h2s || []), ...(item?.h3s || [])].join(' ').toLowerCase();
            if (!url || this.isBannedResearchUrl(url)) return false;
            if (/\.pdf(?:$|[?#])/.test(url)) return false;
            if (/(jobtoday|indeed|infojobs|jooble|linkedin\.com\/jobs)/.test(url)) return false;
            if (/\b(trabajo|empleo|vacante|curriculum|oferta de empleo|bolsa de trabajo)\b/.test(`${title} ${headings}`)) return false;
            if (this.isLowSignalCompetitorAudit(item)) return false;
            return wordCount >= 300;
        });
    }

    private buildResearchQualityContext(input: {
        organicAccepted: any[];
        organicRejected: any[];
        auditsAccepted: any[];
        auditsRejected: any[];
        geoData: any;
    }) {
        const geoSignals = extractLocalSignalsFromGeo(input.geoData);
        const summary = buildResearchQualitySummary({
            acceptedOrganic: input.organicAccepted,
            rejectedOrganic: input.organicRejected,
            acceptedAudits: input.auditsAccepted,
            rejectedOrganic: input.organicRejected,
            acceptedAudits: input.auditsAccepted,
            rejectedAudits: input.auditsRejected,
            geoSignals,
        });
        return { summary, geoSignals };
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


    private createStateMachineHost(runtime: { fastDebugMode: boolean; }): PipelineHostAdapter {
        return {
            ensureMissionEnrolledDB: async (mission) => this.ensureMissionEnrolledDB(mission),
            sanitizeMission: (mission) => this.sanitizeMission(mission),
            shouldUseSoftMode: (mission) => this.shouldUseSoftMode(mission),
            applyPlaybookContext: async (mission) => {
                const clonedMission = JSON.parse(JSON.stringify(mission));
                try {
                    const playbookContext = resolvePlaybookForMission(clonedMission.niche);
                    clonedMission.contextual_data = {
                        ...(clonedMission.contextual_data || {}),
                        nichePlaybook: playbookContext,
                    };

                    if (playbookContext) {
                        this.analyst.setNicheBrief(playbookContext.analystBrief);
                        this.architect.setNicheBrief(playbookContext.architectBrief);
                        this.writer.setNicheBrief(playbookContext.writerBrief);
                        this.writer.setTechnicalBrief(playbookContext.technicalBrief);
                        this.nicheCoherenceAgent.setTechnicalBrief(playbookContext.technicalBrief);
                        this.spanishCorrector.setTechnicalBrief(playbookContext.technicalBrief);
                        this.qualityScoreAgent.setTechnicalBrief(playbookContext.technicalBrief);
                    }

                    console.log(`[StateMachine:playbook] Playbook resolved for niche: ${clonedMission.niche}`);
                    return { mission: clonedMission, playbookContext };
                } catch (error: any) {
                    console.warn(`[StateMachine:playbook] Failed to resolve playbook for niche ${clonedMission.niche}. Error: ${error.message}. Using generic rules.`);
                    return { mission: clonedMission, playbookContext: null };
                }
            },
            buildSiteGraph: (mission) => buildSiteGraph(mission),
            runResearchPhase: async (mission) => this.runResearchPhase(mission),
            runNormalizationPhase: async (research) => this.runNormalizationPhase(research),
            validateNormalizationGate: async (context) => this.validateNormalizationGate(context),
            runPlanningPhase: async (context, mission) => this.runPlanningPhase(context, mission),
            validatePlanningGate: async (plan) => this.validatePlanningGate(plan),
            resolveRenderPlan: (mission, pagePlan) => {
                if (!pagePlan.layoutContract) {
                    throw new Error('Planning Gate Failure: missing layoutContract before RenderPlanResolver.');
                }
                if (!pagePlan.pageProfile) {
                    pagePlan.pageProfile = pagePlan.pageVariety?.profile || pagePlan.pageProfile;
                }
                const varietyResult = pagePlan.pageVariety || {
                    h1: pagePlan.h1,
                    profile: pagePlan.pageProfile,
                    sections: pagePlan.sections || [],
                };
                return RenderPlanResolver.resolve(
                    mission.missionId || `${mission.niche}-${mission.city}`,
                    pagePlan,
                    pagePlan.intentModel,
                    varietyResult,
                    pagePlan.layoutContract,
                    mission.wordpress?.enabled ? 'wordpress' : 'web',
                );
            },
            runWritingPhase: async (context, plan, mission, observability, resolvedPlan) => this.runWritingPhase(context, plan, mission, observability, resolvedPlan),
            runCorrectionPhase: async (draft, context) => this.runCorrectionPhase(draft, context),
            validateWordBudget: (draft, target) => this.validateWordBudget(draft, target),
            validatePreAssemblyIntegrityGate: async (draft, options) => this.validatePreAssemblyIntegrityGate(draft, options),
            runEnrichmentPhase: async (draft, context, plan, mission) => this.runEnrichmentPhase(draft, context, plan, mission),
            buildSeoContract: async (draft, pagePlan, mission) => {
                const faqs = (draft.blocks || [])
                    .filter((b: any) => b.metadata?.block_type === 'faq')
                    .flatMap((b: any) => {
                        const meta = b.metadata || {};
                        const semantic = meta.semantic || {};
                        return (semantic.faqItems || meta.faqItems || meta.items || []).filter((f: any) => f.question && f.answer);
                    });

                const seoResult = buildSeoForPipeline(pagePlan, mission, faqs);
                const internalLinks = (pagePlan.internalLinking?.linkPlan?.all || []).map((c: any) => ({
                    url: c.targetSlug.startsWith('/') ? c.targetSlug : `/${c.targetSlug}/`,
                    text: c.anchor,
                    relation: c.direction,
                }));

                const enrichedDraft = attachRenderedSeoToDraft(draft, seoResult.renderedSeo);
                (pagePlan as any).seoBrief = seoResult.seoBrief;
                (pagePlan as any).internalLinks = internalLinks;

                return {
                    enrichedDraft,
                    seoResult,
                    internalLinks,
                    pagePlan,
                };
            },
            runAssemblyPhase: async (draft, plan, context, mission, resolvedPlan) => this.runAssemblyPhase(draft, plan, context, mission, resolvedPlan),
            finalizeImages: async (renderedPage, mission, pagePlan, options) => {
                const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, canonical: (renderedPage.metadata.seo as any)?.canonical };
                const outcome = await runPhaseWithRepair({
                    phase: 'images', input: renderedPage, maxAttempts: 3,
                    execute: async (page) => {
                        if (options.withImages && vault.COMFY_ENABLED) {
                            try {
                                const imageContext: PageImageContext = { pageId: mission.missionId || `${mission.niche}-${mission.city}`, niche: mission.niche, city: mission.city, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, h1: pagePlan.h1, heroSubtitle: pagePlan.meta_description, canonical: (page.metadata.seo as any)?.canonical, outputSlug: resolveMissionOutputSlug(mission) };
                                page.html = await finalizePageImages(page.html, imageContext);
                            } catch (error: any) { page.metadata = page.metadata || {}; page.metadata.image_generation_error = String(error?.message || error); }
                        }
                        return page;
                    },
                    validate: (page) => validateRenderedPageForPhase(page, 'images'),
                    repair: ({ value }) => repairRenderedPageForPhase(value, 'images', repairOptions),
                    fallback: ({ value }) => repairRenderedPageForPhase(value, 'images', repairOptions),
                    allowFallbackOnHardBlock: true,
                });
                renderedPage = outcome.output; renderedPage.metadata = renderedPage.metadata || {}; (renderedPage.metadata as any).phaseRepairImages = outcome.history;
                if (outcome.status === 'failed') return { status: 'failed', output: renderedPage, warnings: outcome.warnings, error: outcome.error };
                return { status: outcome.repaired ? 'degraded' : 'success', warnings: outcome.repaired ? ['Images phase auto-repaired.'] : [], output: renderedPage };
            },
            validateCompleteness: async (renderedPage, mission, softMode) => {
                const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone };
                const outcome = await runPhaseWithRepair({
                    phase: 'completeness', input: renderedPage, maxAttempts: 3,
                    execute: (page) => { const c = validateRenderCompleteness(page.html); if (!c.passed) page.html = finalHtmlPolish(page.html, { city: mission.city, niche: mission.niche }); return page; },
                    validate: (page) => { const c = validateRenderCompleteness(page.html); const t = validateRenderedPageForPhase(page, 'completeness'); return { passed: c.passed && t.passed, hardBlock: !c.passed || t.hardBlock, issues: [ ...((c.issues || []).map((i:any)=>({ code: `COMPLETENESS_${i.code || 'ISSUE'}`, severity: 'critical', message: i.message || i.code || 'Completeness issue' }))), ...((t.issues || []) as any) ] }; },
                    repair: ({ value }) => repairRenderedPageForPhase(value, 'completeness', repairOptions),
                    fallback: ({ value }) => repairRenderedPageForPhase(value, 'completeness', repairOptions), allowFallbackOnHardBlock: true,
                });
                renderedPage = outcome.output; renderedPage.metadata = renderedPage.metadata || {}; (renderedPage.metadata as any).phaseRepairCompleteness = outcome.history;
                if (outcome.status === 'failed' && !softMode) return { status: 'failed', output: renderedPage, warnings: outcome.warnings, error: outcome.error };
                if (outcome.status === 'failed') return { status: 'degraded', output: renderedPage, warnings: outcome.warnings, error: outcome.error };
                return { status: outcome.repaired ? 'degraded' : 'success', output: renderedPage, warnings: outcome.repaired ? ['Completeness phase auto-repaired.'] : [] };
            },
            validateTechnical: async (renderedPage, mission, pagePlan, resolvedPlan, seoResult, softMode) => {
                const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, canonical: seoResult?.renderedSeo?.canonical };
                const buildValidationInput = (): TechnicalSeoValidationInput => ({ expectedPhone: mission.local_nap?.phone || '', expectedCanonicalBase: mission.siteConfig?.baseUrl || 'https://serviciosprofesionales.pro', pageType: resolvedPlan.pageType, requireFaq: seoResult.seoBrief?.faqEligible, expectedBusinessName: mission.local_nap?.business_name, expectedAddress: mission.local_nap?.address, pagePlan, mission, renderedSeo: seoResult.renderedSeo });
                const outcome = await runPhaseWithRepair({ phase: 'technical-validation', input: renderedPage, maxAttempts: 3,
                    validate: (page) => { const tech = validateRenderedPageTechnically(page, buildValidationInput()); const integrity = validateRenderedPageForPhase(page, 'technical-validation'); return { passed: tech.length === 0 && integrity.passed, hardBlock: tech.length > 0 || integrity.hardBlock, issues: [ ...tech.map((i:string)=>({ code: i.replace(/[^A-Z0-9_]+/gi, '_').toUpperCase().slice(0,80), severity: 'critical', message: i })), ...((integrity.issues || []) as any) ] }; },
                    repair: ({ value }) => repairRenderedPageForPhase(value, 'technical-validation', repairOptions), fallback: ({ value }) => repairRenderedPageForPhase(value, 'technical-validation', repairOptions), allowFallbackOnHardBlock: true });
                renderedPage = outcome.output; const finalTechIssues = validateRenderedPageTechnically(renderedPage, buildValidationInput()); const finalIntegrity = validateRenderedPageForPhase(renderedPage, 'technical-validation');
                renderedPage.metadata.technical_passed = finalTechIssues.length === 0 && finalIntegrity.passed; (renderedPage.metadata as any).phaseRepairTechnical = outcome.history;
                renderedPage.metadata.validation_errors.push(...finalTechIssues, ...((finalIntegrity.issues || []).map((issue:any)=>`[TECHNICAL:${issue.code}] ${issue.message}`)));
                if (!renderedPage.metadata.technical_passed) { const error = `Technical Validation Failed: ${[...finalTechIssues, ...((finalIntegrity.issues || []).map((issue:any)=>issue.code))].join(', ')}`; if (!softMode) return { status: 'failed', output: renderedPage, warnings: outcome.warnings, error }; return { status: 'degraded', output: renderedPage, warnings: [...outcome.warnings, error], error }; }
                return { status: outcome.repaired ? 'degraded' : 'success', output: renderedPage, warnings: outcome.repaired ? ['Technical phase auto-repaired.'] : [] };
            },
            runUxValidation: async (renderedPage, mission) => {
                try {
                    const uxResult = await UXValidator.validate(
                        renderedPage.html,
                        mission.missionId || `${mission.niche}-${mission.city}-${Date.now()}`,
                    );
                    (renderedPage.metadata as any).ux_audit = uxResult;
                    if (!uxResult.passed) {
                        const criticalIssues = uxResult.issues.filter((issue: any) => issue.severity === 'error');
                        renderedPage.metadata.validation_errors.push(
                            ...criticalIssues.map((issue: any) => `[UX:${issue.viewport}:${issue.type}] ${issue.message}`),
                        );
                        if (criticalIssues.length > 0) {
                            return {
                                status: 'degraded',
                                output: renderedPage,
                                warnings: criticalIssues.map((issue: any) => issue.message),
                            };
                        }
                    }
                    return { status: 'success', output: renderedPage };
                } catch (error: any) {
                    return {
                        status: 'degraded',
                        output: renderedPage,
                        warnings: [`UX validation skipped: ${error.message}`],
                        error: error.message,
                    };
                }
            },
            runQualityGate: async (renderedPage, mission, pagePlan, softMode) => {
                if (runtime.fastDebugMode) return { status: 'success', output: { renderedPage, qualityGateResult: undefined }, warnings: ['FAST_DEBUG_MODE active. Deterministic Quality Gate skipped.'] };
                const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, canonical: (renderedPage.metadata.seo as any)?.canonical };
                const preGate = await runPhaseWithRepair({ phase: 'quality-gate', input: renderedPage, maxAttempts: 3, validate: (page) => validateRenderedPageForPhase(page, 'quality-gate'), repair: ({ value }) => repairRenderedPageForPhase(value, 'quality-gate', repairOptions), fallback: ({ value }) => repairRenderedPageForPhase(value, 'quality-gate', repairOptions), allowFallbackOnHardBlock: true });
                renderedPage = preGate.output; renderedPage.metadata = renderedPage.metadata || {}; (renderedPage.metadata as any).phaseRepairQualityGate = preGate.history;
                const qualityGateResult = await runAsyncQualityGate({ html: renderedPage.html, city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, mission, pagePlan, pageId: mission.missionId });
                (renderedPage.metadata as any).qualityGate = qualityGateResult; const technicalIntegrity = analyzeTechnicalIntegrity(renderedPage.html); (renderedPage.metadata as any).technicalIntegrity = technicalIntegrity;
                renderedPage.metadata.validation_errors.push(...qualityGateResult.issues.map((issue:any)=>`[QUALITY:${issue.code}] ${issue.message}`), ...technicalIntegrity.issues.map((issue:any)=>`[TECHNICAL:${issue.code}] ${issue.message}`));
                const qualityPassed = qualityGateResult.score >= 85 && !technicalIntegrity.hardBlock;
                if (!qualityPassed) { const error = `Quality Gate Failed (${qualityGateResult.score}/100). Requisito Premium V2.3: 85/100. Issues: ${formatQualityGateIssues(qualityGateResult)} | Technical: ${formatTechnicalIntegrityIssues(technicalIntegrity)}`; if (!softMode) return { status: 'failed', output: { renderedPage, qualityGateResult }, warnings: preGate.warnings, error }; return { status: 'degraded', output: { renderedPage, qualityGateResult }, warnings: [...preGate.warnings, error], error }; }
                return { status: preGate.repaired ? 'degraded' : 'success', output: { renderedPage, qualityGateResult }, warnings: preGate.repaired ? ['Quality gate preflight auto-repaired.'] : [] };
            },
            runEditorialValidation: async (renderedPage, mission, softMode) => {
                const auditResult = await this.runEditorialValidation(renderedPage, mission);
                renderedPage.metadata.qaScore = auditResult.score;
                renderedPage.metadata.validation_errors.push(
                    ...((auditResult.issues || []).map((issue: string) => `[EDITORIAL] ${issue}`)),
                );
                renderedPage.metadata.editorial_passed = ['publishable', 'premium'].includes(String(auditResult.status || ''));

                if (!renderedPage.metadata.editorial_passed) {
                    const reason = auditResult.reasoning ? ` ${auditResult.reasoning}` : '';
                    if (!softMode) {
                        return {
                            status: 'failed',
                            output: { renderedPage, editorialAudit: auditResult },
                            error: `Editorial Validation Failed: status=${auditResult.status} score=${auditResult.score}.${reason}`,
                        };
                    }
                    return {
                        status: 'degraded',
                        output: { renderedPage, editorialAudit: auditResult },
                        warnings: [String(auditResult.reasoning || `status=${auditResult.status} score=${auditResult.score}`)],
                        error: `Editorial Validation Failed: status=${auditResult.status} score=${auditResult.score}`,
                    };
                }

                return {
                    status: 'success',
                    output: { renderedPage, editorialAudit: auditResult },
                };
            },
            runDeliveryPhase: async (renderedPage, mission, options) => {
                const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, canonical: (renderedPage.metadata.seo as any)?.canonical };
                renderedPage = repairRenderedPageForPhase(renderedPage, 'delivery', repairOptions);
                assertFinalPageReady(renderedPage);
                if (options.deliver === false) return { status: 'success', output: { renderedPage, delivery: { attempted: false, completed: false, skipped: true, reason: 'Entrega omitida por configuración.' } }, warnings: ['Delivery skipped by configuration after final production-readiness guard.'] };
                await this.runDeliveryPhase(renderedPage, mission);
                return { status: 'success', output: { renderedPage, delivery: { attempted: true, completed: true } } };
            },
            runPostDeployAudit: async (renderedPage, mission, pagePlan) => {
                const warnings: string[] = [];
                const auditReport = await this.runPostDeployAudit(renderedPage, mission);
                if (pagePlan) {
                    try {
                        await recordOriginalityAfterRender({
                            mission,
                            pagePlan,
                            html: renderedPage.html,
                            pageId: mission.missionId,
                        });
                    } catch (error: any) {
                        warnings.push(`Originality record skipped: ${error.message}`);
                    }
                }
                return {
                    status: warnings.length ? 'degraded' : 'success',
                    warnings,
                    output: {
                        renderedPage,
                        postDeployAudit: auditReport,
                    },
                };
            },
            extractFaqsFromRenderedHtml: (html, mission) => this.extractFaqsFromRenderedHtml(html, mission),
            extractPrimaryH1FromHtml: (html) => this.extractPrimaryH1FromHtml(html),
            countWordsFromRenderedHtml: (html) => this.countWordsFromRenderedHtml(html),
            buildPostAuditNotes: (audit) => this.buildPostAuditNotes(audit),
            buildSoftModeResult: (renderedPage, mission, error, observability) => this.generateSoftModeResult(renderedPage, mission, error, observability),
            saveLegacyDebugSnapshot: this.debugArtifactsDir
                ? async (phase: CanonicalPipelinePhaseId, pipelineState: PipelineState, extra = {}) => {
                    const phaseMap: Partial<Record<CanonicalPipelinePhaseId, DebugPhaseId>> = {
                        'playbook': '0.1',
                        'site-graph': '0.5',
                        'research': '1',
                        'normalization': '2',
                        'planning': '3',
                        'render-plan': '3.5',
                        'writing': '4',
                        'correction': '5',
                        'integrity': '6',
                        'enrichment': '7',
                        'seo-contract': '7.5',
                        'assembly': '8',
                        'images': '8.2',
                        'completeness': '8.5',
                        'technical-validation': '9',
                        'ux-validation': '9.25',
                        'quality-gate': '9.5',
                        'editorial-validation': '10',
                        'delivery': '11',
                        'post-audit': '12',
                    };
                    const debugPhase = phaseMap[phase];
                    if (!debugPhase) return;
                    await this.saveDebugSnapshot(
                        debugPhase,
                        pipelineState.mission,
                        {
                            playbookContext: pipelineState.data.playbookContext,
                            siteGraph: pipelineState.data.siteGraph,
                            researchContext: pipelineState.data.researchContext,
                            normalizedContext: pipelineState.data.normalizedContext,
                            pagePlan: pipelineState.data.pagePlan,
                            resolvedPlan: pipelineState.data.resolvedPlan,
                            contentDraft: pipelineState.data.contentDraft,
                            correctedDraft: pipelineState.data.correctedDraft,
                            enrichedDraft: pipelineState.data.enrichedDraft,
                            seoResult: pipelineState.data.seoResult,
                            renderedPage: pipelineState.data.renderedPage,
                            qualityGateResult: pipelineState.data.qualityGateResult,
                            editorialAudit: pipelineState.data.editorialAudit,
                            delivery: pipelineState.data.delivery,
                            postDeployAudit: pipelineState.data.postDeployAudit,
                            observability: pipelineState.observability,
                        } as any,
                        extra,
                    );
                }
                : undefined,
        };
    }

    async run(mission: GenerationMission, options: PipelineRunOptions = {}): Promise<PipelineResult | null> {
        mission = this.sanitizeMission(mission);
        const fastDebugMode = this.FAST_DEBUG_MODE;
        const persistState = options.persistState ?? Boolean(mission.debugMode);

        if (mission.debugMode) {
            if (options.resumeFromStatePath) {
                const resolvedStatePath = path.resolve(options.resumeFromStatePath);
                this.debugArtifactsDir = path.dirname(path.dirname(resolvedStatePath));
                this.debugRunId = path.basename(this.debugArtifactsDir);
            } else {
                const { runId, dir } = await ensureRunArtifactsDir({ niche: mission.niche, city: mission.city });
                this.debugRunId = runId;
                this.debugArtifactsDir = dir;
            }
            console.log(`[DEBUG] Modo depuración activo. Artefactos en: ${this.debugArtifactsDir}`);
            startDebugLogging(this.debugArtifactsDir);
        }

        try {
            const host = this.createStateMachineHost({
                fastDebugMode,
            });

            const machine = new ContentPipelineStateMachine(host);
            const execution = await machine.run(mission, {
                ...options,
                persistState,
                artifactsDir: options.artifactsDir || this.debugArtifactsDir,
            });

            if (this.debugArtifactsDir) {
                try {
                    await consolidateRunJsonFiles(this.debugArtifactsDir);
                } catch (error: any) {
                    console.warn(`[Pipeline] Failed to consolidate run JSON files: ${error.message}`);
                }
            }

            return execution.result;
        } finally {
            if (mission.debugMode) {
                stopDebugLogging();
            }
        }
    }

    private async ensureMissionEnrolledDB(mission: GenerationMission): Promise<void> {
        try {
            const db = await dbManager.getDB();
            if (mission.missionId) {
                await db.run('INSERT OR IGNORE INTO missions (id, niche, city, status) VALUES (?, ?, ?, ?)', [
                    mission.missionId,
                    mission.niche,
                    mission.city,
                    'running'
                ]);
            }
        } catch (e: any) {
            console.warn(`[Pipeline] Failed to enroll mission in DB: ${e.message}`);
        }
    }

    private generateSoftModeResult(renderedPage: RenderedPage, mission: GenerationMission, error: Error, obs: ObservabilityMetadata): PipelineResult {
        console.warn(`[SOFT_MODE] Pipeline falló pero devolviendo última página renderizada para inspección.`);
        const html = renderedPage.html;
        const h1 = this.extractPrimaryH1FromHtml(html) || 'Failed Page (Soft Mode)';
        const wordCount = this.countWordsFromRenderedHtml(html);
        
        return {
            success: true,
            data: {
                html: renderedPage.html,
                html_path: renderedPage.metadata.output_path || '',
                word_count: wordCount,
                score: 0,
                notes: [`CRITICAL_ERROR: ${error.message}`, ...renderedPage.metadata.validation_errors],
                status: 'critical_error_soft' as any,
                url: '',
                h1,
                faqs: [],
                metadata: {
                    ...renderedPage.metadata,
                    total_words: wordCount,
                    is_soft_recovery: true
                },
                observability: obs
            }
        };
    }

    private buildPostAuditNotes(audit: any): string[] {
        const out: string[] = [];
        if (audit.criticalIssues?.length) out.push(`CRITICAL: ${audit.criticalIssues[0]}`);
        if (audit.uxGaps?.length) out.push(`UX_GAP: ${audit.uxGaps[0]}`);
        if (audit.seoWarning) out.push(`SEO_WARN: ${audit.seoWarning}`);
        return out;
    }

    private extractPrimaryH1FromHtml(html: string): string {
        const $ = cheerio.load(html);
        return $('h1').first().text().trim();
    }

    private countWordsFromRenderedHtml(html: string): number {
        const $ = cheerio.load(html);
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return text.split(/\s+/).filter(Boolean).length;
    }

    private extractFaqsFromRenderedHtml(html: string, mission: GenerationMission): any[] {
        const $ = cheerio.load(html);
        const faqs: any[] = [];
        
        $('.faq-item, .faq-accordion details, [itemtype="https://schema.org/Question"]').each((_, el) => {
            const question = $(el).find('h3, summary, [itemprop="name"]').first().text().trim();
            const answer = $(el).find('.faq-answer, .faq-content, [itemprop="text"]').first().text().trim();
            if (question && answer) {
                faqs.push({ question, answer });
            }
        });

        return faqs.slice(0, 8);
    }

    public async runResearchPhase(mission: GenerationMission): Promise<ResearchContext> {
        if (mission.contextual_data?.strategicAnalysis && mission.contextual_data?.marketData) {
            console.log(`[Phase 1] Using pre-fetched strategic context. Skipping redundant LLM analysis.`);
            const analystData = mission.contextual_data.strategicAnalysis;
            const marketData = mission.contextual_data.marketData;

            const intentModel: IntentModel = {
                pageType: analystData.pageTypeRecommendation || 'service',
                primaryIntent: analystData.primaryIntent || 'commercial',
                secondaryIntent: analystData.secondaryIntent,
                funnelStage: analystData.funnelStage || 'BOFU',
                primaryKeyword: analystData.primaryKeyword || mission.niche,
                secondaryKeywords: analystData.secondaryKeywords || [],
                semanticEntities: analystData.semanticEntities || analystData.entities || [],
                serpFeaturesTarget: analystData.serpFeaturesTarget || ['local_pack'],
                mandatoryTrustElements: analystData.mandatoryTrustElements || analystData.trustAssets || ['telefono visible', 'cobertura local'],
                mandatorySections: analystData.mandatorySections || analystData.contentAngles || [],
                internalLinkTargets: analystData.internalLinkTargets || [],
                conversionGoal: 'call',
                wordCountTarget: analystData.wordCountTarget
            };

            return {
                niche: mission.niche,
                city: mission.city,
                local_nap: mission.local_nap,
                keywords: intentModel.secondaryKeywords,
                entities: intentModel.semanticEntities,
                competitors: marketData.organicLeaders || [],
                serp_gaps: [],
                market_data: analystData,
                intentModel,
                strategicAnalysis: analystData,
                geoData: { neighborhoods: [], sub_locations: [] }
            };
        }

        console.log(`[Phase 1.1] Geo-Intelligence & Local Mapping...`);
        const geoResponse = await this.geointel.execute({ root_location: mission.city, scope: 'auto' });
        const geoData = geoResponse?.success ? {
            neighborhoods: geoResponse.data?.neighborhoods || [],
            sub_locations: geoResponse.data?.sub_locations || []
        } : { neighborhoods: [], sub_locations: [] };

        console.log(`[Phase 1.2] SDI SERP Extraction...`);
        const serpData = await serpManager.scrapeUnifiedSERP(mission.niche, mission.city);
        const organicQuality = filterUsefulOrganicResults(serpData.organic || [], mission.niche, mission.city, 10);
        const organicResults = organicQuality.accepted.length ? organicQuality.accepted : this.filterOrganicResults(serpData.organic || []);
        const localPack = serpData.localPack || [];

        console.log(`[Phase 1.3] Competitive Audit & SERP Deep Analysis...`);
        const auditResponse = await this.competitorAudit.execute({ targetLinks: organicResults.map(r => r.link), niche: mission.niche, city: mission.city });
        const auditQuality = filterUsefulCompetitorAudits(Array.isArray(auditResponse?.data) ? auditResponse.data : [], mission.niche, mission.city, Number(process.env.COMPETITOR_AUDIT_LIMIT) || 3);
        const deepAudits = auditQuality.accepted.length ? auditQuality.accepted : this.filterDeepAudits(Array.isArray(auditResponse?.data) ? auditResponse.data : []);
        const organicLeaders = organicResults;

        console.log(`[Phase 1.4] Entity Extraction & Niche Knowledge...`);
        const entityResponse = await this.entityExtractor.execute({
            keyword: mission.niche,
            serpData: { organic: organicResults, audits: deepAudits }
        });
        const geoSignals = extractLocalSignalsFromGeo(geoData);
        const entities = Array.from(new Set([...(entityResponse?.data?.entities || []), ...geoSignals]));

        console.log(`[Phase 1.5] Identifying Content Gaps & Opportunities...`);
        const serpGapResponse = await this.serpGap.execute({ keyword: mission.niche, audits: deepAudits });

        console.log(`[Phase 1.6] Strategic Intelligence Synthesis...`);
        const analystResponse = await this.analyst.execute({
            niche: mission.niche,
            city: mission.city,
            marketData: { localPack: localPack, organicLeaders: organicLeaders, deepAudits: deepAudits }
        });
        const { summary: researchQuality } = this.buildResearchQualityContext({
            organicAccepted: organicQuality.accepted,
            organicRejected: organicQuality.rejected,
            auditsAccepted: auditQuality.accepted,
            auditsRejected: auditQuality.rejected,
            geoData
        });
        const analystData = {
            ...(analystResponse?.data || {}),
            entities: Array.from(new Set([...((analystResponse?.data?.entities) || []), ...geoSignals])),
            researchQuality
        };

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

        const napData = napResponse?.success && napResponse?.data ? napResponse.data : mission.local_nap;

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

    public async runNormalizationPhase(research: ResearchContext): Promise<NormalizedContext> {
        return ContextNormalizer.normalize(research);
    }

    public async validateNormalizationGate(context: NormalizedContext): Promise<void> {
        if (!context.clean_nap.phone_normalized || context.clean_nap.phone_normalized.length < 9) {
            console.warn("[Normalization Gate] WARNING: Invalid or unparseable phone number.");
            return;
        }
    }

    public async runPlanningPhase(research: NormalizedContext, mission: GenerationMission): Promise<PagePlan> {
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
                word_count_target: mission.contextual_data?.wordCountTarget || Math.max(1500, research.intentModel?.wordCountTarget || 0),
                entities: research.deduplicated_entities || [],
                cluster_data: mission.cluster_data,
                local_nap: research.clean_nap,
                intentModel: research.intentModel!,
                strategicAnalysis: research.strategicAnalysis,
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

                successfulPlan = finalPlan;
            }
        }

        if (!successfulPlan) throw new Error("Phase 3 Architecture Failure.");
        return successfulPlan;
    }

    public async validatePlanningGate(plan: PagePlan): Promise<void> {
        if (!plan.h1 || !plan.h1.trim()) throw new Error("Planning Gate Failure: missing H1.");
        if (!Array.isArray(plan.sections) || plan.sections.length < 5) throw new Error("Planning Gate Failure: insufficient sections.");
    }

    private validateSeoBlock(html: string, section: any, city: string, niche: string): string[] {
        const issues: string[] = [];
        const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const normalizedText = plainText.toLowerCase();
        const words = plainText.split(/\s+/).filter(Boolean).length;
        const blockType = String(section?.block_type || '').toLowerCase();
        const absoluteMinimums: Record<string, number> = { trust_band: 90, urgency_panel: 60, local_proof: 110, services_grid: 220, faq: 180 };
        const minWords = Math.max(absoluteMinimums[blockType] || 80, Math.floor((section?.target_words || 180) * 0.42));

        if (words < minWords) issues.push(`SEO:THIN_BLOCK(${words}/${minWords})`);
        if (!normalizedText.includes(city.toLowerCase())) issues.push('SEO:MISSING_CITY');
        if (!normalizedText.includes(niche.toLowerCase()) && !normalizedText.includes('especialista')) issues.push('SEO:MISSING_NICHE');
        return issues;
    }


    private deriveAllowedLocalEntities(research: NormalizedContext, mission: GenerationMission, plan: PagePlan): string[] {
        const cityKey = String(research.city || '').toLowerCase().trim();
        const raw = [
            ...((research.geoData?.neighborhoods || []) as string[]),
            ...((research.geoData?.sub_locations || []).map((item: any) => item?.name)),
            ...((mission.cluster_data?.geo || []).map((item: any) => item?.name)),
            ...(((plan as any)?.internalLinking?.architectContext?.localAreas || []) as string[]),
            ...((((plan as any)?.internalLinking?.linkPlan?.grouped?.relatedAreas || []) as any[]).map((item: any) => item?.targetTitle || item?.anchor)),
        ];

        const seen = new Set<string>();
        const out: string[] = [];
        for (const value of raw) {
            const cleaned = String(value || '').replace(/^.*?\ben\s+/i, '').replace(/\s+/g, ' ').trim();
            const key = cleaned.toLowerCase();
            if (!cleaned || key === cityKey || seen.has(key)) continue;
            seen.add(key);
            out.push(cleaned);
            if (out.length >= 8) break;
        }

        return out;
    }

    private getResolvedSectionContract(resolvedPlan: ResolvedPageRenderPlan | undefined, sectionId: string, section: any, index: number) {
        const resolvedSections = Array.isArray(resolvedPlan?.sections) ? resolvedPlan.sections : [];
        const directMatch = resolvedSections.find((item: any) => item?.sectionId === sectionId);
        if (directMatch) return directMatch;

        const blockType = String(section?.block_type || section?.blockType || '').toLowerCase().trim();
        if (!blockType) return undefined;

        const sameType = resolvedSections.filter((item: any) => String(item?.blockType || '').toLowerCase().trim() === blockType);
        return sameType[index] || sameType[0];
    }


    public async runWritingPhase(research: NormalizedContext, plan: PagePlan, mission: GenerationMission, obs: ObservabilityMetadata, resolvedPlan: ResolvedPageRenderPlan): Promise<ContentDraft> {
        console.log(`[Phase 4] Multi-Agent semantic writing for H1: ${plan.h1}`);

        obs.totalCost = 0;
        const blocks: ContentBlock[] = [];
        const allowedLocalEntities = this.deriveAllowedLocalEntities(research, mission, plan);

        const internalLinksToMention = (plan.internalLinking?.linkPlan?.all || [])
            .map((c: any) => c.anchor)
            .filter(Boolean);

        for (let i = 0; i < plan.sections.length; i++) {
            const section = plan.sections[i];
            const sectionId = section.section_id || `section-${i}`;
            const resolvedSectionContract = this.getResolvedSectionContract(resolvedPlan, sectionId, section, i);
            const layoutSpec = {
                shell: resolvedSectionContract?.shell || 'plain',
                density: resolvedSectionContract?.density || section.content_density || 'standard',
                pattern: resolvedSectionContract?.sectionPattern || section.pattern_hint || 'stack',
                layout: section.layout_hint || 'full_width_text'
            };

            const writerStart = Date.now();
            const writerResponse = await this.writer.execute({
                niche: research.niche,
                city: research.city,
                section_h2: section.h2,
                subsections_h3: section.h3s || [],
                local_nap: research.clean_nap,
                contextual_data: mission.contextual_data,
                entities: research.deduplicated_entities || [],
                pageProfile: plan.pageProfile,
                sectionIndex: i,
                totalSections: plan.sections.length,
                blockType: section.block_type || section.blockType,
                preferred_format: section.preferred_format,
                content_density: layoutSpec.density,
                layout_hint: layoutSpec.layout,
                visual_variant: section.visual_variant,
                visual_spec: {
                    ...(section.visual_spec || {}),
                    ...(resolvedSectionContract?.mobilePattern ? { mobilePattern: resolvedSectionContract.mobilePattern } : {})
                },
                factuality_level: section.factuality_level,
                mobile_priority: section.mobile_priority,
                section_id: sectionId,
                allowedLocalEntities,
                intentModel: research.intentModel!,
                sectionBrief: {
                    objective: section.objective || '',
                    userQuestion: '',
                    internalLinksToMention: Array.from(new Set([...internalLinksToMention])),
                },
                targetWords: section.target_words,
                expansion_mode: section.depth_mode || 'standard',
                pageSkeleton: plan.layoutContract?.pageSkeleton,
                heroTemplate: plan.layoutContract?.heroTemplate,
                cadencePattern: plan.layoutContract?.cadencePattern,
                proofStrategy: plan.layoutContract?.proofStrategy,
                ctaStrategy: plan.layoutContract?.ctaStrategy,
                sectionPattern: layoutSpec.pattern,
                sectionContract: resolvedSectionContract
            });

            const duration = Date.now() - writerStart;
            obs.durations[`WriterBlock-${i}`] = duration;

            if (writerResponse.success && writerResponse.data) {
                const block: ContentBlock = {
                    id: sectionId,
                    type: section.block_type || 'unspecified',
                    h2: section.h2,
                    html: writerResponse.data.html || '',
                    wordCount: writerResponse.data.wordCount || 0,
                    score: 0,
                    metadata: {
                        block_type: section.block_type,
                        semantic: writerResponse.data.semantic,
                        duration,
                        model: writerResponse.observability?.model,
                        tokens: writerResponse.observability?.tokenUsage || 0
                    }
                };
                blocks.push(block);
                obs.tokenUsage += (block.metadata.tokens || 0);
            } else {
                console.warn(`[Phase 4] Writer failure in block ${i}. Contenido degradado.`);
            }
        }

        return {
            h1: plan.h1,
            meta_title: plan.meta_title,
            meta_description: plan.meta_description,
            blocks,
            totalWords: blocks.reduce((acc, b) => acc + b.wordCount, 0),
            pageProfile: plan.pageProfile,
            metadata: {
                blocks_generated: blocks.length,
                plan_sections: plan.sections.length
            }
        };
    }

    public async runCorrectionPhase(draft: ContentDraft, context: NormalizedContext): Promise<ContentDraft> {
        console.log(`[Phase 5] Global coherence and linguistic correction...`);

        const correctedBlocks: ContentBlock[] = [];
        for (const block of draft.blocks) {
            const rawHtml = block.html;
            
            const refineResponse = await this.nicheCoherenceAgent.execute({
                html: rawHtml,
                niche: context.niche,
                city: context.city,
                blockType: block.type
            });

            let refinedHtml = refineResponse.success ? refineResponse.data.html : rawHtml;
            refinedHtml = SectionIntegrityRefiner.refine(refinedHtml, context.niche, context.city);

            const correccionesResponse = await this.spanishCorrector.execute({
                html: refinedHtml,
                niche: context.niche,
                city: context.city,
                businessName: context.clean_nap?.business_name,
                phone: context.clean_nap?.phone
            });

            let correctedHtml = correccionesResponse.success ? correccionesResponse.data.html : refinedHtml;

            // NICHE ISOLATION GATE: Final check post-correction
            const crossNicheReport = detectCrossNicheContamination({
                niche: context.niche,
                city: context.city,
                blockType: block.type,
                html: correctedHtml
            });

            if (crossNicheReport.severity === 'major' || crossNicheReport.severity === 'fatal') {
                console.warn(`[Niche Isolation] Contaminación detectada tras corrección en bloque ${block.id}. Revirtiendo a versión pre-corrección.`);
                correctedHtml = refinedHtml;
            }

            correctedBlocks.push({
                ...block,
                html: correctedHtml
            });
        }

        return {
            ...draft,
            blocks: correctedBlocks
        };
    }

    public async validatePreAssemblyIntegrityGate(
        draft: ContentDraft,
        options: { softMode?: boolean; city?: string; niche?: string; targetTotal?: number } = {}
    ): Promise<void> {
        const { softMode = false, city, niche, targetTotal } = options;
        const issues = IntegrityGuard.validateDraft(draft, { city, niche, targetTotal });

        // NICHE ISOLATION GATE: Check all blocks against playbook
        if (niche) {
            for (const block of draft.blocks) {
                const nicheCheck = validateContentAgainstNichePlaybook({
                    niche,
                    html: block.html
                });
                if (!nicheCheck.ok) {
                    issues.push(`NICHE_PLAYBOOK_VIOLATION:${block.id}: ${nicheCheck.issues.join('; ')}`);
                }
            }
        }

        if (issues.length > 0) {
            console.warn(`[Integrity Gate] Initial issues: ${issues.join(', ')}`);
            const criticalIssues = issues.filter((issue) => /CONTENT_VOLUME_TOO_LOW|PLACEHOLDER_DETECTED|EMPTY_BLOCK|VISIBLE_TEXT_TOO_LOW|UNSAFE_OR_CORRUPTED_HTML|DUPLICATE_BLOCK_COPY|EMPTY_DRAFT/.test(issue));
            if (criticalIssues.length > 0 && !softMode) {
                throw new Error(`Integrity Gate Failed: ${criticalIssues.join(', ')}`);
            }
        }
    }

    public async runEnrichmentPhase(draft: ContentDraft, context: NormalizedContext, plan: PagePlan, mission: GenerationMission): Promise<ContentDraft> {
        console.log(`[Phase 7] Content enrichment (SEO/Trust/Internal Linking)...`);

        const enrichedDraft: ContentDraft = {
            ...draft,
            blocks: draft.blocks.map(block => {
                let enrichedHtml = block.html;
                enrichedHtml = refinePremiumBlockCopy(enrichedHtml, {
                    blockType: (block as any).type || block.metadata?.block_type,
                    niche: context.niche,
                    city: context.city
                });
                return {
                    ...block,
                    html: enrichedHtml
                };
            })
        };

        const linkedDraft = injectAutomaticLinkBlocks(
            enrichedDraft as any,
            plan.internalLinking?.autoBlocks || []
        );

        return linkedDraft as ContentDraft;
    }

    public async runAssemblyPhase(draft: ContentDraft, plan: PagePlan, context: NormalizedContext, mission: GenerationMission, resolvedPlan: ResolvedPageRenderPlan): Promise<RenderedPage> {
        console.log(`[Phase 8] Final procedural composition...`);

        const generatedSections: GeneratedSection[] = draft.blocks.map(block => ({
            sectionId: block.id,
            id: block.id,
            blockType: ((block as any).type || block.metadata?.block_type || '') as any,
            type: ((block as any).type || block.metadata?.block_type || '') as any,
            html: block.html,
            h2: block.h2,
            metadata: block.metadata
        }));

        const breadcrumbs = buildPageBreadcrumbs(mission, plan);
        const mappedBreadcrumbs = mapBreadcrumbsForRenderer(breadcrumbs);

        const renderedHtml = renderPage({
            niche: context.niche,
            city: context.city,
            h1: draft.h1,
            hero: plan.hero,
            meta: {
                title: draft.meta_title,
                description: draft.meta_description,
                seo: (draft.metadata as any)?.seo
            },
            sections: generatedSections,
            designDNA: plan.design?.dna,
            layoutContract: plan.layoutContract,
            business: context.clean_nap,
            breadcrumbs: mappedBreadcrumbs,
            composition: (plan.pageProfile as any)?.page_composition || 'conversion',
            resolvedPlan
        });

        const santizedHtml = sanitizeFinalRenderedHtml(renderedHtml, {
            niche: context.niche,
            city: context.city,
            businessName: context.clean_nap?.business_name,
            phone: context.clean_nap?.phone
        });
        const guardedResult = guardRenderedHtml(renderedHtml, santizedHtml);
        const finalHtml = editorialPostProcessHtml(guardedResult.html, {
            city: context.city,
            brand: context.clean_nap?.business_name || '',
            phone: context.clean_nap?.phone || '',
            maxBrandMentions: plan.contentRules?.maxBrandMentionsPerSection || 4,
            niche: context.niche
        });
        
        // Final Polish Patch Integration (Alignment + Final Copy Cleanup)
        const polishedHtml = finalHtmlPolish(finalHtml, {
            city: context.city,
            niche: context.niche
        });

        (this as any).lastRenderedPage = {
            html: polishedHtml,
            metadata: {
                niche: context.niche,
                city: context.city,
                output_path: '',
                technical_passed: true,
                editorial_passed: true,
                validation_errors: [],
                seo: (draft.metadata as any)?.seo
            }
        };

        return (this as any).lastRenderedPage;
    }

    public async runEditorialValidation(page: RenderedPage, mission: GenerationMission): Promise<any> {
        console.log(`[Phase 10] LLM Score audit...`);
        const result = await this.qualityScoreAgent.execute({
            html: page.html,
            niche: mission.niche,
            city: mission.city,
            businessName: mission.local_nap.business_name
        });

        return result.success ? result.data : { score: 65, status: 'needs_review', reasoning: 'Audit failure' };
    }

    public async runDeliveryPhase(page: RenderedPage, mission: GenerationMission): Promise<void> {
        const slug = buildDeterministicSlug(mission.niche, mission.city, mission.subPath);
        const outputRoot = resolveMissionOutputSlug(mission);
        const fullDir = path.join(vault.OUTPUT_DIR || path.join(process.cwd(), 'output_sites'), outputRoot);
        const fileName = mission.wordpress?.enabled ? 'content.txt' : 'index.html';
        const finalPath = path.join(fullDir, fileName);

        await fs.mkdir(fullDir, { recursive: true });
        await fs.writeFile(finalPath, page.html, 'utf-8');
        page.metadata.output_path = finalPath;
        console.log(`[Phase 11] Delivered to: ${finalPath}`);
    }

    public async runPostDeployAudit(page: RenderedPage, mission: GenerationMission): Promise<PostDeployAuditResult> {
        return await AuditSentinel.audit(page, mission);
    }

    private validateWordBudget(draft: ContentDraft, target: number): void {
        const words = draft.totalWords || 0;
        if (words < target * 0.7) {
            console.warn(`[Integrity] Page length is below 70% of target (${words}/${target} words)`);
        }

        if (words < Math.max(650, Math.floor(target * 0.55)) && !this.SOFT_MODE) {
            throw new Error(`WORD_BUDGET_TOO_LOW:${words}/${target}`);
        }
    }
}



