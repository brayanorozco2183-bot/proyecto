import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

async function testValenciaHardening() {
    console.log("🧪 Starting Hardened Valencia Generation Test...");
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        niche: "{{NICHE}}",
        city: "Valencia",
        local_nap: {
            business_name: "Profesionales Valencia Pro",
            address: "Calle de Colón, 10, 46004 Valencia",
            phone: "+34 960 00 00 00"
        },
        entities: ["{{NICHE}} valencia", "urgencias 24h", "apertura de puertas"],
        contextual_data: {
            wordCountTarget: 800
        },
        siteConfig: {
            baseUrl: "https://serviciosprofesionales.pro",
            brandName: "Profesionales Valencia Pro"
        }
    };

    try {
        const result = await pipeline.run(mission);
        if (!result) throw new Error("Pipeline returned null.");

        const html = result.html;
        const issues = result.metadata.issues || [];

        console.log(`✅ Generation Complete! (Words: ${result.metadata.totalWords}, Score: ${result.metadata.qaScore})`);
        
        // Hardening Checks
        console.log("🧐 Verificando endurecimiento...");
        
        const hasExampleUrl = html.includes('example.com');
        const hasFakePhone = html.includes('900 000 000');
        const phoneMatches = html.match(/\+34 960 00 00 00/g) || [];

        if (hasExampleUrl) console.error("❌ ERROR: Se detectó example.com");
        if (hasFakePhone) console.error("❌ ERROR: Se detectó 900 000 000");
        if (phoneMatches.length === 0) console.error("❌ ERROR: No se encontró el teléfono real");
        
        // Check for multiple phone numbers (validator should have caught this if it failed)
        const allPhones = html.match(/9\d[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}/g) || [];
        const uniquePhones = new Set(allPhones.map(p => p.replace(/\D/g, '')));
        if (uniquePhones.size > 1) {
            console.error(`❌ ERROR: Múltiples teléfonos detectados: ${Array.from(uniquePhones).join(', ')}`);
        }

        if (issues.length > 0) {
            console.log("⚠️ Issues de QA detectados:", issues);
        }

        const outputPath = path.join(process.cwd(), 'test_valencia_hardened.html');
        await fs.writeFile(outputPath, html);
        console.log(`- HTML guardado en: ${outputPath}`);

    } catch (err: any) {
        console.error("❌ Error durante el test:", err.message);
    }
}

testValenciaHardening().catch(console.error);
