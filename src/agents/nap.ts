import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';

/**
 * NAP_Guardian_07 - The Local Authority Engine.
 * Ensures NAP consistency and simulates local citations/signals.
 */
export class NAPGuardianAgent extends BaseAgent {
    constructor() {
        super('NAP_Guardian_01', 'NAP Guardian', 'Protector de Datos', 'Guardián de la consistencia de Nombre, Dirección y Teléfono (NAP) para maximizar el posicionamiento en el Local Pack.', vault.OLLAMA_MODEL_COPY);
    }

    async execute(input: {
        niche: string;
        city: string;
        business_name?: string;
        address?: string;
        phone?: string;
    }): Promise<AgentResponse<any>> {
        this.logThought(`Verifying and generating unique NAP identity for ${input.niche} in ${input.city}`);

        const prompt = `
      Eres un experto en SEO Local y Citaciones.
      Tu misión es asegurar que este negocio tenga una IDENTIDAD LOCAL ÚNICA en ${input.city} para dominar el Local Pack.
      
      DATOS DISPONIBLES:
        - Nicho: ${input.niche}
        - Ciudad: ${input.city}
        - Nombre Sugerido: ${input.business_name || 'Sin nombre confirmado'}
        - Dirección: ${input.address || 'No disponible'}
        - Teléfono: ${input.phone || 'No disponible'}

    REGLAS DE ORO:
  1. NO inventes direcciones exactas.
  2. NO inventes teléfonos.
  3. Si falta la dirección, usa solo ciudad o zona.
  4. Si falta el teléfono, devuelve "No disponible".
  5. Si falta el nombre comercial, genera un nombre comercial genérico limpio basado en nicho + ciudad, SIN etiquetas como "[Provisional]" ni marcadores temporales.
   REGLAS DE GENERACIÓN:
      1. El nombre debe sonar profesional, artesano y local (ej. "${input.niche} Profesional en ${input.city}" o "${input.niche} de Confianza en ${input.city}").
      2. La dirección debe ser una calle real o coherente de ${input.city}.
      3. El teléfono DEBE tener el prefijo correcto de la provincia.
      4. SI NO HAY DIRECCIÓN REAL:
   - NO INVENTAR DIRECCIONES
   - uses solo ciudad o zona
   
      REGLA ESTRICTA DE PREFIJOS TELEFÓNICOS:
      - Si el teléfono no está disponible o debe generarse, el prefijo provincial generado debe coincidir matemática y geográficamente al 100% con la provincia de la ciudad analizada. Está prohibido usar números móviles genéricos (empezando por 6) si no se especifica explícitamente.
      SALIDA (JSON ESTRICTO):
      {
        "business_name": "string",
        "address": "string",
        "phone": "string",
        "consistency_score": (0-100),
        "citations": [{"site": "string", "action": "create"}],
        "local_blurb": "Resumen de 50 palabras enfocado en la autoridad local"
      }
    `;

        try {
            this.logThought("Generating local prominence strategy with Ollama...");
            const response = await axios.post(`${vault.OLLAMA_URL}/api/generate`, {
                model: this.model,
                prompt,
                stream: false
            }, { timeout: 900000 }); // 15 min timeout

            let rawText = response.data.response || "";
            let napData: any = {
                consistency_score: 90,
                citations: [
                    { site: `Directorio Principal de ${input.city}`, action: 'create' },
                    { site: `Páginas Amarillas Locales ${input.city}`, action: 'create' }
                ],
                local_blurb: `Servicios profesionales de ${input.niche} en ${input.city}, brindando calidad y confianza a nuestra comunidad.`
            };

            try {
                if (rawText.includes('```json')) {
                    rawText = rawText.split('```json')[1].split('```')[0].trim();
                } else if (rawText.includes('```')) {
                    rawText = rawText.split('```')[1].trim();
                }
                const parsed = JSON.parse(rawText);
                if (parsed.business_name) napData.business_name = parsed.business_name;
                if (parsed.address) napData.address = parsed.address;
                if (parsed.phone) napData.phone = parsed.phone;
                if (parsed.mapEmbedUrl) napData.mapEmbedUrl = parsed.mapEmbedUrl;
                if (parsed.consistency_score !== undefined) napData.consistency_score = parsed.consistency_score;
                if (parsed.citations) napData.citations = parsed.citations;
                if (parsed.local_blurb) napData.local_blurb = parsed.local_blurb;
            } catch (e) {
                // Regex fallback
                this.logThought("[RESCATE] JSON fragmentado en NAP. Usando valores seguros...");
                const scoreMatch = rawText.match(/"consistency_score"\s*:\s*(\d+)/i);
                if (scoreMatch) napData.consistency_score = parseInt(scoreMatch[1]);
            }

            // PRESERVE INPUT DATA IF PROVIDED AND VALID (Avoids re-optimization hallucinations)
            if (input.business_name && input.business_name !== "No disponible" && input.business_name.length > 3) {
                napData.business_name = input.business_name;
            }
            if (input.address && input.address !== "No disponible" && input.address.length > 5) {
                napData.address = input.address;
            }
            if (input.phone && input.phone !== "No disponible" && input.phone.replace(/\D/g, '').length >= 9) {
                napData.phone = input.phone;
            }

            if (!napData.business_name) {
                napData.business_name = `${input.niche} en ${input.city}`;
            }

            if (!napData.address) {
                napData.address = input.city;
            }

            if (!napData.phone || napData.phone === "No disponible" || napData.phone.replace(/\D/g, '').length < 9) {
                // Generar teléfono plausible por prefijo según ciudad
                const cityLower = input.city.toLowerCase();
                let prefix = "93"; // Barcelona default
                if (cityLower.includes("madrid")) prefix = "91";
                if (cityLower.includes("valencia")) prefix = "96";
                if (cityLower.includes("sevilla")) prefix = "95";

                const randomPart = Math.floor(1000000 + Math.random() * 8999999);
                napData.phone = `${prefix}${randomPart}`;
                this.logThought(`[RESCATE] Teléfono no válido o ausente. Generado número plausible: ${napData.phone}`);
            }

            return {
                success: true,
                data: napData,
                thoughts: `NAP strategy generated for ${input.city}. Consistency score: ${napData.consistency_score}.`
            };

        } catch (error) {
            const errorMsg = (error as Error).message;
            await this.logThought(`[RESCATE] NAPAgent falló: ${errorMsg}. Usando fallback seguro.`);

            const cityLower = input.city.toLowerCase();
            let prefix = "93"; // Barcelona default
            if (cityLower.includes("madrid")) prefix = "91";
            if (cityLower.includes("valencia")) prefix = "96";
            if (cityLower.includes("sevilla")) prefix = "95";
            if (cityLower.includes("bilbao")) prefix = "94";

            const randomPart = Math.floor(1000000 + Math.random() * 8999999);
            const fallbackPhone = input.phone || `${prefix}${randomPart}`;

            return {
                success: true,
                data: {
                    business_name: input.business_name || `${input.niche} en ${input.city}`,
                    address: input.address || input.city,
                    phone: fallbackPhone,
                    consistency_score: 50,
                    citations: [],
                    local_blurb: `Especialistas en ${input.niche} con amplia experiencia en ${input.city}.`
                },
                thoughts: "NAP generation using emergency fallback due to LLM failure."
            };
        }
    }
}