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
        { suffix: 'fam-editorial', family: 'editorial', palette: 'modern_white' },
        { suffix: 'fam-conversion', family: 'conversion_heavy', palette: 'corporate_blue' },
        { suffix: 'fam-trust', family: 'local_trust', palette: 'luxury_dark' },
        { suffix: 'fam-grid', family: 'technical_grid', palette: 'industrial_gray' },
        { suffix: 'fam-asymmetric', family: 'asymmetric_premium', palette: 'vibrant_orange' },
        { suffix: 'fam-minimal', family: 'minimal_authority', palette: 'soft_zen' },
    ];

    console.log(`🚀 Iniciando generación de ${variants.length} variantes de LAYOUT para ${niche} ${city}...\n`);

    for (const v of variants) {
        console.log(`---------------------------------------------------`);
        console.log(`🏗️  Generando Variante de Estructura: ${v.suffix}...`);
        console.log(`👨‍👩‍👧‍👦 Familia: ${v.family} | 🎨 Paleta: ${v.palette}`);
        
        // El orquestador cargará 'layout_test_full' y al no encontrar layoutContract, lo generará.
        const command = `npx tsx src/orchestrator/orchestrator.ts "@sandbox ${niche} ${city} --id=${id} --suffix=${v.suffix} --family=${v.family} --palette=${v.palette}"`;
        
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
