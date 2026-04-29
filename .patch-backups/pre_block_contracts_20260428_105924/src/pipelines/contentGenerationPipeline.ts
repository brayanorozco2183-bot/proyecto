import { ContentArchitectAgent } from '../agents/architect.js';
import { ArtDirectorAgent } from '../agents/artDirectorAgent.js';
import { LayoutComposerAgent } from '../agents/layoutComposerAgent.js';
import { ContentWriterAgent } from '../agents/contentWriterAgent.js';
import { QualityScoreAgent } from '../agents/quality_score.js';
import { ContentVarietyAgent } from '../agents/contentVarietyAgent.js';
import { NicheCoherenceAgent } from '../agents/nicheCoherenceAgent.js';
import { SpanishCorrectorAgent } from '../agents/spanishCorrectorAgent.js';
import { StaticDeployAgent } from '../agents/static_deploy.js';
import { SEOAnalystAgent } from '../agents/analyst.js';
import { GeoIntelAgent } from '../agents/geointel.js';
import { CompetitorAuditAgent } from '../agents/competitor_audit.js';
import { SERPGapAgent } from '../agents/serpGapAgent.js';
import { EntityExtractorAgent } from '../agents/entityExtractorAgent.js';
import { NAPGuardianAgent } from '../agents/nap.js';

import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

import { ContextNormalizer } from '../utils/contextNormalizer.js';
import { resolvePlaybookForMission } from '../niches/agentAdapters.js';
import { resolveNicheId, loadNichePlaybook } from '../niches/playbookLoader.js';
import { startDebugLogging, stopDebugLogging } from '../utils/debugLogger.js';
import { 
    savePhaseArtifact, 
    ensureRunArtifactsDir, 
    consolidateRunJsonFiles 
} from '../debug/phaseArtifactStore.js';
import { DebugPipelineState, DebugPhaseId } from '../debug/phaseDebugTypes.js';
import { 
    buildSeoForPipeline, 
    attachRenderedSeoToDraft 
} from '../seo/pipelineIntegration.js';
import { buildSiteGraph } from '../internal-linking/index.js';
import { dbManager } from '../db/index.js';
import { RenderPlanResolver } from '../renderers/renderPlanResolver.js';
import { 
    GenerationMission, 
    PipelineResult, 
    ResearchContext, 
    NormalizedContext, 
    PagePlan, 
    ContentDraft, 
    RenderedPage, 
    PostDeployAuditResult, 
    ObservabilityMetadata 
} from '../types/pipeline_v2.js';
import { ContentPipelineStateMachine } from '../pipeline-state/contentPipelineStateMachine.js';
import type { PipelineHostAdapter, PipelineRunOptions, PipelineState } from '../types/pipeline/state.js';
import type { CanonicalPipelinePhaseId } from '../types/pipeline/contracts.js';

// Phase Modules
import { ResearchPhase } from './phases/research.phase.js';
import { PlanningPhase } from './phases/planning.phase.js';
import { WritingPhase } from './phases/writing.phase.js';
import { AssemblyPhase } from './phases/assembly.phase.js';
import { QualityPhase } from './phases/quality.phase.js';
import { DeliveryPhase } from './phases/delivery.phase.js';

export class ContentGenerationPipeline {
    // Agents
    private analyst = new SEOAnalystAgent();
    private geointel = new GeoIntelAgent();
    private competitorAudit = new CompetitorAuditAgent();
    private serpGap = new SERPGapAgent();
    private entityExtractor = new EntityExtractorAgent();
    private architect = new ContentArchitectAgent();
    private varietyEngine = new ContentVarietyAgent();
    private writer = new ContentWriterAgent();
    private nicheCoherenceAgent = new NicheCoherenceAgent();
    private spanishCorrector = new SpanishCorrectorAgent();
    private qualityScoreAgent = new QualityScoreAgent();
    private artDirector = new ArtDirectorAgent();
    private layoutComposer = new LayoutComposerAgent();

    // Phase Engines
    private researchEngine: ResearchPhase;
    private planningEngine: PlanningPhase;
    private writingEngine: WritingPhase;
    private assemblyEngine: AssemblyPhase;
    private qualityEngine: QualityPhase;
    private deliveryEngine: DeliveryPhase;

