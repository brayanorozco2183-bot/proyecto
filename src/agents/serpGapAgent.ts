
import { BaseAgent, AgentResponse } from './base.js';
import { CompetitorAudit } from '../tools/scraper.js';

export interface SERPGapAnalysis {
    average_word_count: number;
    common_headings: string[];
    schema_detected: string[];
    missing_topics: string[];
    entities_detected: string[];
}

function normalize(value: any): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function unique(items: string[], limit = 12): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items || []) {
        const cleaned = String(item || '').replace(/^[-•*]\s*/, '').replace(/\s+/g, ' ').trim();
        const key = normalize(cleaned);
        if (!cleaned || !key || seen.has(key)) continue;
        seen.add(key);
        out.push(cleaned);
        if (out.length >= limit) break;
    }
    return out;
}

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

        const useful = (input.audits || []).filter((audit) => Number(audit?.wordCount || 0) >= 120);
        if (!useful.length) {
            return {
                success: false,
                thoughts: 'No hay datos de competidores útiles para analizar.',
                error: 'No competitor audits provided.'
            };
        }

        const average_word_count = Math.round(useful.reduce((acc, audit) => acc + Number(audit.wordCount || 0), 0) / useful.length);
        const common_headings = unique(useful.flatMap((audit) => [...(audit.h1s || []), ...(audit.h2s || [])])
            .filter(Boolean)
            .filter((heading) => !/^(inicio|contacto|blog|sobre nosotros|cookies|aviso legal|preguntas frecuentes)$/i.test(String(heading || '').trim())), 12);

        const haystack = normalize(JSON.stringify(useful));
        const schema_detected = unique([
            /faq/i.test(haystack) ? 'FAQPage' : '',
            /service|servicio/i.test(haystack) ? 'Service' : '',
            /localbusiness|negocio local/i.test(haystack) ? 'LocalBusiness' : '',
        ].filter(Boolean), 5);

        const keyword = normalize(input.keyword);
        const missing_topics: string[] = [];
        const entities_detected: string[] = [];

        const opportunityMap: Array<{ topic: string; pattern: RegExp }> = [
            { topic: 'pruebas de confianza verificables repartidas por la página', pattern: /(garantia por escrito|garantía por escrito|factura detallada|materiales certificados|taller propio)/i },
            { topic: 'respuestas FAQ tomadas del playbook y no preguntas genéricas', pattern: /(armario empotrado|mueble a medida|sol o humedad|instalacion de puertas|instalación de puertas)/i },
            { topic: 'proceso de medición y diagnóstico previo', pattern: /(medicion|medición|diagnostico|diagnóstico|visita tecnica|visita técnica)/i },
            { topic: 'factores que cambian el presupuesto', pattern: /(presupuesto|precio|factores|comparar propuestas)/i },
            { topic: 'materiales y acabados recomendados', pattern: /(melamina|madera maciza|lacado|barnizado|acabados)/i },
            { topic: 'garantía por escrito y alcance de la instalación', pattern: /(garantia|garantía|instalacion|instalación)/i },
            { topic: 'zonas de cobertura y logística real', pattern: /(madrid|barrios|zonas|cobertura|desplazamiento)/i },
            { topic: 'errores comunes antes de contratar', pattern: /(errores|fallos|conviene revisar|que evitar|qué evitar)/i },
            { topic: 'reparar o sustituir según el estado real', pattern: /(reparar|sustituir|restaurar|renovar)/i },
        ];

        for (const item of opportunityMap) {
            if (!item.pattern.test(haystack)) missing_topics.push(item.topic);
        }

        const entityPattern = /(madera maciza|melamina|dm lacado|lacado|barnizado|vestidores|armarios empotrados|herrajes|bisagras|parque|parqué|tarima flotante|ebanisteria|ebanistería)/gi;
        entities_detected.push(...Array.from(haystack.matchAll(entityPattern)).map((m) => m[1]));

        const result: SERPGapAnalysis = {
            average_word_count,
            common_headings,
            schema_detected,
            missing_topics: unique(missing_topics.length ? missing_topics : [`resolver mejor la intención de ${keyword}`, 'añadir criterios técnicos verificables'], 8),
            entities_detected: unique(entities_detected, 12)
        };

        await this.logThought(`Análisis completado. Encontradas ${result.missing_topics.length} brechas de contenido.`);
        return { success: true, data: result, thoughts: `Brechas detectadas: ${result.missing_topics.length}.` };
    }
}
