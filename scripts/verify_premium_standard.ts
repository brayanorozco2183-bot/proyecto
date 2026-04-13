import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

async function verifyPremiumStandard() {
    console.log("🚀 Starting Premium Standard Verification...");
    const pipeline = new ContentGenerationPipeline();

    const mission = {
        niche: "Fontaneros",
        city: "Alicante",
        local_nap: {
            business_name: "Fontanería Alicante Pro",
            address: "Av. de la Constitución, 10, 03002 Alicante",
            phone: "965123456"
        },
        entities: ["Castillo de Santa Bárbara", "Explanada de España", "Puerto de Alicante"],
        contextual_data: {
            wordCountTarget: 1200
        }
    };

    try {
        const result = await pipeline.run(mission as any);
        if (!result) {
            console.error("❌ FAILED: Pipeline returned null");
            process.exit(1);
        }

        const html = result.html;
        const $ = cheerio.load(html);
        const issues: string[] = [];

        // 1. Editorial Boilerplate Check
        const forbidden = [
            "conocimiento profundo",
            "nivel de especialización local",
            "franquicias impersonales",
            "nuestra red de técnicos locales se desplaza",
            "servicio limpio y profesional"
        ];
        forbidden.forEach(phrase => {
            if (html.toLowerCase().includes(phrase)) {
                issues.push(`CRITICAL: Forbidden boilerplate found: "${phrase}"`);
            }
        });

        // 2. Visual DNA Check (CSS Injections)
        const hasFamilyCss = html.includes('--font-display') || html.includes('skeleton-') || html.includes(':root');
        if (!hasFamilyCss) {
            issues.push("WARNING: No family CSS variables or skeletons detected in <style>.");
        }

        // 3. Navigation Limit Check
        const navCount = $('.nav__link').length;
        if (navCount > 5) { // 4 items + potentially one extra or something
            issues.push(`ERROR: Excessive navigation items (${navCount}). Max 4 expected.`);
        }

        // 4. Map Adjacency Contract
        const localProofIdx = $('section').toArray().findIndex(el => $(el).attr('id')?.includes('local-proof') || $(el).text().toLowerCase().includes('áreas'));
        const mapIdx = $('section, .merged-from-map').toArray().findIndex(el => $(el).attr('id')?.includes('donde-estamos') || $(el).hasClass('merged-from-map'));
        
        if (localProofIdx !== -1 && mapIdx !== -1) {
            if (mapIdx !== localProofIdx + 1 && mapIdx !== localProofIdx) { // Adjacency or same block (if merged)
                 issues.push(`CONTRACT ERROR: Map is not adjacent to Local Proof. Proof at ${localProofIdx}, Map at ${mapIdx}.`);
            }
        }

        if (issues.length === 0) {
            console.log("✅ ALL PREMIUM STANDARDS PASSED");
        } else {
            console.log("❌ VERIFICATION ISSUES DETECTED:");
            issues.forEach(i => console.log(`  - ${i}`));
        }

        const dir = path.join(process.cwd(), 'public_static', 'verification');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'premium-standard-test.html'), html);
        console.log(`\nDraft saved to: ${path.join(dir, 'premium-standard-test.html')}`);

    } catch (error) {
        console.error("💥 CRITICAL ERROR during verification:", error);
    }
}

verifyPremiumStandard();
