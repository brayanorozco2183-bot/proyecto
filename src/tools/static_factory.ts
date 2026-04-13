import fs from 'fs/promises';
import path from 'path';

/**
 * StaticFactory - The 2026 Performance Engine.
 * Generates ultra-lightweight, SEO-perfect static pages.
 */
export class StaticFactory {
    private templateDir = path.join(process.cwd(), 'templates');
    private outputDir = path.join(process.cwd(), 'output_sites');

    async generatePage(data: {
        city: string;
        niche: string;
        content: string;
        schema: any;
        keywords: string[];
        subPath?: string;
        clusterFolderName?: string;
    }): Promise<string> {
        const basePath = data.clusterFolderName || `${data.niche.toLowerCase()}-${data.city.toLowerCase()}`;
        const finalPath = data.subPath ? path.join(basePath, data.subPath.toLowerCase().replace(/\s+/g, '-')) : basePath;
        const sitePath = path.join(this.outputDir, finalPath);
        await fs.mkdir(sitePath, { recursive: true });

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

        const filePath = path.join(sitePath, 'index.html');
        await fs.writeFile(filePath, html);
        return sitePath;
    }
}

export const staticFactory = new StaticFactory();