import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';
import { AuditSentinel } from '../src/utils/auditSentinel.js';

async function runCarpinterosTest() {
    const pipeline = new ContentGenerationPipeline();
    
    const mission: GenerationMission = {
        missionId: 'carpinteros-madrid-test',
        niche: 'carpinteros',
        city: 'Madrid',
        local_nap: {
            business_name: 'Carpinteros Madrid Expertos',
            address: 'Paseo de la Castellana, 100, Madrid',
            phone: '913456789'
        },
        mode: 'production',
        debugMode: true,
        clusterFolderName: 'carpinteros-madrid-test'
    };

    console.log('🚀 [START] Niche Versatility Test: Carpinteros Madrid...');
    
    try {
        const result = await (pipeline as any).run(mission);

        if (result.success) {
            console.log('✅ Mission Phase Completion Successful.');
            const renderedPage = (pipeline as any).lastRenderedPage;
            if (renderedPage) {
                const auditReport = await AuditSentinel.audit(renderedPage, mission);
                console.log(`PASS: ${auditReport.passed ? '✅ YES' : '❌ NO'}`);
                console.log(`Score: ${auditReport.qualityScore || 'N/A'}`);
            }
        } else {
            console.error('❌ Pipeline failed:', result.error);
        }
    } catch (err) {
        console.error('💥 Fatal Crash:', err);
    }
}

runCarpinterosTest();
