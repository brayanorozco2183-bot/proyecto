import { ContentArchitectAgent } from '../agents/architect.js';
import { IntentModel } from '../types/pipeline_v2.js';

async function testArchitect() {
    const architect = new ContentArchitectAgent();
    const intentModel: IntentModel = {
        pageType: 'service',
        primaryIntent: 'commercial',
        primaryKeyword: '{{NICHE}}',
        secondaryKeywords: [],
        semanticEntities: [],
        serpFeaturesTarget: [],
        mandatoryTrustElements: [],
        mandatorySections: [],
        internalLinkTargets: [],
        conversionGoal: 'call',
        funnelStage: 'BOFU'
    };

    const result = await architect.execute({
        niche: '{{NICHE}}',
        city: 'Valencia',
        silo_structure: [],
        word_count_target: 2000,
        entities: [],
        intentModel
    });

    console.log(JSON.stringify(result.data, null, 2));
}

testArchitect().catch(console.error);
