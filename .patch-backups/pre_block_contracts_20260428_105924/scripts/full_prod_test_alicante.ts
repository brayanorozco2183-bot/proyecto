import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { vault } from '../src/tools/vault.js';

async function fullProdTest() {
    console.log('=== INICIANDO TEST CALIDAD PRODUCCIÓN: ALICANTE ELECTRICISTAS (BLE V2.4 + DISEÑO V3) ===');
    
    // Modo Producción Real (Sin atajos)
    process.env.PIPELINE_FAST_DEBUG = 'false'; // Activamos Quality Gate LLM (Phase 9.5)
    process.env.PIPELINE_SKIP_IMAGES = 'false'; // Intentamos generar imágenes reales
    process.env.PIPELINE_SOFT_MODE = 'false';  // Si algo falla, el sistema se detiene (Hardening V2.4)
    
    // Configuramos el vault para reflejar entorno de producción
    vault.DEBUG_MODE = true; // Pero mantenemos debug activo para revisión de artefactos
    vault.COMFY_ENABLED = true;

    const pipeline = new ContentGenerationPipeline();
    const missionId = `prod-test-alicante-${Date.now()}`;
    
    try {
        console.log(`[PROD] Lanzando misión completa con Auditoría LLM y Diseño V3...`);
        const result = await pipeline.run({
            missionId,
            niche: 'electricistas',
            city: 'Alicante',
            debugMode: true,
            local_nap: {
                business_name: "Alicante Electricistas Pro",
                address: "Calle Mayor 1, Alicante",
                phone: "910000000"
            }
        }, {
            withImages: true,
            deliver: true
        });

        if (result && result.success) {
            console.log(`\n[ÉXITO TOTAL] Misión de producción finalizada.`);
            console.log(`Puntuación Editorial (Quality Gate): ${result.data?.metadata?.qaScore || 'n/a'}/100`);
            console.log(`Diseño Seleccionado: ${result.data?.metadata?.visualDNA?.pageArchetype || 'n/a'}`);
            console.log(`Ruta Final: ${result.data?.metadata?.output_path}`);
            
            if (result.data?.metadata?.phaseRepairHistory) {
                console.log(`\nHistorial de Auto-Reparación (V2.3):`);
                console.log(JSON.stringify(result.data.metadata.phaseRepairHistory, null, 2));
            }
        } else {
            console.error(`\n[FALLO DE PRODUCCIÓN] La misión no alcanzó los estándares exigidos: ${result?.error || 'Error desconocido'}`);
            if (result?.data?.metadata?.validation_errors) {
                console.log('Errores detectados:', result.data.metadata.validation_errors);
            }
        }
    } catch (error: any) {
        console.error(`\n[ERROR CRÍTICO] ${error.message}`);
    }
}

fullProdTest().catch(console.error);
