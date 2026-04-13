import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { PageType, SearchIntent, IntentModel } from '../types/pipeline_v2.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
/**
 * SEO_Analyst_01 - The Strategic Lead (V5 Military Grade).
 * Designs the 'Market Dominance Statute' based on objective competitive data.
 */

interface StrategicAnalysis {
    primaryKeyword: string;
    secondaryKeywords: string[];
    entities: string[];
    pageTypeRecommendation: PageType;
    primaryIntent: SearchIntent;
    secondaryIntent?: SearchIntent;
    funnelStage: 'BOFU' | 'MOFU' | 'TOFU';
    wordCountTarget: number;
    serpFeaturesTarget: string[];
    contentAngles: string[];
    trustAssets: string[];
    internalLinkTargets: string[];
    titleStrategy: string;
    metaDescriptionStrategy: string;
    schemaTypes: string[];
    keywordReport: string;
    strategyConfidence: 'low' | 'medium' | 'high';
    classificationReasons: string[];
}

export class SEOAnalystAgent extends BaseAgent {
    constructor() {
        super('SEO_Analyst_01', 'Strategic Intelligence', 'Estratega de Mercado', 'Experto en analizar la competencia en Google y extraer las mejores palabras clave para tu ciudad.', vault.OLLAMA_MODEL_RESEARCH);
    }

    private classifyKeyword(keyword: string): { pageType: PageType, intent: SearchIntent, stage: 'BOFU' | 'MOFU' | 'TOFU', reasons: string[] } {
        const k = keyword.toLowerCase();
        const reasons: string[] = ["Análisis determinista de keyword principal"];

        if (k.includes('precio') || k.includes('cuanto cuesta') || k.includes('tarifas') || k.includes('coste')) {
            reasons.push("Keyword detectada como intención de comparación de precios");
            return { pageType: 'comparison', intent: 'commercial', stage: 'MOFU', reasons };
        }
        if (k.includes('24h') || k.includes('urgente') || k.includes('urgencia') || k.includes('rapido') || k.includes('inmediato')) {
            reasons.push("Keyword detectada como intención de urgencia inmediata");
            return { pageType: 'urgent', intent: 'transactional', stage: 'BOFU', reasons };
        }
        // Check for specific local intent (neighborhoods, districts, near me)
        const localIndicators = ['cerca', 'próximo', 'barrio', 'distrito', 'sector', 'zona de'];
        const hasSpecificLocalDetail = localIndicators.some(ind => k.includes(ind));

        if (hasSpecificLocalDetail) {
            reasons.push("Keyword detectada como intención de área de servicio específica (barrio/proximidad)");
            return { pageType: 'service_area', intent: 'transactional', stage: 'BOFU', reasons };
        }
        if (k.includes('que es') || k.includes('como') || k.includes('guia') || k.includes('pasos')) {
            reasons.push("Keyword detectada como intención informacional/guía");
            return { pageType: 'guide', intent: 'informational', stage: 'TOFU', reasons };
        }
        if (k.includes('mejor') || k.includes('vs') || k.includes('comparativa')) {
            reasons.push("Keyword detectada como intención de comparativa de mercado");
            return { pageType: 'comparison', intent: 'commercial', stage: 'MOFU', reasons };
        }

        reasons.push("Keyword detectada como servicio local estándar");
        return { pageType: 'service', intent: 'transactional', stage: 'BOFU', reasons };
    }

    private getWordCountTarget(pageType: PageType, avgCompetitorWords: number): number {
        const base: Record<string, number> = {
            service: 2100,
            urgent: 1700,
            service_area: 1700,
            guide: 2600,
            faq: 2200,
            comparison: 2400,
            category: 2100,
            home_local: 2200
        };

        const min = base[pageType] || 1700;
        const competitorDriven = avgCompetitorWords > 0 ? avgCompetitorWords + 250 : min;

        const safeCeilings: Record<string, number> = {
            service: 2600,
            urgent: 1900,
            service_area: 2200,
            guide: 3200,
            faq: 2600,
            comparison: 2800,
            category: 2500,
            home_local: 2600
        };

        return Math.min(Math.max(min, competitorDriven), safeCeilings[pageType] || 2600);
    }

