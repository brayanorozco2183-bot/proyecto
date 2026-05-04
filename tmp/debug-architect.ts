
import { ContentArchitectAgent } from '../src/agents/architect.js';
import { ContentVarietyAgent } from '../src/agents/contentVarietyAgent.js';
import { DesignGenerator } from '../src/design-system/generator.js';
import { vault } from '../src/tools/vault.js';
import dotenv from 'dotenv';

dotenv.config();

async function debug() {
    console.log("Starting Full Phase 3 Debug...");
    const architect = new ContentArchitectAgent();
    const varietyEngine = new ContentVarietyAgent();
    
    // Simulate input for Ruzafa
    const input = {
        niche: "Cerrajeros",
        city: "Ruzafa",
        silo_structure: ["Ruzafa", "Benimaclet", "El Carmen"],
        word_count_target: 2000,
        entities: ["Cerrajero Ruzafa", "Urgencias 24h", "Apertura de puertas"],
        cluster_data: { geo: ["Calle Sueca", "Calle Cádiz", "Mercado de Ruzafa"] },
        local_nap: {
            business_name: "Cerrajeros Ruzafa Gorkita",
            address: "Calle de Ruzafa, Valencia",
            phone: "960 000 000"
        }
    };

    try {
        console.log("--- Phase 3.1: Architect ---");
        const architectResponse = await architect.execute(input);
        console.log("Architect Success:", architectResponse.success);
        
        if (!architectResponse.success) {
            console.log("Architect Error:", architectResponse.error);
            return;
        }

        const blueprint = architectResponse.data;
        console.log("--- Phase 3.2: Variety Engine ---");
        const varietyResult = await varietyEngine.execute({
            h1: blueprint.h1,
            sections: blueprint.sections
        });
        console.log("Variety Success:", varietyResult.success);
        if (!varietyResult.success) {
            console.log("Variety Error:", varietyResult.error);
        }

        console.log("--- Phase 3.3: Design Generator ---");
        const designGenerator = new DesignGenerator(`${input.niche}-${input.city}`.toLowerCase());
        const designVariant = designGenerator.generate();
        console.log("Design Variant Seed:", designVariant.seed);

        const successfulPlan = {
            ...blueprint,
            design: {
                pageFamily: designVariant.artDirection as any,
                designTokens: designVariant.tokens,
                visualVariantId: designVariant.seed,
                composition: Object.keys(designVariant.componentSelection)[0]
            },
            pageProfile: varietyResult.data?.profile,
            meta_description: blueprint.meta_description || `Especialistas en ${input.niche} en ${input.city}.`
        };

        console.log("Full Plan Successful!");
        console.log(JSON.stringify(successfulPlan, null, 2));

    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

debug();
