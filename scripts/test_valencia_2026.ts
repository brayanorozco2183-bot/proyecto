
import { ContentGenerationPipeline, GenerationMission } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';
import { dbManager } from '../src/db/index.js';

async function generateValencia() {
    const pipeline = new ContentGenerationPipeline();
    const missionId = `test-valencia-${Date.now()}`;
    const db = await dbManager.getDB();

    console.log(`[DB] Registering mission ${missionId} for dashboard visibility...`);
    await db.run('INSERT INTO missions (id, niche, city, status) VALUES (?, ?, ?, ?)', [missionId, "Cerrajeros", "Valencia", "running"]);
    await db.run('INSERT INTO city_data (mission_id, city, status, quality_score, audit_score) VALUES (?, ?, ?, ?, ?)', [missionId, "Valencia", "INITIALIZING", 0, 0]);

    const mission: GenerationMission = {
        missionId,
        niche: "Cerrajeros",
        city: "Valencia",
        debugMode: true,
        local_nap: {
            business_name: "Cerrajeros Valencia Pro",
            address: "Calle de Colón, 10, 46004 Valencia",
            phone: "+34 960 00 00 00"
        },
        entities: [
            "Cerrajeros Valencia", 
            "Apertura de puertas Valencia", 
            "Miguelete",
            "Torres de Quart"
        ],
        contextual_data: {
            wordCountTarget: 800,
            niche_experience: "Expertos en cerrajería integral operativa en todos los distritos de Valencia, con más de 15 años de servicio ininterrumpido en la capital."
        },
        cluster_data: {
            geo: [
                { name: "Valencia Centro" },
                { name: "Distritos Norte" },
                { name: "Distritos Sur" },
                { name: "Zonas Marítimas" }
            ],
            topical: [
                { name: "Apertura de Puertas" },
                { name: "Cambio de Bombines" },
                { name: "Cerraduras Inteligentes" },
                { name: "Urgencias 24 Horas" }
            ]
        },
        siteConfig: {
            baseUrl: "https://serviciosprofesionales.pro",
            brandName: "Cerrajeros Valencia Pro"
        }
    };

    console.log("🚀 Starting Valencia 2026 Generation Flow...");
    console.log("Target Word Count: 1000");
    const startTime = Date.now();
    
    const result = await pipeline.run(mission);
    const duration = (Date.now() - startTime) / 1000;

    if (result) {
        const outputPath = path.join('public_static', 'valencia-test-2026.html');
        await fs.mkdir('public_static', { recursive: true });
        await fs.writeFile(outputPath, result.html);
        
        console.log(`\n✅ Generation Successful!`);
        console.log(`   - Output: ${outputPath}`);
        console.log(`   - Words: ${result.metadata.totalWords}`);
        console.log(`   - Time: ${duration}s`);
        console.log(`   - QA Score: ${result.metadata.qaScore}`);
        
        await db.run('UPDATE missions SET status = ? WHERE id = ?', ['COMPLETED', missionId]);
        await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['COMPLETED', missionId, "Valencia"]);
    } else {
        await db.run('UPDATE missions SET status = ? WHERE id = ?', ['FAILED', missionId]);
        await db.run('UPDATE city_data SET status = ? WHERE mission_id = ? AND city = ?', ['FAILED', missionId, "Valencia"]);
        console.error("\n❌ Pipeline failed to complete the generation.");
    }
}

generateValencia().catch(console.error);
