
import fs from 'node:fs';
import path from 'node:path';
import { renderPage } from '../src/design-system/procedural-engine.js';
import { corporateGoldTheme } from '../src/design-system/themes/corporateGold.js';

const masterclassDir = path.join(process.cwd(), 'src/config/design-masterclasses');
const showcaseDir = path.join(process.cwd(), 'showcase');

if (!fs.existsSync(showcaseDir)) fs.mkdirSync(showcaseDir);

// Leer los archivos del nuevo pack (tomamos los primeros 24 para el showcase)
const allFiles = fs.readdirSync(masterclassDir).filter(f => f.endsWith('.json')).sort();
const selectedFiles = allFiles.slice(0, 24);

console.log(`Generating showcase for ${selectedFiles.length} premium templates...`);

const results: any[] = [];

selectedFiles.forEach((file, index) => {
    const mcPath = path.join(masterclassDir, file);
    const mc = JSON.parse(fs.readFileSync(mcPath, 'utf-8'));
    
    const fileName = `premium_${file.replace('.json', '.html')}`;
    const outputPath = path.join(showcaseDir, fileName);

    const resolvedPlan = {
        theme: corporateGoldTheme,
        visualSystem: {
            family: 'asymmetric_premium',
            surfaceStyle: 'glass',
            visualSystem: 'mixed',
            pageComposition: 'editorial',
            navbarTreatment: 'glass',
            footerTreatment: 'prestige',
            cadence: 'cinematic',
            contrastModel: 'dramatic',
            spacingScale: 'airy',
            cardTreatment: 'glass'
        },
        sections: [
            { sectionId: 'hero', blockType: 'hero', h2: mc.title, html: `<p>Estilo: ${mc.architecture?.layout_paradigm || 'Standard'}</p>` },
            { sectionId: 'services', blockType: 'services_grid', h2: 'Excelencia Premium', html: '<p>Contenido renderizado con control total de tokens y CSS inyectado.</p>' }
        ]
    };

    const html = renderPage({
        niche: 'Elite Services',
        city: 'Showcase City',
        h1: mc.title,
        meta: {
            title: `${mc.title} | Gravity 200 Pack`,
            description: `Visualización del diseño premium ${mc.id}`,
        },
        business: {
            business_name: 'MAESTRO ELITE',
            phone: '900 000 000',
            address: 'Luxury Avenue 77'
        },
        sections: resolvedPlan.sections.map(s => ({
            ...s,
            html: `<p>Este bloque demuestra la aplicación de los tokens inyectados: <strong>${mc.design_system_injection?.tokens?.primary || '#default'}</strong> como color primario y el paradigma <strong>${mc.architecture?.layout_paradigm}</strong>.</p>`
        })),
        resolvedPlan: resolvedPlan as any,
        pageType: 'service',
        masterclass: mc
    } as any);

    fs.writeFileSync(outputPath, html, 'utf-8');
    results.push({ 
        title: mc.title, 
        paradigm: mc.architecture?.layout_paradigm, 
        primary: mc.design_system_injection?.tokens?.primary,
        file: fileName 
    });
});

// Update Index Hub
const indexHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Gravity 200 PREMIUM Showcase</title>
    <style>
        body { background: #050505; color: #f4f4f5; font-family: 'Inter', system-ui; padding: 4rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .card { 
            background: #0f0f0f; 
            border: 1px solid #1f1f1f; 
            border-radius: 16px; 
            padding: 1.5rem; 
            text-decoration: none; 
            color: inherit; 
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .card:hover { border-color: var(--p-color); transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .badge { font-size: 0.65rem; text-transform: uppercase; padding: 0.3rem 0.6rem; border-radius: 6px; background: #27272a; margin-bottom: 1rem; display: inline-block; font-weight: 700; letter-spacing: 0.05em; }
        .paradigm-badge { background: #3b82f6; color: white; margin-left: 0.5rem; }
        h1 { font-size: 3rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.04em; }
        .subtitle { color: #a1a1aa; margin-bottom: 4rem; font-size: 1.2rem; }
        .color-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
        .view-link { margin-top: 1.5rem; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    </style>
</head>
<body>
    <h1>Premium 200 Pack</h1>
    <p class="subtitle">Auditoría de los nuevos diseños con inyección de Control Total.</p>
    <div class="grid">
        ${results.map(r => `
            <a href="showcase/${r.file}" class="card" style="--p-color: ${r.primary}">
                <span class="badge">Gravity Premium</span>
                <span class="badge paradigm-badge">${r.paradigm}</span>
                <h3>${r.title}</h3>
                <div style="display: flex; align-items: center; margin-top: 1rem; font-size: 0.8rem; color: #71717a;">
                    <span class="color-dot" style="background: ${r.primary}"></span>
                    <span>Primario: ${r.primary}</span>
                </div>
                <div class="view-link" style="color: ${r.primary}">Ver Realidad Aumentada →</div>
            </a>
        `).join('')}
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(process.cwd(), 'index_showcase.html'), indexHtml, 'utf-8');
console.log('Showcase Hub updated at index_showcase.html');
