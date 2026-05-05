import { comfyClient } from '../src/images/comfy/client.js';
import { buildBriefForSlot } from '../src/images/comfy/promptFactory.js';
import { PageImageContext } from '../src/images/types.js';
import { vault } from '../src/tools/vault.js';
import fs from 'fs';

async function runMultiTest() {
    console.log('\n===========================================');
    console.log('🧪 ComfyUI Multi-Scenario Generation Test');
    console.log('===========================================\n');

    if (!vault.COMFY_ENABLED) {
        console.error('❌ ERROR: COMFY_ENABLED está en false.');
        return;
    }

    const scenarios = [
        { niche: 'Cerrajeros', city: 'Madrid', business: 'Cerrajería Urgente Madrid' },
        { niche: 'Reformas de Baños', city: 'Valencia', business: 'Reformas Levante' },
        { niche: 'Limpieza de Oficinas', city: 'Sevilla', business: 'Sevilla Clean Pro' }
    ];

    for (let i = 0; i < scenarios.length; i++) {
        const s = scenarios[i];
        console.log(`\n[Scenario ${i+1}/3] 🏗️ Generando para ${s.niche} en ${s.city}...`);

        const context: PageImageContext = {
            pageId: `test-multi-${i}-${Date.now()}`,
            niche: s.niche,
            city: s.city,
            businessName: s.business,
            h1: `Expertos en ${s.niche} en ${s.city}`,
            outputSlug: 'test-multi'
        };

        const brief = buildBriefForSlot('hero-default', `Servicio de ${s.niche}`, context);
        
        try {
            const start = Date.now();
            const asset = await comfyClient.generateImage(brief);
            const duration = ((Date.now() - start) / 1000).toFixed(1);

            console.log(`   ✅ Completado en ${duration}s`);
            console.log(`   Ruta: ${asset.localPath}`);
            
            if (!fs.existsSync(asset.localPath)) {
                console.error('   ⚠️ Error: El archivo no se guardó correctamente.');
            }
        } catch (error: any) {
            console.error(`   ❌ ERROR: ${error.message}`);
        }
    }

    console.log('\n===========================================');
    console.log('🏁 Fin del test múltiple.');
    console.log('===========================================\n');
}

runMultiTest();
