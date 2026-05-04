import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';

async function main() {
    console.log('🐞 INICIANDO MISIÓN DEBUG: Electricistas en Sevilla');
    
    const orchestrator = new TaskOrchestrator();
    
    try {
        const jobId = await orchestrator.startMission(
            'electricistas', 
            ['Sevilla'], 
            'draft', 
            {
                local_nap: {
                    business_name: 'Sevilla Luz Express',
                    address: 'Calle Sierpes, Sevilla',
                    phone: '954 00 00 00'
                },
                cluster_data: {
                    geo: [
                        { name: 'Dos Hermanas', sub_path: '/electricistas-dos-hermanas' },
                        { name: 'Alcalá de Guadaíra', sub_path: '/electricistas-alcala' },
                        { name: 'Utrera', sub_path: '/electricistas-utrera' }
                    ]
                },
                mode: 'debug' // ACTIVAMOS MODO DEBUG
            }
        );
        
        console.log(`✅ MISIÓN DEBUG LANZADA. Job ID: ${jobId}`);
    } catch (error) {
        console.error('❌ ERROR AL LANZAR LA MISIÓN:', error);
    }
}

main();
