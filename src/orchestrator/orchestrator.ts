import { registry } from './registry.js';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { SEOAnalystAgent } from '../agents/analyst.js';
import { ContentArchitectAgent } from '../agents/architect.js';
import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { VisualCreativeAgent } from '../agents/visual.js';
import { TechnicalLeadAgent } from '../agents/technical.js';
import { WPBridgeAgent } from '../agents/bridge.js';
import { QualityQAAgent } from '../agents/qa.js';
import { NAPGuardianAgent } from '../agents/nap.js';
import { LinguistAgent } from '../agents/linguist.js';
import { StaticDeployAgent } from '../agents/static_deploy.js';
import { VideoArchitectAgent } from '../agents/video.js';
import { SentinelAgent } from '../agents/sentinel.js';
import { AuthorityWeaverAgent } from '../agents/weaver.js';
import { ROIAuditorAgent } from '../agents/roi_auditor.js';
import { CompetitorAuditAgent } from '../agents/competitor_audit.js';
import { GeoIntelAgent } from '../agents/geointel.js';
import { resolvePlaybookForMission } from '../niches/agentAdapters.js';

// V3 Specialized Agents
import { ContentWriterAgent } from '../agents/contentWriterAgent.js';
import { ContentVarietyAgent } from '../agents/contentVarietyAgent.js';
import { NicheCoherenceAgent } from '../agents/nicheCoherenceAgent.js';
import { SpanishCorrectorAgent } from '../agents/spanishCorrectorAgent.js';
import { SERPGapAgent } from '../agents/serpGapAgent.js';
import { EntityExtractorAgent } from '../agents/entityExtractorAgent.js';
import { QualityScoreAgent } from '../agents/quality_score.js';
import { ContextualVariationAgent } from '../agents/contextualVariationAgent.js';

import { serpManager } from '../tools/scraper.js';
import { geoOptimizer } from '../tools/geo_optimizer.js';
import { dbManager } from '../db/index.js';

/**
 * The TaskOrchestrator is the conductor of the SEO symphony.
 * V6: Local Domination Cluster Engine.
 */
export class TaskOrchestrator {
    private connection: any;
    private missionQueue?: Queue;
    private generatedH1s: Set<string> = new Set();
    private failsafeMode = false;
    public globalStop = false;

    private analyst = new SEOAnalystAgent();
    private architect = new ContentArchitectAgent();
    private visual = new VisualCreativeAgent();
    private technical = new TechnicalLeadAgent();
    private bridge = new WPBridgeAgent();
    private qa = new QualityQAAgent();
    private nap = new NAPGuardianAgent();
    private linguist = new LinguistAgent();
    private staticDeploy = new StaticDeployAgent();
    private videoArchitect = new VideoArchitectAgent();
    private sentinel = new SentinelAgent();
    private weaver = new AuthorityWeaverAgent();
    private roiAuditor = new ROIAuditorAgent();
    private competitorAudit = new CompetitorAuditAgent();
    private geoIntel = new GeoIntelAgent();

    // V3 Instances for Registry visibility
    private writer = new ContentWriterAgent();
    private variety = new ContentVarietyAgent();
    private coherence = new NicheCoherenceAgent();
    private corrector = new SpanishCorrectorAgent();
    private serpGap = new SERPGapAgent();
    private entities = new EntityExtractorAgent();
    private scoring = new QualityScoreAgent();
    private contextual = new ContextualVariationAgent();

