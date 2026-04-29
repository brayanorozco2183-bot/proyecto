import { z } from 'zod';

/**
 * World-class Agent Base Definition.
 * This version keeps backwards compatibility and adds prompt augmentation
 * from curated lessons/exemplars stored in SQLite.
 */
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  /** Optional because some legacy agents return minimal responses. */
  thoughts?: string;
  response?: string;
  /** Optional runtime metadata used by pipeline phases for telemetry. */
  observability?: {
    duration?: number;
    model?: string;
    tokenUsage?: number;
    [key: string]: unknown;
  };
}

export abstract class BaseAgent {
  protected missionId: string = '';
  protected nicheBrief: string = '';
  protected technicalBrief: string = '';

  constructor(
    public name: string,
    public role: string,
    public displayName: string = '',
    public description: string = '',
    protected model: string = 'qwen2.5:latest'
  ) {
    if (!this.displayName) this.displayName = name;
  }

  setMissionId(id: string): void {
    this.missionId = id;
  }

  setNicheBrief(brief: string): void {
    this.nicheBrief = brief;
  }

  setTechnicalBrief(brief: string): void {
    this.technicalBrief = brief;
  }

  abstract execute(input: any): Promise<AgentResponse<any>>;

  public async logThought(thought: string): Promise<void> {
    console.log(`[${this.name}] Thinking: ${thought}`);
    if (this.missionId) {
      const { dbManager } = await import('../db/index.js');
      const db = await dbManager.getDB();
      await db.run(
        'INSERT INTO agent_logs (mission_id, agent_name, thought) VALUES (?, ?, ?)',
        [this.missionId, this.name, thought]
      );
    }
  }

  public async log(message: string): Promise<void> {
    return this.logThought(message);
  }

  public async getPersistentKnowledge(context?: { city?: string; niche?: string; brand?: string }): Promise<string> {
    const { dbManager } = await import('../db/index.js');
    const db = await dbManager.getDB();
    const rules = await db.all<any[]>(
      'SELECT content FROM agent_knowledge WHERE agent_id = ? OR agent_id = "global"',
      [this.name]
    );

    if (!rules.length) return '';

    let content = rules.map((r) => r.content).join('\n\n');

    if (context?.city) {
      const cityVariants = [
        /M[áàäâa]laga/gi, /Soria/gi, /Valencia/gi, /Madrid/gi, /Barcelona/gi,
        /Catedral/gi, /Plaza Mayor/gi, /Puerta del Sol/gi
      ];
      cityVariants.forEach((regex) => {
        content = content.replace(regex, context.city!);
      });

      const certVariants = [/ISO\s?\d*/gi, /ISO Calidad/gi, /Certificado Profesional/gi];
      certVariants.forEach((regex) => {
        content = content.replace(regex, '{{CERTIFICACION_REAL}}');
      });

      const fakeAuthorityVariants = [
        /Ministerio del Interior/gi,
        /técnicos federados/gi,
        /asociación profesional/gi,
        /certificación oficial/gi,
        /normativa europea/gi
      ];
      fakeAuthorityVariants.forEach((regex) => {
        content = content.replace(regex, '{{VERIFICAR_AUTORIDAD_REAL}}');
      });

      content = content.replace(/Q\d+/g, '{{ID_WIKIDATA_LOCAL}}');
      content = content.replace(/{{CIUDAD}}/g, context.city);
      content = content.replace(/{{CITY}}/g, context.city);
    }

    if (context?.brand || context?.niche) {
      const brands = [/KeyPro/gi, /ServiHogar/gi, /TechSEO/gi];
      brands.forEach((regex) => {
        content = content.replace(regex, context?.brand || '{{MARCA_LOCAL}}');
      });
      if (context?.brand) {
        content = content.replace(/{{MARCA_LOCAL}}/g, context.brand);
        content = content.replace(/{{BUSINESS_NAME}}/g, context.brand);
      }
    }

    if (context?.niche) {
      const currentNiche = String(context.niche || '').trim();
      content = content.replace(/{{NICHE}}/g, currentNiche);

      const foreignSecurityTerms = [
        /\bcerraduras?\b/gi,
        /\bbomb[ií]n(?:es)?\b/gi,
        /\bcilindros?\b/gi,
        /\bantibumping\b/gi,
        /\bescudos?\s+magn[eé]ticos?\b/gi,
        /\bganz[uú]as?\b/gi,
        /\bextractores?\s+de\s+cilindros?\b/gi,
        /\bapertura\s+sin\s+dañ[oa]s\b/gi,
        /\bllaves?\s+maestras?\b/gi,
        /\bcajas?\s+fuertes?\b/gi,
        /\bcontrol\s+de\s+acceso\b/gi,
        /\bintrusiones?\b/gi
      ];

      if (!/cerraj|cerradur|bomb[ií]n|cilindr|cerroj|ganzu|antibumping|llave|candado|cierrapuertas|control\s+de\s+acceso/i.test(currentNiche)) {
        const sentenceDetectors = [
          ...foreignSecurityTerms,
          /\bcierrapuertas\b/gi,
          /\bmuelles?\s+cierrapuertas\b/gi,
          /\bblindajes?\b/gi,
          /\bpuertas?\s+de\s+trastero\b/gi,
          /\bpuertas?\s+autom[aá]ticas\b/gi,
          /\bcancelas?\b/gi,
          /\bpomos?\b/gi,
          /\bmanillas?\b/gi,
          /\brepuestos?\s+originales?\b/gi,
          /\bmecanismos?\s+de\s+seguridad\b/gi,
          /\bauditor[ií]as?\s+de\s+seguridad\b/gi
        ].map((regex) => new RegExp(regex.source, regex.flags.replace(/g/g, '')));

        const sentences = content
          .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
          .map((sentence) => sentence.trim())
          .filter(Boolean);

        if (sentences.length > 0) {
          content = sentences
            .filter((sentence) => !sentenceDetectors.some((regex) => regex.test(sentence)))
            .join(' ');
        }

        content = content
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+([,.;:])/g, '$1')
          .replace(/\(\s*\)/g, '');
      }
    }

