
import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function runTest() {
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        missionId: 'test-exemplars-alcorcon-electricistas',
        niche: 'electricistas',
        city: 'Alcorcón',
        local_nap: {
            business_name: 'Electricistas Alcorcón Premium',
            address: 'Calle Mayor, 1, Alcorcón',
            phone: '916112233'
        },
        mode: 'production',
        debugMode: true,
        softMode: false, // Queremos ver la IA en acción
        clusterFolderName: 'test-exemplars-alcorcon'
    };

    console.log(`🚀 Probando nueva inteligencia: ${mission.niche} en ${mission.city}`);
    console.log(`📦 Usando pack de 100 exemplars inyectado.`);

    try {
        const result = await (pipeline as any).run(mission);
        if (result.success) {
            console.log(`✅ ¡Misión completada!`);
            console.log(`📍 HTML generado en: ${result.data?.html_path || result.outputPath}`);
            console.log(`📊 Puntuación de calidad: ${result.data?.score}`);
        } else {
            console.error(`❌ Fallo en la misión:`, result.error);
        }
    } catch (err) {
        console.error(`💥 Error catastrófico:`, err);
    }
}

runTest();
