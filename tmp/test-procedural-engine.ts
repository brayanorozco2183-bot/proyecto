
import { resolveDesign, renderPage, GeneratedSection } from '../src/design-system/procedural-engine.js';

const mockSections: GeneratedSection[] = [
    {
        h2: "Experiencia profesional y trayectoria local",
        h3s: ["Décadas de servicio", "Equipo técnico", "Garantía"],
        html: "<p>Contenido de prueba sobre experiencia local en cerrajería.</p>"
    },
    {
        h2: "Servicios técnicos de cerrajería avanzada",
        h3s: ["Aperturas", "Bombines", "Cerraduras"],
        html: "<p>Detalles técnicos sobre servicios de cerrajería.</p>"
    },
    {
        h2: "Presupuesto honesto y tarifas claras",
        h3s: ["Sin sorpresas", "Transparencia", "Precios"],
        html: "<p>Información sobre precios y presupuestos de cerrajería.</p>"
    }
];

const mockData = {
    businessName: "Cerrajeros de Prueba",
    city: "Valencia",
    title: "Cerrajeros Valencia 24h",
    subtitle: "Servicio profesional y cercano en toda la capital",
    phone: "+34 960 000 000"
};

const seeds = ["seed-1", "seed-2", "seed-3"];

console.log("--- Starting Procedural Engine Test ---");

seeds.forEach(seed => {
    console.log(`\nTesting Seed: ${seed}`);
    const design = resolveDesign(seed, mockSections);
    console.log(`Selected Family: ${design.family}`);
    console.log(`Blueprint Hero: ${design.blueprint.hero}`);
    console.log(`Mapped Blocks: ${design.mappedBlocks.map(b => b.type).join(', ')}`);

    // Check rhythm rules
    const centeredLike = ['prose_intro', 'editorial_quote', 'faq_clean', 'trust_strip'];
    let centeredStreak = 0;
    design.mappedBlocks.forEach(block => {
        if (centeredLike.includes(block.type)) {
            centeredStreak++;
        } else {
            centeredStreak = 0;
        }
        if (centeredStreak > design.blueprint.maxCenteredInRow) {
            console.error(`!!!! RHYTHM VIOLATION in ${seed}: Too many centered blocks in a row.`);
        }
    });

    // Verify HTML generation doesn't crash
    try {
        const html = renderPage(seed, mockData, mockSections);
        console.log(`HTML generated successfully (${html.length} chars)`);
    } catch (e) {
        console.error(`!!!! HTML RENDER FAILED for ${seed}:`, e);
    }
});

console.log("\n--- Test Finished ---");
