import axios from 'axios';
import { agentMemoryStore, makePromptHash } from '../ai/agentMemory.js';
import { vault } from './vault.js';
import { resolveInstalledModel } from '../ai/modelAvailability.js';
import { resolveModelForAgent } from '../ai/modelRouter.js';

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
  const endpoint = `${vault.OLLAMA_URL}/api/generate`;
  
  // Ruteo inteligente por agente
  const routing = resolveModelForAgent(agentName, model);
  const requestedModel = routing.selectedModel;

  const promptLength = String(prompt || '').length;
  const normalizedAgent = String(agentName || '').toLowerCase();
  const isArchitect = normalizedAgent.includes('content_architect') || normalizedAgent.includes('architect');
  const isWriter = normalizedAgent.includes('content_writer') || normalizedAgent.includes('writer');
  const isLongPrompt = promptLength >= 9000;
  const baseTimeout = Number(vault.AI_FACADE_TIMEOUT_MS || 60000);
  const timeoutMs = options.timeoutMs
    ?? options.timeout
    ?? (isArchitect
      ? Math.max(baseTimeout, 90000)
      : (isWriter ? Math.max(baseTimeout, 180000) : (isLongPrompt ? Math.max(baseTimeout, 120000) : baseTimeout)));

  const maxRetries = Math.max(1, options.maxRetries ?? (isArchitect || isLongPrompt ? 1 : 2));
  const numPredict = Math.max(256, options.numPredict ?? options.maxTokens ?? (isArchitect ? 1400 : (isLongPrompt ? 1800 : 2400)));

  const now = Date.now();
  if (now < this.failureCooldownUntil && options.fastFail) {
    const waitMs = this.failureCooldownUntil - now;
    if (options.fallbackResponse) return this.resolveFallbackResponse(options.fallbackResponse) || '';
    throw new Error(`[AIFacade] Fast-fail activo para ${agentName}. Cooldown restante=${waitMs}ms.`);
  }

  const runtimeResolution = await resolveInstalledModel(requestedModel);
  const runtimeModel = runtimeResolution.selectedModel;

  if (runtimeModel !== requestedModel) {
    console.warn(`[AIFacade] ${agentName} remapeado de ${requestedModel} -> ${runtimeModel}. ${runtimeResolution.reason}`);
  }

  let lastError: any = null;
  const promptHash = makePromptHash(String(prompt || '').slice(0, 20000));
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[AIFacade] ${agentName} -> ${runtimeModel} | intento ${attempt}/${maxRetries} | timeout=${timeoutMs}ms | json=${Boolean(options.json)} | prompt=${promptLength} chars`);

    try {
      const payload: any = {
        model: runtimeModel,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.35,
          num_predict: numPredict,
        },
      };

      if (options.json) payload.format = 'json';

      const response = await axios.post(endpoint, payload, { timeout: timeoutMs });
      const text = String(response?.data?.response || '').trim();
      if (!text) throw new Error('empty response');

      this.failureCooldownUntil = 0;
      console.log(`[AIFacade] ${agentName} respondió correctamente en intento ${attempt}/${maxRetries}.`);

      await agentMemoryStore.recordRun({
        agentName,
        model: runtimeModel,
        success: true,
        durationMs: Date.now() - startedAt,
        promptLength,
        responseLength: text.length,
        jsonMode: Boolean(options.json),
        missionId: options.missionId,
        niche: options.niche,
        city: options.city,
        scopeKey: options.scopeKey,
        promptHash,
      });

      return text;
    } catch (error: any) {
      lastError = error;
      const responseDetail = error?.response?.data?.error || error?.response?.data || '';
      const detailSuffix = responseDetail ? ` | detalle=${typeof responseDetail === 'string' ? responseDetail : JSON.stringify(responseDetail)}` : '';
      console.warn(`[AIFacade] ${agentName} falló en intento ${attempt}/${maxRetries}: ${error?.message || 'unknown error'}${detailSuffix}`);
      if (attempt >= maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }

  this.failureCooldownUntil = Date.now() + Math.max(2000, Number(vault.AI_FACADE_FAILURE_COOLDOWN_MS || 4000));

  await agentMemoryStore.recordRun({
    agentName,
    model: runtimeModel,
    success: false,
    durationMs: Date.now() - startedAt,
    promptLength,
    responseLength: 0,
    jsonMode: Boolean(options.json),
    missionId: options.missionId,
    niche: options.niche,
    city: options.city,
    scopeKey: options.scopeKey,
    promptHash,
  });

  await agentMemoryStore.recordFailure({
    agentName,
    model: runtimeModel,
    errorMessage: lastError?.message || 'unknown error',
    failureType: options.json ? 'llm_json_failure' : 'llm_text_failure',
    niche: options.niche,
    city: options.city,
    scopeKey: options.scopeKey,
    promptHash,
  });

  if (options.fallbackResponse) {
    console.warn(`[AIFacade] ${agentName} usando fallbackResponse explícito tras fallo del modelo ${runtimeModel}.`);
    return this.resolveFallbackResponse(options.fallbackResponse) || '';
  }

  const message = `[AIFacade] Ollama request failed for ${agentName}: ${lastError?.message || 'unknown error'} | requested=${requestedModel} | runtime=${runtimeModel}`;
  if (!vault.AI_FACADE_ALLOW_MOCKS) {
    throw new Error(`${message}. Mock mode is disabled.`);
  }

  console.warn(`${message}. Falling back to mock mode because AI_FACADE_ALLOW_MOCKS=true.`);
  return this.getMockResponse(agentName, prompt);
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
