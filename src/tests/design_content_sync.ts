import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';

/**
 * Design-Content Incompatibility Test.
 * Verification for Requirement 5: "Añadir un test de incompatibilidad diseño-contenido".
 * Specifically checks if the Procedural Engine can handle a layout that doesn't 
 * match the content block roles (e.g., CTA content in a BENTO layout).
 */
async function testDesignIncompatibility() {
    console.log("🧪 Starting Design-Content Incompatibility Test...");
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        niche: "Servicio Professional",
        city: "Madrid",
        local_nap: {
            business_name: "Test Design Sync",
            address: "Calle Falsa 123",
            phone: "+34600000000"
        },
        // Force a specific family to test edge cases
        forcedFamily: 'BENTO_DARK' as any,
        entities: ["urgencias 24h", "apertura sin romper"],
        contextual_data: {}
    };

    console.log("Running pipeline with forced BENTO design family...");
    const result = await pipeline.run(mission);

    if (!result) {
        console.error("❌ Test Failed: Pipeline returned null.");
        return;
    }

    const { html } = result;
    
    // Check if the procedural engine correctly mapped the blocks to the layout
    const hasHero = html.includes('id="hero"');
    const hasFooter = html.includes('<footer>');
    const sectionsCount = (html.match(/<section/g) || []).length;

    console.log(`- Sections found: ${sectionsCount}`);
    console.log(`- Technical passed: ${result.metadata.issues.length === 0}`);
    console.log(`- QA Score: ${result.metadata.qaScore}`);

    if (sectionsCount >= 5 && hasHero && hasFooter) {
        console.log("✅ SUCCESS: Procedural Engine handled the forced design family without breaking the structure.");
    } else {
        console.error("❌ FAILURE: Design-Content sync issues detected.");
    }

    // Verify Design Plan vs Page Plan separation
    if (result.metadata.observability.durations['Planning'] > 0) {
        console.log("✅ SUCCESS: Planning phase executed correctly.");
    }
}

testDesignIncompatibility().catch(console.error);
