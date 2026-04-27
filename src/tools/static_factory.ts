import fs from 'fs/promises';
import path from 'path';

const IMAGE_FILE_RX = /\.(?:png|jpe?g|webp|gif|svg|avif)$/i;

function minifyInlineCss(css: string): string {
    return String(css || '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
}

function minifyHtmlForStaticDelivery(html: string): string {
    let out = String(html || '');
    if (!out) return out;

    out = out.replace(/<!--[\s\S]*?-->/g, (match) => {
        return /^<!--\[if|<!\[endif\]-->$/i.test(match.trim()) ? match : '';
    });

    out = out.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs, css) => {
        return `<style${attrs}>${minifyInlineCss(css)}</style>`;
    });

    out = out
        .replace(/>\s+</g, '><')
        .replace(/\n{2,}/g, '\n')
        .trim();

    return out;
}



function assertNoPublishLeaks(html: string): void {
    const raw = String(html || '');
    const patterns = [
        /\{\{.*?\}\}|\[\[.*?\]\]|__[^_]+__|\$\{.*?\}/i,
        /\ben\s*[\.,!?;:]/i,
        /\bidentity\s*,/i,
        /\bundefined\b|\bnull\b|\[object Object\]/i
    ];
    const hit = patterns.find((pattern) => pattern.test(raw));
    if (hit) {
        throw new Error(`StaticFactory publish blocked by unresolved output leak: ${hit}`);
    }
}

function sanitizeOutputPathToken(value?: string): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
}

function sanitizeNestedOutputPath(value?: string): string {
    return String(value || '')
        .split(/[\/]+/g)
        .map(segment => sanitizeOutputPathToken(segment))
        .filter(Boolean)
        .join('/');
}

function legacyOutputToken(value?: string): string {
    return String(value || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

function comparableToken(value?: string): string {
    return sanitizeOutputPathToken(value).replace(/-/g, '');
}

async function listFilesRecursive(dir: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) return listFilesRecursive(full);
            return [full];
        }));
        return files.flat();
    } catch {
        return [];
    }
}

async function pruneLegacyAliasDirectory(rootDir: string, normalizedRelativePath: string, legacyRelativePath: string): Promise<void> {
    const normalized = String(normalizedRelativePath || '').replace(/^\/+|\/+$/g, '');
    const legacy = String(legacyRelativePath || '').replace(/^\/+|\/+$/g, '');
    if (!normalized || !legacy || normalized === legacy) return;

    const targetDir = path.join(rootDir, normalized);
    const legacyDir = path.join(rootDir, legacy);

    try {
        const [targetStat, legacyStat] = await Promise.all([
            fs.stat(targetDir).catch(() => null),
            fs.stat(legacyDir).catch(() => null)
        ]);
        if (!targetStat?.isDirectory() || !legacyStat?.isDirectory()) return;

        const files = await listFilesRecursive(legacyDir);
        const containsImages = files.some(file => IMAGE_FILE_RX.test(file));
        if (containsImages) return;

        await fs.rm(legacyDir, { recursive: true, force: true });
        console.log(`[StaticFactory] Removed legacy alias directory without images: ${legacyDir}`);
    } catch (error: any) {
        console.warn(`[StaticFactory] Could not prune legacy alias ${legacyDir}: ${error.message}`);
    }
}


async function pruneComparableAliasDirectories(rootDir: string, normalizedRelativePath: string): Promise<void> {
    const segments = String(normalizedRelativePath || '').split(/[\/]+/g).filter(Boolean);
    if (!segments.length) return;

    let currentRoot = rootDir;
    for (const segment of segments) {
        try {
            const entries = await fs.readdir(currentRoot, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                if (entry.name === segment) continue;
                if (comparableToken(entry.name) !== comparableToken(segment)) continue;

                const aliasDir = path.join(currentRoot, entry.name);
                const files = await listFilesRecursive(aliasDir);
                const containsImages = files.some(file => IMAGE_FILE_RX.test(file));
                if (containsImages) continue;

                await fs.rm(aliasDir, { recursive: true, force: true });
                console.log(`[StaticFactory] Removed comparable alias directory without images: ${aliasDir}`);
            }
        } catch {
            return;
        }

        currentRoot = path.join(currentRoot, segment);
    }
}

/**
 * StaticFactory - The 2026 Performance Engine.
 * Generates ultra-lightweight, SEO-perfect static pages.
 */
export class StaticFactory {
    private templateDir = path.join(process.cwd(), 'templates');
    private outputDir = path.join(process.cwd(), 'output_sites');
    private publicStaticDir = path.join(process.cwd(), 'public-static');

