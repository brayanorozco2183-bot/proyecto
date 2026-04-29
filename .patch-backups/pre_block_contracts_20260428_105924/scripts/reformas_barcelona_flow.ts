import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runReformasBarcelona() {
    const pipeline = new ContentGenerationPipeline();
    const neighborhoods = [
        { name: "Eixample", address: "Carrer de Balmes, 08007 Barcelona" },
        { name: "Gràcia", address: "Carrer Gran de Gràcia, 08012 Barcelona" },
        { name: "Les Corts", address: "Avinguda Diagonal, 08028 Barcelona" }
    ];

    console.log("🚀 Starting REFORMAS BARCELONA Flow (Remote Ollama Mode)...");
    
    for (const neighborhood of neighborhoods) {
        const mission = {
            niche: "Reformas Integrales",
            city: `${neighborhood.name}, Barcelona`,
            local_nap: {
                business_name: `Reformas Premium ${neighborhood.name}`,
                address: neighborhood.address,
                phone: `93${Math.floor(1000000 + Math.random() * 9000000)}`
            },
            entities: ["Sagrada Familia", "Passeig de Gràcia", "Camp Nou", "Diagonal"],
            cluster_data: {
                geo: [],
                topical: [{ name: "Reformas de Cocinas" }, { name: "Interiorismo" }, { name: "Reformas de Baños" }]
            }
        };

        console.log(`\n--- Generating for ${neighborhood.name} ---`);
        const startTime = Date.now();
        const result = await pipeline.run(mission as any);
        const duration = (Date.now() - startTime) / 1000;

        if (result) {
            const fileName = `barcelona-reformas-${neighborhood.name.toLocaleLowerCase().replace(/\s+/g, '-')}.html`;
            const outputPath = path.join('public_static', 'tests', fileName);
            await fs.mkdir(path.join('public_static', 'tests'), { recursive: true });
            await fs.writeFile(outputPath, result.html);
            
            console.log(`✅ Success for ${neighborhood.name}!`);
            console.log(`   - Output: ${outputPath}`);
            console.log(`   - Words: ${result.metadata.totalWords}`);
            console.log(`   - Time: ${duration}s`);
        } else {
            console.error(`❌ Failed for ${neighborhood.name}`);
        }
    }
}

runReformasBarcelona().catch(console.error);
