import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runSingleBarcelona() {
    const pipeline = new ContentGenerationPipeline();
    const mission = {
        niche: "Reformas Integrales",
        city: "Barcelona",
        local_nap: {
            business_name: "Reformas Barcelona Maestro",
            address: "Carrer de Balmes, 08007 Barcelona",
            phone: "931234567"
        },
        entities: ["Sagrada Familia", "Passeig de Gràcia", "Camp Nou", "Eixample"],
        cluster_data: {
            geo: [],
            topical: [{ name: "Reformas de Cocinas" }, { name: "Interiorismo" }, { name: "Reformas de Baños" }]
        },
        contextual_data: {
            wordCountTarget: 1200
        }
    };

    console.log("🚀 Starting SINGLE MISSION: Reformas Barcelona...");
    const startTime = Date.now();
    const result = await pipeline.run(mission as any);
    const duration = (Date.now() - startTime) / 1000;

    if (result) {
        const fileName = `reformas-barcelona-final.html`;
        const outputPath = path.join('public_static', 'tests', fileName);
        await fs.mkdir(path.join('public_static', 'tests'), { recursive: true });
        await fs.writeFile(outputPath, result.html);
        
        console.log(`✅ Success!`);
        console.log(`   - Output: ${outputPath}`);
        console.log(`   - Words: ${result.metadata.totalWords}`);
        console.log(`   - Time: ${duration}s`);
    } else {
        console.error(`❌ Mission Failed.`);
        process.exit(1);
    }
}

runSingleBarcelona().catch(error => {
    console.error(error);
    process.exit(1);
});