    private readonly SOFT_MODE = process.env.PIPELINE_SOFT_MODE === 'true';
    private debugArtifactsDir?: string;
    private debugRunId?: string;

    constructor() {
        this.researchEngine = new ResearchPhase(this.geointel, this.competitorAudit, this.entityExtractor, this.serpGap, this.analyst);
        this.planningEngine = new PlanningPhase(this.architect, this.artDirector, this.layoutComposer, this.varietyEngine);
        this.writingEngine = new WritingPhase(this.writer, this.nicheCoherenceAgent, this.spanishCorrector);
        this.assemblyEngine = new AssemblyPhase();
        this.qualityEngine = new QualityPhase(this.qualityScoreAgent);
        this.deliveryEngine = new DeliveryPhase();
    }

    async run(mission: GenerationMission, options: PipelineRunOptions = {}): Promise<PipelineResult | null> {
        mission = this.sanitizeMission(mission);
        if (mission.debugMode) {
            const { runId, dir } = await ensureRunArtifactsDir({ niche: mission.niche, city: mission.city });
            this.debugRunId = runId;
            this.debugArtifactsDir = dir;
            startDebugLogging(this.debugArtifactsDir);
        }

        try {
            const host = this.createStateMachineHost();
            const machine = new ContentPipelineStateMachine(host);
            const execution = await machine.run(mission, { ...options, artifactsDir: this.debugArtifactsDir });
            if (this.debugArtifactsDir) await consolidateRunJsonFiles(this.debugArtifactsDir);
            return execution.result;
        } finally {
            if (mission.debugMode) stopDebugLogging();
        }
    }

    public async runResearchPhase(mission: GenerationMission): Promise<ResearchContext> {
        await this.applyPlaybookContext(mission);
        return this.researchEngine.run(mission);
    }

    public async runNormalizationPhase(research: ResearchContext): Promise<NormalizedContext> {
        return ContextNormalizer.normalize(research);
    }

    public async runPlanningPhase(context: NormalizedContext, mission: GenerationMission): Promise<PagePlan> {
        await this.applyPlaybookContext(mission);
        return this.planningEngine.run(context, mission);
    }

    public async runWritingPhase(context: NormalizedContext, plan: PagePlan, mission: GenerationMission, obs: ObservabilityMetadata, resolvedPlan: any): Promise<ContentDraft> {
        await this.applyPlaybookContext(mission);
        return this.writingEngine.run(context, plan, mission, obs, resolvedPlan);
    }

    public async runCorrectionPhase(draft: ContentDraft, context: NormalizedContext): Promise<ContentDraft> {
        return this.writingEngine.runCorrection(draft, context);
    }

    public async runEnrichmentPhase(draft: ContentDraft, context: NormalizedContext, plan: PagePlan, mission: GenerationMission): Promise<ContentDraft> {
        return this.writingEngine.runEnrichment(draft, context, plan);
    }

    public async runAssemblyPhase(draft: ContentDraft, plan: PagePlan, context: NormalizedContext, mission: GenerationMission): Promise<RenderedPage> {
        return this.assemblyEngine.run(draft, plan, context, mission, this.resolveRenderPlan(mission, plan));
    }

    public async runDeliveryPhase(page: RenderedPage, mission: GenerationMission): Promise<any> {
        return this.deliveryEngine.run(page, mission);
    }

