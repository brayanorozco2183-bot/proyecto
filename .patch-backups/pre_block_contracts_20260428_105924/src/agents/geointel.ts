import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';

export type GeoScope = 'neighborhoods' | 'municipalities' | 'provinces' | 'autonomous_communities' | 'country' | 'auto';

export interface GeoIntelInput {
    root_location: string;
    scope: GeoScope;
    niche?: string;
}

export interface GeoIntelOutput {
    root: string;
    scope: GeoScope;
    sub_locations: { name: string, type: string }[];
    recommended_hub: string;
    campaign_total: number;
}

type OsmRecord = {
    display_name?: string;
    address?: Record<string, string>;
    name?: string;
};

const MUNICIPALITY_FALLBACKS: Record<string, string[]> = {
    pinto: ['Valdemoro', 'Getafe', 'Parla', 'Fuenlabrada'],
    getafe: ['Leganés', 'Fuenlabrada', 'Pinto', 'Madrid', 'El Bercial', 'Juan de la Cierva', 'Getafe Centro'],
    valdemoro: ['Pinto', 'Ciempozuelos', 'Getafe', 'Parla'],
    mostoles: ['Alcorcón', 'Fuenlabrada', 'Leganés', 'Madrid'],
    leganes: ['Getafe', 'Alcorcón', 'Fuenlabrada', 'Madrid'],
    bilbao: ['Deusto', 'Abando', 'Recalde', 'Indautxu', 'Santutxu', 'San Ignacio', 'Zorroza', 'Castaños'],
    alicante: ['San Blas', 'Carolinas', 'Babel', 'Benalúa', 'Garbinet', 'Vistahermosa', 'Albufereta'],
};


function normalize(value: string): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function uniqueLocations(items: Array<{ name: string; type: string }>, limit = 24): Array<{ name: string; type: string }> {
    const seen = new Set<string>();
    const out: Array<{ name: string; type: string }> = [];

    for (const item of items || []) {
        const name = String(item?.name || '').replace(/\s+/g, ' ').trim();
        const type = String(item?.type || '').trim() || 'barrio';
        const key = `${normalize(name)}::${type}`;
        if (!name || seen.has(key)) continue;
        seen.add(key);
        out.push({ name, type });
        if (out.length >= limit) break;
    }

    return out;
}

function buildNeighborhoods(subLocations: Array<{ name: string; type: string }>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const item of subLocations || []) {
        if (!/barrio|distrito|zona|sector/i.test(item.type)) continue;
        const key = normalize(item.name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(item.name);
        if (out.length >= 12) break;
    }

    return out;
}

function extractNamesFromDisplayName(displayName: string, root: string): string[] {
    return String(displayName || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => normalize(part) !== normalize(root));
}

function pushCandidate(bucket: Array<{ name: string; type: string }>, name: string, type: string, root: string) {
    const clean = String(name || '').trim();
    if (!clean) return;
    const normalized = normalize(clean);
    if (!normalized || normalized === normalize(root)) return;
    if (/^\d{5}$/.test(clean)) return;
    if (/pol[ií]gono industrial|industrial|c[oó]digo postal/i.test(clean)) return;
    bucket.push({ name: clean, type });
}

function extractDeterministicGeo(root: string, records: OsmRecord[], scope: GeoScope) {
    const bucket: Array<{ name: string; type: string }> = [];

    for (const record of records || []) {
        const address = record?.address || {};
        pushCandidate(bucket, address.neighbourhood || address.neighborhood || '', 'barrio', root);
        pushCandidate(bucket, address.suburb || '', 'barrio', root);
        pushCandidate(bucket, address.city_district || '', 'distrito', root);
        pushCandidate(bucket, address.quarter || '', 'barrio', root);
        pushCandidate(bucket, address.borough || '', 'distrito', root);
        pushCandidate(bucket, address.residential || '', 'zona', root);
        pushCandidate(bucket, address.town || '', 'municipio', root);
        pushCandidate(bucket, address.village || '', 'municipio', root);
        pushCandidate(bucket, address.municipality || '', 'municipio', root);

        for (const item of extractNamesFromDisplayName(record?.display_name || '', root).slice(0, 3)) {
            pushCandidate(bucket, item, 'zona', root);
        }
    }

    const fallbackMunicipalities = MUNICIPALITY_FALLBACKS[normalize(root)] || [];
    for (const municipality of fallbackMunicipalities) {
        pushCandidate(bucket, municipality, 'municipio', root);
    }

    const sub_locations = uniqueLocations(
        scope === 'municipalities'
            ? bucket.filter((item) => item.type === 'municipio')
            : scope === 'neighborhoods'
                ? bucket.filter((item) => item.type !== 'municipio')
                : bucket,
        20,
    );

    const neighborhoods = buildNeighborhoods(sub_locations);
    return {
        sub_locations,
        neighborhoods,
    };
}

async function fetchOsmRecords(rootLocation: string): Promise<OsmRecord[]> {
    const queries = [
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(rootLocation + ', España')}&format=jsonv2&addressdetails=1&limit=20&countrycodes=es`,
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(rootLocation)}&format=jsonv2&addressdetails=1&limit=20&countrycodes=es`,
    ];

    const records: OsmRecord[] = [];
    for (const url of queries) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'SEO-GeoIntel-Agent/2.0'
                },
                timeout: 12000
            });

            if (Array.isArray(response.data)) {
                records.push(...response.data);
            }
        } catch {
            // swallow and keep fallback path alive
        }
    }

    return records;
}

