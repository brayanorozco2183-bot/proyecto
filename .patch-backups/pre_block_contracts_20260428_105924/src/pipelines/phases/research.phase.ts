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

export class ResearchPhase {
    constructor(
        private geointel: GeoIntelAgent,
        private competitorAudit: CompetitorAuditAgent,
        private entityExtractor: EntityExtractorAgent,
        private serpGap: SERPGapAgent,
        private analyst: SEOAnalystAgent
    ) {}

    async run(mission: GenerationMission): Promise<ResearchContext> {
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
        
        // Logic adapted from ContentGenerationPipeline helper methods
        const organicResults = filterUsefulOrganicResults(serpData.organic || [], mission.niche, mission.city, 10).accepted;
        const localPack = serpData.localPack || [];

        console.log(`[Phase 1.3] Competitive Audit & SERP Deep Analysis...`);
        const auditResponse = await this.competitorAudit.execute({ targetLinks: organicResults.map(r => r.link), niche: mission.niche, city: mission.city });
        const deepAudits = filterUsefulCompetitorAudits(Array.isArray(auditResponse?.data) ? auditResponse.data : [], mission.niche, mission.city, Number(process.env.COMPETITOR_AUDIT_LIMIT) || 3).accepted;
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

        const researchQuality = buildResearchQualitySummary({
            organicAccepted: organicResults,
            organicRejected: [], // Simplified for phase extraction
            auditsAccepted: deepAudits,
            auditsRejected: [],
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

        return {
            niche: mission.niche,
            city: mission.city,
            local_nap: mission.local_nap,
            keywords: intentModel.secondaryKeywords,
            entities: intentModel.semanticEntities,
            competitors: organicLeaders,
            serp_gaps: serpGapResponse?.data?.gaps || [],
            market_data: analystData,
            intentModel,
            strategicAnalysis: analystData,
            geoData
        };
    }
}
