import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function runGetafeTest() {
    const pipeline = new ContentGenerationPipeline();
    
    const mission: GenerationMission = {
        missionId: 'getafe-final-test',
        niche: 'cerrajeros',
        city: 'Getafe',
        local_nap: {
            business_name: 'Cerrajeros Getafe Express',
            address: 'Calle Mayor, 10, Getafe',
            phone: '910000000'
        },
        mode: 'production',
        debugMode: true
    };

    console.log('🚀 Starting Final Verification Mission: Cerrajeros Getafe...');
    const result = await (pipeline as any).run(mission);

    if (result.success) {
        console.log('✅ Mission Success!');
        console.log('Output Site:', result.data?.outputDir);
    } else {
        console.error('❌ Mission Failed:', result.error);
        if (result.data?.metadata?.validation_errors) {
            console.error('Validation Errors:', result.data.metadata.validation_errors);
        }
    }
}

runGetafeTest().catch(console.error);
