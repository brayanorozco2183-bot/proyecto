import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

async function runCerrajerosTest() {
    const missionPath = path.join(process.cwd(), 'src/tests/fixtures/debug_mission.cerrajeros.json');
    const missionRaw = await fs.readFile(missionPath, 'utf8');
    const mission: GenerationMission = JSON.parse(missionRaw);
    
    // Forzado de modo depuración y soft mode para esta prueba
    mission.debugMode = true;
    (mission as any).mode = 'production'; 

    console.log(`\n================================================================`);
    console.log(`🚀 INICIANDO PRUEBA INTEGRAL: ${mission.niche} en ${mission.city}`);
    console.log(`================================================================\n`);
    
    const pipeline = new ContentGenerationPipeline();
    const start = Date.now();

    try {
        const result = await pipeline.run(mission);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        if (result && result.success) {
            const data = result.data || (result as any);
            const html = data.html || '';
            const metadata = data.metadata || {};

            console.log(`\n✅ ¡PRUEBA COMPLETADA EXITOSAMENTE! [${duration}s]`);
            console.log(`----------------------------------------------------------------`);
            console.log(`📊 RESULTADOS FINALES:`);
            console.log(`   - H1: ${metadata.h1 || 'N/A'}`);
            console.log(`   - Palabras: ${metadata.totalWords || metadata.total_words || 0}`);
            console.log(`   - QA Score: ${metadata.qaScore || 0}`);
            console.log(`   - Incidencias: ${metadata.issues?.length || 0}`);
            
            if (metadata.issues && metadata.issues.length > 0) {
                console.log(`\n⚠️ DETALLE DE INCIDENCIAS (SOFT MODE):`);
                metadata.issues.forEach((issue: string) => console.log(`   [!] ${issue}`));
            }

            console.log(`\n📄 El HTML final ha sido guardado por el StaticDeploy en el cluster.`);
            console.log(`📂 Busca los artefactos de depuración en la carpeta 'debug/run_xxx'`);
            console.log(`----------------------------------------------------------------\n`);
        } else {
            console.error(`\n❌ LA PRUEBA FALLÓ: El pipeline no devolvió resultados.`);
        }
    } catch (error: any) {
        console.error(`\n❌ ERROR FATAL DURANTE LA PRUEBA:`);
        console.error(`   ${error.message}`);
        if (error.stack) console.error(`\n   Stack Trace:\n${error.stack}`);
    }
}

runCerrajerosTest().catch(err => {
    console.error('❌ Error no controlado:', err);
    process.exit(1);
});
