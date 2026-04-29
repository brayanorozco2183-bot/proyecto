import { execSync } from 'child_process';

/**
 * Generates 3 layout variants for the 'reformas-de-cocinas' project
 * to verify the diversity of the Layout Composer.
 */

async function runLayoutVariants() {
    const city = 'madrid';
    const niche = 'reformas-de-cocinas';
    const id = 'layout_test_full';

    const variants = [
        { suffix: 'v1-editorial', id: 'variante1', family: 'editorial', palette: 'modern_white', niche: 'reformas-de-cocinas', city: 'madrid' },
        { suffix: 'v2-conversion', id: 'variante2', family: 'conversion_heavy', palette: 'corporate_blue', niche: 'reformas-de-cocinas', city: 'madrid' },
        { suffix: 'v3-asymmetric', id: 'variante3', family: 'asymmetric_premium', palette: 'vibrant_orange', niche: 'reformas-de-cocinas', city: 'madrid' },
    ];

    console.log(`🚀 Iniciando generación de ${variants.length} variantes de LAYOUT para ${niche} ${city}...\n`);

    for (const v of variants) {
        console.log(`---------------------------------------------------`);
        console.log(`🏗️  Generando Variante de Estructura: ${v.suffix}...`);
        console.log(`👨‍👩‍👧‍👦 Familia: ${v.family} | 🎨 Paleta: ${v.palette}`);
        
        // El orquestador cargará 'layout_test_full' y al no encontrar layoutContract, lo generará.
        const command = `npx tsx src/orchestrator/orchestrator.ts "@sandbox ${v.niche} ${v.city} --id=${v.id} --suffix=${v.suffix} --family=${v.family} --palette=${v.palette}"`;
        
        try {
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ Variante ${v.suffix} generada en public_static/reformas-de-cocinas-madrid-${v.suffix}/`);
        } catch (error) {
            console.error(`❌ Error en variante ${v.suffix}:`, error);
        }
    }

    console.log(`\n✨ Proceso de variantes de layout completado.`);
}

runLayoutVariants().catch(console.error);
