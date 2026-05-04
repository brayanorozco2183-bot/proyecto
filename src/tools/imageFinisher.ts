
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { finalizePageImages } from '../images/finalizePageImages.js';
import { vault } from './vault.js';
import { PageImageContext } from '../images/types.js';

function normalizeGeneratedImageSourcePath(src: string): string {
    return String(src || '')
        .trim()
        .replace(/[?#].*$/g, '')
        .replace(/^https?:\/\/[^/]+/i, '')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/^(?:\.\.\/|\.\/)+(?=(?:assets_generated|output_sites)\/)/, '');
}

function resolveGeneratedImageLocalPath(src: string): string | null {
    const raw = String(src || '').trim();
    if (!raw) return null;

    const cleaned = normalizeGeneratedImageSourcePath(raw);
    const comfyOutputDir = String(vault.COMFY_OUTPUT_DIR || 'assets_generated/page-images')
        .replace(/\\/g, '/')
        .replace(/^\.\//, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/g, '');

    const candidates = [
        path.resolve(process.cwd(), cleaned),
        path.resolve(process.cwd(), cleaned.replace(/^assets_generated\/page-images\//, `${comfyOutputDir}/`)),
        path.resolve(process.cwd(), cleaned.replace(/^assets_generated\//, 'assets_generated/')),
        path.resolve(process.cwd(), cleaned.replace(/^output_sites\//, 'output_sites/'))
    ];

    for (const candidate of candidates) {
        try {
            const stat = fsSync.statSync(candidate);
            if (stat.isFile()) return candidate;
        } catch {
            // continue
        }
    }

    return null;
}

async function rewriteImagesToPageLocal(filePath: string, html: string): Promise<string> {
    const $ = cheerio.load(html, { decodeEntities: false });
    const pageDir = path.dirname(filePath);

    for (const img of $('img').toArray()) {
        const $img = $(img);
        const src = String($img.attr('src') || '').trim();
        if (!src) continue;

        const localSource = resolveGeneratedImageLocalPath(src);
        if (!localSource) continue;

        const targetFileName = path.basename(localSource);
        const localTarget = path.join(pageDir, targetFileName);
        await fs.mkdir(pageDir, { recursive: true });
        if (path.resolve(localSource) !== path.resolve(localTarget)) {
            await fs.copyFile(localSource, localTarget);
        }
        $img.attr('src', `./${targetFileName}`);
    }

    return $.html();
}

/**
 * ImageFinisher - El Finalizador de Visiones.
 * Este script permite generar las imágenes pesadas (Flux/ComfyUI) 
 * de forma diferida, después de haber validado el contenido textual.
 */
async function processFile(filePath: string) {
    console.log(`\n[ImageFinisher] 🔍 Analizando: ${filePath}`);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Verificar si hay slots de imagen pendientes o provisionales
    const hasProvisional = $('[data-image-slot]').toArray().some(node => {
        const status = $(node).attr('data-image-status');
        const src = $(node).find('img').attr('src') || '';
        return status === 'provisional' || src.startsWith('data:image/svg+xml');
    });
    const hasGeneratedImagesToRelink = $('img').toArray().some(node => {
        const src = String($(node).attr('src') || '').trim();
        return Boolean(src) && (src.includes('assets_generated/page-images') || src.startsWith('/assets_generated/') || src.startsWith('../../assets_generated/'));
    });

    if (!hasProvisional && !hasGeneratedImagesToRelink) {
        console.log(`[ImageFinisher] ✨ No se encontraron imágenes provisionales ni rutas externas que relocalizar. Saltando.`);
        return;
    }

    // Extraer contexto semántico del HTML para que Flux sepa qué generar
    const title = $('title').text() || '';
    const h1 = $('h1').first().text() || '';
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    
    // Intentar deducir ciudad y nicho
    const h1Parts = h1.includes(' en ') ? h1.split(' en ') : [h1, ''];
    const niche = h1Parts[0]?.trim() || 'Servicios Profesionales';
    const city = h1Parts[1]?.replace(/[:].*/, '').trim() || 'España';

    const context: PageImageContext = {
        pageId: path.basename(path.dirname(filePath)),
        niche: niche,
        city: city,
        businessName: niche,
        phone: '', 
        h1: h1,
        heroSubtitle: metaDesc,
        canonical: canonical,
        outputSlug: path.basename(path.dirname(filePath))
    };

    console.log(`[ImageFinisher] 🎨 Iniciando generación de imágenes para: ${niche} en ${city}...`);

    try {
        const finalizedHtml = hasProvisional ? await finalizePageImages(html, context) : html;
        const pageLocalHtml = await rewriteImagesToPageLocal(filePath, finalizedHtml);
        await fs.writeFile(filePath, pageLocalHtml);
        console.log(`[ImageFinisher] ✅ Proceso completado con éxito para: ${filePath}`);
    } catch (e: any) {
        console.error(`[ImageFinisher] ❌ Error al procesar imágenes: ${e.message}`);
    }
}

async function run() {
    // Forzamos COMFY_ENABLED para que finalizePageImages no retorne inmediatamente
    // aunque esté desactivado en el .env global
    if (!vault.COMFY_ENABLED) {
        console.log('[ImageFinisher] 🚀 Activando motor ComfyUI temporalmente para esta sesión...');
        (vault as any).COMFY_ENABLED = true;
    }

    const outputDir = path.join(process.cwd(), 'output_sites');
    
    const findHtmlFiles = async (dir: string): Promise<string[]> => {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const files = await Promise.all(entries.map(async (entry) => {
                const res = path.resolve(dir, entry.name);
                if (entry.isDirectory()) {
                    return findHtmlFiles(res);
                } else if (entry.name === 'index.html') {
                    return [res];
                }
                return [];
            }));
            return files.flat();
        } catch (e) {
            return [];
        }
    };

    console.log(`[ImageFinisher] 📂 Escaneando directorio de salida: ${outputDir}`);
    const files = await findHtmlFiles(outputDir);
    
    if (files.length === 0) {
        console.log('[ImageFinisher] ℹ️ No se encontraron archivos index.html en output_sites.');
        return;
    }

    console.log(`[ImageFinisher] 🕒 Encontrados ${files.length} sitios. Procesando secuencialmente para no saturar la GPU...`);
    
    for (const file of files) {
        await processFile(file);
    }
    
    console.log('\n[ImageFinisher] 🎉 ¡Tarea completada! Todos los sitios han sido procesados.');
}

run().catch(err => {
    console.error('[ImageFinisher] FATAL ERROR:', err);
    process.exit(1);
});
