import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { vault } from '../tools/vault.js';
import { comfyClient } from './comfy/client.js';
import { PageImageContext } from './types.js';
import { buildBriefForSlot } from './comfy/promptFactory.js';

function isProvisionalImage($node: cheerio.Cheerio<any>): boolean {
    const status = String($node.attr('data-image-status') || '').toLowerCase();
    const img = $node.find('img').first();
    const src = String(img.attr('src') || '');
    const caption = $node.find('figcaption').first().text().trim().toLowerCase();

    return status === 'provisional'
        || src.startsWith('data:image/svg+xml')
        || caption.includes('imagen provisional')
        || caption.includes('sustituye automáticamente')
        || caption.includes('sustituible por imagen real');
}



function normalizeOutputSlug(outputSlug?: string): string | null {
    const normalized = String(outputSlug || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '');

    return normalized || null;
}

function buildPageLocalSrc(fileName: string): string {
    const normalized = String(fileName || '').replace(/^\.?\/+/, '');
    return `./${normalized}`;
}



function normalizeComparableSegment(value: string): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

async function directoryHasImages(dir: string): Promise<boolean> {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (await directoryHasImages(full)) return true;
                continue;
            }
            if (/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(entry.name)) return true;
        }
    } catch {
        return false;
    }
    return false;
}

async function pruneAliasFolders(rootDir: string, normalizedOutputSlug: string): Promise<void> {
    const segments = String(normalizedOutputSlug || '').split('/').filter(Boolean);
    if (!segments.length) return;

    let currentRoot = rootDir;
    for (const segment of segments) {
        const targetComparable = normalizeComparableSegment(segment);
        let entries: any[] = [];
        try {
            entries = await fs.readdir(currentRoot, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (entry.name === segment) continue;
            if (normalizeComparableSegment(entry.name) !== targetComparable) continue;

            const aliasDir = path.join(currentRoot, entry.name);
            if (await directoryHasImages(aliasDir)) continue;

            await fs.rm(aliasDir, { recursive: true, force: true });
            console.log(`[finalizePageImages] Removed alias folder without images: ${aliasDir}`);
        }

        currentRoot = path.join(currentRoot, segment);
    }
}

function inferSectionTitle($: any, node: any): string | undefined {
    const $node = $(node);
    const previousHeading = $node.prevAll().find('h2').last().text().trim();
    if (previousHeading) return previousHeading;

    const wrapperHeading = $node.parent().prevAll().find('h2').last().text().trim();
    if (wrapperHeading) return wrapperHeading;

    return undefined;
}

export async function finalizePageImages(html: string, context: PageImageContext): Promise<string> {
    if (!vault.COMFY_ENABLED) {
        return html;
    }

    const $ = cheerio.load(html, { decodeEntities: false });
    const candidates = $('[data-image-slot]').toArray();
    const normalizedOutputSlug = normalizeOutputSlug(context.outputSlug);

    for (const node of candidates) {
        const $node = $(node);
        if (!isProvisionalImage($node)) continue;

        const slot = String($node.attr('data-image-slot') || '').trim();
        if (!slot) continue;

        const sectionTitle = inferSectionTitle($, node);
        const brief = buildBriefForSlot(slot, sectionTitle, context);

        try {
            const asset = await comfyClient.generateImage(brief);
            const $img = $node.find('img').first();
            if (!$img.length) continue;

            // --- Lógica de Ruteo Real: Copiar imagen a la carpeta del sitio y su espejo público ---
            if (normalizedOutputSlug) {
                const destinationRoots = [
                    path.join(process.cwd(), 'output_sites'),
                    path.join(process.cwd(), 'public-static')
                ];

                try {
                    for (const rootDir of destinationRoots) {
                        const siteDir = path.join(rootDir, normalizedOutputSlug);
                        const destPath = path.join(siteDir, asset.filename);
                        await fs.mkdir(siteDir, { recursive: true });
                        await fs.copyFile(asset.localPath, destPath);
                        await pruneAliasFolders(rootDir, normalizedOutputSlug);
                    }

                    // Forzamos src relativo a la misma carpeta del index.html
                    $img.attr('src', buildPageLocalSrc(asset.filename));
                } catch (copyError) {
                    console.error(`[finalizePageImages] Error al copiar imagen local de página:`, copyError);
                    $img.attr('src', asset.publicUrl); // Fallback al ruteo original
                }
            } else {
                $img.attr('src', asset.publicUrl);
            }

            $img.attr('alt', asset.alt);
            $img.attr('data-image-origin', 'comfy');

            const $caption = $node.find('figcaption').first();
            if ($caption.length && asset.caption) {
                $caption.text(asset.caption);
            }

            $node.attr('data-image-status', 'generated');
            $node.attr('data-image-provider', 'comfy');
            $node.attr('data-image-workflow', asset.workflowId);

            if (Array.isArray(asset.appliedLoras) && asset.appliedLoras.length) {
                $node.attr('data-image-loras', asset.appliedLoras.join(', '));
            }
        } catch (error: any) {
            $node.attr('data-image-status', 'fallback');
            $node.attr('data-image-error', String(error?.message || error).slice(0, 180));
        }
    }

    return $.html();
}


