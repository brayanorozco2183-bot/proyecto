import { orchestrator } from '../orchestrator/orchestrator.js';
import { dbManager } from '../db/index.js';

async function runLargeFlowTest() {
    console.log('🚀 Iniciando Prueba de Flujo Grande (5 Nichos)...');

    const testMissions = [
        { niche: 'Carpinteros', location: 'Barcelona' },
        { niche: 'Pintores', location: 'Madrid' },
        { niche: 'Electricistas', location: 'Valencia' },
        { niche: 'Cerrajeros', location: 'Sevilla' },
        { niche: 'Fontaneros', location: 'Bilbao' }
    ];

    try {
        // Aseguramos que el orquestador esté inicializado
        // (La clase TaskOrchestrator hace gran parte de la inicialización en el constructor)
        
        for (const mission of testMissions) {
            console.log(`\n[TEST] Lanzando misión: ${mission.niche} en ${mission.location}...`);
            
            const jobId = await orchestrator.startMission(
                mission.niche, 
                [mission.location], 
                'publish', 
                { site_type: 'static', mode: 'production' }
            );
            
            console.log(`[TEST] Misión aceptada. JobId: ${jobId}`);
            
            // Si no estamos en modo Redis (failsafeMode), la misión se procesa de forma síncrona
            // dentro de startMission -> processMissionLogic.
            // Si estamos en modo Redis, se añade a la cola y el worker la procesará.
        }

        console.log('\n✅ Todas las misiones han sido enviadas al orquestador.');
        console.log('Monitorea los logs en la base de datos o en la consola del orquestador.');

    } catch (error) {
        console.error('❌ Error fatal durante la prueba de flujo:', error);
        process.exit(1);
    }
}

// Ejecutar el test
runLargeFlowTest().then(() => {
    // No cerramos el proceso inmediatamente para dejar que el orquestador trabaje
    // si está ejecutando en el mismo hilo (Modo Failsafe).
    console.log('Esperando a que las misiones finalicen o se estabilicen...');
});
