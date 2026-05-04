import { GeoIntelAgent } from '../../agents/geointel.js';
import { CompetitorAuditAgent } from '../../agents/competitor_audit.js';
import { EntityExtractorAgent } from '../../agents/entityExtractorAgent.js';
import { SERPGapAgent } from '../../agents/serpGapAgent.js';
import { SEOAnalystAgent } from '../../agents/analyst.js';
import { serpManager } from '../../tools/scraper.js';
import {
    filterUsefulOrganicResults,
    filterUsefulCompetitorAudits,
    extractLocalSignalsFromGeo,
    buildResearchQualitySummary
} from '../../utils/researchQuality.js';
import {
    GenerationMission,
    ResearchContext,
    IntentModel
} from '../../types/pipeline_v2.js';
import { resolveResearchConfig } from '../../config/research.js';
import { assertSerpResearchCompleted, buildSerpGateReport } from '../../gates/serpGate.js';
import { saveSerpEvidence } from '../../utils/serpEvidence.js';
import { buildSerpInsights } from '../../utils/serpInsights.js';

export class ResearchPhase {
    constructor(
        private geointel: GeoIntelAgent,
        private competitorAudit: CompetitorAuditAgent,
        private entityExtractor: EntityExtractorAgent,
        private serpGap: SERPGapAgent,
        private analyst: SEOAnalystAgent
    ) {}

    async run(mission: GenerationMission): Promise<ResearchContext> {
        const researchConfig = resolveResearchConfig(mission);
        const hasPrefetchedContext = Boolean(mission.contextual_data?.strategicAnalysis && mission.contextual_data?.marketData);

        if (researchConfig.mode === 'offline_debug' && hasPrefetchedContext) {
            console.log(`[Phase 1] Offline debug: using pre-fetched strategic context. SERP live disabled by research mode.`);
            return this.buildPrefetchedResearchContext(mission, researchConfig);
        }

        console.log(`[Phase 1.1] Geo-Intelligence & Local Mapping...`);
        const geoResponse = await this.geointel.execute({ root_location: mission.city, scope: 'auto' });
        const geoData = geoResponse?.success ? {
            neighborhoods: geoResponse.data?.neighborhoods || [],
            sub_locations: geoResponse.data?.sub_locations || []
        } : { neighborhoods: [], sub_locations: [] };

        console.log(`[Phase 1.2] SERP Research (${researchConfig.mode})...`);
        const serpQuery = `${mission.niche} ${mission.city}`.trim();
        const serpStartedAt = new Date().toISOString();
        let serpData: { organic: any[]; localPack: any[] } = { organic: [], localPack: [] };
        let serpError: string | undefined;

        if (researchConfig.mode !== 'offline_debug') {
            try {
                serpData = await serpManager.scrapeUnifiedSERP(mission.niche, mission.city);
            } catch (error: any) {
                serpError = error?.message || String(error);
                console.warn(`[SERP] Failed: ${serpError}`);
            }
        } else {
            console.log(`[SERP] Skipped: offline_debug mode.`);
        }

        const filteredOrganic = filterUsefulOrganicResults(serpData.organic || [], mission.niche, mission.city, 10);
        const organicResults = filteredOrganic.accepted;
        const localPack = serpData.localPack || [];

        console.log(`[SERP] query="${serpQuery}" provider=${researchConfig.provider} organic=${organicResults.length} localPack=${localPack.length}`);

        let deepAudits: any[] = [];
        if (organicResults.length) {
            console.log(`[Phase 1.3] Competitive Audit & SERP Deep Analysis...`);
            const auditResponse = await this.competitorAudit.execute({
                targetLinks: organicResults.map(r => r.link),
                niche: mission.niche,
                city: mission.city
            });
            deepAudits = filterUsefulCompetitorAudits(
                Array.isArray(auditResponse?.data) ? auditResponse.data : [],
                mission.niche,
                mission.city,
                Number(process.env.COMPETITOR_AUDIT_LIMIT) || 3
            ).accepted;
        } else {
            console.log(`[Phase 1.3] Competitive Audit skipped: no organic SERP results.`);
        }

        const serpAttempted = researchConfig.mode !== 'offline_debug';
        const serpExecuted = serpAttempted && !serpError;

        const serpEvidenceBase = {
            attempted: serpAttempted,
            executed: serpExecuted,
            provider: researchConfig.provider,
            mode: researchConfig.mode,
            query: serpQuery,
            city: mission.city,
            niche: mission.niche,
            organicResults,
            competitors: deepAudits,
            localPack,
            timestamp: serpStartedAt,
            error: serpError
        };

        const gateProbeContext: Partial<ResearchContext> = {
            competitors: organicResults,
            serp_evidence: serpEvidenceBase as any,
            researchConfig
        };
        const serpGateReport = buildSerpGateReport(gateProbeContext, researchConfig);
        if (serpGateReport.fallbackUsed) {
            console.warn("[SERP_GATE] fallback status=" + serpGateReport.status + " reason=\"" + (serpGateReport.reason || "sin detalles") + "\"");
        }

        let evidenceDir: string | undefined;
        let evidenceFiles: string[] | undefined;
        if (researchConfig.saveEvidence) {
            const saved = saveSerpEvidence(mission, {
                raw: serpData,
                competitors: deepAudits,
                summary: {
                    attempted: serpEvidenceBase.attempted,
                    executed: serpEvidenceBase.executed,
                    status: serpGateReport.status,
                    fallbackUsed: serpGateReport.fallbackUsed,
                    fallbackReason: serpGateReport.reason || null,
                    provider: serpEvidenceBase.provider,
                    mode: serpEvidenceBase.mode,
                    query: serpEvidenceBase.query,
                    city: serpEvidenceBase.city,
                    niche: serpEvidenceBase.niche,
                    organicResultsCount: organicResults.length,
                    competitorsFetched: deepAudits.length,
                    localPackCount: localPack.length,
                    timestamp: serpEvidenceBase.timestamp,
                    error: serpError || null
                },
                researchMarkdown: this.buildResearchEvidenceMarkdown(mission, serpQuery, organicResults, deepAudits, researchConfig.mode)
            });
            evidenceDir = saved.dir;
            evidenceFiles = saved.files;
        }

        const serpInsights = buildSerpInsights({
            organicResults,
            deepAudits,
            niche: mission.niche,
            city: mission.city
        });

        assertSerpResearchCompleted({
            competitors: organicResults,
            serp_evidence: { ...serpEvidenceBase, evidenceDir, evidenceFiles } as any,
            researchConfig
        }, researchConfig);

        console.log(`[Phase 1.4] Entity Extraction & Niche Knowledge...`);
        const entityResponse = await this.entityExtractor.execute({
            keyword: mission.niche,
            serpData: { organic: organicResults, audits: deepAudits }
        });
        const geoSignals = extractLocalSignalsFromGeo(geoData);
        const entities = Array.from(new Set([...(entityResponse?.data?.entities || []), ...geoSignals]));

        console.log(`[Phase 1.5] Identifying Content Gaps & Opportunities...`);
        const serpGapResponse = await this.serpGap.execute({ keyword: mission.niche, audits: deepAudits });
        const serpGaps = serpGapResponse?.data?.missing_topics || [];
        const enrichedSerpInsights = buildSerpInsights({
            organicResults,
            deepAudits,
            niche: mission.niche,
            city: mission.city,
            serpGaps
        });

        console.log(`[Phase 1.6] Strategic Intelligence Synthesis...`);
        const analystResponse = await this.analyst.execute({
            niche: mission.niche,
            city: mission.city,
            marketData: { localPack: localPack, organicLeaders: organicResults, deepAudits: deepAudits, serpInsights: enrichedSerpInsights }
        });

        const researchQuality = buildResearchQualitySummary({
            acceptedOrganic: organicResults,
            rejectedOrganic: filteredOrganic.rejected || [],
            acceptedAudits: deepAudits,
            rejectedAudits: [],
            geoSignals
        });

        const prefetchedStrategic = mission.contextual_data?.strategicAnalysis || {};
        const analystData = {
            ...(hasPrefetchedContext ? prefetchedStrategic : {}),
            ...(analystResponse?.data || {}),
            entities: Array.from(new Set([...((analystResponse?.data?.entities) || []), ...geoSignals])),
            researchQuality,
            serpInsights: enrichedSerpInsights,
            researchMode: researchConfig.mode
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
            mandatoryTrustElements: analystData.trustAssets || ['contacto claro', 'cobertura local prudente'],
            mandatorySections: Array.from(new Set([...(analystData.contentAngles || []), ...(enrichedSerpInsights.contentAngles || [])])),
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
            competitors: organicResults,
            serp_gaps: serpGaps,
            market_data: analystData,
            intentModel,
            strategicAnalysis: analystData,
            geoData,
            serp_evidence: {
                ...serpEvidenceBase,
                status: serpGateReport.status,
                fallbackUsed: serpGateReport.fallbackUsed,
                fallbackReason: serpGateReport.reason,
                evidenceDir,
                evidenceFiles
            } as any,
            serpInsights: enrichedSerpInsights,
            researchConfig
        };
    }

