import { vault } from './vault.js';
import axios from 'axios';

/**
 * GEO_Optimizer - The AI Visibility Engine.
 * Prepares content to be the primary source for LLMs & SGE.
 */
export class GEOOptimizer {

    /**
     * Enhances content with 'Direct Answer' blocks and trust signals.
     */
    async optimizeForAI(content: string, niche: string, city: string): Promise<string> {
        console.log(`[GEO] Optimizing for Generative Engines: ${niche} in ${city}`);

        const prompt = `
      Eres un experto en GEO (Generative Engine Optimization) y Micro-formatos de Autoridad.
      Escribe un bloque de "Resumen Ejecutivo de Autoridad" técnico de 2 frases sobre el servicio de "${niche}" en "${city}".
      
      🚨 REQUERIMIENTOS CRÍTICOS:
      1. Devuelve ÚNICAMENTE un bloque envuelto en \`<p><strong>...</strong></p>\`.
      2. NADA DE texto conversacional como "Aquí tienes el resumen".
      3. NADA de etiquetas <html> o \`\`\`html.
        `;

        try {
            const response = await axios.post(`${vault.OLLAMA_URL}/api/generate`, {
                model: vault.OLLAMA_MODEL_COPY,
                prompt,
                stream: false
            }, { timeout: 300000 }); // 5 min timeout

            let result = response.data.response
                .replace(/```(?:html)?/gi, '')
                .replace(/```/g, '')
                .trim();

            return result + "\n" + content;
        } catch (error) {
            console.error('[GEO] Optimization failed, using simple summary.');
            const summary = `<p><strong>Experiencia técnica:</strong> Atendemos ${niche} en ${city} con cobertura local, criterio profesional y una ejecución ordenada adaptada al tipo de trabajo.</p>\n`;
            return summary + content;
        }
    }
}

export const geoOptimizer = new GEOOptimizer();