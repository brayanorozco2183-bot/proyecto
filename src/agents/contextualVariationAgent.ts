import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';

export interface ContextualVariationInput {
    city: string;
    keyword: string;
    geo_data?: any;
    disallowedEntities?: string[];
}

export interface ContextualVariationResult {
    housing_type: string;
    common_problems: string[];
    local_context: string[];
    service_examples: string[];
    local_landmarks: string[];
    climate_impact: string;
}

/**
 * ContextualVariationAgent - Especialista en Hiperlocalización
 * Genera datos contextuales únicos y factualmente precisos.
 */
export class ContextualVariationAgent extends BaseAgent {
    constructor() {
        super(
            'Contextual_Variation_Agent',
            'Hyperlocal Context Specialist',
            'Especialista en Contexto Local',
            'Genera variables contextuales únicas y precisas basadas en geografía real.',
            vault.OLLAMA_MODEL_COPY
        );
    }

    async execute(input: ContextualVariationInput): Promise<AgentResponse<ContextualVariationResult>> {
        await this.logThought(`Generando jerarquía factual para "${input.keyword}" en "${input.city}"`);

        let realCityContext = "";
        try {
            const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(input.city)}`;
            const wikiRes = await axios.get(wikiUrl, { timeout: 5000 });
            if (wikiRes.data && wikiRes.data.extract) {
                realCityContext = wikiRes.data.extract;
            }
        } catch (e) {
            this.logThought(`Wikipedia no disponible para ${input.city}.`);
        }

        const prompt = `
Eres un Experto en Geo-Inteligencia Editorial. Tu misión es extraer y deducir la JERARQUÍA FACTUAL de "${input.city}" para el nicho "${input.keyword}".

DATOS DE CONTEXTO REAL (Wikipedia):
"${realCityContext}"

INSTRUCCIONES CRÍTICAS:
1. PRIORIDAD FACTUAL: Usa los datos de Wikipedia para identificar hitos Reales (plazas, monumentos, distritos).
2. PROHIBICIONES:
   - No inventes nombres de calles si no estás seguro.
   - Prohibido usar "20 minutos" o promesas temporales.
   - Prohibido: ${input.disallowedEntities?.join(', ') || 'ninguna'}.

ESTRUCTURA JSON REQUERIDA:
{
  "housing_type": "Descripción técnica del tipo de construcción predominante",
  "common_problems": ["Problema 1", "Problema 2"],
  "local_context": ["Dato 1", "Dato 2"],
  "service_examples": ["Ejemplo 1", "Ejemplo 2"],
  "local_landmarks": ["Hito 1", "Hito 2"],
  "climate_impact": "Explicación del impacto climático"
}

Responde SOLO con el JSON.
`;

        try {
            this.logThought(`Consultando Ollama (${this.model}) para jerarquía factual...`);

            const response = await axios.post(`${vault.OLLAMA_URL}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                format: 'json'
            }, { timeout: 90000 });

            let result: ContextualVariationResult = {
                housing_type: "",
                common_problems: [],
                local_context: [],
                service_examples: [],
                local_landmarks: [],
                climate_impact: ""
            };

            const rawText = response.data.response || "";

            try {
                let cleanText = rawText;
                if (cleanText.includes('```json')) {
                    cleanText = cleanText.split('```json')[1].split('```')[0].trim();
                } else if (cleanText.includes('```')) {
                    cleanText = cleanText.split('```')[1].trim();
                }

                const parsed = JSON.parse(cleanText);
                result = { ...result, ...parsed };

                if (!Array.isArray(result.common_problems)) result.common_problems = [result.common_problems].filter(Boolean) as string[];
                if (!Array.isArray(result.local_context)) result.local_context = [result.local_context].filter(Boolean) as string[];
                if (!Array.isArray(result.service_examples)) result.service_examples = [result.service_examples].filter(Boolean) as string[];
                if (!Array.isArray(result.local_landmarks)) result.local_landmarks = [result.local_landmarks].filter(Boolean) as string[];

            } catch (jsonError) {
                await this.logThought(`[RESCATE] Usando contexto base por fallo de parsing.`);
                result = {
                    housing_type: `viviendas en ${input.city}`,
                    common_problems: [`incidencias de ${input.keyword} en la zona`],
                    local_context: [`entorno de ${input.city}`],
                    service_examples: [`servicio en el centro de ${input.city}`],
                    local_landmarks: [`${input.city}`],
                    climate_impact: "Condiciones climáticas locales estándar"
                };
            }

            if (!result.housing_type) result.housing_type = `inmuebles en ${input.city}`;
            if (result.common_problems.length === 0) result.common_problems.push(`averías de ${input.keyword}`);
            if (result.local_landmarks.length === 0) result.local_landmarks.push(input.city);
            if (!result.climate_impact) result.climate_impact = "Factores ambientales típicos de la zona";

            await this.logThought(`✅ Contexto factual generado para ${input.city}.`);

            return {
                success: true,
                data: result,
                thoughts: "Contexto hiperlocal generado con jerarquía factual."
            };

        } catch (error: any) {
            await this.logThought(`[ERROR] ${error.message}`);
            return {
                success: false,
                thoughts: "Error de comunicación con el motor de IA.",
                error: error.message
            };
        }
    }
}



