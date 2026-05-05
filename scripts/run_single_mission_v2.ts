import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function runSingle() {
    const pipeline = new ContentGenerationPipeline();

    const mission: GenerationMission = {
        missionId: 'getafe-carpinteros-prod-v4',
        niche: 'carpinteros',
        city: 'Getafe',
        local_nap: {
            business_name: 'Carpintería Getafe Premium',
            address: 'Calle Mayor, 15, Getafe',
            phone: '916000100'
        },
        mode: 'production',
        debugMode: true,
        softMode: true,
        clusterFolderName: 'carpinteros-getafe-prod-v4'
    };

    console.log(`🚀 Lanzando misión única de prueba V2: ${mission.niche} en ${mission.city}`);

    try {
        const result = await (pipeline as any).run(mission);
        if (result.success) {
            const outPath = result.data?.html_path || result.outputPath;
            console.log(`✅ ¡Éxito! Generado en: ${outPath}`);
        } else {
            console.error(`❌ Fallo en la misión:`, result.error);
        }
    } catch (err) {
        console.error(`💥 Error catastrófico:`, err);
    }
}

runSingle();