    async execute(input: {
        niche: string;
        city: string;
        marketData: {
            localPack: any[];
            organicLeaders: any[];
            deepAudits: any[];
        }
    }): Promise<AgentResponse<any>> {
        const knowledge = await this.getPersistentKnowledge({
            city: input.city,
            niche: input.niche
        });

        const classification = this.classifyKeyword(input.niche);
        const avgWords = input.marketData.deepAudits.length > 0
            ? input.marketData.deepAudits.reduce((acc, a) => acc + (a.wordCount || 0), 0) / input.marketData.deepAudits.length
            : 0;

        const strategyConfidence = input.marketData.deepAudits.length >= 2 ? 'high' : (input.marketData.deepAudits.length >= 1 ? 'medium' : 'low');

        await this.logThought(`[INTEL] Sintetizando Estatuto de Dominación para "${input.niche}" en "${input.city}". Confianza: ${strategyConfidence}`);

        const prompt = `
Eres el Director General de Estrategia SEO de una agencia premium.

Tu misión es analizar el mercado para "${input.niche}" en "${input.city}" y devolver una estrategia lista para producción editorial y de diseño.

${knowledge}

${this.nicheBrief}

DATOS DE COMPETIDORES:
${input.marketData.deepAudits.map(a => `
URL: ${a.url}
- WordCount: ${a.wordCount}
- H1: ${a.h1s.join(' | ')}
- H2: ${a.h2s.join(' | ')}
- H3: ${a.h3s.join(' | ')}
`).join('\n')}

ANÁLISIS PRELIMINAR (DETERMINISTA):
- Clasificación Sugerida: ${classification.pageType}
- Intención: ${classification.intent}
- Etapa Funnel: ${classification.stage}
- Razones: ${classification.reasons.join(', ')}

TU TAREA:
Refina esta clasificación usando los datos reales de los competidores. Si los líderes orgánicos usan un estilo diferente, adáptate, pero mantén el foco en la conversión local.

Devuelve SOLO JSON válido con esta estructura:
{
  "primaryKeyword": "string",
  "secondaryKeywords": ["string"],
  "entities": ["string"],
  "pageTypeRecommendation": "${classification.pageType}",
  "primaryIntent": "${classification.intent}",
  "secondaryIntent": "commercial",
  "funnelStage": "${classification.stage}",
  "wordCountTarget": ${this.getWordCountTarget(classification.pageType, avgWords)},
  "serpFeaturesTarget": ["local_pack", "faq"],
  "contentAngles": ["string"],
  "trustAssets": ["telefono visible", "presupuesto sin compromiso", "atención inmediata", "técnicos cualificados", "transparencia total", "garantía por escrito"],
  "internalLinkTargets": ["string"],
  "titleStrategy": "string",
  "metaDescriptionStrategy": "string",
  "schemaTypes": ["LocalBusiness", "FAQPage"],
  "keywordReport": "string",
  "strategyConfidence": "${strategyConfidence}",
  "classificationReasons": ["string"]
}

REGLAS ESTRATÉGICAS:
- pageTypeRecommendation: home_local, service, service_area, urgent, guide, faq, comparison, category.
- Si strategyConfidence es 'low', sé más conservador con las entidades y keywords secundarias.
- Nunca reduzcas el wordCountTarget por debajo de ${this.getWordCountTarget(classification.pageType, 0)}.
- Anti-Canibalización: Prioriza intenciones BOFU.
`;

        const getFallback = (): StrategicAnalysis => ({
            primaryKeyword: input.niche,
            secondaryKeywords: [],
            entities: [input.city],
            pageTypeRecommendation: classification.pageType,
            primaryIntent: classification.intent,
            secondaryIntent: 'commercial',
            funnelStage: classification.stage,
            wordCountTarget: this.getWordCountTarget(classification.pageType, avgWords),
            serpFeaturesTarget: ['local_pack'],
            contentAngles: [`Servicio de ${input.niche} en ${input.city}`],
            trustAssets: ['telefono visible', 'cobertura local', 'presupuesto sin compromiso', 'atención directa', 'transparencia total'],
            internalLinkTargets: [],
            titleStrategy: `Keyword principal + ${input.city} + beneficio`,
            metaDescriptionStrategy: `Servicio local orientado a conversión para ${input.city}`,
            schemaTypes: ['LocalBusiness'],
            keywordReport: `Estrategia de emergencia basada en clasificación determinista. Confianza: ${strategyConfidence}`,
            strategyConfidence: strategyConfidence,
            classificationReasons: classification.reasons
        });

        try {
            const ollamaUrl = vault.OLLAMA_URL || 'http://localhost:11434';
            this.logThought(`Generating data-driven strategy with ${this.model} at ${ollamaUrl}...`);
            const rawText = await this.callModel(prompt);
            const parsed = safeJsonParse<StrategicAnalysis>(rawText, getFallback());

            // Force determinism if LLM hallucinates confidence
            if (!parsed.strategyConfidence) parsed.strategyConfidence = strategyConfidence;
            if (!parsed.classificationReasons) parsed.classificationReasons = classification.reasons;

            return {
                success: true,
                data: parsed,
                thoughts: `Estrategia generada. Tipo=${parsed.pageTypeRecommendation}. Confianza=${parsed.strategyConfidence}.`
            };

        } catch (error: any) {
            console.error(`[CRITICAL FAILURE] Pipeline V3 aborted: ${error.message}`);
            // Fallback logging
            return {
                success: true,
                data: getFallback(),
                thoughts: "RECUPERACIÓN: Fallo del LLM, se aplicó la clasificación determinista de seguridad."
            };
        }
    }
}
