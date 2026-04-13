import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { CompetitorAudit, LocalSearchResult } from '../tools/scraper.js';

export interface EntityExtractorInput {
    keyword: string;
    serpData: {
        organic: LocalSearchResult[];
        audits: CompetitorAudit[];
    };
}

export interface EntityExtractionResult {
    entities: string[];
}

/**
 * EntityExtractorAgent - Especialista en Semántica Técnica.
 * Extrae entidades (marcas, modelos, conceptos clave) del contenido TOP10
 * para enriquecer la relevancia temática del texto generado.
 */
export class EntityExtractorAgent extends BaseAgent {
    constructor() {
        super(
            'Entity_Extractor',
            'Semantic Semantic Engineer',
            'Ingeniero Semántico',
            'Experto en extraer entidades clave (marcas, modelos, conceptos técnicos) desde los resultados de Google.',
            vault.OLLAMA_MODEL_RESEARCH
        );
    }

    async execute(input: EntityExtractorInput): Promise<AgentResponse<EntityExtractionResult>> {
        await this.logThought(`Extrayendo entidades semánticas para la keyword: "${input.keyword}"`);

        const { organic, audits } = input.serpData;

        if ((!organic || organic.length === 0) && (!audits || audits.length === 0)) {
            return {
                success: false,
                thoughts: "No hay datos SERP o de auditoría para extraer entidades.",
                error: "Insufficient data for entity extraction."
            };
        }

        // Construir contexto a partir de los títulos, snippets y encabezados
        const titles = organic.map(r => r.title).join('\n');
        const snippets = organic.map(r => r.snippet).join('\n');
        const h1s = audits.flatMap(a => a.h1s).join(', ');
        const h2s = audits.flatMap(a => a.h2s).slice(0, 20).join(', ');

        const prompt = `
        Eres un Ingeniero Semántico Experto en SEO. Tu objetivo es extraer "entidades técnicas" de los siguientes textos extraídos del TOP 10 de Google para la keyword: "${input.keyword}".

        Las entidades son: Marcas específicas, Tipos técnicos puntuales, o conceptos muy de nicho (ej. Puerta acorazada, escudo magnético).
        
        REGLA DE FILTRADO COMERCIAL:
        - Al extraer entidades, ignora explícitamente palabras transaccionales genéricas de competidores (ej. 'barato', 'rápido', '24h', 'urgente'). Extrae única y exclusivamente sustantivos técnicos tangibles (herramientas, marcas, normativas, componentes físicos).

        Ignora palabras genéricas como "barato", "rápido", "urgente", "24 horas", "provincia", "ciudad".

        IMPORTANTE: OBLIGATORIAMENTE debes incluir y priorizar en tu lista final al menos 3 marcas líderes reales del sector para el nicho "${input.keyword}". Si no aparecen explícitamente en el texto base, añade marcas que sean de conocimiento general para este sector específico.

        DATOS DISPONIBLES:
        Títulos:
        ${titles}

        Snippets:
        ${snippets}

        Encabezados Competidores:
        H1s: ${h1s}
        H2s: ${h2s}

        Extrae una lista de las 10 a 15 entidades más repetidas o relevantes para posicionar semánticamente este tema de forma profesional.

        ESTRUCTURA DE RESPUESTA REQUERIDA (SOLO JSON):
        {
          "entities": ["entidad 1", "entidad 2", "..."]
        }
        ⚠️ DEVUELVE EXCLUSIVAMENTE UN JSON VÁLIDO. SIN TEXTO ANTES NI DESPUÉS.
        `;

        try {
            this.logThought(`Enviando prompt a Ollama (${this.model}) para extracción de entidades...`);

            const response = await axios.post(`${vault.OLLAMA_URL}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false
            }, { timeout: 300000 }); // 5 min timeout

            let entitiesResult: EntityExtractionResult = { entities: [] };
            const rawText = response.data.response || "";

            try {
                // Limpieza básica de markdown JSON si lo hay
                let cleanText = rawText;
                if (cleanText.includes('```json')) {
                    cleanText = cleanText.split('```json')[1].split('```')[0].trim();
                } else if (cleanText.includes('```')) {
                    cleanText = cleanText.split('```')[1].trim();
                }

                const parsed = JSON.parse(cleanText);
                if (parsed.entities && Array.isArray(parsed.entities)) {
                    entitiesResult.entities = parsed.entities;
                }
            } catch (jsonError) {
                // Fallback heurístico si falla el JSON
                await this.logThought(`[RESCATE] Fallo el parsing JSON. Intentando extraer array por Regex...`);
                const arrayMatch = rawText.match(/\[(.*?)\]/s);
                if (arrayMatch && arrayMatch[1]) {
                    const items = arrayMatch[1].split(',')
                        .map((s: string) => s.replace(/["']/g, '').trim())
                        .filter((s: string) => s.length > 0);
                    entitiesResult.entities = items;
                } else {
                    throw new Error("No se pudo extraer JSON ni Array válido.");
                }
            }

            await this.logThought(`Extracción completada. ${entitiesResult.entities.length} entidades encontradas.`);

            return {
                success: true,
                data: entitiesResult,
                thoughts: "Se han extraído con éxito las entidades técnicas más relevantes del mercado actual."
            };

        } catch (error: any) {
            await this.logThought(`[ERROR] Fallo en la extracción de entidades: ${error.message}`);
            return {
                success: false,
                thoughts: "Hubo un error de comunicación con el LLM o procesando los datos.",
                error: error.message
            };
        }
    }
}