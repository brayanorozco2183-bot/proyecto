import { z } from 'zod';

/**
 * World-class Agent Base Definition
 * Every agent must follow this protocol to ensure robustness and transparency.
 */
export interface AgentResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  thoughts: string;
  response?: string;
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

  /**
   * Primary execution method for any agent mission.
   */
  abstract execute(input: any): Promise<AgentResponse<any>>;

  /**
   * Logging for the Maestro Dashboard
   */
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
  /**
   * Loads global and specific guardrails for this agent.
   * Now with dynamic sanitization to avoid literal examples.
   */
  public async getPersistentKnowledge(context?: { city?: string, niche?: string, brand?: string }): Promise<string> {
    const { dbManager } = await import('../db/index.js');
    const db = await dbManager.getDB();
    const rules = await db.all(
      'SELECT content FROM agent_knowledge WHERE agent_id = ? OR agent_id = "global"',
      [this.name]
    );

    if (rules.length === 0) return '';

    let content = rules.map(r => r.content).join('\n\n');

    // --- SANITIZACIÓN DINÁMICA DE EJEMPLOS ---
    if (context?.city) {
      const cityVariants = [
        /M[áàäâa]laga/gi, /Soria/gi, /Valencia/gi, /Madrid/gi, /Barcelona/gi,
        /Catedral/gi, /Plaza Mayor/gi, /Puerta del Sol/gi
      ];
      cityVariants.forEach(regex => {
        content = content.replace(regex, context.city!);
      });

      // --- FILTRO DE CERTIFICACIONES DE EJEMPLO ---
      const certVariants = [/ISO\s?\d*/gi, /ISO Calidad/gi, /Certificado Profesional/gi];
      certVariants.forEach(regex => {
        content = content.replace(regex, '{{CERTIFICACION_REAL}}');
      });
      const fakeAuthorityVariants = [
        /Ministerio del Interior/gi,
        /técnicos federados/gi,
        /asociación profesional/gi,
        /certificación oficial/gi,
        /normativa europea/gi
      ];

      fakeAuthorityVariants.forEach(regex => {
        content = content.replace(regex, '{{VERIFICAR_AUTORIDAD_REAL}}');
      });


      content = content.replace(/Q\d+/g, '{{ID_WIKIDATA_LOCAL}}');
      content = content.replace(/{{CIUDAD}}/g, context.city);
      content = content.replace(/{{CITY}}/g, context.city);
    }

    if (context?.brand || context?.niche) {
      const brands = [/KeyPro/gi, /ServiHogar/gi, /TechSEO/gi];
      brands.forEach(regex => {
        content = content.replace(regex, context?.brand || '{{MARCA_LOCAL}}');
      });
      if (context?.brand) {
        content = content.replace(/{{MARCA_LOCAL}}/g, context.brand);
        content = content.replace(/{{BUSINESS_NAME}}/g, context.brand);
      }
    }

    if (context?.niche) {
      const currentNiche = String(context.niche || '').trim();

      // Solo resolvemos placeholders explícitos del nicho actual.
      content = content.replace(/{{NICHE}}/g, currentNiche);

      // Nunca conviertas ejemplos de otros oficios en el nicho actual:
      // eso fabrica contaminación semántica falsa.
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

      // En nichos que no sean cerrajería, neutralizamos ejemplos ajenos;
      // no los mutamos al nicho actual.
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

        // Limpieza de restos tras neutralización.
        content = content
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+([,.;:])/g, '$1')
          .replace(/\(\s*\)/g, '');
      }
    }

    return `
    🚨 REGLAS DE CONOCIMIENTO PERSISTENTE (GUARDA-RAILES) 🚨:
    ORDEN TEMPORAL: Los datos de ejemplo detectados arriba (como ciudades o marcas fijas) han sido sanitizados. 
    Usa solo la información de la misión actual: ${context?.niche || 'N/A'} en ${context?.city || 'N/A'}.

    ${content}

    ⚠️ DIRECTIVA DE CIERRE: NUNCA menciones nombres de empresas o ciudades que solo aparezcan como ejemplos en los protocolos.
    `;
  }

  /**
   * Cleans common placeholder patterns from generated content.
   */
  public sanitizePlaceholders(content: string): string {
    if (!content) return content;

    return content
      .replace(/\[\s*provisional\s*\]/gi, '')
      .replace(/\[\s*\]/g, '')
      .replace(/\[[a-zA-Z\s\u00C0-\u017F0-9_-]+\]/gi, '')
      .replace(/\{{2,}[^{}]+\}{2,}/g, '')
      .replace(/\$\{[^}]+\}/g, '')
      .replace(/<%[^%]+%>/g, '')
      .replace(/\(REQUERIDO\)/gi, '')
      .replace(/\b(example\.com|lorem ipsum|click aquí|escribe aquí|rellenar con)\b/gi, '')
      .replace(/\b(900\s?000\s?000)\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Universal sanitizer for LLM outputs.
   */
  /**
   * Universal AI Interaction Point.
   * Redirects to AIFacade to handle Ollama fallbacks.
   */
  protected async callModel(prompt: string, model?: string): Promise<string> {
    const { AIFacade } = await import('../tools/aiFacade.js');
    return AIFacade.callOllama(this.name, prompt, model || this.model);
  }
}

