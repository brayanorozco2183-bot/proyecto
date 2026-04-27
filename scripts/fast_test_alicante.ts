import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { vault } from '../src/tools/vault.js';

async function fastTest() {
    console.log('=== INICIANDO TEST RÁPIDO: ALICANTE ELECTRICISTAS (BLE V2.2) ===');
    
    // Configuramos flags de velocidad
    process.env.PIPELINE_FAST_DEBUG = 'true'; 
    process.env.PIPELINE_SKIP_IMAGES = 'true';
    
    // Desactivamos ComfyUI explícitamente en el vault para este test
    vault.COMFY_ENABLED = false;

    const pipeline = new ContentGenerationPipeline();
    const missionId = `fast-test-alicante-${Date.now()}`;
    
    try {
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
            withImages: false,
            deliver: true
        });

        if (result && result.success) {
            console.log(`\n[EXITO] Misión finalizada correctamente.`);
            console.log(`Puntuación Editorial: ${result.data?.metadata?.qaScore || 'n/a'}`);
            console.log(`Ruta: ${result.data?.metadata?.output_path}`);
            
            if (result.data?.metadata?.validation_errors?.length) {
                console.log(`\nErrores de validación encontrados:`);
                result.data.metadata.validation_errors.forEach((err: string) => console.log(` - ${err}`));
            }
        } else {
            console.error(`\n[FALLO] La misión no se completó: ${result?.error || 'Error desconocido'}`);
        }
    } catch (error: any) {
        console.error(`\n[ERROR CRÍTICO] ${error.message}`);
    }
}

fastTest().catch(console.error);
