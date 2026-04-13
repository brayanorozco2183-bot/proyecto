
import { ContentGenerationPipeline, GenerationMission } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function testRuzafa() {
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        niche: "Cerrajeros",
        city: "Ruzafa, Valencia",
        local_nap: {
            business_name: "Cerrajería Elite Ruzafa",
            address: "Carrer de Russafa, 46006 Valencia",
            phone: "960 123 456"
        },
        entities: ["Mercado de Ruzafa", "Parroquia de San Valero"],
        cluster_data: {
            geo: [
                { name: "Benimaclet", sub_path: "benimaclet" },
                { name: "El Carmen", sub_path: "el-carmen" },
                { name: "Colon", sub_path: "colon" }
            ],
            topical: [
                { name: "Apertura de Puertas" },
                { name: "Cambio de Cerraduras" }
            ]
        }
    };

    console.log("Starting Ruzafa test generation...");
    const result = await pipeline.run(mission);

    if (result) {
        const outputPath = path.join('public_static', 'ruzafa-test.html');
        await fs.mkdir('public_static', { recursive: true });
        await fs.writeFile(outputPath, result.html);
        console.log(`✅ Test successful! Output saved to ${outputPath}`);
        console.log(`Word Count: ${result.metadata.totalWords}`);
    } else {
        console.error("❌ Test failed.");
    }
}

testRuzafa().catch(console.error);
