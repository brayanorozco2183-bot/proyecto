import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

async function runBatch() {
    const scenarios = [
        { niche: 'cerrajeros', city: 'Bilbao' },
        { niche: 'fontaneros', city: 'Madrid' },
        { niche: 'carpinteros', city: 'Sevilla' },
        { niche: 'pintores', city: 'Valencia' }
    ];

    const pipeline = new ContentGenerationPipeline();
    const resultsDir = path.join(process.cwd(), 'test_results');
    await fs.mkdir(resultsDir, { recursive: true });

    console.log(`🚀 Starting Batch Generation for ${scenarios.length} scenarios...\n`);

    for (const s of scenarios) {
        console.log(`👉 Generating: ${s.niche} ${s.city}...`);
        
        const mission: GenerationMission = {
            niche: s.niche,
            city: s.city,
            local_nap: {
                business_name: `${s.niche.charAt(0).toUpperCase() + s.niche.slice(1)} ${s.city} Pro`,
                address: `Calle Mayor 1, ${s.city}`,
                phone: "+34 900 000 000"
            },
            siteConfig: {
                baseUrl: `https://${s.niche}${s.city.toLowerCase()}.pro`,
                brandName: `${s.niche.charAt(0).toUpperCase() + s.niche.slice(1)} ${s.city} Pro`
            },
            mode: 'production'
        };

        try {
            const start = Date.now();
            const result = await pipeline.run(mission);
            const duration = ((Date.now() - start) / 1000).toFixed(1);

            if (result && result.html) {
                const fileName = `${s.niche}_${s.city.toLowerCase()}.html`;
                const filePath = path.join(resultsDir, fileName);
                await fs.writeFile(filePath, result.html);
                
                console.log(`✅ Success! [${duration}s] ${result.metadata.totalWords} words, QA Score: ${result.metadata.qaScore}`);
                console.log(`   File saved to: ${filePath}\n`);
            } else {
                console.error(`❌ Failed: No HTML generated for ${s.niche} ${s.city}\n`);
            }
        } catch (error: any) {
            console.error(`❌ Error generating ${s.niche} ${s.city}: ${error.message}\n`);
        }
    }

    console.log("🏁 Batch Generation Finished.");
}

runBatch().catch(console.error);