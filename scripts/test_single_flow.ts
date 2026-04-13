import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runSingleFlowTest() {
    const pipeline = new ContentGenerationPipeline();

    const [node, script, argNiche, argCity] = process.argv;
    
    const testCase = {
        niche: argNiche || "Cerrajeros",
        city: argCity || "Madrid",
        address: argCity ? `Calle Mayor, 1, ${argCity}` : "Calle Mayor, 1, 28013 Madrid",
        phone: "910112233",
        entities: ["Puerta del Sol", "Gran Vía", "Retiro"]
    };

    console.log("🚀 Starting Single Niche Flow Test...");
    console.log("-------------------------------------------");
    console.log(`[TEST] Niche: ${testCase.niche} | City: ${testCase.city}`);

    const outputDir = path.join('public_static', 'test_flow');
    await fs.mkdir(outputDir, { recursive: true });

    const mission = {
        missionId: `test-${testCase.niche.toLowerCase()}-${testCase.city.toLowerCase()}-${Date.now()}`,
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
            wordCountTarget: 1800
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

            console.log(`\n✅ SUCCESS: ${testCase.niche} in ${testCase.city}`);
            console.log(`   - Output: ${outputPath}`);
            console.log(`   - Words: ${result.metadata.totalWords}`);
            console.log(`   - QA Score: ${result.metadata.qaScore}`);
            console.log(`   - Time: ${duration.toFixed(2)}s`);
            
            if (result.metadata.issues && result.metadata.issues.length > 0) {
                console.log(`   - Issues found (${result.metadata.issues.length}):`);
                result.metadata.issues.forEach((issue: string) => console.log(`     ⚠️ ${issue}`));
            }
        } else {
            console.error(`\n❌ FAILED: Pipeline returned null for ${testCase.niche} in ${testCase.city}`);
            console.log("Check debug_failed_assembly.html or debug_failed_quality_gate.html for details.");
        }
    } catch (error: any) {
        console.error(`\n❌ ERROR in ${testCase.niche} / ${testCase.city}:`, error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }

    console.log("\n-------------------------------------------");
    console.log("🏁 Single Flow Test Completed.");
}

runSingleFlowTest().catch(console.error);
