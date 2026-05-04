import { ContentGenerationPipeline, GenerationMission } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runVerification() {
    console.log("Starting Design Engine Verification...");

    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        niche: "cerrajeria",
        city: "Ruzafa",
        local_nap: {
            business_name: "Cerrajeros Ruzafa Elite",
            address: "Calle de Ruzafa, 12, Valencia",
            phone: "+34 600 000 000"
        },
        cluster_data: {
            geo: [
                { name: "Valencia Centro" },
                { name: "Benicalap" }
            ],
            topical: [
                { name: "Apertura de puertas" },
                { name: "Cambio de bombín" }
            ]
        }
    };

    try {
        const result = await pipeline.run(mission);

        if (result) {
            const outputPath = path.join('output_sites', 'verify_design.html');
            await fs.mkdir('output_sites', { recursive: true });
            await fs.writeFile(outputPath, result.html);

            console.log(`\n✅ Verification successful!`);
            console.log(`📄 Page generated: ${outputPath}`);
            console.log(`📊 Word count: ${result.metadata.totalWords}`);
            console.log(`✨ QA Score: ${result.metadata.qaScore}`);

            // Basic inspection
            const hasArtDirection = result.html.includes('--spacing-section');
            const hasScales = result.html.includes('--radius-card');

            console.log(`🔍 Brand presence check: ${result.html.includes('Cerrajeros Ruzafa Elite')}`);
            console.log(`🔍 Spacing Scale present: ${hasArtDirection}`);
            console.log(`🔍 Radius Scale present: ${hasScales}`);
        } else {
            console.error("❌ Pipeline failed to generate content.");
        }
    } catch (error) {
        console.error("❌ Error during verification:", error);
    }
}

runVerification();
