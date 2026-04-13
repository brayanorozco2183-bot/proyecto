import fs from 'fs/promises';
import path from 'path';
import { RenderPlanResolver } from '../src/renderers/renderPlanResolver.js';
import { VarietyResult } from '../src/agents/contentVarietyAgent.js';

async function testResolver() {
    const variants = ['variante2', 'variante3', 'variante4', 'variante5', 'variante6', 'variante7', 'variante8', 'variante9', 'variante10', 'variante11'];
    const baselineDir = path.join(process.cwd(), 'backups', 'baselines', 'baseline_v1');
    await fs.mkdir(baselineDir, { recursive: true });

    console.log(`🚀 Testing RenderPlanResolver with ${variants.length} variants...`);
    
    for (const vName of variants) {
        const variantPath = path.join(process.cwd(), 'backups', 'frozen', `${vName}.json`);
        try {
            const rawData = await fs.readFile(variantPath, 'utf8');
            const data = JSON.parse(rawData);
            const plan = data.plan;

            const variety: VarietyResult = {
                h1: plan.h1,
                profile: {
                    ...plan.pageProfile,
                    designDNA: plan.design?.dna
                },
                sections: plan.sections
            };

            const resolved = RenderPlanResolver.resolve(
                vName, 
                plan.intentModel || { pageType: 'service' }, 
                variety,
                plan.layoutContract
            );

            const outputPath = path.join(baselineDir, `resolved_${vName}.json`);
            await fs.writeFile(outputPath, JSON.stringify(resolved, null, 2));
            console.log(` ✅ Resolved: ${vName} -> ${outputPath}`);
        } catch (e: any) {
            console.error(` ❌ Failed ${vName}:`, e.message);
        }
    }
    
    console.log(`\n✨ Batch Processing Complete. All plans saved to: ${baselineDir}`);
}

testResolver().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
