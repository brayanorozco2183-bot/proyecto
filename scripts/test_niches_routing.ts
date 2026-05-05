import { finalizePageImages } from '../src/images/finalizePageImages.js';
import { PageImageContext } from '../src/images/types.js';
import { vault } from '../src/tools/vault.js';
import fs from 'fs';
import path from 'path';

async function testNiche(niche: string, city: string) {
    console.log(`\n--- 🧪 Probando Nicho: ${niche} en ${city} ---`);
    
    const slug = `${niche.toLowerCase().replace(/\s+/g, '-')}-${city.toLowerCase()}`;
    const context: PageImageContext = {
        pageId: `test-${slug}`,
        niche: niche,
        city: city,
        h1: `${niche} Profesionales en ${city}`,
        outputSlug: slug
    };

    const mockHtml = `
        <html>
            <body>
                <h1>${context.h1}</h1>
                <div data-image-slot="hero-default" data-image-status="provisional">
                    <img src="data:image/svg+xml;base64,..." alt="Provisional">
                    <figcaption>Imagen provisional del servicio</figcaption>
                </div>
                <p>Contenido del servicio de ${niche}...</p>
                <h2>Nuestro proceso de trabajo</h2>
                <div data-image-slot="editorial-1" data-image-status="provisional">
                    <img src="data:image/svg+xml;base64,..." alt="Provisional support">
                    <figcaption>Sustituye automáticamente esta imagen</figcaption>
                </div>
            </body>
        </html>
    `;

    try {
        const resultHtml = await finalizePageImages(mockHtml, context);
        
        // Verificar si los archivos existen en la carpeta de salida
        const siteDir = path.join(process.cwd(), 'output_sites', slug);
        console.log(`✅ Finalizado para ${niche}.`);
        
        if (fs.existsSync(siteDir)) {
            const files = fs.readdirSync(siteDir);
            console.log(`📁 Archivos en ${slug}:`, files.filter(f => f.endsWith('.png')));
        } else {
            console.error(`❌ La carpeta ${siteDir} no fue creada.`);
        }
    } catch (error: any) {
        console.error(`❌ Error probando ${niche}:`, error.message);
    }
}

async function runAllTests() {
    if (!vault.COMFY_ENABLED) {
        console.error('COMFY_ENABLED=false. Actívalo para probar.');
        return;
    }

    const niches = [
        { name: 'Cerrajeros', city: 'Madrid' },
        { name: 'Fontaneros', city: 'Barcelona' },
        { name: 'Pintores', city: 'Valencia' },
        { name: 'Reformas Integrales', city: 'Alicante' }
    ];

    for (const niche of niches) {
        await testNiche(niche.name, niche.city);
    }
    
    console.log('\n--- 🏁 Pruebas completadas ---');
}

runAllTests();
