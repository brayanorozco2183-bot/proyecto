import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

async function runSingleTest() {
    const niche = 'pintores';
    const city = 'Madrid';
    
    console.log(`🚀 Iniciando Prueba de Flujo Único Estabilizado: ${niche} en ${city}...`);
    
    const pipeline = new ContentGenerationPipeline();
    const resultsDir = path.join(process.cwd(), 'test_results');
    await fs.mkdir(resultsDir, { recursive: true });

    const mission: GenerationMission = {
        niche: niche,
        city: city,
        local_nap: {
            business_name: `Pintores ${city} Elite`,
            address: `Calle de la Victoria 10, ${city}`,
            phone: "+34 912 345 678"
        },
        siteConfig: {
            baseUrl: `https://pintores${city.toLowerCase()}elite.pro`,
            brandName: `Pintores ${city} Elite`
        },
        mode: 'production'
    };

    try {
        const start = Date.now();
        console.log('[Pipeline] Ejecutando pipeline.run()...');
        const result = await pipeline.run(mission);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        if (result && result.html) {
            const fileName = `test_estabilidad_${niche}_${city.toLowerCase()}.html`;
            const filePath = path.join(resultsDir, fileName);
            await fs.writeFile(filePath, result.html);
            
            console.log(`\n✅ ¡ÉXITO! [${duration}s]`);
            console.log(`📊 Estadísticas:`);
            console.log(`   - Palabras: ${result.metadata.totalWords}`);
            console.log(`   - Secciones: ${result.metadata.sectionsCount}`);
            console.log(`   - QA Score: ${result.metadata.qaScore}`);
            console.log(`   - Archivo: ${filePath}\n`);

            if (result.metadata.issues && result.metadata.issues.length > 0) {
                console.warn('⚠️ Advertencias detectadas:');
                result.metadata.issues.forEach((issue: string) => console.warn(`   - ${issue}`));
            }
        } else {
            console.error(`\n❌ FALLO: No se generó HTML. El pipeline devolvió null.`);
            console.error(`Verifica los logs de la consola para detectar bloqueos por "fail-closed" u errores de Ollama.`);
        }
    } catch (error: any) {
        console.error(`\n❌ ERROR CRÍTICO durante la generación:`);
        console.error(`   Mensaje: ${error.message}`);
        if (error.stack) console.error(`   Stack: ${error.stack}`);
    }
}

runSingleTest().catch(err => {
    console.error('❌ Error no controlado en el script de prueba:', err);
    process.exit(1);
});
