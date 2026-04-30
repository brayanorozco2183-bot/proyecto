import axios from 'axios';
import { agentMemoryStore, makePromptHash } from '../ai/agentMemory.js';
import { vault } from './vault.js';
import { resolveInstalledModel } from '../ai/modelAvailability.js';
import { resolveModelForAgent } from '../ai/modelRouter.js';
import { recordLlmTelemetry } from '../observability/llmTelemetry.js';
import { RuntimeControl } from '../utils/runtimeControl.js';

interface AIFacadeOptions {
  json?: boolean;
  timeoutMs?: number;
  timeout?: number;
  maxRetries?: number;
  fastFail?: boolean;
  fallbackResponse?: string | (() => string);
  numPredict?: number;
  maxTokens?: number;
  temperature?: number;
  jsonSchema?: any;
  missionId?: string;
  niche?: string;
  city?: string;
  scopeKey?: string;
}

export class AIFacade {
  private static failureCooldownUntil = 0;

  private static resolveFallbackResponse(fallbackResponse?: string | (() => string)): string | undefined {
    if (!fallbackResponse) return undefined;
    return typeof fallbackResponse === 'function' ? fallbackResponse() : fallbackResponse;
  }

  static async callOllama(
    agentName: string,
    prompt: string,
    model: string,
    options: AIFacadeOptions = {}
  ): Promise<string> {
    if (vault.AI_FACADE_ALLOW_MOCKS) {
      console.log(`[AIFacade] Mock Mode Active for ${agentName}.`);
      return this.getMockResponse(agentName, prompt);
    }

    const endpoint = `${vault.OLLAMA_URL}/api/generate`;
    
    // Tiered Model Fallback Chain
    const modelTiers = [
      model,                             // Original (Router assigned)
      'qwen2.5:latest',                  // Tier 1: Premium
      'qwen2.5-coder:3b',                // Tier 2: Competent
      'qwen2.5:1.5b',                    // Tier 3: Fast/Safety
      'qwen2.5-coder:1.5b'               // Tier 4: Ultra-Light
    ];

    let lastError: any = null;
    const startedAt = Date.now();

    for (const currentModel of modelTiers) {
      try {
        let runtimeModel = currentModel;

        // Only use the router for the first attempt (the original model)
        // For fallback tiers, we use the specific model in the chain
        if (currentModel === model) {
          const routing = resolveModelForAgent(agentName, currentModel);
          const requestedModel = routing.selectedModel;
          const runtimeResolution = await resolveInstalledModel(requestedModel);
          runtimeModel = runtimeResolution.selectedModel;
        } else {
          const runtimeResolution = await resolveInstalledModel(currentModel);
          runtimeModel = runtimeResolution.selectedModel;
        }

        const timeoutMs = options.timeoutMs ?? this.calculateTimeout(agentName, prompt.length);
        const maxRetries = options.maxRetries ?? (agentName.includes('architect') ? 1 : 2);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          RuntimeControl.check();
          const callStartedAt = Date.now();
          try {
            console.log(`[AIFacade] ${agentName} -> ${runtimeModel} | attempt ${attempt}/${maxRetries} | tier_fallback=${currentModel !== model}`);
            recordLlmTelemetry({
              agentName,
              model: runtimeModel,
              requestedModel: model,
              attempt,
              maxRetries,
              tierFallback: currentModel !== model,
              status: 'started',
              promptChars: prompt.length,
              jsonMode: Boolean(options.json),
              timeoutMs,
              missionId: options.missionId,
              niche: options.niche,
              city: options.city,
              scopeKey: options.scopeKey,
            });
            
            const payload = {
              model: runtimeModel,
              prompt,
              stream: false,
              options: {
                temperature: options.temperature ?? 0.35,
                num_predict: options.numPredict ?? this.calculateNumPredict(agentName, prompt.length)
              },
              format: options.json ? 'json' : undefined
            };

            const response = await axios.post(endpoint, payload, { timeout: timeoutMs });
            const text = String(response?.data?.response || '').trim();
            if (!text) throw new Error('empty response');

            const callDurationMs = Date.now() - callStartedAt;
            recordLlmTelemetry({
              agentName,
              model: runtimeModel,
              requestedModel: model,
              attempt,
              maxRetries,
              tierFallback: currentModel !== model,
              status: callDurationMs >= 60000 ? 'slow' : 'success',
              durationMs: callDurationMs,
              promptChars: prompt.length,
              responseChars: text.length,
              jsonMode: Boolean(options.json),
              timeoutMs,
              missionId: options.missionId,
              niche: options.niche,
              city: options.city,
              scopeKey: options.scopeKey,
            });
            if (callDurationMs >= 60000) {
              console.warn(`[LLM] SLOW_CALL agent=${agentName} model=${runtimeModel} durationMs=${callDurationMs} thresholdMs=60000`);
            }
            await this.recordSuccess(agentName, runtimeModel, startedAt, prompt.length, text.length, options);
            return text;
          } catch (e: any) {
            lastError = e;
            recordLlmTelemetry({
              agentName,
              model: runtimeModel,
              requestedModel: model,
              attempt,
              maxRetries,
              tierFallback: currentModel !== model,
              status: 'failed',
              durationMs: Date.now() - callStartedAt,
              promptChars: prompt.length,
              jsonMode: Boolean(options.json),
              timeoutMs,
              error: e?.message || String(e),
              missionId: options.missionId,
              niche: options.niche,
              city: options.city,
              scopeKey: options.scopeKey,
            });
            if (attempt >= maxRetries) throw e;
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      } catch (tierError: any) {
        recordLlmTelemetry({
          agentName,
          model: String(currentModel),
          requestedModel: model,
          attempt: 0,
          maxRetries: options.maxRetries ?? (agentName.includes('architect') ? 1 : 2),
          tierFallback: currentModel !== model,
          status: 'tier_failed',
          durationMs: Date.now() - startedAt,
          promptChars: prompt.length,
          jsonMode: Boolean(options.json),
          error: tierError?.message || String(tierError),
          missionId: options.missionId,
          niche: options.niche,
          city: options.city,
          scopeKey: options.scopeKey,
        });
        console.warn(`[AIFacade] Tier failure for ${currentModel}: ${tierError.message}. Trying next tier...`);
        continue;
      }
    }

    if (options.fallbackResponse) return this.resolveFallbackResponse(options.fallbackResponse) || '';
    if (vault.AI_FACADE_ALLOW_MOCKS) return this.getMockResponse(agentName, prompt);
    
    throw new Error(`[AIFacade] All model tiers failed for ${agentName}. Last error: ${lastError?.message}`);
  }

  private static calculateTimeout(agentName: string, promptLength: number): number {
    const base = Number(vault.AI_FACADE_TIMEOUT_MS || 60000);
    if (agentName.includes('architect')) return Math.max(base, 120000);
    if (agentName.includes('writer')) return Math.max(base, 240000);
    if (promptLength > 10000) return Math.max(base, 180000);
    return base;
  }

  private static calculateNumPredict(agentName: string, promptLength: number): number {
    if (agentName.includes('architect')) return 1600;
    if (agentName.includes('writer')) return 2800;
    return 2000;
  }

  private static async recordSuccess(agent: string, model: string, start: number, pLen: number, rLen: number, opt: any) {
    await agentMemoryStore.recordRun({
      agentName: agent, model, success: true,
      durationMs: Date.now() - start,
      promptLength: pLen, responseLength: rLen,
      jsonMode: Boolean(opt.json),
      missionId: opt.missionId, niche: opt.niche, city: opt.city
    });
  }


  static async generateJson(
    model: string,
    prompt: string,
    options: AIFacadeOptions & { agentName?: string } = {}
  ): Promise<string> {
    return this.callOllama(options.agentName || 'Compatibility_Layer', prompt, model, {
      ...options,
      json: true,
    });
  }

  static async generateJsonForAgent(
    agentName: string,
    model: string,
    prompt: string,
    options: AIFacadeOptions = {}
  ): Promise<string> {
    return this.callOllama(agentName, prompt, model, {
      ...options,
      json: true,
    });
  }

  private static getMockResponse(agentName: string, prompt: string): string {
    const normalized = String(agentName || '').toLowerCase();

    if (normalized.includes('content_architect') || normalized.includes('architect')) {
      return JSON.stringify({
        h1: 'Servicio local con atención técnica y enfoque profesional',
        meta_title: 'Servicio local profesional y atención técnica',
        meta_description: 'Atención local con diagnóstico claro, proceso ordenado y garantía por escrito cuando corresponda.',
        page_skeleton: 'conversion-funnel',
        hero: {
          h1: 'Atención técnica local con enfoque profesional',
          subtitle: 'Organizamos la página para explicar el servicio, demostrar cobertura real y cerrar con una llamada a la acción clara.',
          trust_bullets: ['Atención local', 'Proceso claro', 'Garantía por escrito'],
          cta_text: 'Solicitar atención',
          hero_role: 'conversion',
          visual_intent: 'high_impact',
        },
        sections: [
          { section_id: 'servicios', h2: 'Qué resolvemos', h3s: ['Servicio principal', 'Casos frecuentes', 'Cuándo conviene actuar'], block_type: 'services_grid', target_words: 420 },
          { section_id: 'urgencia', h2: 'Atención prioritaria', h3s: ['Disponibilidad', 'Cómo actuamos', 'Qué información pedir'], block_type: 'urgency_panel', target_words: 160 },
          { section_id: 'zonas', h2: 'Cobertura local', h3s: ['Dónde intervenimos', 'Proximidad', 'Coordinación'], block_type: 'local_proof', target_words: 220 },
          { section_id: 'faq', h2: 'Preguntas frecuentes', h3s: ['Duda 1', 'Duda 2', 'Duda 3'], block_type: 'faq', target_words: 300 },
          { section_id: 'contacto', h2: 'Solicita atención', h3s: ['Presupuesto', 'Atención directa'], block_type: 'cta_panel', target_words: 90 },
        ],
      });
    }

    if (normalized.includes('analyst')) {
      return JSON.stringify({
        primaryKeyword: 'servicio local',
        secondaryKeywords: ['servicio urgente', 'servicio en tu zona'],
        entities: [],
        pageTypeRecommendation: 'service',
        primaryIntent: 'transactional',
        secondaryIntent: 'commercial',
        funnelStage: 'BOFU',
        wordCountTarget: 2100,
        serpFeaturesTarget: ['local_pack'],
        contentAngles: ['Atención local', 'Proceso profesional'],
        trustAssets: ['atención directa', 'garantía por escrito'],
        internalLinkTargets: [],
        titleStrategy: 'Keyword + ciudad + beneficio',
        metaDescriptionStrategy: 'beneficio local + CTA',
        schemaTypes: ['LocalBusiness'],
        keywordReport: 'Fallback del analista.',
        strategyConfidence: 'low',
        classificationReasons: ['Fallback del sistema'],
      });
    }

    return '{}';
  }
}
