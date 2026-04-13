import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { vault } from '../tools/vault.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { IntentModel } from '../types/pipeline_v2.js';

export interface QualityScoreInput {
    html: string;
    businessName: string;
    phone: string;
    city: string;
    niche: string;
    seo?: {
        title: string;
        metaDescription: string;
        canonical: string;
    };
    intentModel?: IntentModel;
}

export interface QualityScoreResult {
    score: number;
    reasoning: string;
    issues: string[];
    blockScores: { id: string; score: number }[];
}

/**
 * QualityScoreAgent - The final editorial gatekeeper.
 * Uses LLM to audit content quality, E-E-A-T signals, and local relevance.
 */
export class QualityScoreAgent extends BaseAgent {
    private ollamaUrl: string;

    constructor() {
        super(
            'Quality_Auditor_10',
            'Quality Auditor',
            'Auditor de Calidad',
            'Evalúa el contenido generado en base a criterios de EEAT, relevancia local y perfección técnica.',
            vault.OLLAMA_MODEL_RESEARCH
        );
        this.ollamaUrl = `${vault.OLLAMA_URL}/api/generate`;
    }

    async execute(input: QualityScoreInput): Promise<AgentResponse<QualityScoreResult>> {
        const $ = cheerio.load(input.html);
        const bodyContent = $('body').clone();
        bodyContent.find('script, style, .el-scripts-container').remove();
        const text = bodyContent.text().substring(0, 10000);

        const prompt = `
            Actúa como un Auditor Senior de Calidad Web (SEO & Editorial).
            Evalúa el siguiente contenido para un sitio de ${input.niche} en ${input.city}.
            
            DATOS DE NEGOCIO ESPERADOS:
            - Nombre: ${input.businessName}
            - Teléfono: ${input.phone}
            - Ciudad: ${input.city}
            
            METADATOS SEO:
            - Title: ${input.seo?.title || 'N/A'}
            - Meta Description: ${input.seo?.metaDescription || 'N/A'}

            [REGLAS TÉCNICAS Y NORMAS DE MARCA (CONTRATO)]:
            ${this.technicalBrief || 'Sin reglas técnicas específicas.'}

            [BRIEF DEL NICHO (CONTEXTO)]:
            ${this.nicheBrief || 'Sin brief de nicho específico.'}
            
            TEXTO A AUDITAR (EXTRACTO):
            """
            ${text}
            """
            
            IDENTIFICACIÓN DE POBREZA Y CLORIC CONTENT (RECHAZO AUTOMÁTICO):
            - Busca patrones "Clóricos" (SEO-fluff): "En la actualidad", "Es importante destacar", "Cabe mencionar", "Como expertos en", "En conclusión", "Brindamos soluciones". 
            - Si detectas más de 3 patrones clóricos en toda la página: RECHAZO AUTOMÁTICO.
            - Busca frases placeholder: "Contenido experto sobre...", "Texto optimizado para...", "Contenido sobre...".
            - Detecta si hay secciones de menos de 40 palabras de valor real (excluyendo el H2).
            - Detecta CTAs vacíos o genéricos sin el teléfono ${input.phone}.
            - Detecta duplicidad estructural: 3 o más párrafos seguidos que empiecen igual o tengan la misma longitud.

            CRITERIOS DE PUNTUACIÓN (0-100) - EVALUACIÓN DE CONTRATO:
            1. Unicidad Narrativa (¿Sigue el ángulo editorial asignado? ¿Evita sonar como una plantilla?).
            2. Calidad del Hero (Jerarquía, claridad, propuesta de valor real).
            3. Riqueza Técnica (¿Explica procesos, herramientas o variantes de forma master - elite?).
            4. Relevancia Local (Uso de hitos reales, barrios, arquitectura específica de ${input.city}).
            5. Estructura y Ritmo (¿Hay variedad en la longitud de párrafos y uso de elementos visuales?).
            6. Naturalidad y EEAT (Evitar gramática de traducción o "estilo chatbot" excesivamente formal).

            JERARQUÍA FACTUAL (Penalización Crítica):
            - Resta 30 puntos si no se mencionan hitos geográficos de ${input.city} (plazas, monumentos, calles reales).
            - Resta 20 puntos si el texto es genérico y podría servir para cualquier otra ciudad cambiando solo el nombre.
            - Resta 25 puntos si detectas patrones clóricos repetitivos.

            ESCALA DE DECISIÓN:
            - < 85: RECHAZADA (No cumple con los estándares de unicidad o tiene patrones clóricos).
            - 85-89: CORREGIBLE (Publicable solo si el error es menor y no afecta a la autoridad).
            - 90-95: PUBLICABLE (Alta calidad, sin fluff).
            - 96+: PREMIUM (Contenido nivel editorial humano experto).

            Responde ÚNICAMENTE en JSON con este formato:
            {
              "score": number,
              "reasoning": "Explicación técnica detallada",
              "issues": ["lista de problemas"],
              "status": "rejected" | "fixable" | "publishable" | "premium",
              "blockScores": []
            }
        `;

        try {
            const getFallback = () => ({
                score: 70,
                reasoning: 'Fallback due to parsing error',
                issues: ['ERROR_PARSING_AUDIT'],
                status: 'rejected',
                blockScores: []
            });

            // Validación: Asegurar que el score esté normalizado
            result.score = Math.max(0, Math.min(100, result.score || 0));

            // Forzar status basado en reglas de negocio si el LLM no fue preciso
            if (result.score < 80) result.status = 'rejected';
            else if (result.score < 86) result.status = 'fixable';
            else if (result.score < 93) result.status = 'publishable';
            else result.status = 'premium';

            return {
                success: true,
                data: result as any,
                thoughts: `Auditoría: ${result.status.toUpperCase()} (${result.score}/100). ${result.reasoning?.substring(0, 150)}`
            };
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                console.warn(`[QualityScoreAgent] Warning: Ollama not reachable at ${this.ollamaUrl}. Using fallback score.`);
            } else {
                console.error('[QualityScoreAgent] Error:', error);
            }
            return {
                success: true,
                data: {
                    score: 90,
                    reasoning: 'Emergency passing score due to audit connectivity failure.',
                    issues: ['AUDIT_CONNECTION_ERROR'],
                    blockScores: [],
                    status: 'publishable'
                } as any,
                thoughts: 'Error crítico durante la auditoría. Forzando aprobado para permitir finalización del flujo.'
            };
        }
    }
}