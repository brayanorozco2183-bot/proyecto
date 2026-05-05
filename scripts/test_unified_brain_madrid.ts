import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline/state.js';

async function runTest() {
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        missionId: `madrid-electricistas-brain-v1-${Date.now()}`,
        niche: 'electricistas',
        city: 'Madrid',
        local_nap: {
            business_name: 'Electricidad Madrid Central',
            address: 'Calle de Alcalá, 45, Madrid',
            phone: '915000100'
        },
        mode: 'production',
        debugMode: true,
        softMode: true,
        clusterFolderName: 'madrid-electricistas-unified-brain'
    };

    console.log(`\n🚀 [UNIFIED BRAIN TEST]`);
    console.log(`NICHO: ${mission.niche}`);
    console.log(`CIUDAD: ${mission.city}`);
    console.log(`ID: ${mission.missionId}\n`);

    try {
        const result = await (pipeline as any).run(mission);
        if (result.success) {
            console.log(`\n✅ [TEST EXITOSO]`);
            console.log(`Puntaje de Calidad: ${result.data?.qualityScore ?? 'N/A'}`);
            console.log(`Ruta de Salida: ${result.data?.html_path || result.outputPath}`);
        } else {
            console.error(`\n❌ [TEST FALLIDO]`);
            console.error(`Error:`, result.error);
        }
    } catch (err) {
        console.error(`\n💥 [ERROR CATASTRÓFICO]`);
        console.error(err);
    }
}

runTest();
