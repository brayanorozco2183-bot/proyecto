
import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

async function verifyInterlinkingIntegration() {
    console.log('🚀 Iniciando Prueba de Integración Real de Interlinking (Producción Mirror)...');
    
    // 1. Limpiar y recrear estructura de producción para el test
    const baseDir = process.cwd();
    const outputDir = path.join(baseDir, 'output_sites');
    
    // Alcorcón y Móstoles (Dummies)
    const dummyPaths = [
        'fontaneros-alcorcon/servicios-tecnicos',
        'fontaneros-alcorcon/urgencias-24h',
        'fontaneros-mostoles/servicios-tecnicos'
    ];
    
    for (const dp of dummyPaths) {
        const fullPath = path.join(outputDir, dp);
        await fs.mkdir(fullPath, { recursive: true });
        await fs.writeFile(path.join(fullPath, 'index.html'), `<html>Mock ${dp}</html>`);
    }

    const pipeline = new ContentGenerationPipeline();
    const mission: GenerationMission = {
        niche: 'fontaneros',
        city: 'Getafe',
        local_nap: {
            business_name: 'Fontaneros Getafe Inter-Test',
            address: 'Calle de la Prueba 123, Getafe',
            phone: '+34 600 000 000'
        },
        siteConfig: {
            baseUrl: 'https://fontaneros-getafe.pro',
            brandName: 'Fontaneros Getafe Inter-Test'
        },
        mode: 'production'
    };

    (mission as any).cluster_folder_name = 'fontaneros-getafe';
    mission.subPath = 'servicios tecnicos';

    try {
        const start = Date.now();
        // El pipeline escribe automáticamente en output_sites si mission.mode es production
        const result = await pipeline.run(mission);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        if (result && result.html) {
            // El pipeline ya los guarda en output_sites/[cluster]/[subpath]/index.html
            const finalFilePath = path.join(outputDir, 'fontaneros-getafe', 'servicios-tecnicos', 'index.html');
            
            console.log(`✅ ¡ÉXITO! [${duration}s]`);
            console.log(`   - Archivo generado en ruta real: ${finalFilePath}`);

            const generatedHtml = result.html;

            // Verificación 1: Presencia del bloque
            if (generatedHtml.includes('Disponibilidad de fontaneros por Región')) {
                console.log('🔗 SEÑAL RECIBIDA: El bloque de interlinking está presente.');
            } else {
                console.error('❌ SEÑAL NO ENCONTRADA: El bloque de interlinking NO aparece.');
            }

            // Verificación 2: Links sin barra inicial (Relativos correctos)
            const relativeLinkPattern = /href="(\.\.\/\.\.\/fontaneros-alcorcon\/servicios-tecnicos\/)"/;
            const brokenLinkPattern = /href="\/(\.\.\/\.\.\/fontaneros-alcorcon\/servicios-tecnicos\/)"/;

            if (brokenLinkPattern.test(generatedHtml)) {
                console.error('❌ ERROR DETECTADO: Los links siguen teniendo la barra inicial "/../../"');
            } else if (relativeLinkPattern.test(generatedHtml)) {
                console.log('✅ VALIDACIÓN EXITOSA: Los links son relativos puros "../../"');
            } else {
                console.warn('⚠️ ADVERTENCIA: No se pudo validar el patrón de link esperado, revisa manualmente.');
            }
        }
    } catch (error: any) {
        console.error('❌ ERROR FATAL:', error.message);
    }
}

verifyInterlinkingIntegration().catch(console.error);
