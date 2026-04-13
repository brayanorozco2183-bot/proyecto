import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';

export interface CoherenceInput {
    html: string;
    niche: string;
    city: string;
}

export interface CoherenceResult {
    html: string;
    changesMade: boolean;
}

/**
 * NicheCoherenceAgent - Auditor Semántico y Técnico.
 * Identifica y corrige alucinaciones específicas del nicho (como cambio climático, roedores, etc.)
 */
export class NicheCoherenceAgent extends BaseAgent {
    constructor() {
        super(
            'Niche_Coherence_Auditor',
            'Niche Semantic Expert',
            'Auditor de Coherencia',
            'Repara incongruencias técnicas, alucinaciones de IA y errores de contexto técnico.',
            vault.OLLAMA_MODEL_COPY
        );
    }

    private getSystemPrompt(context: { niche: string, city: string }): string {
        return `Eres un auditor técnico experto en el nicho de ${context.niche} en ${context.city}.
Tu misión es realizar una "cirugía semántica" sobre el código HTML que recibirás para eliminar alucinaciones de la IA, errores técnicos y redundancias.

**REGLAS DE SEGURIDAD CRÍTICAS (NO ROMPER)**:
1. **INTEGRIDAD ESTRUCTURAL**: PROHIBIDO cambiar etiquetas HTML (div, span, section, p, etc.). Mantén el balance de tags original. No cierres divs con spans.
2. **CLASES CSS SAGRADAS**: PROHIBIDO cambiar, añadir o eliminar clases CSS. No uses "site-headername", "block-sectionheader", "blocktitle" ni ninguna otra clase que no esté en el HTML original.
3. **MANTENER ATRIBUTOS**: No toques IDs, hrefs ni atributos data-*.
4. **FOCO TÉCNICO**: Usa terminología correcta de ${context.niche}. Elimina menciones a temas irrelevantes (clima, política, fauna).
5. **ANTI-CONTAMINACIÓN DE OFICIO**: Elimina terminología, piezas, averías, ejemplos o procesos propios de otros gremios. Si el nicho es fontanería, no pueden aparecer conceptos de cerrajería; si es cerrajería, no pueden aparecer conceptos de climatización, etc.
6. **SIN FRASES INVEROSÍMILES**: Si una frase suena genérica, robótica o físicamente incoherente para el oficio, reescríbela con lenguaje natural del gremio.

[REGLAS TÉCNICAS Y NORMAS DE MARCA (OBLIGATORIO)]:
${this.technicalBrief || 'Sin normas técnicas adicionales.'}

[CRÍTICO] PROHIBICIÓN DE ENCABEZADOS:
- NO agregues ningún tag <h1> ni <h2> al inicio.
- Devuelve solo el contenido que se te entrega, corregido en su texto, manteniendo el HTML estructural INTACTO.`;
    }


    async execute(input: CoherenceInput): Promise<AgentResponse<CoherenceResult>> {
        await this.logThought(`Auditoría de coherencia para ${input.niche} en ${input.city}`);

        const prompt = `${this.getSystemPrompt({ niche: input.niche, city: input.city })}

        HTML A CORREGIR:
        ${input.html}

        RESPONDE SOLO CON EL HTML CORREGIDO.
        `;

        try {
            let correctedHtml = await this.callModel(prompt);

            // Clean markdown artifacts
            correctedHtml = correctedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

            // Clean prompt/instruction leakage
            correctedHtml = correctedHtml
                .replace(/RESPONDE\s+SOLO\s+CON\s+EL\s+HTML\s+CORREGIDO\.?/gi, '')
                .replace(/AQU[IÍ]\s+TIENES\s+EL\s+HTML[^<]*/gi, '')
                .replace(/HE\s+CORREGIDO\s+EL\s+HTML[^<]*/gi, '')
                .trim();

            // Safety check: if the model wrapped it in <html> despite instructions, strip it
            if (correctedHtml.includes('<body')) {
                const bodyMatch = correctedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) correctedHtml = bodyMatch[1];
            }
            if (correctedHtml.includes('<html')) {
                correctedHtml = correctedHtml.replace(/<html[^>]*>|<\/html>/gi, '');
            }
            if (correctedHtml.includes('<head')) {
                correctedHtml = correctedHtml.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
            }

            // Validation: Text length shouldn't collapse too much
            const origLen = input.html.length;
            const newLen = correctedHtml.length;
            if (newLen < origLen * 0.60) {
                await this.logThought(`[WARNING] Coherence Auditor truncated content by ${Math.round((1 - newLen / origLen) * 100)}%. Fallback to original.`);
                correctedHtml = input.html;
            }

            const changesMade = correctedHtml.trim() !== input.html.trim();

            // Extra safety: if rogue classes appear after correction, revert.
            if (/\bsite-headername\b|\bblock-sectionheader\b|\bblocktitle\b|\bel-breadcrumbslink\b|\bherotitle\b|\bherosubtitle\b/i.test(correctedHtml)) {
                correctedHtml = input.html;
            }

            return {
                success: true,
                data: { html: correctedHtml.trim(), changesMade },
                thoughts: `Revision completada. Cambios realizados: ${changesMade}. Safe: ${newLen >= origLen * 0.60}`
            };

        } catch (error: any) {
            await this.logThought(`[ERROR] en Auditor de Coherencia: ${error.message}`);
            return {
                success: false,
                thoughts: "Error durante la auditoría de coherencia.",
                error: error.message
            };
        }
    }
}