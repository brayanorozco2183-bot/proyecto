import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';

async function main() {
    console.log('🐞 INICIANDO MISIÓN DEBUG: Cerrajeros en Madrid');
    
    const orchestrator = new TaskOrchestrator();
    
    try {
        const jobId = await orchestrator.startMission(
            'cerrajeros', 
            ['Madrid'], 
            'draft', 
            {
                local_nap: {
                    business_name: 'Madrid Lock Expert',
                    address: 'Calle Mayor, Madrid',
                    phone: '912 00 00 00'
                },
                mode: 'debug',
                debugMode: true
            }
        );
        
        console.log(`✅ MISIÓN LANZADA. Job ID: ${jobId}`);
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

main();