    async generatePage(data: {
        city: string;
        niche: string;
        content: string;
        schema: any;
        keywords: string[];
        subPath?: string;
        clusterFolderName?: string;
    }): Promise<string> {
        const normalizedBasePath = sanitizeOutputPathToken(data.clusterFolderName)
            || `${sanitizeOutputPathToken(data.niche)}-${sanitizeOutputPathToken(data.city)}`;
        const normalizedSubPath = sanitizeNestedOutputPath(data.subPath);
        const finalPath = normalizedSubPath ? path.join(normalizedBasePath, normalizedSubPath) : normalizedBasePath;

        const legacyBasePath = data.clusterFolderName
            ? legacyOutputToken(data.clusterFolderName)
            : `${String(data.niche || '').toLowerCase()}-${String(data.city || '').toLowerCase()}`;
        const legacySubPath = data.subPath ? legacyOutputToken(data.subPath) : '';
        const legacyFinalPath = legacySubPath ? path.join(legacyBasePath, legacySubPath) : legacyBasePath;

        const sitePath = path.join(this.outputDir, finalPath);
        const publicStaticPath = path.join(this.publicStaticDir, finalPath);
        await fs.mkdir(sitePath, { recursive: true });
        await fs.mkdir(publicStaticPath, { recursive: true });

        // Si el contenido ya es un documento HTML completo (Premium Templates), lo usamos directamente
        let html = data.content;

        // Detección robusta de documento completo (DOCTYPE o estructura HTML básica)
        const isFullDocument = html.trim().toLowerCase().startsWith('<!doctype html>') ||
            (html.includes('<html') && html.includes('<head>') && html.includes('<body'));

        if (isFullDocument) {
            // Inyectar Schema dinámicamente si falta
            if (data.schema && !html.includes('application/ld+json')) {
                const schemaInject = `<script type="application/ld+json">\n${JSON.stringify(data.schema, null, 2)}\n</script>\n</head>`;
                html = html.replace('</head>', schemaInject);
            }
        } else {
            const keywordList = (data.keywords || []).map(k => {
                const kwText = typeof k === 'object' && k !== null ? (k as any).kw : k;
                return `<li>Experiencia profesional en <strong>${kwText}</strong></li>`;
            }).join('');

            html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.niche} en ${data.city} | Experto Local</title>
    <meta name="description" content="Servicios profesionales de ${data.niche} en ${data.city}. Calidad garantizada y atención inmediata.">
    <style>
        :root { --p: #2563eb; --t: #1f2937; --bg: #ffffff; }
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: var(--t); margin: 0; padding: 0; }
        header { background: var(--p); color: white; padding: 2rem 1rem; text-align: center; }
        main { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        .hero { font-size: 1.25rem; font-weight: bold; border-left: 4px solid var(--p); padding-left: 1rem; margin-bottom: 2rem; }
        .content { font-size: 1.125rem; }
        footer { background: #f3f4f6; padding: 2rem; text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 4rem; }
        script[type="application/ld+json"] { display: none; }
    </style>
    <script type="application/ld+json">
        ${JSON.stringify(data.schema)}
    </script>
</head>
<body>
    <header>
        <h1>${data.niche} en ${data.city}</h1>
        <p>Tu mejor opción local en ${data.city}</p>
    </header>
    <main>
        <div class="hero">Especialistas en ${data.niche} - Servicio Geo-Localizado</div>
        <article class="content">
            ${data.content}
        </article>
        <section style="margin-top: 3rem; padding: 1.5rem; background: #f9fafb; border-radius: 8px;">
            <h3>¿Por qué elegirnos en ${data.city}?</h3>
            <ul>
                ${keywordList}
            </ul>
        </section>
    </main>
    <footer>
        <p>&copy; 2026 ${data.niche} ${data.city}. Todos los derechos reservados.</p>
        <p>Desplegado por SEO Maestro Ultra - High Performance Engine</p>
    </footer>
</body>
</html>
            `;
        }

        assertNoPublishLeaks(html);
        html = minifyHtmlForStaticDelivery(html);

        const filePath = path.join(sitePath, 'index.html');
        const publicStaticFilePath = path.join(publicStaticPath, 'index.html');
        await fs.writeFile(filePath, html);
        await fs.writeFile(publicStaticFilePath, html);

        await pruneLegacyAliasDirectory(this.outputDir, finalPath, legacyFinalPath);
        await pruneLegacyAliasDirectory(this.publicStaticDir, finalPath, legacyFinalPath);
        await pruneComparableAliasDirectories(this.outputDir, finalPath);
        await pruneComparableAliasDirectories(this.publicStaticDir, finalPath);

        return sitePath;
    }
}

export const staticFactory = new StaticFactory();
