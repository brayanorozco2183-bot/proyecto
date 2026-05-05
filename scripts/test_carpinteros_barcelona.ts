import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function testCarpinterosBarcelona() {
    const pipeline = new ContentGenerationPipeline();
    const neighborhoods = [
        { name: "Gràcia", address: "Vila de Gràcia, 08012 Barcelona" },
        { name: "Eixample", address: "Dreta de l'Eixample, 08009 Barcelona" },
        { name: "Poblenou", address: "El Poblenou, 08005 Barcelona" }
    ];

    console.log("🚀 Starting Carpinteros Barcelona Flow Test...");
    
    for (const neighborhood of neighborhoods) {
        const mission = {
            niche: "carpinteros",
            city: `${neighborhood.name}, Barcelona`,
            local_nap: {
                business_name: `Carpinteros Pro ${neighborhood.name}`,
                address: neighborhood.address,
                phone: `93${Math.floor(1000000 + Math.random() * 9000000)}`
            },
            entities: ["Sagrada Familia", "Diagonal Mar", "Plaça de Catalunya"],
            cluster_data: {
                geo: [],
                topical: [{ name: "Muebles a Medida" }, { name: "Armarios Empotrados" }, { name: "Puertas de Madera" }]
            },
            contextual_data: {
                wordCountTarget: 2000
            }
        };

        console.log(`\n--- Generating for ${neighborhood.name} ---`);
        const startTime = Date.now();
        try {
            const result = await pipeline.run(mission as any);
            const duration = (Date.now() - startTime) / 1000;

            if (result) {
                const fileName = `carpinteros-barcelona-${neighborhood.name.toLocaleLowerCase().replace(/\s+/g, '-')}.html`;
                const outputPath = path.join('public_static', 'tests', fileName);
                await fs.mkdir(path.join('public_static', 'tests'), { recursive: true });
                await fs.writeFile(outputPath, result.html);
                
                console.log(`✅ Success for ${neighborhood.name}!`);
                console.log(`   - Output: ${outputPath}`);
                console.log(`   - Words: ${result.metadata.totalWords}`);
                console.log(`   - Time: ${duration.toFixed(2)}s`);
            } else {
                console.error(`❌ Failed for ${neighborhood.name}: Pipeline returned null`);
            }
        } catch (error: any) {
            console.error(`❌ Error for ${neighborhood.name}: ${error.message}`);
        }
    }
}

testCarpinterosBarcelona().catch(console.error);
