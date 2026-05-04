/**
 * E2E Test: Reformas de Cocina en Madrid
 * Generates:
 *   1. Frozen baseline page
 *   2. 3 design variants from the frozen state (sandbox mode)
 */
import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../types/pipeline_v2.js';
import fs from 'fs/promises';
import path from 'path';

const FREEZE_ID = 'reformas-cocina-madrid';
const OUT_DIR = path.join(process.cwd(), 'output', 'reformas-cocina-madrid');

const BASE_MISSION: GenerationMission = {
    niche: 'Reformas de Cocina',
    city: 'Madrid',
    local_nap: {
        business_name: 'Reformas Cocinas Madrid Expertos',
        address: 'Calle Gran Vía, 15, 28013 Madrid',
        phone: '+34 910 00 00 00'
    },
    entities: ['reformas de cocina madrid', 'renovación cocina', 'cocinas a medida', 'presupuesto reforma cocina', 'empresa reformas madrid'],
    contextual_data: {
        wordCountTarget: 1800
    },
    siteConfig: {
        baseUrl: 'https://reformascocinasexpertosmadrid.es',
        brandName: 'Reformas Cocinas Madrid Expertos'
    }
};

async function saveOutput(filename: string, html: string): Promise<void> {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const filePath = path.join(OUT_DIR, filename);
    await fs.writeFile(filePath, html, 'utf-8');
    console.log(`✅ Guardado: ${filePath}`);
}

async function saveFrozenState(id: string, state: any): Promise<void> {
    const dir = path.join(process.cwd(), 'backups', 'frozen');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    console.log(`❄️  Estado frozen guardado en: ${filePath}`);
}

async function loadFrozenState(id: string): Promise<any | null> {
    const filePath = path.join(process.cwd(), 'backups', 'frozen', `${id}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

// ─── PHASE 1: BASELINE GENERATION ────────────────────────────────────────────
async function generateBaseline(pipeline: ContentGenerationPipeline): Promise<void> {
    console.log('\n\n╔══════════════════════════════════════════╗');
    console.log('║   FASE 1: GENERACIÓN BASE (FREEZE)       ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const mission: GenerationMission = {
        ...BASE_MISSION,
        mode: 'freeze',
        freezeId: FREEZE_ID
    };

    const start = Date.now();
    const result = await pipeline.run(mission);
    const duration = Math.round((Date.now() - start) / 1000);

    if (!result) {
        throw new Error('❌ La generación base falló - el pipeline retornó null.');
    }

    console.log(`\n🎉 BASELINE completado en ${duration}s`);
    console.log(`   ├── Palabras: ${result.metadata.totalWords}`);
    console.log(`   ├── QA Score: ${result.metadata.qaScore}`);
    console.log(`   ├── H1: ${result.metadata.h1}`);
    console.log(`   └── Issues: ${(result.metadata.issues || []).length}`);

    await saveOutput('baseline.html', result.html);

    // We also persist the state manually for sandbox variants
    // (the pipeline already saves it to backups/frozen internally when mode=freeze)
    console.log(`\n📦 Estado frozen listo con ID: ${FREEZE_ID}`);
}

// ─── PHASE 2: DESIGN VARIANTS GENERATION ─────────────────────────────────────
interface VariantConfig {
    name: string;
    filename: string;
    designOverrides: NonNullable<GenerationMission['designOverrides']>;
}

const VARIANTS: VariantConfig[] = [
    {
        name: 'Variante 1: Editorial Oscuro',
        filename: 'variant-01-editorial-dark.html',
        designOverrides: {
            dna: {
                family: 'editorial',
                surfaceStyle: 'glassmorphic',
                motionProfile: 'fluid',
                heroTreatment: 'centered',
                sectionCadence: 'cinematic',
                tensionCurve: ['hero', 'proof', 'services', 'testimonial', 'faq', 'cta'],
            },
            pageProfile: {
                hero_variant: 'centered',
                page_composition: 'editorial',
            },
            forcedPalette: 'dark-editorial',
            forcedTypography: 'display-serif'
        }
    },
    {
        name: 'Variante 2: Conversión Limpia',
        filename: 'variant-02-conversion-clean.html',
        designOverrides: {
            dna: {
                family: 'conversion',
                surfaceStyle: 'flat',
                motionProfile: 'subtle',
                heroTreatment: 'split',
                sectionCadence: 'alternating',
                tensionCurve: ['hero', 'services', 'proof', 'cta', 'faq'],
            },
            pageProfile: {
                hero_variant: 'split',
                page_composition: 'conversion',
            },
            forcedPalette: 'light-clean',
            forcedTypography: 'geometric-sans'
        }
    },
    {
        name: 'Variante 3: Autoridad Premium',
        filename: 'variant-03-authority-premium.html',
        designOverrides: {
            dna: {
                family: 'authority',
                surfaceStyle: 'layered',
                motionProfile: 'dynamic',
                heroTreatment: 'stacked',
                sectionCadence: 'calm',
                tensionCurve: ['hero', 'authority', 'services', 'proof', 'faq', 'cta'],
            },
            pageProfile: {
                hero_variant: 'stacked',
                page_composition: 'authority',
            },
            forcedPalette: 'premium-dark',
            forcedTypography: 'humanist-serif'
        }
    }
];

async function generateVariants(pipeline: ContentGenerationPipeline): Promise<void> {
    console.log('\n\n╔══════════════════════════════════════════╗');
    console.log('║   FASE 2: GENERACIÓN DE 3 VARIANTES      ║');
    console.log('╚══════════════════════════════════════════╝\n');

    for (let i = 0; i < VARIANTS.length; i++) {
        const variant = VARIANTS[i];
        console.log(`\n── ${variant.name} (${i + 1}/${VARIANTS.length}) ──────────────────────`);

        const mission: GenerationMission = {
            ...BASE_MISSION,
            mode: 'sandbox',
            freezeId: FREEZE_ID,
            designOverrides: variant.designOverrides
        };

        const start = Date.now();
        const result = await pipeline.run(mission);
        const duration = Math.round((Date.now() - start) / 1000);

        if (!result) {
            console.warn(`⚠️  ${variant.name} falló - saltando...`);
            continue;
        }

        console.log(`   ✅ Completado en ${duration}s — Palabras: ${result.metadata.totalWords}, Issues: ${(result.metadata.issues || []).length}`);
        await saveOutput(variant.filename, result.html);
    }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  E2E TEST: Reformas de Cocina en Madrid           ║');
    console.log('║  Modo: Frozen Baseline + 3 Design Variants        ║');
    console.log('╚══════════════════════════════════════════════════╝');

    const pipeline = new ContentGenerationPipeline();

    // Check if frozen state already exists (to allow a resume run)
    const frozenExists = await loadFrozenState(FREEZE_ID);

    if (!frozenExists) {
        await generateBaseline(pipeline);
    } else {
        console.log(`\n♻️  Frozen state detectado. Omitiendo generación base y pasando directamente a variantes.`);
    }

    await generateVariants(pipeline);

    console.log('\n\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ FLUJO COMPLETO FINALIZADO                     ║');
    console.log(`║  Outputs en: output/reformas-cocina-madrid/        ║`);
    console.log('╚══════════════════════════════════════════════════╝\n');
}

main().catch(err => {
    console.error('💥 FALLO CRÍTICO:', err.message);
    process.exit(1);
});
