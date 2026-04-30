import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';

async function main() {
    console.log('🚀 INICIANDO MISIÓN PREMIUM: Fontaneros en Barcelona');
    
    const orchestrator = new TaskOrchestrator();
    
    // El método correcto es startMission(niche, locations, publishMode, options)
    try {
        const jobId = await orchestrator.startMission(
            'fontaneros', 
            ['Barcelona'], 
            'publish', 
            {
                local_nap: {
                    business_name: 'Fontanería Barna Pro',
                    address: 'Gran Via de les Corts Catalanes, Barcelona',
                    phone: '930 00 00 00'
                },
                cluster_data: {
                    geo: [
                        { name: 'Hospitalet de Llobregat', sub_path: '/fontaneros-hospitalet' },
                        { name: 'Badalona', sub_path: '/fontaneros-badalona' },
                        { name: 'Sabadell', sub_path: '/fontaneros-sabadell' }
                    ]
                },
                mode: 'production'
            }
        );
        
        console.log(`✅ MISIÓN LANZADA. Job ID: ${jobId}`);
        console.log('El orquestador procesará la misión en segundo plano o modo failsafe.');
    } catch (error) {
        console.error('❌ ERROR AL LANZAR LA MISIÓN:', error);
    }
}

main();
