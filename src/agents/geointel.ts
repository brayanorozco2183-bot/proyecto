import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';

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
    recommended_hub: string; // The slug/name of the main page
    campaign_total: number;
}

/**
 * GeoIntelAgent: The Cartographer of Domination.
 * Responsible for mapping out neighborhoods, municipalities and provincial units for massive SEO clusters.
 */
export class GeoIntelAgent extends BaseAgent {
    constructor() {
        super('GeoIntel_Agent', 'GeoIntel', 'Inteligencia Geográfica', 'Cartógrafo digital experto en identificar barrios, distritos y zonas de influencia para dominación local.');
    }

    async execute(input: GeoIntelInput): Promise<AgentResponse<GeoIntelOutput & { city?: string, neighborhoods?: string[] }>> {
        await this.logThought(`Mapping geographic domination cluster for: ${input.root_location} (Scope: ${input.scope})`);

        let externalGeoData = "";

        // 1. Obtener datos reales de OSM (Nominatim) si buscamos barrios
        if (input.scope === 'neighborhoods' || input.scope === 'auto') {
            await this.logThought(`Fetching real district/neighborhood data from OpenStreetMap for ${input.root_location}...`);
            try {
                // Buscamos la ciudad para obtener subdistritos o features cercanas
                const osmUrl = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(input.root_location)}&format=json&addressdetails=1&extratags=1&limit=50`;
                const osmRes = await axios.get(osmUrl, {
                    headers: {
                        'User-Agent': 'SEO-GeoIntel-Agent/1.0'
                    },
                    timeout: 10000
                });

                // Extraemos algunos nombres para dar contexto al LLM
                if (osmRes.data && osmRes.data.length > 0) {
                    const places = osmRes.data.map((d: any) => d.display_name || d.name).slice(0, 15);
                    externalGeoData = `Datos en crudo de OSM para referencia:\n${places.join(' | ')}`;
                } else {
                    externalGeoData = "Sin datos directos de OSM disponibles. Usa tu base de datos interna.";
                }
            } catch (e) {
                this.logThought("Fallback: Error conectando a OSM. Usando conocimiento interno del LLM.");
            }
        }

        const prompt = `
        Eres un experto en Geografía de España y Estrategia de Local SEO.
        Tu tarea es listar TODAS las sub-ubicaciones relevantes para una campaña de SEO.

        ENTRADA:
        - Ubicación Raíz: "${input.root_location}"
        - Alcance Requerido: "${input.scope}" (neighborhoods = barrios, municipalities = municipios)

        ${externalGeoData}

        REGLAS DE ORO:
        1. Si el alcance es "neighborhoods", lista los barrios/distritos oficiales de "${input.root_location}" con mayor volumen de población (ej: Ruzafa, Benimaclet, Campanar).
        2. Si el alcance es "municipalities", lista los municipios secundarios clave alrededor de "${input.root_location}".
        3. Si el alcance es "auto", detecta si "${input.root_location}" es una ciudad principal y combina tanto sus barrios más importantes como sus municipios conurbados clave.
        4. OBLIGATORIO: Asegura que el array "neighborhoods" contenga solo STRINGS planos con los nombres de los barrios.

        Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta para mantener compatibilidad:
        {
            "root": "Nombre normalizado",
            "scope_detected": "neighborhoods/municipalities",
            "city": "${input.root_location}",
            "neighborhoods": ["Barrio 1", "Barrio 2", "Barrio 3"],
            "sub_locations": [
                { "name": "Nombre 1", "type": "barrio/municipio" },
                { "name": "Nombre 2", "type": "barrio/municipio" }
            ],
            "recommended_hub": "Nombre para la Home"
        }
        
        REGLA DE RELEVANCIA DEMOGRÁFICA:
        - Filtra y descarta códigos postales vacíos, polígonos industriales sin zonas residenciales o barrios con menos de 1,000 habitantes en el array de neighborhoods. Céntrate solo en zonas con potencial de demanda de servicios.

        No añadas explicaciones ni bloques Markdown, SOLO EL JSON.
        `;

        try {
            const response = await axios.post(`${vault.OLLAMA_URL}/api/generate`, {
                model: this.model,
                prompt,
                stream: false,
                format: 'json'
            }, { timeout: 600000 });

            let rawText = response.data.response;
            if (rawText.includes('```json')) {
                rawText = rawText.split('```json')[1].split('```')[0].trim();
            } else if (rawText.includes('```')) {
                rawText = rawText.split('```')[1].trim();
            }

            const data = JSON.parse(rawText);

            // Aseguramos que neighborhoods siempre exista como fallback de sub_locations
            if (!data.neighborhoods && data.sub_locations) {
                data.neighborhoods = data.sub_locations
                    .filter((s: any) => s.type === 'barrio')
                    .map((s: any) => s.name);
            }

            return {
                success: true,
                data: {
                    root: data.root || input.root_location,
                    scope: data.scope_detected || input.scope,
                    sub_locations: data.sub_locations || [],
                    recommended_hub: data.recommended_hub || input.root_location,
                    campaign_total: (data.sub_locations || []).length,
                    city: data.city || data.root || input.root_location,
                    neighborhoods: data.neighborhoods || []
                },
                thoughts: `Mapa de dominación generado. Se identificaron ${data.neighborhoods?.length || 0} barrios en ${input.root_location}.`
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                thoughts: "Fallo al generar el mapa geográfico cruzando la API de OSM con Ollama."
            };
        }
    }
}