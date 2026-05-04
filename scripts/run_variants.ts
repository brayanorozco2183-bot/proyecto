import { execSync } from 'child_process';
import path from 'path';

/**
 * Automates the generation of 5 design variants for 'cerrajeros valencia'
 * using the Sandbox mode of the Orchestrator.
 */

async function runVariants() {
    const city = 'valencia';
    const niche = 'cerrajeros';
    const id = 'valencia_demo';

    const variants = [
        { suffix: 'v1', palette: 'premium_gold', typography: 'bebas_jakarta', composition: 'alternating' },
        { suffix: 'v2', palette: 'corporate_blue', typography: 'montserrat_poppins', composition: 'editorial' },
        { suffix: 'v3', palette: 'security_green', typography: 'inter_jakarta', composition: 'high_contrast' },
        { suffix: 'v4', palette: 'vibrant_orange', typography: 'bebas_jakarta', composition: 'solid' },
        { suffix: 'v5', palette: 'minimal_red', typography: 'inter_jakarta', composition: 'alternating' },
    ];

    console.log(`🚀 Iniciando generación de ${variants.length} variantes para ${niche} ${city}...\n`);

    for (const v of variants) {
        console.log(`---------------------------------------------------`);
        console.log(`📦 Generando Variante ${v.suffix}...`);
        console.log(`🎨 Paleta: ${v.palette} | ✍️ Tipo: ${v.typography} | 🏗 Comp: ${v.composition}`);
        
        const command = `npx tsx src/orchestrator/orchestrator.ts "@sandbox ${niche} ${city} --id=${id} --suffix=${v.suffix} --palette=${v.palette} --typography=${v.typography} --composition=${v.composition}"`;
        
        try {
            // Use inherit to see the progress of the orchestrator
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ Variante ${v.suffix} generada con éxito.`);
        } catch (error) {
            console.error(`❌ Error generando variante ${v.suffix}:`, error);
        }
    }

    console.log(`\n✨ Proceso de variantes completado.`);
    console.log(`📂 Revisa los resultados en public_static/${niche}-${city}-v1/ ... v5/`);
}

runVariants().catch(console.error);
