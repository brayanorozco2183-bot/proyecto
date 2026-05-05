import { repairRenderedHtmlForPhase } from '../src/repair/pageRepairKit.js';
import { analyzeTechnicalIntegrity } from '../src/quality/technicalIntegrityGate.js';
import { getProceduralGlobalStyles } from '../src/design-system/proceduralStyles.js';
import fs from 'fs';

async function runManualFlowTest() {
    console.log("=== GRAVITY MANUAL FLOW TEST ===");

    // 1. Verificar CSS
    console.log("\n[1/3] Verificando Procedural CSS...");
    const css = getProceduralGlobalStyles();
    if (css.includes("Gravity Conversion UX Super Patch") && css.includes("Gravity Delivery Stable CSS")) {
        console.log("✅ CSS Procedural cargado correctamente con todos los parches.");
    } else {
        console.log("❌ Error: CSS incompleto o faltan parches.");
    }

    // 2. Stress Test del Sanitizador
    console.log("\n[2/3] Stress Test del Sanitizador (Placeholders)...");
    const dirtyHtml = `
        <html>
            <body>
                <h1>Servicio de Cerrajeros en [CIUDAD]</h1>
                <p>Factor 1: La seguridad es clave.</p>
                <p>Criterio 3: Rapidez en la llegada.</p>
                <p>En , podemos ayudarte.</p>
                <div>undefined</div>
                <span>{{PLACEHOLDER_TEXT}}</span>
                <img src="placeholder.jpg" alt="[IMAGEN]">
            </body>
        </html>
    `;

    const repairedHtml = repairRenderedHtmlForPhase(dirtyHtml, 'completeness', {
        city: "Valencia",
        niche: "cerrajeros",
        businessName: "Cerrajeros Valencia Pro",
        phone: "+34 960 00 00 00"
    });

    const report = analyzeTechnicalIntegrity(repairedHtml);
    
    if (report.passed) {
        console.log("✅ Sanitización exitosa: Placeholders eliminados.");
    } else {
        console.log("❌ Fallo de integridad técnica:");
        console.log(JSON.stringify(report.issues, null, 2));
    }

    // 3. Verificación de links y NAP
    console.log("\n[3/3] Verificando NAP y Estructura...");
    if (repairedHtml.includes("Valencia") && repairedHtml.includes("+34 960 00 00 00")) {
        console.log("✅ Datos NAP (Valencia / Teléfono) inyectados correctamente.");
    } else {
        console.log("❌ Error: Datos NAP no encontrados en el HTML reparado.");
    }

    console.log("\n=== TEST FINALIZADO ===");
}

runManualFlowTest();
