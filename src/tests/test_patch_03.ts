import { ContentArchitectAgent } from '../agents/architect.js';
import { LayoutComposerAgent } from '../agents/layoutComposerAgent.js';
import { ContentWriterAgent } from '../agents/contentWriterAgent.js';
import { vault } from '../tools/vault.js';

async function testAgents() {
    console.log("--- TEST PATCH 03: AGENTS LOGIC ---");

    const architect = new ContentArchitectAgent();
    const layout = new LayoutComposerAgent();
    const writer = new ContentWriterAgent();

    // 1. Test Architect
    console.log("\n1. Testing ArchitectAgent...");
    const architectResult = await architect.execute({
        niche: "Cerrajeros",
        city: "Madrid",
        silo_structure: ["Urgencias", "Apertura de puertas"],
        word_count_target: 1500,
        entities: ["cerradura", "bombín", "deshaucio"],
        intentModel: {
            pageType: 'service',
            primaryKeyword: 'cerrajeros madrid',
            intent: 'transactional',
            funnelStage: 'bottom',
            wordCountTarget: 1500
        }
    });

    if (architectResult.success) {
        console.log("✅ Architect success.");
        console.log("Blueprint Sections:", architectResult.data.sections.length);
    } else {
        console.error("❌ Architect failed.");
    }

    // 2. Test Layout Composer
    console.log("\n2. Testing LayoutComposerAgent...");
    const layoutResult = await layout.execute({
        blueprint: architectResult.data,
        niche: "Cerrajeros",
        city: "Madrid",
        pageType: "service",
        dna: { family: 'conversion_heavy' }
    });

    if (layoutResult.success) {
        console.log("✅ LayoutComposer success.");
        console.log("Visual Rhythm:", layoutResult.data.visualRhythm);
    } else {
        console.error("❌ LayoutComposer failed.");
    }

    // 3. Test ContentWriterAgent - Generic Niche (Safety Valve)
    console.log("\n3. Testing ContentWriterAgent Safety Valve (Generic Niche)...");
    const writerResult = await writer.execute({
        niche: "Multiservicio", // Should trigger safety valve
        city: "Madrid",
        section_h2: "Servicios profesionales en Madrid",
        subsections_h3: ["Reparaciones", "Mantenimiento"],
        local_nap: {
            business_name: "Test Business",
            address: "Calle Falsa 123",
            phone: "912345678"
        },
        blockType: "services_grid"
    });

    if (writerResult.success) {
        console.log("✅ Writer success.");
        console.log("Thoughts:", writerResult.thoughts);
        if (writerResult.thoughts?.toLowerCase().includes("determinis")) {
            console.log("✅ Safety valve correctly triggered deterministic mode.");
        } else {
            console.log("⚠️ Safety valve NOT triggered (Check thoughts above).");
        }
    } else {
        console.error("❌ Writer failed:", writerResult.error);
    }
}

testAgents().catch(console.error);
