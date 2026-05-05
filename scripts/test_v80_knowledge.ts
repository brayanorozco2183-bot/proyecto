import { orchestrator } from '../src/orchestrator/orchestrator.js';

async function main() {
    console.log('🚀 LANZANDO MISIÓN DE PRUEBA V8.0: Electricistas en Barcelona');
    console.log('Objetivo: Verificar integración de neighborhoods y conocimiento premium.');
    
    try {
        // Usamos el orquestador global (singleton) para que el Dashboard lo detecte
        const jobId = await orchestrator.startMission(
            'electricistas', 
            ['Barcelona', 'Eixample', 'Gracia', 'Poblenou'], 
            'draft', 
            {
                local_nap: {
                    business_name: 'BCN Electricistas Pro',
                    address: 'Carrer de Mallorca, Barcelona',
                    phone: '932 00 00 00'
                },
                is_cluster: true,
                debugMode: false
            }
        );
        
        console.log(`✅ MISIÓN LANZADA CORRECTAMENTE.`);
        console.log(`ID de Misión: ${jobId}`);
        console.log(`\nVe al Dashboard (Audit View) para monitorear el progreso en tiempo real.`);
    } catch (error) {
        console.error('❌ ERROR AL LANZAR LA MISIÓN:', error);
    }
}

main();
