import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runFlowTest() {
    const pipeline = new ContentGenerationPipeline();

    const testCases = [
        {
            niche: "Carpinteros",
            city: "Barcelona",
            address: "Carrer de Balmes, 15, 08007 Barcelona",
            phone: "930112233",
            entities: ["Sagrada Familia", "Eixample", "Paseo de Gracia"]
        },
        {
            niche: "Cerrajeros",
            city: "Madrid",
            address: "Calle Mayor, 1, 28013 Madrid",
            phone: "910112233",
            entities: ["Puerta del Sol", "Gran Vía", "Retiro"]
        },
        {
            niche: "Electricistas",
            city: "Valencia",
            address: "Carrer de Colón, 5, 46004 Valencia",
            phone: "960112233",
            entities: ["Ciudad de las Artes", "El Carmen", "Ruzafa"]
        },
        {
            niche: "Fontaneros",
            city: "Sevilla",
            address: "Calle Sierpes, 10, 41004 Sevilla",
            phone: "950112233",
            entities: ["La Giralda", "Triana", "Plaza de España"]
        },
        {
            niche: "Pintores",
            city: "Bilbao",
            address: "Gran Vía, 20, 48001 Bilbao",
            phone: "940112233",
            entities: ["Guggenheim", "Casco Viejo", "Indautxu"]
        }
    ];

    console.log("🚀 Starting 5 Niches x 5 Cities Flow Test...");
    console.log("-------------------------------------------");

    const outputDir = path.join('public_static', 'test_flow');
    await fs.mkdir(outputDir, { recursive: true });

    for (const testCase of testCases) {
        console.log(`\n[TEST] Niche: ${testCase.niche} | City: ${testCase.city}`);

        const mission = {
            niche: testCase.niche,
            city: testCase.city,
            local_nap: {
                business_name: `${testCase.niche} ${testCase.city} Express`,
                address: testCase.address,
                phone: testCase.phone
            },
            entities: testCase.entities,
            cluster_data: {
                geo: [],
                topical: [
                    { name: `Servicios de ${testCase.niche}` },
                    { name: `${testCase.niche} Urgente` },
                    { name: `Presupuesto ${testCase.niche}` }
                ]
            },
            contextual_data: {
                wordCountTarget: 2200
            }
        };

        const startTime = Date.now();
        try {
            const result = await pipeline.run(mission as any);
            const duration = (Date.now() - startTime) / 1000;

            if (result) {
                const safeCity = testCase.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
                const safeNiche = testCase.niche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
                const fileName = `${safeNiche}-${safeCity}.html`;
                const outputPath = path.join(outputDir, fileName);

                await fs.writeFile(outputPath, result.html);

                console.log(`✅ SUCCESS: ${testCase.niche} in ${testCase.city}`);
                console.log(`   - Output: ${outputPath}`);
                console.log(`   - Words: ${result.metadata.totalWords}`);
                console.log(`   - QA Score: ${result.metadata.qaScore}`);
                console.log(`   - Time: ${duration.toFixed(2)}s`);
            } else {
                console.error(`❌ FAILED: Pipeline returned null for ${testCase.niche} in ${testCase.city}`);
            }
        } catch (error: any) {
            console.error(`❌ ERROR in ${testCase.niche} / ${testCase.city}:`, error.message);
        }
    }

    console.log("\n-------------------------------------------");
    console.log("🏁 Flow Test Completed.");
}

runFlowTest().catch(console.error);
