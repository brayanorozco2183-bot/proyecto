import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';

async function runLugoTest() {
    console.log("🚀 Starting Carpinteros Lugo Debug Flow...");
    const pipeline = new ContentGenerationPipeline();

    const mission = {
        niche: "Carpinteros",
        city: "Lugo",
        local_nap: {
            business_name: "Carpinteros Lugo Express",
            address: "Rúa de San Pedro, 1, 27001 Lugo",
            phone: "982123456"
        },
        entities: ["Muralla de Lugo", "Catedral de Lugo", "Río Miño"],
        contextual_data: {
            wordCountTarget: 1600
        }
    };

    try {
        const result = await pipeline.run(mission as any);
        if (result) {
            console.log("✅ SUCCESS: Page generated for Lugo");
            const fileName = `carpinteros-lugo.html`;
            const dir = path.join(process.cwd(), 'public_static', 'debug_lugo');
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(path.join(dir, fileName), result.html);
            console.log(`Saved to: ${path.join(dir, fileName)}`);
        } else {
            console.log("❌ FAILED: Pipeline returned null");
        }
    } catch (error) {
        console.error("💥 CRITICAL ERROR during Lugo test:", error);
    }
}

runLugoTest();
