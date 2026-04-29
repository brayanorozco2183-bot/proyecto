
import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';
import { CompetitorAudit, LocalSearchResult } from '../tools/scraper.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';

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

function normalize(value: any): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const FAMILY_ENTITY_BOOSTS: Record<string, string[]> = {
    carpinteros: ['muebles a medida', 'armarios empotrados', 'vestidores', 'melamina', 'madera maciza', 'herrajes', 'bisagras', 'barnizado', 'lacado', 'tarima flotante', 'parqué', 'ebanistería', 'puertas de interior', 'medición en obra'],
    cerrajeros: ['bombín', 'cerradura', 'cilindro', 'escudo protector', 'amaestramiento'],
    fontaneros: ['tubería', 'desagüe', 'grifería', 'cisterna', 'latiguillo'],
};

function detectFamily(keyword: string): string | null {
    const normalized = normalize(keyword);
    if (/carpint|ebanist|madera|armario|vestidor|tarima/.test(normalized)) return 'carpinteros';
    if (/cerraj|cerradur|bombin|cilindr|llave/.test(normalized)) return 'cerrajeros';
    if (/fontan|tuber|grifo|desatas|fuga/.test(normalized)) return 'fontaneros';
    return null;
}

function uniqueEntities(items: string[], limit = 16): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of items || []) {
        const cleaned = String(raw || '').replace(/^[-•*]\s*/, '').replace(/\s+/g, ' ').trim();
        const key = normalize(cleaned);
        if (!cleaned || cleaned.length < 3 || key.length < 3 || seen.has(key)) continue;
        if (/^(madrid|espana|españa|presupuesto|rapido|rápido|urgente|barato|servicio|servicios|empresa|profesional|profesionales)$/i.test(cleaned)) continue;
        seen.add(key);
        out.push(cleaned);
        if (out.length >= limit) break;
    }
    return out;
}

/**
 * EntityExtractorAgent - Especialista en Semántica Técnica.
 */
export class EntityExtractorAgent extends BaseAgent {
    constructor() {
        super(
            'Entity_Extractor',
            'Semantic Semantic Engineer',
            'Ingeniero Semántico',
            'Experto en extraer entidades clave (materiales, procesos, soluciones y conceptos técnicos) desde los resultados de Google.',
            vault.OLLAMA_MODEL_RESEARCH
        );
    }

    private buildDeterministicEntities(input: EntityExtractorInput): string[] {
        const { organic, audits } = input.serpData;
        const candidates: string[] = [];
        const keywordTokens = normalize(input.keyword).split(' ');
        const family = detectFamily(input.keyword);

        for (const item of organic || []) {
            candidates.push(...String(item.title || '').split(/[|,·–—]/g));
            candidates.push(...String(item.snippet || '').split(/[.,;:]/g));
        }

        for (const audit of audits || []) {
            candidates.push(audit.title || '');
            candidates.push(...(audit.h1s || []));
            candidates.push(...(audit.h2s || []));
            candidates.push(...(audit.h3s || []).slice(0, 10));
        }

        const extracted = uniqueEntities(
            [
                ...candidates
                    .flatMap((text) => String(text || '').split(/[|,.;:()\/]+/g))
                    .map((text) => text.trim())
                    .filter((text) => {
                        const normalized = normalize(text);
                        if (!normalized) return false;
                        if (keywordTokens.some((token) => token && normalized === token)) return false;
                        if (normalized.split(' ').length > 6) return false;
                        return /(madera|melamina|lacado|barnizado|armarios|vestidores|herrajes|bisagras|tarima|parque|parqué|ebanisteria|ebanistería|puertas|cocinas|bano|baño|medicion|medición|instalacion|instalación|restauracion|restauración)/i.test(normalized);
                    }),
                ...(family ? (FAMILY_ENTITY_BOOSTS[family] || []) : [])
            ],
            16
        );

        return extracted;
    }

    async execute(input: EntityExtractorInput): Promise<AgentResponse<EntityExtractionResult>> {
        await this.logThought(`Extrayendo entidades semánticas para la keyword: "${input.keyword}"`);
        const { organic, audits } = input.serpData;

        if ((!organic || organic.length === 0) && (!audits || audits.length === 0)) {
            return {
                success: false,
                thoughts: 'No hay datos SERP o de auditoría para extraer entidades.',
                error: 'Insufficient data for entity extraction.'
            };
        }

        const deterministic = this.buildDeterministicEntities(input);
        if (deterministic.length >= 10) {
            await this.logThought(`Extracción determinista completada. ${deterministic.length} entidades encontradas.`);
            return { success: true, data: { entities: deterministic }, thoughts: `Extracción determinista completada. ${deterministic.length} entidades.` };
        }

        const prompt = `
Devuelve SOLO JSON válido.
Extrae entidades semánticas útiles para SEO local del nicho "${input.keyword}".
No inventes marcas. No añadas ciudades ni claims comerciales.
Prioriza: materiales, acabados, piezas, procesos, soluciones y criterios técnicos.
Descarta: urgente, barato, 24 horas, empresa, profesional, Madrid.

TÍTULOS Y SNIPPETS:
${(organic || []).map((item) => `- ${item.title} :: ${item.snippet}`).join('\n')}

HEADINGS DE COMPETIDORES:
${(audits || []).map((audit) => `- ${audit.title}\n  H1: ${(audit.h1s || []).join(' | ')}\n  H2: ${(audit.h2s || []).slice(0, 8).join(' | ')}`).join('\n')}

Salida:
{"entities":["string"]}
`.trim();

        try {
            const raw = await AIFacade.callOllama(this.name, prompt, this.model, {
                json: true,
                timeoutMs: 45000,
                numPredict: 400,
                temperature: 0.1,
                maxRetries: 0,
                fallbackResponse: () => JSON.stringify({ entities: deterministic })
            });
            const parsed = safeJsonParse<{ entities: string[] }>(raw, { entities: deterministic });
            const entities = uniqueEntities([...(parsed.entities || []), ...deterministic], 14);
            await this.logThought(`Extracción completada. ${entities.length} entidades encontradas.`);
            return { success: entities.length > 0, data: { entities }, thoughts: `Extracción completada. ${entities.length} entidades.` };
        } catch (error: any) {
            return { success: true, data: { entities: deterministic }, thoughts: `RECUPERACIÓN: entidades deterministas (${deterministic.length}).` };
        }
    }
}
