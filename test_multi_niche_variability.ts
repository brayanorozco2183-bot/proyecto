import { TaskOrchestrator } from './src/orchestrator/orchestrator.js';

const orchestrator = new TaskOrchestrator();

const testMissions = [
    { niche: 'Cerrajeros', cities: ['Madrid'] },
    { niche: 'Fontaneros', cities: ['Barcelona'] },
    { niche: 'Electricistas', cities: ['Valencia'] },
    { niche: 'Carpinteros', cities: ['Sevilla'] },
    { niche: 'Pintores', cities: ['Zaragoza'] }
];

async function runBulkTest() {
    console.log('🚀 Iniciando prueba de variabilidad multi-nicho (5 misiones)...');
    
    for (const mission of testMissions) {
        try {
            console.log(`📡 Lanzando misión para: ${mission.niche} en ${mission.cities.join(', ')}...`);
            const jobId = await orchestrator.startMission(
                mission.niche, 
                mission.cities, 
                'publish', 
                { 
                    mode: 'publish',
                    site_type: 'static'
                }
            );
            console.log(`✅ [${mission.niche}] Misión iniciada. ID: ${jobId}`);
            
            // Espera corta entre lanzamientos para no saturar el orquestador
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (err) {
            console.error(`❌ Fallo al iniciar misión para ${mission.niche}:`, err);
        }
    }
    
    console.log('\n---');
    console.log('🎯 Todas las misiones han sido encoladas.');
    console.log('Monitoriza el progreso en el dashboard o mediante los logs de la DB.');
}

runBulkTest();
