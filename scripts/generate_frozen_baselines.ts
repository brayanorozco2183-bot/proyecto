import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';

async function generateBaselines() {
    const pipeline = new ContentGenerationPipeline();
    
    const missions: GenerationMission[] = [
        {
            missionId: 'baseline-madrid-cerrajeros',
            niche: 'Cerrajeros',
            city: 'Madrid',
            local_nap: {
                business_name: 'Madrid Cerrajeros 24h',
                address: 'Calle Mayor 1, Madrid',
                phone: '912345678'
            },
            mode: 'freeze',
            freezeId: 'frozen-madrid-cerrajeros',
            contextual_data: { wordCountTarget: 1600 },
            siteConfig: { baseUrl: 'https://serviciosprofesionales.pro', brandName: 'Madrid Cerrajeros 24h' }
        },
        {
            missionId: 'baseline-barcelona-fontaneros',
            niche: 'Fontaneros',
            city: 'Barcelona',
            local_nap: {
                business_name: 'Barcelona Fontanería Pro',
                address: 'Gran Via 123, Barcelona',
                phone: '934567890'
            },
            mode: 'freeze',
            freezeId: 'frozen-barcelona-fontaneros',
            contextual_data: { wordCountTarget: 1600 },
            siteConfig: { baseUrl: 'https://serviciosprofesionales.pro', brandName: 'Barcelona Fontanería Pro' }
        },
        {
            missionId: 'baseline-valencia-reformas',
            niche: 'Reformas',
            city: 'Valencia',
            local_nap: {
                business_name: 'Reformas Integrales Valencia',
                address: 'Calle de la Paz 5, Valencia',
                phone: '967890123'
            },
            mode: 'freeze',
            freezeId: 'frozen-valencia-reformas',
            contextual_data: { wordCountTarget: 1800 },
            siteConfig: { baseUrl: 'https://serviciosprofesionales.pro', brandName: 'Reformas Integrales Valencia' }
        },
        {
            missionId: 'baseline-sevilla-pintores',
            niche: 'Pintores',
            city: 'Sevilla',
            local_nap: {
                business_name: 'Pintores Sevilla Premium',
                address: 'Avenida de la Constitución 10, Sevilla',
                phone: '954567812'
            },
            mode: 'freeze',
            freezeId: 'frozen-sevilla-pintores',
            contextual_data: { wordCountTarget: 1500 },
            siteConfig: { baseUrl: 'https://serviciosprofesionales.pro', brandName: 'Pintores Sevilla Premium' }
        },
        {
            missionId: 'baseline-bilbao-limpieza',
            niche: 'Limpieza',
            city: 'Bilbao',
            local_nap: {
                business_name: 'Bilbao Limpieza Industrial',
                address: 'Calle Ledesma 15, Bilbao',
                phone: '944567891'
            },
            mode: 'freeze',
            freezeId: 'frozen-bilbao-limpieza',
            contextual_data: { wordCountTarget: 1500 },
            siteConfig: { baseUrl: 'https://serviciosprofesionales.pro', brandName: 'Bilbao Limpieza Industrial' }
        }
    ];

    console.log(`🚀 Starting Generation of 5 Baselines...`);

    for (const mission of missions) {
        console.log(`\n\n[Baseline] Starting: ${mission.niche} in ${mission.city} (FreezeID: ${mission.freezeId})`);
        try {
            const result = await pipeline.run(mission);
            if (result) {
                console.log(`✅ Success: ${mission.freezeId} generated.`);
            } else {
                console.error(`❌ Failed: ${mission.freezeId} (Pipeline returned null)`);
            }
        } catch (error: any) {
            console.error(`💥 Error generating baseline ${mission.freezeId}: ${error.message}`);
        }
    }

    console.log(`\n✨ Baseline Generation Complete.`);
}

generateBaselines().catch(err => console.error(err));
