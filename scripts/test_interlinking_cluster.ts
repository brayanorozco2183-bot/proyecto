/**
 * TEST DE INTERLINKING: Cerrajeros en Madrid
 * Ciudad principal + 3 barrios
 * Valida que el siteGraph genere correctamente nodos home_local + service_area
 * y que los enlaces internos fluyan ciudad -> barrio y barrio -> ciudad.
 */

import { buildSiteGraph } from '../src/internal-linking/siteGraph.js';
import { buildSiteNodes } from '../src/internal-linking/siteGraph.js';
import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import type { GenerationMission } from '../src/types/pipeline_v2.js';

const NICHE = 'cerrajeros';
const CITY  = 'Madrid';

// ─── Misión con clúster geo de 3 barrios ───────────────────────────────────
const mission: GenerationMission = {
    missionId:         `interlinking-test-${Date.now()}`,
    niche:             NICHE,
    city:              CITY,
    mode:              'production',
    debugMode:         true,
    softMode:          true,
    clusterFolderName: `${NICHE}-${CITY.toLowerCase()}`,

    local_nap: {
        business_name: 'Cerrajeros Madrid Centro',
        address:       'Calle Gran Vía, 1, Madrid',
        phone:         '910 000 001',
    },

    cluster_data: {
        // Páginas geográficas: ciudad hub + 3 barrios
        geo: [
            { name: CITY,           sub_path: 'index.html',            kind: 'home_local' as any },
            { name: 'Malasaña',     sub_path: 'malasana/index.html',   kind: 'service_area' as any },
            { name: 'Lavapiés',     sub_path: 'lavapies/index.html',   kind: 'service_area' as any },
            { name: 'Salamanca',    sub_path: 'salamanca/index.html',  kind: 'service_area' as any },
        ],
        topical: [],
    },
};

// ─── 1. Validación del grafo ANTES de generar ──────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('  🔍 FASE 1: Validación del SiteGraph');
console.log('══════════════════════════════════════════════');

const graph = buildSiteGraph(mission);
const nodes = buildSiteNodes(mission);

console.log(`\n📊 Nodos generados: ${nodes.length}`);
for (const node of nodes) {
    const parentInfo = node.parent ? ` ← parent: ${node.parent}` : ' (ROOT)';
    const areaInfo   = node.areaName ? ` [área: ${node.areaName}]` : '';
    console.log(`  [${node.type.padEnd(14)}] ${node.title || node.keyword}${areaInfo}  →  slug: ${node.slug}${parentInfo}`);
}

console.log(`\n🔗 Aristas (links internos): ${graph.edges.length}`);
for (const edge of graph.edges) {
    const from = graph.nodes.find(n => n.id === edge.from);
    const to   = graph.nodes.find(n => n.id === edge.to);
    console.log(`  "${from?.title || edge.from}" ──[${edge.rel}]──> "${to?.title || edge.to}" (peso: ${edge.weight})`);
}

// ─── 2. Generación real del HTML de la ciudad hub ──────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('  🚀 FASE 2: Generando HTML del hub (Madrid)');
console.log('══════════════════════════════════════════════\n');

const pipeline = new ContentGenerationPipeline();

try {
    const result = await (pipeline as any).run(mission);
    if (result?.success) {
        const outPath = result.data?.html_path || result.outputPath || '(en memoria)';
        console.log(`\n✅ Página hub generada en: ${outPath}`);

        // Extraer y mostrar los enlaces internos del HTML generado
        const html: string = result.data?.html || result.html || '';
        if (html) {
            const linkMatches = [...html.matchAll(/href="([^"]*(?:malasa|lavap|salama|madrid)[^"]*)"/gi)];
            console.log(`\n🔗 Hrefs relevantes encontrados en el HTML generado (${linkMatches.length}):`);
            for (const m of linkMatches) {
                console.log(`   → ${m[1]}`);
            }
            if (linkMatches.length === 0) {
                console.warn('  ⚠️  No se encontraron enlaces a barrios en el HTML. Revisar el bloque "internal_links_hub".');
            }
        }
    } else {
        console.error(`❌ Pipeline falló:`, result?.error || 'Sin detalle');
    }
} catch (err) {
    console.error(`💥 Error catastrófico:`, err);
}

console.log('\n══════════════════════════════════════════════');
console.log('  ✔ Test de interlinking completado');
console.log('══════════════════════════════════════════════\n');
