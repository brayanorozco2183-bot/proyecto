import { comfyClient } from '../src/images/comfy/client.js';
import { buildBriefForSlot } from '../src/images/comfy/promptFactory.js';
import { PageImageContext } from '../src/images/types.js';
import { vault } from '../src/tools/vault.js';
import path from 'path';
import fs from 'fs';

async function runIsolatedTest() {
    console.log('\n===========================================');
    console.log('🧪 ComfyUI Isolated Generation Test');
    console.log('===========================================\n');

    if (!vault.COMFY_ENABLED) {
        console.error('❌ ERROR: COMFY_ENABLED está en false en el .env');
        return;
    }

    const context: PageImageContext = {
        pageId: 'test-isolated-' + Date.now(),
        niche: 'Pintores',
        city: 'Barcelona',
        businessName: 'Pinturas Pro Barcelona',
        h1: 'Pintores Profesionales en Barcelona',
        outputSlug: 'test-runs'
    };

    console.log(`[Config] Nicho: ${context.niche}`);
    console.log(`[Config] Ciudad: ${context.city}`);
    console.log(`[Config] Modelo: ${vault.COMFY_CHECKPOINT}`);
    console.log(`[Config] URL: ${vault.COMFY_BASE_URL}`);

    console.log('\n[Phase 1] Building prompt brief...');
    const brief = buildBriefForSlot('hero-default', 'Servicio de pintura integral en Barcelona', context);
    console.log(`   Prompt: ${brief.prompt.slice(0, 100)}...`);

    console.log('\n[Phase 2] Sending request to ComfyUI (This may take 15-60s)...');
    try {
        const start = Date.now();
        const asset = await comfyClient.generateImage(brief);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        console.log(`\n✅ ¡ÉXITO! Imagen generada en ${duration}s`);
        console.log(`   URL Pública: ${asset.publicUrl}`);
        console.log(`   Ruta Local: ${asset.localPath}`);
        console.log(`   Dimensiones: ${brief.width}x${brief.height}`);
        console.log(`   Workflow ID: ${asset.workflowId}`);

        if (fs.existsSync(asset.localPath)) {
            const stats = fs.statSync(asset.localPath);
            console.log(`   Tamaño archivo: ${(stats.size / 1024).toFixed(1)} KB`);
        } else {
            console.error('   ⚠️ ALERTA: La imagen no aparece en la ruta local esperada.');
        }

    } catch (error: any) {
        console.error('\n❌ ERROR DURANTE LA GENERACIÓN:');
        console.error(`   ${error.message}`);
        if (error.response) {
            console.error('   Detalles del servidor:', error.response.data);
        }
    }

    console.log('\n===========================================');
    console.log('🏁 Fin del test aislado.');
    console.log('===========================================\n');
}

runIsolatedTest();
