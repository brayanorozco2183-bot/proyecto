
import { ContentGenerationPipeline, GenerationMission } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function generateValencia() {
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        niche: "Cerrajeros",
        city: "Valencia",
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
    } else {
        console.error("\n❌ Pipeline failed to complete the generation.");
    }
}

generateValencia().catch(console.error);
