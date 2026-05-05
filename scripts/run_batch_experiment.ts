import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function runBatch() {
    const pipeline = new ContentGenerationPipeline();

    const missions: GenerationMission[] = [
        {
            missionId: 'getafe-cerrajeros-1',
            niche: 'cerrajeros',
            city: 'Getafe',
            local_nap: {
                business_name: 'Cerrajero Getafe Master',
                address: 'Calle Madrid, 10, Getafe',
                phone: '916000001'
            },
            mode: 'production',
            debugMode: true,
            clusterFolderName: 'cerrajeros-getafe'
        },
        {
            missionId: 'getafe-antibumping-2',
            niche: 'cerrajeros antibumping',
            city: 'Getafe',
            local_nap: {
                business_name: 'Seguridad Getafe Pro',
                address: 'Avenida de España, 5, Getafe',
                phone: '916000002'
            },
            mode: 'production',
            debugMode: true,
            clusterFolderName: 'antibumping-getafe'
        },
        {
            missionId: 'getafe-bombin-3',
            niche: 'cambio de bombín',
            city: 'Getafe',
            local_nap: {
                business_name: 'Bombines Getafe Express',
                address: 'Calle Mayor, 2, Getafe',
                phone: '916000003'
            },
            mode: 'production',
            debugMode: true,
            clusterFolderName: 'cambio-bombin-getafe'
        }
    ];

    console.log(`🚀 Iniciando Batida de 3 misiones para Getafe...`);

    for (const mission of missions) {
        console.log(`\n--------------------------------------------`);
        console.log(`👉 Ejecutando: ${mission.niche} en ${mission.city}`);
        console.log(`--------------------------------------------\n`);

        try {
            const result = await (pipeline as any).run(mission);
            if (result.success) {
                console.log(`✅ ¡Éxito! Generado en: ${result.outputPath}`);
            } else {
                console.error(`❌ Fallo en misión ${mission.missionId}:`, result.error);
            }
        } catch (err) {
            console.error(`💥 Error catastrófico en ${mission.missionId}:`, err);
        }
    }

    console.log(`\n🏆 Batida de misiones finalizada.`);
}

runBatch();
