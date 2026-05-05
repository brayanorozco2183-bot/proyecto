import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

async function runInterlinkingBatch() {
    const niche = 'fontaneros';
    const cities = ['Alcorcón', 'Móstoles', 'Getafe'];
    
    const pipeline = new ContentGenerationPipeline();
    const resultsDir = path.join(process.cwd(), 'test_results');
    await fs.mkdir(resultsDir, { recursive: true });

    console.log(`🚀 Iniciando Batch de Verificación de Interlinking: ${niche} en ${cities.join(', ')}...`);

    for (const city of cities) {
        console.log(`\n👉 Generando: ${niche} en ${city}...`);
        
        const mission: GenerationMission = {
            niche: niche,
            city: city,
            local_nap: {
                business_name: `Fontaneros ${city} Elite`,
                address: `Calle Principal 10, ${city}`,
                phone: "+34 600 000 000"
            },
            siteConfig: {
                baseUrl: `https://fontaneros${city.toLowerCase().replace(/á/g, 'a').replace(/ó/g, 'o')}.pro`,
                brandName: `Fontaneros ${city} Elite`
            },
            mode: 'production'
        };

        // Forzamos ruteo tipo cluster para probar normalización e interlinking
        (mission as any).cluster_folder_name = `fontaneros ${city.toLowerCase().replace(/á/g, 'a').replace(/ó/g, 'o')}`;
        mission.subPath = 'servicios tecnicos';

        try {
            const start = Date.now();
            const result = await pipeline.run(mission);
            const duration = ((Date.now() - start) / 1000).toFixed(1);

            if (result && result.html) {
                const fileName = `batch_${niche}_${city.toLowerCase()}.html`;
                const filePath = path.join(resultsDir, fileName);
                await fs.writeFile(filePath, result.html);
                
                console.log(`✅ ¡ÉXITO! [${duration}s]`);
                console.log(`   - Archivo de depuración: ${filePath}`);
            } else {
                console.error(`❌ FALLO: No se generó HTML para ${city}.`);
            }
        } catch (error: any) {
            console.error(`❌ ERROR en ${city}: ${error.message}`);
        }
    }

    console.log("\n🏁 Batch de Verificación Finalizado.");
}

runInterlinkingBatch().catch(err => {
    console.error('❌ Error no controlado en el script de batch:', err);
    process.exit(1);
});