    return `
    🚨 REGLAS DE CONOCIMIENTO PERSISTENTE (GUARDA-RAILES) 🚨:
    ORDEN TEMPORAL: Los datos de ejemplo detectados arriba han sido sanitizados.
    Usa solo la información de la misión actual: ${context?.niche || 'N/A'} en ${context?.city || 'N/A'}.

    ${content}

    ⚠️ DIRECTIVA DE CIERRE: NUNCA menciones nombres de empresas o ciudades que solo aparezcan como ejemplos en los protocolos.
    `;
  }

  public async getRelevantKnowledge(context?: { city?: string; niche?: string; brand?: string }): Promise<string> {
    return this.getPersistentKnowledge(context);
  }

  public sanitizePlaceholders(content: string): string {
    if (!content) return content;

    return content
      .replace(/\[\s*provisional\s*\]/gi, '')
      .replace(/\[\s*\]/g, '')
      .replace(/\[[a-zA-Z\s\u00C0-\u017F0-9_-]+\]/gi, '')
      .replace(/\[{2,}[^\]]+\]{2,}/g, '')
      .replace(/__[^_\n]{2,}__/g, '')
      .replace(/\$\{[^}]+\}/g, '')
      .replace(/<%[^%]+%>/g, '')
      .replace(/\(REQUERIDO\)/gi, '')
      .replace(/\b(example\.com|lorem ipsum|click aquí|escribe aquí|rellenar con)\b/gi, '')
      .replace(/\b(900\s?000\s?000)\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  protected sanitizeModelOutput(content: string): string {
    if (!content) return content;
    const cleaned = content
      .replace(/^(claro|aquí tienes|seguro|entendido|he preparado|esta es|un placer|espero que)[\s\S]*?:\s*\n/i, '')
      .replace(/<(thought|thinking)>[\s\S]*?<\/\1>/gi, '')
      .replace(/```[a-z]*\n/gi, '')
      .replace(/```/g, '')
      .trim();

    return this.sanitizePlaceholders(cleaned);
  }

  protected stripTraceArtifacts(text: string): string {
    return (text || '')
      .replace(/\[OBJECT_MAP\]/gi, '')
      .replace(/\[DEBUG:.*?\]/gi, '')
      .replace(/TR-[A-Z0-9]{4,}/g, '')
      .replace(/\{trace:.*?\}/gi, '')
      .replace(/\[{2,}[^\]]+\]{2,}/g, '')
      .replace(/__[^_\n]{2,}__/g, '')
      .trim();
  }

  protected async callModel(
    prompt: string,
    model?: string,
    options?: {
      json?: boolean;
      timeoutMs?: number;
      numPredict?: number;
      temperature?: number;
      maxRetries?: number;
      fallbackResponse?: string | (() => string);
    }
  ): Promise<string> {
    const { AIFacade } = await import('../tools/aiFacade.js');
    const { resolveModelForAgent } = await import('../ai/modelRouter.js');

    const routingDecision = resolveModelForAgent(this.name, model || this.model);
    const finalModel = routingDecision.selectedModel;

    let finalPrompt = prompt;
    try {
      const { dbManager } = await import('../db/index.js');
      const db = await dbManager.getDB();
      const { augmentPromptWithLearnedContext } = await import('../learning/promptAugmenter.js');
      const augmentation = await augmentPromptWithLearnedContext(db as any, this.name, prompt);
      finalPrompt = augmentation.prompt;
    } catch {
      finalPrompt = prompt;
    }

    const raw = await AIFacade.callOllama(this.name, finalPrompt, finalModel, options);
    return typeof raw === 'string' ? raw : JSON.stringify(raw);
  }

  /**
   * Records a mission failure for persistent learning.
   */
  public async rememberFailure(input: {
    errorMessage: string;
    failureType: string;
    niche?: string;
    city?: string;
    scopeKey?: string;
    lessonTitle?: string;
    lessonText?: string;
  }): Promise<void> {
    try {
      const { agentMemoryStore } = await import('../ai/agentMemory.js');
      await agentMemoryStore.recordFailure({
        agentName: this.name,
        model: this.model,
        errorMessage: input.errorMessage,
        failureType: input.failureType,
        niche: input.niche,
        city: input.city,
        scopeKey: input.scopeKey,
      });

      if (input.lessonTitle && input.lessonText) {
        await this.rememberLesson({
          title: input.lessonTitle,
          lesson: input.lessonText,
          severity: 'major',
          lessonType: 'failure_recovery',
          niche: input.niche,
          city: input.city,
        });
      }
    } catch (e) {
      console.error(`[${this.name}] Failed to record failure in memory:`, e);
    }
  }

  /**
   * Records a curated lesson for future prompt augmentation.
   */
  public async rememberLesson(input: {
    title: string;
    lesson: string;
    severity?: string;
    lessonType?: string;
    niche?: string;
    city?: string;
    scopeKey?: string;
  }): Promise<void> {
    try {
      const { agentMemoryStore } = await import('../ai/agentMemory.js');
      await agentMemoryStore.recordLesson({
        agentName: this.name,
        title: input.title,
        lesson: input.lesson,
        severity: (input.severity as any) || 'minor',
        lessonType: input.lessonType || 'quality',
        niche: input.niche,
        city: input.city,
        scopeKey: input.scopeKey,
      });
    } catch (e) {
      console.error(`[${this.name}] Failed to record lesson in memory:`, e);
    }
  }
}
