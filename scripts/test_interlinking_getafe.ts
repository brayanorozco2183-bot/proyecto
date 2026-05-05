import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function runTest() {
    const pipeline = new ContentGenerationPipeline();

    const cluster_data = {
        geo: [
            { name: 'Getafe', sub_path: 'index.html' },
            { name: 'Getafe Centro', sub_path: 'getafe-centro/index.html' },
            { name: 'Sector III', sub_path: 'sector-iii/index.html' }
        ]
    };

    const missions: GenerationMission[] = [
        {
            missionId: 'test-hub-getafe',
            niche: 'carpinteros',
            city: 'Getafe',
            local_nap: { business_name: 'Carpintería Getafe', address: 'Getafe', phone: '910000000' },
            mode: 'production',
            debugMode: true,
            clusterFolderName: 'carpinteros-getafe',
            cluster_data: cluster_data as any
        },
        {
            missionId: 'test-barrio-getafe-centro',
            niche: 'carpinteros',
            city: 'Getafe Centro',
            local_nap: { business_name: 'Carpintería Getafe Centro', address: 'Getafe Centro', phone: '910000001' },
            mode: 'production',
            debugMode: true,
            clusterFolderName: 'carpinteros-getafe',
            subPath: 'getafe-centro',
            cluster_data: cluster_data as any
        }
    ];

    for (const mission of missions) {
        console.log(`\n🚀 Ejecutando misión: ${mission.missionId} (${mission.city})`);
        try {
            const result = await (pipeline as any).run(mission);
            if (result.success) {
                console.log(`✅ Generado con éxito: ${result.data?.html_path || result.outputPath}`);
            } else {
                console.error(`❌ Fallo:`, result.error);
            }
        } catch (err) {
            console.error(`💥 Error:`, err);
        }
    }
}

runTest();
