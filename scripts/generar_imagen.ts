import { comfyClient } from '../src/images/comfy/client.js';
import { PageImageBrief } from '../src/images/types.js';
import { vault } from '../src/tools/vault.js';
import path from 'path';
import fs from 'fs';

/**
 * 📝 INSTRUCCIONES:
 * 1. Cambia el valor de la variable 'PROMPT' a lo que quieras generar.
 * 2. Ejecuta el script con: npx tsx scripts/generar_imagen.ts
 */

// 👇 CAMBIA EL PROMPT AQUÍ 👇
const PROMPT = `changing a door lock`;

// 👇 OPCIONAL: CAMBIA EL NEGATIVE PROMPT AQUÍ 👇
const NEGATIVE_PROMPT = "text, watermark, logo, blurry, low quality, cartoon, 3d render, illustration";


async function main() {
    console.log('\n🚀 Iniciando generación de imagen con ComfyUI...');
    
    if (!vault.COMFY_ENABLED) {
        console.error('❌ ERROR: COMFY_ENABLED está desactivado en tu archivo .env');
        return;
    }

    // Preparamos los datos para la generación
    const brief: PageImageBrief = {
        pageId: 'prueba-manual-' + Date.now(),
        slot: 'hero-default',
        kind: 'hero',
        niche: 'Prueba Manual',
        city: 'Madrid',
        prompt: PROMPT,
        negativePrompt: NEGATIVE_PROMPT,
        alt: 'Imagen generada manualmente para prueba',
        seed: Math.floor(Math.random() * 1000000),
        width: 1024,
        height: 768,
        modelHints: {
            unet: vault.COMFY_UNET_MODEL,
            clip: vault.COMFY_CLIP_MODEL,
            t5: vault.COMFY_T5_MODEL,
            vae: vault.COMFY_VAE_MODEL
        }
    };

    console.log(`\n🖼️  Prompt: "${PROMPT}"`);
    console.log(`🌐 URL ComfyUI: ${vault.COMFY_BASE_URL}`);
    console.log(`⌛ Esperando respuesta (esto puede tardar de 30 a 90 segundos)...`);

    try {
        const start = Date.now();
        const result = await comfyClient.generateImage(brief);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        console.log(`\n✅ ¡Imagen generada con éxito en ${duration}s!`);
        console.log(`📍 Guardada en: ${result.localPath}`);
        
        if (fs.existsSync(result.localPath)) {
            console.log(`💾 Ruta absoluta: ${path.resolve(result.localPath)}`);
        } else {
            console.warn('⚠️  La imagen se generó pero no se encuentra en la ruta local esperada.');
        }

    } catch (error: any) {
        console.error('\n❌ Error durante la generación:');
        console.error(`   ${error.message}`);
        if (error.response) {
            console.error('   Detalles del servidor:', error.response.data);
        }
    }
}

main();
