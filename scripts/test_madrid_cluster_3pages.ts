import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';

async function testMadridInterlinkingCluster() {
    const orchestrator = new TaskOrchestrator();
    
    const niche = "electricistas";
    const city = "Madrid";
    const neighborhood1 = "Chamberí";
    const neighborhood2 = "Retiro";
    
    // El primer elemento es la raíz del cluster (Ciudad)
    // Los siguientes son los barrios
    const locations = [city, neighborhood1, neighborhood2];
    
    console.log(`\n🚀 [INTERLINKING CLUSTER TEST]`);
    console.log(`NICHO: ${niche}`);
    console.log(`PÁGINAS: ${locations.join(', ')}\n`);
    
    const options = {
        is_cluster: true,
        publish_mode: 'publish',
        mode: 'production',
        debugMode: true,
        site_type: 'web',
        withImages: true // Habilitar generación de imágenes con ComfyUI
    };

    try {
        const missionId = await orchestrator.startMission(niche, locations, 'publish', options);
        console.log(`\n✅ Misión de cluster iniciada. ID: ${missionId}`);
        console.log(`📁 Los resultados se generarán en: output_sites/electricistas-madrid-cluster/`);
        console.log(`🔍 Verifica:`);
        console.log(`   - index.html (Madrid)`);
        console.log(`   - chamberi/index.html`);
        console.log(`   - retiro/index.html`);
        console.log(`\n🔗 El sistema debería conectar automáticamente Madrid con sus barrios.`);
    } catch (error) {
        console.error("\n❌ Error al iniciar la misión de cluster:", error);
    }
}

testMadridInterlinkingCluster().catch(console.error);
