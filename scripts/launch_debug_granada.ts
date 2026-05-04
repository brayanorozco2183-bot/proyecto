import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';

async function main() {
    console.log('🐞 RELANZANDO MISIÓN DEBUG: Electricistas en Granada (Corregida)');
    
    const orchestrator = new TaskOrchestrator();
    
    try {
        const jobId = await orchestrator.startMission(
            'electricistas', 
            ['Granada'], 
            'draft', 
            {
                local_nap: {
                    business_name: 'Granada Luz Pro',
                    address: 'Plaza Nueva, Granada',
                    phone: '958 00 00 00'
                },
                mode: 'debug',
                debugMode: true // Doble seguridad
            }
        );
        
        console.log(`✅ MISIÓN LANZADA. Job ID: ${jobId}`);
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

main();
