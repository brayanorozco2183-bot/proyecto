import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';

async function testCityNeighborhoodCluster() {
    const orchestrator = new TaskOrchestrator();
    
    const niche = "cerrajeros";
    const city = "Getafe";
    const neighborhood = "El Bercial";
    
    // El primer elemento es la raíz del cluster (Ciudad/index.html)
    // El segundo elemento es el barrio (el-bercial/index.html)
    const locations = [city, neighborhood];
    
    console.log(`🚀 Iniciando misión de cluster para ${niche} en ${city} y barrio ${neighborhood}...`);
    
    const options = {
        is_cluster: true,
        publish_mode: 'publish',
        mode: 'production', // Cambiar a 'sandbox' si solo quieres probar la lógica sin llamar a LLM
        debugMode: true,
        site_type: 'web'
    };

    try {
        const missionId = await orchestrator.startMission(niche, locations, 'publish', options);
        console.log(`✅ Misión enviada al orchestrator. ID: ${missionId}`);
        console.log(`📁 Los resultados se generarán en: output_sites/cerrajeros-getafe/`);
        console.log(`🔍 Verifica index.html (Ciudad) y el-bercial/index.html (Barrio).`);
    } catch (error) {
        console.error("❌ Error al iniciar la misión:", error);
    }
}

testCityNeighborhoodCluster().catch(console.error);
