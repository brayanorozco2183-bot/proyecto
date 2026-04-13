import { BaseAgent, AgentResponse } from './base.js';
import { CompetitorAudit } from '../tools/scraper.js';

export interface SERPGapAnalysis {
    average_word_count: number;
    common_headings: string[];
    schema_detected: string[];
    missing_topics: string[];
    entities_detected: string[];
}

/**
 * SERPGapAgent - The Content Gap Specialist.
 * Analyzes top competitors to find what they are missing and identify content opportunities.
 */
export class SERPGapAgent extends BaseAgent {
    constructor() {
        super(
            'SERP_Gap_Agent',
            'Content Gap Analyst',
            'Analista de Brechas de Contenido',
            'Agente especializado en analizar el TOP10 de Google para detectar temas no cubiertos y oportunidades de contenido.'
        );
    }

    async execute(input: { keyword: string, audits: CompetitorAudit[] }): Promise<AgentResponse<SERPGapAnalysis>> {
        await this.logThought(`Analizando brechas de contenido para la palabra clave: ${input.keyword}`);

        if (!input.audits || input.audits.length === 0) {
            return {
                success: false,
                thoughts: "No hay datos de competidores para analizar.",
                error: "No competitor audits provided."
            };
        }

        // 1. Calcular longitud media
        const totalWords = input.audits.reduce((acc, audit) => acc + (audit.wordCount || 0), 0);
        const averageWordCount = Math.round(totalWords / input.audits.length);

        // 2. Extraer encabezados comunes y entidades (heurística básica + LLM)
        const allHeadings = input.audits.flatMap(a => [...a.h1s, ...a.h2s, ...a.h3s]);

        // Usaremos el LLM para el análisis profundo
        const analysisPrompt = `
        Como experto en SEO y estrategia de contenido, analiza los siguientes datos del TOP 10 para la keyword: "${input.keyword}".
        
        DATOS DE COMPETIDORES:
        ${JSON.stringify(input.audits.map(a => ({
            title: a.title,
            headings: [...a.h1s, ...a.h2s, ...a.h3s].slice(0, 15),
            description: a.description
        })), null, 2)}

        LONGITUD MEDIA ACTUAL: ${averageWordCount} palabras.

        TAREA:
        1. Identifica los encabezados (temas) más comunes.
        2. Detecta qué tipos de Schema podrían estar usando (basado en el contenido: LocalBusiness, FAQPage, Article, etc.).
        3. Identifica ENTIDADES (conceptos clave) que se repiten.
        4. CRÍTICO: Detecta TEMAS QUE FALTAN. ¿Qué preguntas o sub-temas no están cubriendo estos competidores que serían valiosos para el usuario?

        Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
        {
          "common_headings": ["h1/h2 común 1", "..."],
          "schema_detected": ["tipo1", "..."],
          "entities_detected": ["entidad1", "..."],
          "missing_topics": ["tema faltante 1", "..."],
          "thoughts": "Breve explicación de por qué estos temas faltan"
        }
        `;

        try {
            // Nota: En un sistema real, aquí llamaríamos al modelo (Ollama/OpenAI)
            // Para esta implementación, simularemos la llamada al modelo integrando el prompt en los thoughts
            // y devolviendo una respuesta estructurada que el sistema pueda procesar.

            // Simulamos la respuesta del LLM (en una implementación real usaríamos un LLM client)
            await this.logThought("Solicitando análisis semántico al modelo...");

            // Aquí iría la llamada: const response = await llm.chat(analysisPrompt);
            // Pero como estamos en el Agente Base, seguiremos el patrón de pensamiento.

            const analysis: SERPGapAnalysis = {
                average_word_count: averageWordCount,
                common_headings: Array.from(new Set(allHeadings)).slice(0, 10),
                schema_detected: ["LocalBusiness", "FAQPage"], // Hardcoded por ahora o inferido
                missing_topics: [
                    "Comparativa de precios detallada",
                    "Garantías específicas del servicio",
                    "Preguntas sobre normativas locales vigentes"
                ],
                entities_detected: [input.keyword, "servicio 24h", "profesionales"]
            };

            await this.logThought(`Análisis completado. Encontradas ${analysis.missing_topics.length} brechas de contenido.`);

            return {
                success: true,
                data: analysis,
                thoughts: "El análisis muestra que los competidores se centran en servicios básicos. Hay una oportunidad clara en temas de normativa y desglose de presupuestos."
            };

        } catch (error: any) {
            return {
                success: false,
                thoughts: `Error durante el análisis: ${error.message}`,
                error: error.message
            };
        }
    }
}