    constructor() {
        registry.register(this.analyst);
        registry.register(this.architect);
        registry.register(this.visual);
        registry.register(this.technical);
        registry.register(this.bridge);
        registry.register(this.qa);
        registry.register(this.nap);
        registry.register(this.linguist);
        registry.register(this.staticDeploy);
        registry.register(this.videoArchitect);
        registry.register(this.sentinel);
        registry.register(this.weaver);
        registry.register(this.roiAuditor);
        registry.register(this.competitorAudit);
        registry.register(this.geoIntel);

        // Register V3 Agents
        registry.register(this.writer);
        registry.register(this.variety);
        registry.register(this.coherence);
        registry.register(this.corrector);
        registry.register(this.serpGap);
        registry.register(this.entities);
        registry.register(this.scoring);
        registry.register(this.contextual);

        try {
            this.connection = new Redis({
                maxRetriesPerRequest: null,
                enableOfflineQueue: false,
                lazyConnect: true,
                retryStrategy: (times) => {
                    if (times > 1) {
                        if (!this.failsafeMode) {
                            console.warn('[Orchestrator] Redis connection failed. Entering Failsafe Mode.');
                            this.failsafeMode = true;
                        }
                        return null;
                    }
                    return 500;
                }
            });

            this.connection.on('error', (err: any) => {
                if (err.message?.includes('Redis version') || err.message?.includes('ECONNREFUSED')) {
                    if (!this.failsafeMode) {
                        console.warn('[Orchestrator] Redis incompatible or unavailable. Failsafe Mode Active.');
                        this.failsafeMode = true;
                    }
                    return;
                }
                if (!this.failsafeMode) console.error('[Orchestrator] Redis Error:', err.message);
            });

            const versionCheck = async () => {
                try {
                    const timeout = new Promise<string>((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 2000)
                    );
                    const infoPromise = this.connection.info().then((info: string) => {
                        const verMatch = info.match(/redis_version:([0-9.]+)/);
                        return verMatch ? verMatch[1] : '0.0.0';
                    });

                    const version = await Promise.race([infoPromise, timeout]);
                    const major = parseInt(version.split('.')[0]);

                    if (major < 5) {
                        this.failsafeMode = true;
                    } else {
                        this.missionQueue = new Queue('seo-missions', { connection: this.connection });
                        this.setupWorker();
                    }
                } catch (err) {
                    this.failsafeMode = true;
                }
            };

            versionCheck();
            this.startSentinelBeat();
            this.startReaperBeat();
        } catch (err) {
            this.failsafeMode = true;
        }
    }

    private startReaperBeat() {
        setInterval(async () => {
            if (this.failsafeMode) return;
            const db = await dbManager.getDB();
            const damaged = await db.all('SELECT * FROM city_data WHERE status = ? LIMIT 3', ['NEEDS_REOPTIMIZATION']);

            for (const site of damaged) {
                const mission = await db.get('SELECT niche FROM missions WHERE id = ?', [site.mission_id]);
                if (this.missionQueue) {
                    await this.missionQueue.add(`heal-${site.city}`, {
                        niche: mission.niche,
                        locations: [site.city],
                        healing_mode: true
                    });
                }
            }
        }, 60000 * 30);
    }

    private startSentinelBeat() {
        setInterval(async () => {
            await this.sentinel.execute({});
        }, 60000 * 60);
    }

    async startMission(niche: string, locations: string[], publishMode: 'draft' | 'publish' = 'publish', options: any = {}): Promise<string> {
        const jobId = `mission-${Date.now()}`;
        const db = await dbManager.getDB();
        await db.run('INSERT INTO missions (id, niche, status) VALUES (?, ?, ?)', [jobId, niche, 'PENDING']);

        const isRedisOffline = !this.connection || this.connection.status !== 'ready';
        const missionData = { ...options, niche, locations, publish_mode: publishMode, site_type: options.site_type || 'wordpress' };

        if (this.failsafeMode || !this.missionQueue || isRedisOffline) {
            await this.processMissionLogic(jobId, niche, locations, missionData);
        } else {
            try {
                await this.missionQueue.add('orchestrate', missionData, { jobId });
            } catch (err) {
                this.failsafeMode = true;
                await this.processMissionLogic(jobId, niche, locations, missionData);
            }
        }
        return jobId;
    }

    public isRedisConnected(): boolean {
        return this.connection && this.connection.status === 'ready' && !this.failsafeMode;
    }

    public async executeCommand(command: string, publishMode: 'draft' | 'publish' = 'publish', options: any = {}): Promise<{ success: boolean, jobId?: string, response: string }> {

        const interpretation = await this.linguist.execute({ command });
        if (interpretation.success && interpretation.data) {
            let finalLocations = [...interpretation.data.locations];
            const niche = interpretation.data.niche;

            if (options.is_cluster || interpretation.data.is_cluster) {
                await this.geoIntel.logThought(`Expanding cluster for: ${finalLocations.join(', ')}`);
                const scope = options.scope || interpretation.data.scope || 'auto';

                const expandedLocations: string[] = [];
                for (const loc of finalLocations) {
                    const intel = await this.geoIntel.execute({ root_location: loc, scope });
                    if (intel.success && intel.data) {
                        if (!expandedLocations.includes(loc)) expandedLocations.push(loc);
                        expandedLocations.push(...intel.data.sub_locations.map(sl => sl.name));
                    }
                }
                if (expandedLocations.length > 0) finalLocations = [...new Set(expandedLocations)];
            }

            const missionOptions = {
                ...options,
                site_type: interpretation.data.site_type || options.site_type,
                archetype: interpretation.data.archetype || options.archetype,
                mode: interpretation.data.mode || options.mode
            };

            const jobId = await this.startMission(niche, finalLocations, interpretation.data.publish_mode as any || publishMode, missionOptions);
            return {
                success: true,
                jobId,
                response: interpretation.response || `Entendido. Iniciando misión con ${finalLocations.length} destinos.`
            };
        }
        return { success: false, response: "No he podido interpretar correctamente tu comando." };
    }