    private createStateMachineHost(): PipelineHostAdapter {
        return {
            ensureMissionEnrolledDB: (m) => this.ensureMissionEnrolledDB(m),
            sanitizeMission: (m) => this.sanitizeMission(m),
            shouldUseSoftMode: (m) => this.shouldUseSoftMode(m),
            applyPlaybookContext: (m) => this.applyPlaybookContext(m),
            buildSiteGraph: (m) => buildSiteGraph(m),
            runResearchPhase: (m) => this.researchEngine.run(m),
            runNormalizationPhase: (r) => Promise.resolve(ContextNormalizer.normalize(r)),
            validateNormalizationGate: (c) => this.validateNormalizationGate(c),
            runPlanningPhase: (c, m) => this.planningEngine.run(c, m),
            validatePlanningGate: (p, m) => this.planningEngine.validatePlanningGate(p),
            resolveRenderPlan: (m, p) => this.resolveRenderPlan(m, p),
            runWritingPhase: (c, p, m, o, r) => this.writingEngine.run(c, p, m, o, r),
            runCorrectionPhase: (d, c) => this.writingEngine.runCorrection(d, c),
            validateWordBudget: (d, t) => this.validateWordBudget(d, t),
            validatePreAssemblyIntegrityGate: (d, o) => this.writingEngine.validateIntegrity(d, o),
            runEnrichmentPhase: (d, c, p, m) => this.writingEngine.runEnrichment(d, c, p),
            buildSeoContract: (d, p, m) => this.buildSeoContract(d, p, m),
            runAssemblyPhase: (d, p, c, m, r) => this.assemblyEngine.run(d, p, c, m, r),
            finalizeImages: (p, m, pl, o) => this.qualityEngine.runImagePhase(p, m, pl, o),
            validateCompleteness: (p, m, s) => this.qualityEngine.runCompletenessPhase(p, m, s),
            validateTechnical: (p, m, pl, r, s, soft) => this.qualityEngine.runTechnicalValidation(p, m, pl, r, s, soft),
            runUxValidation: (p, m) => this.qualityEngine.runUXValidation(p, m),
            runQualityGate: (p, m, pl, s) => this.qualityEngine.runQualityGate(p, m, pl, s),
            runEditorialValidation: (p, m, s) => this.qualityEngine.runEditorialValidation(p, m),
            runDeliveryPhase: (p, m, o) => this.deliveryEngine.run(p, m),
            runPostDeployAudit: (p, m, pl) => this.deliveryEngine.runPostAudit(p, m),
            extractFaqsFromRenderedHtml: (h, m) => this.extractFaqsFromRenderedHtml(h),
            extractPrimaryH1FromHtml: (h) => this.extractPrimaryH1FromHtml(h),
            countWordsFromRenderedHtml: (h) => this.countWordsFromRenderedHtml(h),
            buildPostAuditNotes: (a) => this.buildPostAuditNotes(a),
            buildSoftModeResult: (p, m, e, o) => this.generateSoftModeResult(p, m, e, o),
            saveLegacyDebugSnapshot: this.debugArtifactsDir ? (ph, st, ex) => this.saveLegacyDebugSnapshot(ph, st, ex) : undefined
        };
    }

    private async ensureMissionEnrolledDB(mission: GenerationMission) {
        const db = await dbManager.getDB();
        if (mission.missionId) await db.run('INSERT OR IGNORE INTO missions (id, niche, city, status) VALUES (?, ?, ?, ?)', [mission.missionId, mission.niche, mission.city, 'running']);
    }

    private sanitizeMission(mission: GenerationMission): GenerationMission {
        mission.niche = this.canonicalizeMissionNiche(mission.niche);
        mission.city = this.normalizeCityCase(this.stripControlTokens(mission.city));
        if (!mission.city) throw new Error('MISSION_CITY_UNRESOLVED');
        return mission;
    }

    private stripControlTokens(v?: string) { return String(v || '').replace(/\[[A-Z0-9_:-]+\]/g, ' ').replace(/\s+/g, ' ').trim(); }
    private normalizeCityCase(v?: string) { return String(v || '').split(/\s+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' '); }
    private canonicalizeMissionNiche(raw?: string) {
        const cleaned = this.stripControlTokens(raw).replace(/^(?:misi[oó]n|mission|proyecto|brief|campa[nñ]a|landing|p[aá]gina|pagina|servicio|servicios)\s+de\s+/i, '').trim();
        const id = resolveNicheId(cleaned);
        if (id) { const pb = loadNichePlaybook(id); if (pb?.displayName) return pb.displayName.toLowerCase(); }
        return cleaned;
    }

    private async applyPlaybookContext(mission: GenerationMission) {
        const playbook = resolvePlaybookForMission(mission.niche);
        if (playbook) {
            this.analyst.setNicheBrief(playbook.analystBrief);
            this.architect.setNicheBrief(playbook.architectBrief);
            this.writer.setNicheBrief(playbook.writerBrief);
            this.writer.setTechnicalBrief(playbook.technicalBrief);
            this.nicheCoherenceAgent.setTechnicalBrief(playbook.technicalBrief);
            this.spanishCorrector.setTechnicalBrief(playbook.technicalBrief);
            this.qualityScoreAgent.setTechnicalBrief(playbook.technicalBrief);
        }
        return { mission, playbookContext: playbook };
    }

