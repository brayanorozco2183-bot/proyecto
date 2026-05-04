import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function runSmokeTest() {
    console.log("=== GRAVITY PRODUCTION SMOKE TEST ===");
    const pipeline = new ContentGenerationPipeline();
    
    const args = process.argv.slice(2);
    const targetNiche = args[0] || 'electricistas';
    const targetCity = args[1] || 'Alicante';

    const mission: GenerationMission = {
        missionId: `smoke-test-${targetCity.toLowerCase()}`,
        niche: targetNiche,
        city: targetCity,
        local_nap: {
            business_name: `${targetNiche.charAt(0).toUpperCase() + targetNiche.slice(1)} ${targetCity} Pro`,
            address: `Calle Mayor 1, ${targetCity}`,
            phone: '600000000'
        },
        debugMode: true,
        contextual_data: {
            wordCountTarget: 1200
        }
    };

    try {
        const result = await pipeline.run(mission);
        console.log("RESULTADO:", JSON.stringify(result, null, 2));
        if (result?.success) {
            console.log("✅ SMOKE TEST PASSED");
        } else {
            console.log("❌ SMOKE TEST FAILED");
        }
    } catch (error) {
        console.error("💥 CRITICAL ERROR DURING SMOKE TEST:", error);
    }
}

runSmokeTest();