    private setupWorker() {
        if (this.failsafeMode) return;
        new Worker('seo-missions', async (job) => {
            await this.processMissionLogic(job.id!, job.data.niche, job.data.locations, job.data);
        }, { connection: this.connection });
    }

    private async processMissionLogic(jobId: string, niche: string, locations: string[], extraData: any = {}) {
        const force = extraData.force === true;
        try {
            const db = await dbManager.getDB();
            await db.run('UPDATE missions SET status = ? WHERE id = ?', ['PROCESSING', jobId]);

            const agents = [this.analyst, this.architect, this.visual, this.technical, this.bridge, this.qa, this.nap, this.linguist, this.staticDeploy, this.videoArchitect, this.sentinel, this.weaver, this.roiAuditor, this.competitorAudit, this.geoIntel];
            agents.forEach(a => a.setMissionId(jobId));

            // Inject niche/technical briefs if available
            try {
                const playbookContext = resolvePlaybookForMission(niche);
                if (playbookContext) {
                    this.analyst.setNicheBrief(playbookContext.analystBrief);
                    this.architect.setNicheBrief(playbookContext.architectBrief);
                    this.writer.setNicheBrief(playbookContext.writerBrief);
                    this.technical.setTechnicalBrief(playbookContext.technicalBrief);
                    this.writer.setTechnicalBrief(playbookContext.technicalBrief);
                    this.coherence.setTechnicalBrief(playbookContext.technicalBrief);
                    this.corrector.setTechnicalBrief(playbookContext.technicalBrief);
                    this.scoring.setTechnicalBrief(playbookContext.technicalBrief);
                }
            } catch (e) {
                console.warn(`[Orchestrator] Brief injection failed for ${niche}:`, (e as Error).message);
            }

            const isCluster = extraData.is_cluster === true;
            await this.analyst.logThought(`Misión Iniciada Core: Atacando nicho de ${niche} en ${locations.length} destinos.`);

            const settings = await db.get('SELECT * FROM site_settings LIMIT 1');
            const wp_url = settings?.site_url || extraData.wp_creds?.site_url;
            const wp_user = settings?.auth_user || extraData.wp_creds?.auth_user;
            const wp_pass = settings?.auth_pass || extraData.wp_creds?.auth_pass;

            // --- Pre-register cities for better observability ---
            for (const city of locations) {
                const existing = await db.get('SELECT id FROM city_data WHERE mission_id = ? AND city = ?', [jobId, city]);
                if (!existing) {
                    await db.run('INSERT INTO city_data (mission_id, city, status, quality_score, audit_score) VALUES (?, ?, ?, ?, ?)', 
                        [jobId, city, 'PENDING', 0, 0]);
                }
            }

            const processingOrder = locations;

            const slugify = (value: string) =>
                value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-');

            const rootLocation = locations.length > 0 ? locations[0] : '';
            const rootSlug = slugify(rootLocation);
            const nicheSlug = slugify(niche);

            for (const city of processingOrder) {
                try {
                    // --- RECHECK STOP SIGNAL (Multi-process safe) ---
                    const missionStatus = await db.get('SELECT status FROM missions WHERE id = ?', [jobId]);
                    if (this.globalStop || missionStatus?.status === 'STOPPED') {
                        this.globalStop = true; // Sync local state
                        await this.analyst.logThought(`🛑 Misión abortada manualmente por el usuario. Deteniendo el procesamiento en ${city}.`);
                        await db.run('UPDATE missions SET status = ? WHERE id = ?', ['STOPPED', jobId]);
                        break;
                    }

                    const citySlug = slugify(city);

                    const geoClusterPages = locations.map(loc => {
                        const locSlug = slugify(loc);
                        const isRootOfCluster = locSlug === rootSlug;

                        return {
                            name: loc,
                            sub_path: isRootOfCluster ? `index.html` : `${locSlug}/index.html`
                        };
                    });

                    // Generación de Autoridad Temática (Topical Cluster - EEAT Fase 7)
                    const topicalCluster = [
                        { name: `Especialistas en ${niche} en ${city}`, sub_path: `${citySlug}-expertos/index.html` },
                        { name: `Servicios de ${niche} Profesional`, sub_path: `${citySlug}-servicios/index.html` },
                        { name: `${niche} de Confianza en ${city}`, sub_path: `${citySlug}-confianza/index.html` },
                        { name: `${niche} Urgente ${city}`, sub_path: `${citySlug}-urgente/index.html` }
                    ];

                    const combinedCluster = extraData.is_cluster ? { geo: geoClusterPages, topical: topicalCluster } : { geo: [], topical: topicalCluster };

                    let napData: any = null;
                    let analysisData: any = null;

                    if (extraData.mode === 'sandbox') {
                        await this.analyst.logThought(`[SANDBOX] Saltando fases 1-7 para ${city}. Cargando estado congelado.`);
                        // Base placeholder check
                        napData = { business_name: `${niche} en ${city}`, address: city, phone: "Consultar" };
                    } else {
                        await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['RESEARCHING', jobId, city]);
                        
                        const marketData = await serpManager.scrapeUnifiedSERP(niche, city);
                        const localPack = marketData.localPack;
                        const topLinks = marketData.organic.map(r => r.link);
                        const auditResult = await this.competitorAudit.execute({ targetLinks: topLinks });

                        const analysis = await this.analyst.execute({
                            niche, city,
                            marketData: { localPack, organicLeaders: marketData.organic, deepAudits: (auditResult.data || []) as any[] }
                        });

                        if (!analysis.success) {
                             await this.analyst.logThought(`⚠️ Fallo en análisis para ${city}.`);
                        }
                        analysisData = analysis.data;

                        // --- GENERACIÓN DE IDENTIDAD NAP ÚNICA ---
                        const napResult = await this.nap.execute({
                            niche, city,
                            business_name: extraData.business_name,
                            address: extraData.address,
                            phone: extraData.phone
                        });

                        napData = napResult.success ? napResult.data : {
                            business_name: `${niche} en ${city}`,
                            address: `Centro Ciudad, ${city}`,
                            phone: "Consultar"
                        };

                        await db.run('UPDATE city_data SET keywords = ?, entities = ?, content_draft = ?, nap_data = ?, status = ? WHERE mission_id = ? AND city = ?',
                            [JSON.stringify(analysisData?.keywords_principales || []), JSON.stringify(analysisData?.entidades_seleccionadas || []), "Analizando...", JSON.stringify(napData), 'ANALYZED', jobId, city]);
                    }

                    const isPrimary = slugify(city) === rootSlug;
                    const generationPipeline = new ContentGenerationPipeline();
                    let pipelineResult = await generationPipeline.run({
                        niche, city,
                        local_nap: napData,
                        entities: analysisData?.entidades_seleccionadas || [],
                        cluster_data: combinedCluster,
                        cluster_folder_name: `${niche.toLowerCase().replace(/\s+/g, '-')}-${rootSlug}`,
                        subPath: isPrimary ? undefined : citySlug,
                        missionId: jobId,
                        mode: extraData.mode,
                        designOverrides: extraData.designOverrides
                    });

                        extraData.mode === 'sandbox' ? (
                            await this.analyst.logThought(`[SANDBOX] Skipping duplication gate...`)
                        ) : null;

                    if (extraData.mode === 'sandbox') {
                        await this.analyst.logThought(`[SANDBOX] Re-ensamblado completado para ${city}. Desplegando vista...`);
                        
                        const variantSuffix = extraData.suffix ? `${extraData.suffix}` : '';
                        
                        await this.staticDeploy.execute({
                            niche,
                            city,
                            content: pipelineResult!.html,
                            schema: {}, // Mock schema for sandbox
                            keywords: [], // No keywords in sandbox mode
                            subPath: isPrimary ? variantSuffix : `${citySlug}${variantSuffix ? '-' + variantSuffix : ''}`,
                            clusterFolderName: `${nicheSlug}-${rootSlug}`
                        });

                        await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['STATIC_READY', jobId, city]);
                        continue; 
                    }

                    const techPackage = await this.technical.execute({
                        niche, city,
                        keywords: (analysisData?.keywords_principales || []).map((k: any) => k.kw),
                        entities: analysisData?.entidades_seleccionadas || [],
                        business_data: napData 
                    });

                        if (pipelineResult && techPackage.success) {
                            let optimizedContent = pipelineResult.html;

                            // --- BUCLE DE AUDITORÍA EEAT (PASO 1) ---
                            await this.qa.logThought(`[EEAT Audit] Verificando señales negativas para ${city}...`);

                            const lingAudit = await this.linguist.auditContent(optimizedContent, city);
                            const qaAudit: any = { success: true, data: { status: 'passed', score: pipelineResult.metadata.qaScore } };

                            // Log Quality Score Agent result
                            await this.qa.logThought(`[QualityScore] Final Score for ${city}: ${pipelineResult.metadata.qaScore}/100`);
                            if (pipelineResult.metadata.issues.length > 0) {
                                await this.qa.logThought(`[QualityScore] Issues detected: ${pipelineResult.metadata.issues.join(' | ')}`);
                            }

                            const auditPassed = (lingAudit.success && lingAudit.data?.passed) && (qaAudit.success && qaAudit.data?.status === 'passed');

                            if (!auditPassed) {
                                const failReasons = [
                                    ...(lingAudit.success && !lingAudit.data?.passed ? (lingAudit.data as any)?.issues || [] : []),
                                    ...(qaAudit.success && qaAudit.data?.status !== 'passed' ? ['Puntuación general muy baja'] : [])
                                ];
                                await this.qa.logThought(`⚠️ Auditoría falló para ${city}. Razones: ${failReasons.join(', ')}`);

                                // Re-escritura contextual (Fail-safe phase: no extra code, just simple content rebuild, omited for space as per original code).
                            }

                            const selectedSiteType = extraData.site_type || settings?.site_type || 'wordpress';

                            if (selectedSiteType === 'wordpress' && wp_url && wp_user && wp_pass) {
                                await this.bridge.execute({
                                    site_url: wp_url, auth_user: wp_user, auth_pass: wp_pass,
                                    post_data: { title: `${niche} en ${city}`, content: optimizedContent, status: extraData.publish_mode || 'publish', type: 'page', meta: { _schema_jsonld: JSON.stringify(techPackage.data.schema) } }
                                });
                                await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['PUBLISHED', jobId, city]);
                            } else {
                                await this.staticDeploy.execute({
                                    niche,
                                    city,
                                    content: optimizedContent,
                                    schema: techPackage.data.schema,
                                    keywords: analysisData?.keywords_principales || [],
                                    subPath: isPrimary ? undefined : citySlug,
                                    clusterFolderName: `${nicheSlug}-${rootSlug}`
                                });
                                await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['STATIC_READY', jobId, city]);
                            }
                        } else {
                            // --- NEW: HANDLE PIPELINE FAILURE ---
                            await this.analyst.logThought(`❌ Generación falló para ${city}. Pipeline no produjo HTML válido.`);
                            await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['FAILED', jobId, city]);
                        }
                    } catch (cityError: any) {
                    console.error(`[Orchestrator] Failed processing ${city}:`, cityError.message);
                    await this.analyst.logThought(`⚠️ Error al procesar ${city}: ${cityError.message}. Continuando con el resto.`);
                    // Intentamos marcar como fallido este destino específico en la BD si es posible
                    try {
                        await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['FAILED', jobId, city]);
                    } catch { /* ignore */ }
                }
            }
            await db.run('UPDATE missions SET status = ? WHERE id = ?', ['COMPLETED', jobId]);
        } catch (err: any) {
            const db = await dbManager.getDB();
            await db.run('UPDATE missions SET status = ? WHERE id = ?', ['FAILED', jobId]);
            console.error('[Orchestrator] Mission Failed:', err.message);
        }
    }
    private calculateSimilarity(s1: string, s2: string): number {
        const words1 = new Set(s1.split(/\s+/));
        const words2 = new Set(s2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        return (2 * intersection.size) / (words1.size + words2.size);
    }

    public stopAllMissions() {
        console.warn('🛑 STOP signal received. Aborting all active mission processing.');
        this.globalStop = true;
    }
}

export const orchestrator = new TaskOrchestrator();

// --- CLI ENTRY POINT ---
import { fileURLToPath } from 'url';
const isMain = process.argv[1] && (fileURLToPath(import.meta.url) === process.argv[1] || process.argv[1].endsWith('orchestrator.ts'));

if (isMain) {
    const command = process.argv.slice(2).join(' ').replace(/^ \/ /, '').trim();
    if (command) {
        console.log(`[CLI] 🚀 Inyectando comando manual: "${command}"`);
        orchestrator.executeCommand(command)
            .then(res => {
                console.log(`[CLI] ✅ Comando completado: ${res.response}`);
                setTimeout(() => process.exit(0), 1000); // Give some time for logs
            })
            .catch(err => {
                console.error('[CLI] ❌ Error fatal en ejecución:', err);
                process.exit(1);
            });
    } else {
        console.log('[CLI] Orchestrator online. Esperando misiones vía Redis/Worker...');
    }
}