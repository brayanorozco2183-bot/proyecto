import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function testLayoutComposer() {
    console.log("🚀 Starting Layout Composer Verification Test (Valencia Demo)...");
    
    const pipeline = new ContentGenerationPipeline();
    
    const mission = {
        niche: 'reformas-de-cocinas',
        city: 'Madrid',
        local_nap: {
            business_name: 'Reformas Madrid Pro',
            address: 'Paseo de la Castellana, 100, 28046 Madrid',
            phone: '910 111 222'
        },
        mode: 'sandbox' as const,
        freezeId: 'layout_test_full',
        missionId: 'test-layout-composer'
    };

    try {
        const result = await pipeline.run(mission);
        
        if (result && result.html) {
            const outputPath = path.join(process.cwd(), 'debug_layout_test.html');
            await fs.writeFile(outputPath, result.html);
            console.log(`✅ Test Successful! HTML saved to: ${outputPath}`);
            
            // Log a portion of the HTML to see class application
            const bodyMatch = result.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
                console.log("--- HTML Body Snippet ---");
                console.log(bodyMatch[1].substring(0, 1000) + "...");
            }

            // Robust validation - check for classes in elements
            const hasShellPanel = /class="[^"]*shell-panel[^"]*"/.test(result.html);
            const hasShellBand = /class="[^"]*shell-band[^"]*"/.test(result.html);
            const hasFlowZigzag = /class="[^"]*flow-zigzag[^"]*"/.test(result.html);
            const hasFlowSplit = /class="[^"]*flow-split[^"]*"/.test(result.html);
            
            console.log("--- Visual Diversity Report ---");
            console.log(`Shell Panel: ${hasShellPanel}`);
            console.log(`Shell Band: ${hasShellBand}`);
            console.log(`Flow Zigzag: ${hasFlowZigzag}`);
            console.log(`Flow Split: ${hasFlowSplit}`);
            
            if (hasShellPanel || hasShellBand || hasFlowZigzag || hasFlowSplit) {
                console.log("✅ Layout Composer is applying structural contracts!");
            } else {
                console.log("⚠️ No new layout classes detected. Check agent output or rendering logic.");
            }
        } else {
            console.error("❌ Pipeline failed to generate HTML.");
        }
    } catch (error) {
        console.error("❌ Test failed with error:", error);
    }
}

testLayoutComposer();
