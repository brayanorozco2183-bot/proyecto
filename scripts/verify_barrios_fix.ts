import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { prepareClusterArtifacts } from '../src/internal-linking/pipelineAdapters.js';
import { resolveInternalLinkPlan } from '../src/internal-linking/linkPlanner.js';
import { buildAutomaticInternalLinkBlocks } from '../src/internal-linking/autoBlocks.js';
import { buildSiteGraph } from '../src/internal-linking/siteGraph.js';

async function verifyBarriosLogic() {
    console.log("🔍 Verifying Interlinking Barrios Logic...");

    const mission = {
        niche: "carpinteros",
        city: "Barcelona",
        cluster_data: {
            geo: [
                { name: "Gràcia", sub_path: "carpinteros/gracia/barcelona" },
                { name: "Eixample", sub_path: "carpinteros/eixample/barcelona" },
                { name: "Sants", sub_path: "carpinteros/sants/barcelona" }
            ],
            topical: []
        }
    };

    console.log("1. Building Site Graph...");
    const graph = buildSiteGraph(mission as any);
    
    // Check if we have the nodes
    const primaryService = graph.nodes.find(n => n.type === 'service' && n.pageSubtype === 'primary');
    const graciaNode = graph.nodes.find(n => n.type === 'service_area' && n.areaName === 'Gràcia');

    if (!primaryService || !graciaNode) {
        console.error("❌ Error: Essential nodes not found in graph.");
        console.log("Nodes found:", graph.nodes.map(n => `${n.id} (${n.type})`));
        return;
    }
    console.log(`✅ Found primary service: ${primaryService.id}`);
    console.log(`✅ Found area node: ${graciaNode.id}`);

    console.log("\n2. Testing Plan for Gràcia neighborhood...");
    const plan = resolveInternalLinkPlan(graph, graciaNode.id);

    console.log("Plan results:");
    console.log(`- currentNodeType: ${plan.currentNodeType}`);
    console.log(`- upward target: ${plan.upward?.targetSlug} (${plan.upward?.rule})`);
    console.log(`- lateral links: ${plan.grouped.relatedAreas.length}`);
    plan.grouped.relatedAreas.forEach(l => console.log(`  * ${l.targetSlug} (${l.anchor})`));

    // Verification 1: upward link to primary service
    if (plan.upward?.targetId === primaryService.id) {
        console.log("✅ SUCCESS: Gràcia links upward to primary Barcelona service.");
    } else {
        console.error("❌ FAILURE: Gràcia does NOT link upward to primary service correctly.");
        console.log("Actual upward:", plan.upward);
    }

    // Verification 2: lateral links to siblings
    if (plan.grouped.relatedAreas.length > 0) {
        console.log(`✅ SUCCESS: Found ${plan.grouped.relatedAreas.length} lateral links to sibling areas.`);
    } else {
        console.error("❌ FAILURE: No lateral links found for neighborhood.");
    }

    console.log("\n3. Testing Automatic Blocks for Gràcia...");
    const autoBlocks = buildAutomaticInternalLinkBlocks(plan);
    if (autoBlocks.length > 0 && autoBlocks[0].id === 'related-areas') {
        console.log("✅ SUCCESS: Specialized 'related-areas' block generated.");
        console.log(`- Block H2: ${autoBlocks[0].h2}`);
        console.log(`- Block HTML: ${autoBlocks[0].html}`);
    } else {
        console.error("❌ FAILURE: Specialized 'related-areas' block NOT generated.");
        console.log("Blocks found:", autoBlocks.map(b => b.id));
    }
}

verifyBarriosLogic().catch(console.error);
