import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runSingleFlowTest() {
    const pipeline = new ContentGenerationPipeline();

    const [node, script, argNiche, argCity] = process.argv;
    
    const testCase = {
        niche: argNiche || "Cerrajeros",
        city: argCity || "Getafe",
        address: argCity ? `Calle Mayor, 1, ${argCity}` : "Calle Mayor, 1, Getafe",
        phone: "910112233",
        entities: ["Getafe Central", "Sector III", "El Bercial", "Perales del Río", "Juan de la Cierva", "Getafe Norte", "Cerro de los Ángeles"]
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
        },
        debugMode: true
    };

    const startTime = Date.now();
    try {
        const { dbManager } = await import('../src/db/index.js');
        const db = await dbManager.getDB();
        await db.run('INSERT OR IGNORE INTO missions (id, niche, status) VALUES (?, ?, ?)', [mission.missionId, mission.niche, 'TESTING']);
        
        const result = await pipeline.run(mission as any);
        const duration = (Date.now() - startTime) / 1000;

        if (result && result.success && result.data) {
            const data = result.data;
            const safeCity = testCase.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
            const safeNiche = testCase.niche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
            const fileName = `${safeNiche}-${safeCity}.html`;
            const outputPath = path.join(outputDir, fileName);

            if (data.html) {
                await fs.writeFile(outputPath, data.html);
            } else {
                console.warn(`   - [WARNING] Pipeline reported success but html data was null.`);
                if (data.html_path) {
                    console.log(`   - [NOTE] Page was delivered to: ${data.html_path}`);
                }
            }

            console.log(`\n✅ SUCCESS: ${testCase.niche} in ${testCase.city}`);
            console.log(`   - Output: ${outputPath}`);
            console.log(`   - Words: ${data.word_count}`);
            console.log(`   - QA Score: ${data.score}`);
            console.log(`   - Time: ${duration.toFixed(2)}s`);
            
            if (data.notes && data.notes.length > 0) {
                console.log(`   - Issues found (${data.notes.length}):`);
                data.notes.forEach((issue: string) => console.log(`     ⚠️ ${issue}`));
            }
        } else {
            console.error(`\n❌ FAILED: Pipeline failed or returned null for ${testCase.niche} in ${testCase.city}`);
            if (result && result.error) {
                console.error(`   - Error: ${result.error}`);
            }
            console.log("Check debug_failed_assembly.html or debug_failed_quality_gate.html for details.");
            
            // Actually save the debug files as the message suggests
            if (result && result.data && result.data.html) {
                await fs.writeFile('debug_failed_assembly.html', result.data.html);
            } else if (pipeline['lastRenderedPage']?.html) {
                await fs.writeFile('debug_failed_assembly.html', pipeline['lastRenderedPage'].html);
            }
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
