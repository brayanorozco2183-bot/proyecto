import { performance } from 'perf_hooks';
import { AIFacade } from '../tools/aiFacade.js';
import { agentMemoryStore } from '../ai/agentMemory.js';
import { getAgentRoutingProfile } from '../ai/agentRegistry.js';
import { buildAgentModelManifest } from '../ai/modelRouter.js';

const SAMPLE_PROMPTS: Record<string, { agentName: string; promptFamily: string; prompt: string; json?: boolean }[]> = {
  research: [
    {
      agentName: 'SEO_Analyst_01',
      promptFamily: 'research_json',
      json: true,
      prompt: 'Devuelve JSON con primaryKeyword, secondaryKeywords y entities para "cerrajeros" en "Getafe". Mantén la respuesta pequeña y válida.',
    },
  ],
  planning: [
    {
      agentName: 'Content_Architect_01',
      promptFamily: 'planning_json',
      json: true,
      prompt: 'Devuelve JSON con h1, hero y una sección faq mínima para una landing local de cerrajeros en Getafe.',
    },
  ],
  writing: [
    {
      agentName: 'Content_Writer_01',
      promptFamily: 'writer_json',
      json: true,
      prompt: 'Devuelve JSON con intro y items para una sección services_grid sobre cerrajeros en Getafe. Máximo 180 palabras.',
    },
  ],
  critic: [
    {
      agentName: 'Niche_Coherence_Auditor',
      promptFamily: 'critic_html',
      json: false,
      prompt: 'Corrige este HTML manteniendo estructura: <section><p>En Getafe, la seguridad en tu hogar es una prioridad y nuestros cerrajeros expertos atienden puertas.</p></section>',
    },
  ],
};

async function runOne(agentName: string, model: string, promptFamily: string, prompt: string, json = false) {
  const started = performance.now();
  const response = await AIFacade.callOllama(agentName, prompt, model, {
    json,
    timeoutMs: 60000,
    maxRetries: 1,
    temperature: 0.2,
    numPredict: 600,
  });
  const duration = performance.now() - started;
  return { duration, responseLength: String(response || '').length };
}

async function main() {
  const manifest = buildAgentModelManifest();

  for (const item of manifest) {
    const routing = getAgentRoutingProfile(item.agentName);
    const samples = SAMPLE_PROMPTS[routing.capability] || SAMPLE_PROMPTS.operations || [];
    if (!samples.length || routing.deterministicOnly) continue;

    for (const sample of samples.filter((entry) => entry.agentName === item.agentName)) {
      try {
        const result = await runOne(sample.agentName, item.selectedModel, sample.promptFamily, sample.prompt, sample.json);
        await agentMemoryStore.upsertBenchmark({
          agentName: sample.agentName,
          capability: routing.capability,
          model: item.selectedModel,
          promptFamily: sample.promptFamily,
          successRate: 1,
          avgDurationMs: result.duration,
          avgResponseLength: result.responseLength,
          notes: 'Single sample benchmark run',
        });
        console.log(`[benchmark] ${sample.agentName} -> ${item.selectedModel} OK (${Math.round(result.duration)}ms)`);
      } catch (error: any) {
        await agentMemoryStore.upsertBenchmark({
          agentName: sample.agentName,
          capability: routing.capability,
          model: item.selectedModel,
          promptFamily: sample.promptFamily,
          successRate: 0,
          avgDurationMs: 0,
          avgResponseLength: 0,
          notes: `Failed: ${error?.message || 'unknown error'}`,
        });
        console.warn(`[benchmark] ${sample.agentName} -> ${item.selectedModel} FAILED: ${error?.message || 'unknown error'}`);
      }
    }
  }
}

main().catch((error) => {
  console.error('[benchmark] failed', error);
  process.exit(1);
});
