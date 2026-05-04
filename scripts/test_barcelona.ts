import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function testBarcelona() {
    const pipeline = new ContentGenerationPipeline();
    const neighborhoods = [
        { name: "Gràcia", address: "Vila de Gràcia, 08012 Barcelona" },
        { name: "Eixample", address: "Dreta de l'Eixample, 08009 Barcelona" },
        { name: "Poblenou", address: "El Poblenou, 08005 Barcelona" },
        { name: "Sants", address: "Sants, 08014 Barcelona" },
        { name: "Sarria", address: "Sarrià, 08017 Barcelona" }
    ];

    console.log("🚀 Starting Barcelona Multi-Neighborhood Test...");
    
    for (const neighborhood of neighborhoods) {
        const mission = {
            niche: "Cerrajeros",
            city: `${neighborhood.name}, Barcelona`,
            local_nap: {
                business_name: `Cerrajeros Pro ${neighborhood.name}`,
                address: neighborhood.address,
                phone: `93${Math.floor(1000000 + Math.random() * 9000000)}`
            },
            entities: ["Sagrada Familia", "Park Güell", "Camp Nou"],
            cluster_data: {
                geo: [],
                topical: [{ name: "Urgencias 24h" }, { name: "Cerraduras de Seguridad" }]
            }
        };

        console.log(`\n--- Generating for ${neighborhood.name} ---`);
        const startTime = Date.now();
        const result = await pipeline.run(mission as any);
        const duration = (Date.now() - startTime) / 1000;

        if (result) {
            const fileName = `barcelona-${neighborhood.name.toLocaleLowerCase().replace(/\s+/g, '-')}.html`;
            const outputPath = path.join('public_static', 'tests', fileName);
            await fs.mkdir(path.join('public_static', 'tests'), { recursive: true });
            await fs.writeFile(outputPath, result.html);
            
            console.log(`✅ Success for ${neighborhood.name}!`);
            console.log(`   - Output: ${outputPath}`);
            console.log(`   - Words: ${result.metadata.totalWords}`);
            console.log(`   - Time: ${duration}s`);
            
            // Extract Family info from the HTML (it's in the meta or styles but let's just log success)
            const familyMatch = result.html.match(/--font-display: ([^;]+)/);
            console.log(`   - Visual Signature: ${familyMatch ? familyMatch[1] : 'default'}`);
        } else {
            console.error(`❌ Failed for ${neighborhood.name}`);
        }
    }
}

testBarcelona().catch(console.error);
