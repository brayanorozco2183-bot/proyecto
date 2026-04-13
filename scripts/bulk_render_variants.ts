import fs from 'fs/promises';
import path from 'path';
import { renderPage } from '../src/design-system/procedural-engine.js';
import { ResolvedPageRenderPlan } from '../src/types/design.js';

async function bulkRender() {
    const variants = ['variante2', 'variante3', 'variante4', 'variante5', 'variante6', 'variante7', 'variante8', 'variante9', 'variante10', 'variante11'];
    const inputDir = path.join(process.cwd(), 'backups', 'baselines', 'baseline_v1');
    const outputDir = path.join(process.cwd(), 'backups', 'baselines', 'v1_renders');
    const contentPath = path.join(process.cwd(), 'debug_draft.json');

    await fs.mkdir(outputDir, { recursive: true });

    let contentBlocks: any[] = [];
    try {
        const contentRaw = await fs.readFile(contentPath, 'utf8');
        contentBlocks = JSON.parse(contentRaw);
    } catch (e) {
        console.error("❌ Failed to load debug_draft.json. Using fallback content.");
        contentBlocks = [{ h2: "Fallback", html: "<p>Content not found.</p>", metadata: { block_type: 'generic' } }];
    }

    console.log(`🚀 Bulk Rendering ${variants.length} Variants...`);

    for (const vName of variants) {
        const planPath = path.join(inputDir, `resolved_${vName}.json`);
        try {
            const planRaw = await fs.readFile(planPath, 'utf8');
            const resolvedPlan: ResolvedPageRenderPlan = JSON.parse(planRaw);

            // Ensure visualSystem has required fields for the engine
            if (!resolvedPlan.visualSystem.pageComposition) {
                resolvedPlan.visualSystem.pageComposition = 'editorial';
            }

            // Map content blocks to sections
            const engineSections = resolvedPlan.sections.map((section, idx) => {
                const contentBlock = contentBlocks[idx % contentBlocks.length];
                return {
                    h2: contentBlock.h2 || section.sectionId,
                    h3s: [],
                    html: contentBlock.html || '<p>Contenido de prueba.</p>',
                    blockType: section.blockType as any,
                    sectionId: section.sectionId
                };
            });

            const data = {
                title: "Auditoría de Diseño: " + vName,
                city: "Madrid",
                phone: "912 345 678",
                subtitle: "Prueba visual del sistema de diseño contract-based.",
                businessName: "Madrid Cerrajeros 24h"
            };

            const html = renderPage(
                { seed: vName },
                data,
                engineSections,
                resolvedPlan.visualSystem.family,
                '',
                resolvedPlan.pageType,
                resolvedPlan.hero.template,
                resolvedPlan.visualSystem.pageComposition,
                {
                    title: "Diseño " + vName + " | Cerrajeros Madrid",
                    metaDescription: "Vista previa del diseño para " + vName,
                    canonical: "https://serviciosprofesionales.pro/" + vName + "/"
                },
                [],
                null, // layoutContract
                resolvedPlan
            );

            const outputPath = path.join(outputDir, `${vName}.html`);
            await fs.writeFile(outputPath, html);
            console.log(` ✅ Rendered: ${vName} -> ${outputPath}`);
        } catch (e: any) {
            console.error(` ❌ Failed ${vName}:`, e.message);
        }
    }
    
    console.log(`\n✨ Rendering Complete. All variants available in: ${outputDir}`);
}

bulkRender().catch(err => {
    console.error("❌ Bulk render failed:", err);
    process.exit(1);
});