export class GeoIntelAgent extends BaseAgent {
    constructor() {
        super('GeoIntel_Agent', 'GeoIntel', 'Inteligencia Geográfica', 'Cartógrafo digital experto en identificar barrios, distritos y zonas de influencia para dominación local.', vault.OLLAMA_MODEL_RESEARCH);
    }

    private mergeWithLlmResult(input: GeoIntelInput, deterministic: any, llmData: any) {
        const mergedSubLocations = uniqueLocations([
            ...(Array.isArray(llmData?.sub_locations) ? llmData.sub_locations : []),
            ...(Array.isArray(deterministic?.sub_locations) ? deterministic.sub_locations : []),
        ], 20);

        const mergedNeighborhoods = Array.from(new Set([
            ...(Array.isArray(llmData?.neighborhoods) ? llmData.neighborhoods : []),
            ...(Array.isArray(deterministic?.neighborhoods) ? deterministic.neighborhoods : []),
        ].map((item) => String(item || '').trim()).filter(Boolean))).slice(0, 12);

        return {
            root: llmData?.root || deterministic.root || input.root_location,
            scope: llmData?.scope_detected || llmData?.scope || deterministic.scope || input.scope,
            sub_locations: mergedSubLocations,
            recommended_hub: llmData?.recommended_hub || deterministic.recommended_hub || input.root_location,
            campaign_total: mergedSubLocations.length,
            city: llmData?.city || deterministic.city || input.root_location,
            neighborhoods: mergedNeighborhoods,
            research_meta: {
                source: 'osm_plus_llm',
                osm_records: deterministic.research_meta?.osm_records || 0,
                deterministic_sub_locations: deterministic.sub_locations?.length || 0,
            }
        };
    }

    async execute(input: GeoIntelInput): Promise<AgentResponse<GeoIntelOutput & { city?: string, neighborhoods?: string[] }>> {
        await this.logThought(`Mapping geographic domination cluster for: ${input.root_location} (Scope: ${input.scope})`);

        const osmRecords = await fetchOsmRecords(input.root_location);
        const deterministicGeo = extractDeterministicGeo(input.root_location, osmRecords, input.scope);
        const externalGeoData = osmRecords.length
            ? `Datos OSM detectados: ${(osmRecords.slice(0, 12).map((item) => item.display_name || item.name).filter(Boolean).join(' | '))}`
            : 'Sin datos directos de OSM disponibles. Usa una salida conservadora.';

        const deterministicOutput = {
            root: input.root_location,
            scope: input.scope === 'auto' ? (deterministicGeo.neighborhoods.length ? 'neighborhoods' : 'municipalities') : input.scope,
            sub_locations: deterministicGeo.sub_locations,
            recommended_hub: input.root_location,
            campaign_total: deterministicGeo.sub_locations.length,
            city: input.root_location,
            neighborhoods: deterministicGeo.neighborhoods,
            research_meta: {
                source: 'osm_deterministic',
                osm_records: osmRecords.length,
            }
        };

        const prompt = `
        Eres un experto en Geografía de España y Estrategia de Local SEO.
        Tu tarea es listar sub-ubicaciones relevantes para una campaña de SEO sin inventar barrios dudosos.

        ENTRADA:
        - Ubicación Raíz: "${input.root_location}"
        - Alcance Requerido: "${input.scope}"

        ${externalGeoData}

        BASE DETERMINISTA SEGURA:
        ${JSON.stringify(deterministicOutput, null, 2)}

        REGLAS CRÍTICAS:
        1. Prioriza barrios/distritos reales y municipios cercanos relevantes.
        2. Si no hay suficiente evidencia, conserva la base determinista y no inventes.
        3. "neighborhoods" debe contener solo strings planos.
        4. "sub_locations" debe usar type = barrio, distrito, zona o municipio.
        5. PROHIBIDO INVENTAR: No generes nombres que suenen geográficamente posibles pero no existan (ej: no inventes nombres vascos si no estás seguro para Bilbao).
        6. VALIDACIÓN: Cruza tus propuestas con la base DETERMINISTA SEGURA; si algo contradice fuertemente a OSM, descártalo.


        Devuelve ÚNICAMENTE JSON con esta estructura:
        {
            "root": "Nombre normalizado",
            "scope_detected": "neighborhoods/municipalities",
            "city": "${input.root_location}",
            "neighborhoods": ["Barrio 1", "Barrio 2"],
            "sub_locations": [
                { "name": "Nombre 1", "type": "barrio" },
                { "name": "Nombre 2", "type": "municipio" }
            ],
            "recommended_hub": "Nombre para la Home"
        }
        `.trim();

        try {
            const rawText = await AIFacade.generateJsonForAgent(
                this.name,
                this.model,
                prompt,
                { timeoutMs: 90000 }
            );

            const data = JSON.parse(rawText);
            const merged = this.mergeWithLlmResult(input, deterministicOutput, data);

            return {
                success: true,
                data: merged,
                thoughts: `Mapa geográfico enriquecido. ${merged.neighborhoods?.length || 0} zonas útiles detectadas para ${input.root_location}.`
            };
        } catch (error: any) {
            await this.logThought(`[GEO] Fallback determinista activado: ${error.message}`);
            return {
                success: true,
                data: deterministicOutput,
                thoughts: `Mapa geográfico determinista devuelto. ${deterministicOutput.neighborhoods.length} zonas útiles detectadas para ${input.root_location}.`
            };
        }
    }
}
