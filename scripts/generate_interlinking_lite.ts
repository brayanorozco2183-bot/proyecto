
import { buildAutomaticInternalLinkBlocks } from '../src/internal-linking/autoBlocks.js';
import { sanitizeFinalRenderedHtml } from '../src/utils/finalDocumentSanitizer.js';
import fs from 'fs/promises';
import path from 'path';

async function generateLite() {
    console.log('🚀 Generando Página LITE para probar Interlinking...');

    const baseDir = process.cwd();
    const outputDir = path.join(baseDir, 'output_sites');

    // 1. Preparar estructura dummy
    const cities = [
        { folder: 'fontaneros-alcorcon', services: ['servicios-tecnicos', 'urgencias-24h'] },
        { folder: 'fontaneros-mostoles', services: ['servicios-tecnicos'] },
        { folder: 'fontaneros-getafe', services: ['servicios-tecnicos'] }
    ];

    for (const city of cities) {
        for (const service of city.services) {
            const fullPath = path.join(outputDir, city.folder, service);
            await fs.mkdir(fullPath, { recursive: true });
            await fs.writeFile(path.join(fullPath, 'index.html'), `<html>Mock ${city.folder}/${service}</html>`);
        }
    }

    // 2. Mock Graph & Plan para Getafe
    const graph: any = {
        nodes: [
            { id: 'node_getafe', type: 'home_local', slug: 'fontaneros-getafe/', city: 'Getafe', keyword: 'fontaneros' }
        ],
        edges: [],
        adjacency: {}
    };

    const plan: any = {
        currentNodeId: 'node_getafe',
        currentCity: 'Getafe',
        supporting: [],
        selected: [],
        all: [],
        grouped: {
            relatedServices: [],
            relatedAreas: [],
            relatedGuides: [],
            relatedFaqs: [],
            moneyPages: []
        }
    };

    const mission = {
        niche: 'fontaneros',
        city: 'Getafe',
        cluster_folder_name: 'fontaneros-getafe',
        subPath: 'servicios-tecnicos'
    };

    // 3. Generar el bloque
    console.log('🔗 Generando bloque de interlinking...');
    const blocks = await buildAutomaticInternalLinkBlocks(plan, graph, mission as any);
    const linkingHtml = blocks.map(b => b.html).join('\n');

    // 4. Montar HTML mínimo
    const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Test Lite Interlinking</title>
    <style>
        body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .nav-mock { background: #eee; padding: 10px; margin-bottom: 20px; }
        .internal-links-hub { padding: 2rem; border: 1px solid #ccc; border-radius: 8px; margin: 2rem 0; }
        .internal-links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; list-style: none; padding: 0; }
        .link-card { display: block; padding: 1rem; background: #f9f9f9; border: 1px solid #ddd; text-decoration: none; color: #333; }
        .link-card:hover { background: #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav-mock">Navbar de prueba</div>
        <h1>Página de Prueba: Getafe</h1>
        <p>Esta es una página ligera generada instantáneamente para probar que los enlaces de interlinking funcionen sin barra inicial.</p>
        <hr>
        ${linkingHtml || '<p>⚠️ No se generaron enlaces (vuelve a crear las carpetas dummy en output_sites si es necesario)</p>'}
        <hr>
        <footer>Footer de prueba</footer>
    </div>
</body>
</html>
    `;

    // 5. SANITIZAR (Aquí es donde se aplica el fix)
    console.log('🧹 Sanitizando HTML...');
    const sanitizedHtml = sanitizeFinalRenderedHtml(fullHtml, {
        city: 'Getafe',
        niche: 'fontaneros',
        businessName: 'Test Lite',
        phone: '600000000'
    });

    // 6. Guardar el resultado en la ruta real
    const finalFile = path.join(outputDir, 'fontaneros-getafe', 'servicios-tecnicos', 'index.html');
    await fs.mkdir(path.dirname(finalFile), { recursive: true });
    await fs.writeFile(finalFile, sanitizedHtml);

    console.log(`\n✅ ¡ÉXITO! Página lite generada en:`);
    console.log(`   ${finalFile}`);
    console.log('\nAbre este archivo y verifica que los enlaces a Alcorcón y Móstoles no tengan la barra "/" inicial.');
}

generateLite().catch(console.error);
