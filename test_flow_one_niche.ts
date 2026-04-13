import { TaskOrchestrator } from './src/orchestrator/orchestrator.js';

const orchestrator = new TaskOrchestrator();

async function runTest() {
    console.log('🚀 Iniciando prueba de flujo para Fontaneros en Valencia...');
    console.log('Esta misión verificará todo el pipeline: Análisis, Arquitectura, Redacción y QA.');
    
    try {
        const jobId = await orchestrator.startMission(
            'Fontaneros', 
            ['Valencia'], 
            'publish', 
            { 
                mode: 'publish', 
                site_type: 'static'
            }
        );
        console.log(`\n✅ Misión iniciada con ID: ${jobId}`);
        console.log(`\nLos archivos se generarán en output_sites/`);
    } catch (err) {
        console.error('\n❌ Error al iniciar la misión:', err);
    }
}

runTest();