    private resolveRenderPlan(mission: GenerationMission, pagePlan: PagePlan) {
        return RenderPlanResolver.resolve(mission.missionId || `${mission.niche}-${mission.city}`, pagePlan, pagePlan.intentModel, pagePlan.pageVariety || pagePlan as any, pagePlan.layoutContract!, mission.wordpress?.enabled ? 'wordpress' : 'web');
    }

    private async buildSeoContract(draft: ContentDraft, pagePlan: PagePlan, mission: GenerationMission) {
        const faqs = (draft.blocks || []).filter((b: any) => b.metadata?.block_type === 'faq').flatMap((b: any) => (b.metadata?.semantic?.faqItems || b.metadata?.faqItems || []));
        const seoResult = buildSeoForPipeline(pagePlan, mission, faqs);
        const enrichedDraft = attachRenderedSeoToDraft(draft, seoResult.renderedSeo);
        return { enrichedDraft, seoResult, internalLinks: [], pagePlan };
    }

    private validateNormalizationGate(context: NormalizedContext): Promise<void> {
        if (!context.clean_nap.phone_normalized || context.clean_nap.phone_normalized.length < 9) console.warn("[Normalization Gate] Invalid phone.");
        return Promise.resolve();
    }

    private validateWordBudget(draft: ContentDraft, target: number) {
        if (draft.totalWords < target * 0.7) console.warn(`[Integrity] Low word count: ${draft.totalWords}/${target}`);
        if (draft.totalWords < Math.max(650, target * 0.55) && !this.SOFT_MODE) throw new Error(`WORD_BUDGET_TOO_LOW:${draft.totalWords}`);
    }

    private extractPrimaryH1FromHtml(html: string) { return cheerio.load(html)('h1').first().text().trim(); }
    private countWordsFromRenderedHtml(html: string) { return cheerio.load(html)('body').text().split(/\s+/).filter(Boolean).length; }
    private extractFaqsFromRenderedHtml(html: string) {
        const $ = cheerio.load(html); const faqs: any[] = [];
        $('.faq-item, details').each((_, el) => { const q = $(el).find('h3, summary').first().text().trim(); const a = $(el).find('.faq-answer, p').last().text().trim(); if (q && a) faqs.push({ q, a }); });
        return faqs.slice(0, 8);
    }

    private buildPostAuditNotes(audit: any) { return [`SCORE: ${audit.score}`, `STATUS: ${audit.status}`, audit.reasoning].filter(Boolean); }

    private generateSoftModeResult(page: RenderedPage, mission: GenerationMission, error: Error, obs: ObservabilityMetadata): PipelineResult {
        return { success: true, data: { html: page.html, html_path: '', word_count: this.countWordsFromRenderedHtml(page.html), score: 0, notes: [`ERROR: ${error.message}`], status: 'error_soft' as any, url: '', h1: this.extractPrimaryH1FromHtml(page.html), faqs: [], metadata: { ...page.metadata, is_soft: true }, observability: obs } };
    }

    private shouldUseSoftMode(mission: GenerationMission) { return this.SOFT_MODE || (mission as any).softMode === true; }

    private async saveLegacyDebugSnapshot(phase: CanonicalPipelinePhaseId, state: PipelineState, extra = {}) {
        const phaseMap: any = { 
            'research': '1', 
            'normalization': '2', 
            'planning': '3', 
            'writing': '4', 
            'correction': '5', 
            'integrity': '6', 
            'enrichment': '7', 
            'seo-contract': '7.5', 
            'assembly': '8', 
            'images': '8.5', 
            'completeness': '8.8',
            'technical-validation': '9',
            'ux-validation': '9.2',
            'quality-gate': '9.5',
            'editorial-validation': '10',
            'delivery': '11',
            'post-deploy-audit': '12'
        };
        if (phaseMap[phase]) await savePhaseArtifact(this.debugArtifactsDir!, phaseMap[phase], state as any, extra);
    }
}
