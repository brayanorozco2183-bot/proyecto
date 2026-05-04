import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function testMadridReformas() {
    const pipeline = new ContentGenerationPipeline();
    const neighborhoods = [
        { name: "Chamberí", address: "Calle de Ponzano, 28003 Madrid" },
        { name: "Salamanca", address: "Calle de Velázquez, 28001 Madrid" },
        { name: "Retiro", address: "Calle de Alcalá, 28009 Madrid" }
    ];

    console.log("🚀 Starting Madrid Reformas Test (High Performance Mode)...");
    
    for (const neighborhood of neighborhoods) {
        const mission = {
            niche: "Reformas de Viviendas",
            city: `${neighborhood.name}, Madrid`,
            local_nap: {
                business_name: `Reformas Elite ${neighborhood.name}`,
                address: neighborhood.address,
                phone: `91${Math.floor(1000000 + Math.random() * 9000000)}`
            },
            entities: ["Paseo de la Castellana", "Puerta de Alcalá", "Barrio de Salamanca"],
            cluster_data: {
                geo: [],
                topical: [{ name: "Reformas Integrales" }, { name: "Cocinas y Baños" }, { name: "Interiorismo Moderno" }]
            }
        };

        console.log(`\n--- Generating for ${neighborhood.name} ---`);
        const startTime = Date.now();
        const result = await pipeline.run(mission as any);
        const duration = (Date.now() - startTime) / 1000;

        if (result) {
            const fileName = `madrid-reformas-${neighborhood.name.toLocaleLowerCase().replace(/\s+/g, '-')}.html`;
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

testMadridReformas().catch(console.error);
