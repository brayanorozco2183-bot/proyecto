import { TaskOrchestrator } from './src/orchestrator/orchestrator.js';

const orchestrator = new TaskOrchestrator();

async function runTest() {
    console.log('🚀 Reiniciando prueba para Pintores en Zaragoza...');
    console.log('Este test verificará que las señales de confianza (Pills) no se repitan y que la sanitización sea correcta.');
    
    try {
        const jobId = await orchestrator.startMission(
            'Pintores', 
            ['Zaragoza'], 
            'publish', 
            { 
                mode: 'publish', 
                site_type: 'static'
            }
        );
        console.log(`\n✅ Misión iniciada con ID: ${jobId}`);
        console.log(`\nLos archivos se generarán en output_sites/pintores-zaragoza/`);
    } catch (err) {
        console.error('\n❌ Error al iniciar la misión:', err);
    }
}

runTest();
