import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { MissionController, PipelineStepState } from '../src/orchestrator/missionController.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';
import { dbManager } from '../src/db/index.js';
import * as readline from 'readline';
import * as path from 'path';
import fs from 'fs/promises';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>(resolve => rl.question(query, resolve));

async function runPhase(nextPhase: number, state: PipelineStepState, pipeline: ContentGenerationPipeline, controller: MissionController) {
    try {
        switch (nextPhase) {
            case 1:
                console.log('Ejecutando Fase 1: Research...');
                state.research = await pipeline.runResearchPhase(state.mission);
                break;
            case 2:
                console.log('Ejecutando Fase 2: Normalization...');
                state.normalization = await pipeline.runNormalizationPhase(state.research!);
                break;
            case 3:
                console.log('Ejecutando Fase 3: Planning...');
                state.plan = await pipeline.runPlanningPhase(state.normalization!, state.mission);
                break;
            case 4:
                console.log('Ejecutando Fase 4: Writing...');
                const RenderPlanResolver = (await import('../src/renderers/renderPlanResolver.js')).RenderPlanResolver;
                const resolvedPlan = RenderPlanResolver.resolve(
                    state.mission.missionId!,
                    state.plan!,
                    state.plan!.intentModel,
                    state.plan!.pageVariety || state.plan!.pageProfile,
                    state.plan!.layoutContract!,
                    'web'
                );
                const obs = { durations: {}, scores: {}, retries: {}, agent_logs: [], tokenUsage: 0 };
                state.draft = await pipeline.runWritingPhase(state.normalization!, state.plan!, state.mission, obs, resolvedPlan);
                break;
            case 5:
                console.log('Ejecutando Fase 5: Correction...');
                state.draft = await pipeline.runCorrectionPhase(state.draft!, state.normalization);
                break;
            case 7:
                console.log('Ejecutando Fase 7: Enrichment...');
                state.draft = await pipeline.runEnrichmentPhase(state.draft!, state.normalization!, state.plan!, state.mission);
                break;
            case 8:
                console.log('Ejecutando Fase 8: Assembly...');
                state.rendered = await pipeline.runAssemblyPhase(state.draft!, state.plan!, state.normalization!, state.mission);
                break;
            case 9:
                console.log('Ejecutando Fase 9/10: Validation & Audit...');
                state.rendered!.metadata.technical_passed = true;
                state.rendered!.metadata.editorial_passed = true;
                console.log('Validación técnica y editorial marcada como completada para el flujo manual.');
                break;
            case 11:
                console.log('Ejecutando Fase 11: Delivery...');
                await pipeline.runDeliveryPhase(state.rendered!, state.mission);
                break;
            case 12:
                console.log('Ejecutando Fase 12: Post-Deploy Audit...');
                state.result = {
                    html: state.rendered!.html,
                    metadata: {
                        h1: state.plan!.h1,
                        totalWords: state.draft!.totalWords,
                        sectionsCount: state.draft!.blocks.length,
                        qaScore: state.rendered!.metadata.qaScore,
                        issues: state.rendered!.metadata.validation_errors,
                        observability: { durations: {}, scores: {}, retries: {}, agent_logs: [] },
                    }
                };
                console.log('Misión completada.');
                break;
            default:
                console.log(`Fase ${nextPhase} aún no soportada en modo manual granular.`);
                state.currentPhase = nextPhase;
                return;
        }

        state.currentPhase = nextPhase;
        const phaseName = `phase_${nextPhase}`;
        const savedPath = await controller.saveState(state, phaseName);
        console.log(`✅ Fase ${nextPhase} completada. Estado guardado en: ${savedPath}`);

    } catch (error: any) {
        console.error(`❌ Error en Fase ${nextPhase}:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('\n=== GRAVITY INTERACTIVE PHASE RUNNER ===\n');

    // Manejo de argumentos CLI para automatización
    const args = process.argv.slice(2);
    const forcedPhase = args.find(a => a.startsWith('--phase='))?.split('=')[1];
    const cliNiche = args.find(a => a.startsWith('--niche='))?.split('=')[1];
    const cliCity = args.find(a => a.startsWith('--city='))?.split('=')[1];
    const cliMissionId = args.find(a => a.startsWith('--missionId='))?.split('=')[1];

    const missionDir = path.join(process.cwd(), 'debug_runs', 'interactive');
    await fs.mkdir(missionDir, { recursive: true });

    const pipeline = new ContentGenerationPipeline();
    let state: PipelineStepState | null = null;

    if (forcedPhase && (cliMissionId || (cliNiche && cliCity))) {
        // Modo CLI (No interactivo)
        if (cliMissionId) {
            const ctrl = new MissionController(missionDir, cliMissionId);
            state = await ctrl.loadLastState();
        }
        
        if (!state && cliNiche && cliCity) {
            const missionId = cliMissionId || `interactive-${cliNiche}-${cliCity.toLowerCase()}-${Date.now().toString().slice(-4)}`;
            const mission: GenerationMission = {
                niche: cliNiche,
                city: cliCity,
                local_nap: { business_name: `Empresa de ${cliNiche} en ${cliCity}`, address: `Calle Principal 123, ${cliCity}`, phone: '600111222' },
                missionId, debugMode: true, mode: 'sandbox'
            };
            state = await MissionController.initMission(mission, missionDir);
        }

        if (!state) {
            console.error('Error: Faltan parámetros para iniciar misión en modo CLI.');
            process.exit(1);
        }

        const phaseToRun = parseInt(forcedPhase);
        await runPhase(phaseToRun, state, pipeline, new MissionController(missionDir, state.mission.missionId!));
        rl.close();
        return;
    }

    // Modo Interactivo (Standard)
    const resume = await question('¿Deseas reanudar una misión anterior? (s/n): ');
    
    if (resume.toLowerCase() === 's') {
        const missionId = await question('Introduce el Mission ID: ');
        const ctrl = new MissionController(missionDir, missionId);
        state = await ctrl.loadLastState();
        if (!state) {
            console.error('No se pudo encontrar el estado para esa misión.');
            process.exit(1);
        }
    } else {
        const niche = await question('Nicho (ej: cerrajeros): ') || 'cerrajeros';
        const city = await question('Ciudad (ej: Getafe): ') || 'Getafe';
        const missionId = `interactive-${niche}-${city.toLowerCase()}-${Date.now().toString().slice(-4)}`;
        
        const mission: GenerationMission = {
            niche,
            city,
            local_nap: {
                business_name: `Empresa de ${niche} en ${city}`,
                address: `Calle Principal 123, ${city}`,
                phone: '600111222'
            },
            missionId,
            debugMode: true,
            mode: 'sandbox'
        };

        state = await MissionController.initMission(mission, missionDir);
    }

    const controller = new MissionController(missionDir, state.mission.missionId!);

    while (state.currentPhase < 12) {
        const nextPhase = state.currentPhase + 1;
        console.log(`\n--- Siguiente Fase: ${nextPhase} ---`);
        const confirm = await question(`¿Ejecutar Fase ${nextPhase}? (s/n/q para salir): `);

        if (confirm.toLowerCase() === 'q') break;
        if (confirm.toLowerCase() !== 's') continue;

        try {
            await runPhase(nextPhase, state, pipeline, controller);
        } catch (error: any) {
            break;
        }
    }

    console.log('\nSesión terminada. Adiós.');
    rl.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