    private buildPrefetchedResearchContext(mission: GenerationMission, researchConfig: ReturnType<typeof resolveResearchConfig>): ResearchContext {
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
            mandatoryTrustElements: analystData.mandatoryTrustElements || analystData.trustAssets || ['contacto claro', 'cobertura local prudente'],
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
            geoData: { neighborhoods: [], sub_locations: [] },
            serp_evidence: {
                attempted: false,
                executed: false,
                status: "skipped",
                fallbackUsed: true,
                fallbackReason: "offline_debug con contexto prefetched",
                provider: researchConfig.provider,
                mode: researchConfig.mode,
                query: `${mission.niche} ${mission.city}`.trim(),
                organicResults: [],
                competitors: [],
                localPack: [],
                timestamp: new Date().toISOString()
            },
            serpInsights: buildSerpInsights({
                organicResults: Array.isArray(marketData.organicLeaders) ? marketData.organicLeaders : [],
                deepAudits: Array.isArray(marketData.deepAudits) ? marketData.deepAudits : [],
                niche: mission.niche,
                city: mission.city
            }),
            researchConfig
        };
    }

    private buildResearchEvidenceMarkdown(mission: GenerationMission, query: string, organicResults: any[], deepAudits: any[], mode: string): string {
        const urls = organicResults.map((result, index) => `${index + 1}. ${result?.link || result?.title || 'resultado sin URL'}`).join('\n');
        const audited = deepAudits.map((audit, index) => `${index + 1}. ${audit?.url || audit?.title || 'competidor sin URL'}`).join('\n');
        return `# SERP Evidence\n\n- Nicho: ${mission.niche}\n- Ciudad: ${mission.city}\n- Query: ${query}\n- Modo: ${mode}\n- Resultados orgánicos: ${organicResults.length}\n- Competidores auditados: ${deepAudits.length}\n\n## URLs orgánicas\n\n${urls || 'Sin resultados orgánicos.'}\n\n## Competidores auditados\n\n${audited || 'Sin auditorías de competidores.'}\n`;
    }
}
