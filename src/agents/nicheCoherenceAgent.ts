import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';
import { guardRenderedHtml } from '../utils/renderOutputGuard.js';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';

export interface CoherenceInput {
    html: string;
    niche: string;
    city: string;
    blockType?: string;
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

    private nicheProfile?: any;

    public setNicheProfile(profile: any) {
        this.nicheProfile = profile;
    }

    private normalizeNicheName(niche: string): string {
        return String(niche || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private isGenericOrUnknownNiche(niche: string): boolean {
        const normalized = this.normalizeNicheName(niche);
        if (!normalized) return true;
        return /^(servicios? locales?|servicios? profesionales?|servicios? generales?|profesionales?|especialistas?|empresa local|negocio local|soluciones locales?|multi ?servicio|multiservicio[s]?|home services?)$/.test(normalized);
    }

    private shouldBypassLlm(input: CoherenceInput): boolean {
        const forceAll = String(vault.COHERENCE_FORCE_DETERMINISTIC || '').toLowerCase() === 'true';
        const genericNiche = this.isGenericOrUnknownNiche(input.niche);
        const html = String(input.html || '');
        const htmlIsLarge = html.length > 12000;
        const hasManySemanticBlocks = (html.match(/data-block-type=/g) || []).length >= 4;
        return forceAll || genericNiche || htmlIsLarge || hasManySemanticBlocks;
    }

    private getSystemPrompt(context: { niche: string, city: string }): string {
        return `Eres un auditor técnico experto en el nicho de ${context.niche} en ${context.city}.
Tu misión es realizar una "cirugía semántica" sobre el código HTML que recibirás para eliminar alucinaciones de la IA, errores técnicos y redundancias.

**REGLAS DE SEGURIDAD CRÍTICAS (NO ROMPER)**:
1. **INTEGRIDAD ESTRUCTURAL**: PROHIBIDO cambiar etiquetas HTML (div, span, section, p, etc.). Mantén el balance de tags original. No cierres divs con spans.
2. **CLASES CSS SAGRADAS**: PROHIBIDO cambiar, añadir o eliminar clases CSS. No uses "site-headername", "block-sectionheader", "blocktitle" ni ninguna otra clase que no esté en el HTML original.
3. **MANTENER ATRIBUTOS**: No toques IDs, hrefs ni atributos data-*.
4. **FOCO TÉCNICO**: Usa terminología correcta de ${context.niche}. Elimina menciones a temas irrelevantes (clima, política, fauna).
5. **ANTI-CONTAMINACIÓN DE OFICIO**: Elimina terminología, piezas, averías, ejemplos o procesos propios de otros gremios.
6. **SIN FRASES INVEROSÍMILES**: Si una frase suena genérica, robótica o físicamente incoherente para el oficio, reescríbela con lenguaje natural del gremio.

[REGLAS TÉCNICAS Y NORMAS DE MARCA (OBLIGATORIO)]:
${this.technicalBrief || 'Sin normas técnicas adicionales.'}

${this.nicheProfile?.verticalEnrichment ? `DATOS TÉCNICOS DE AUTORIDAD (USA ESTA TERMINOLOGÍA):\n${JSON.stringify(this.nicheProfile.verticalEnrichment)}` : ''}

[CRÍTICO] PROHIBICIÓN DE ENCABEZADOS:
- NO agregues ningún tag <h1> ni <h2> al inicio.
- Devuelve solo el contenido que se te entrega, corregido en su texto, manteniendo el HTML estructural INTACTO.`;
    }


    async execute(input: CoherenceInput): Promise<AgentResponse<CoherenceResult>> {
        await this.logThought(`Auditoría de coherencia para ${input.niche} en ${input.city}`);

        try {
            if (this.shouldBypassLlm(input)) {
                await this.logThought(`[FASTPATH] Auditoria de coherencia omitida para nicho genérico: ${input.niche}`);
                return {
                    success: true,
                    data: { html: input.html.trim(), changesMade: false },
                    thoughts: 'Determinismo Master: Coherencia implícita en nicho genérico.'
                };
            }

            const prompt = `${this.getSystemPrompt({ niche: input.niche, city: input.city })}

        HTML A CORREGIR:
        ${input.html}

        RESPONDE SOLO CON EL HTML CORREGIDO.
        `;

            const response = await AIFacade.callOllama(this.name, prompt, this.model, {
                json: false,
                timeoutMs: vault.COHERENCE_TIMEOUT_MS
            });

            let correctedHtml = response || "";

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

            // Extra safety: if rogue classes appear after correction, revert.
            if (/\bsite-headername\b|\bblock-sectionheader\b|\bblocktitle\b|\bel-breadcrumbslink\b|\bherotitle\b|\bherosubtitle\b/i.test(correctedHtml)) {
                correctedHtml = input.html;
            }

            const guarded = guardRenderedHtml(input.html, correctedHtml);
            let finalHtml = guarded.html.trim();

            const originalRisk = detectCrossNicheContamination({
                niche: input.niche,
                city: input.city,
                blockType: input.blockType,
                html: input.html
            });
            const correctedRisk = detectCrossNicheContamination({
                niche: input.niche,
                city: input.city,
                blockType: input.blockType,
                html: finalHtml
            });

            if (correctedRisk.shouldRegenerate || correctedRisk.score > (originalRisk.score + 8)) {
                await this.logThought(`[NICHE_ISOLATION] Revirtiendo auditoría de coherencia por contaminación cross-niche. Original=${originalRisk.score}, corregido=${correctedRisk.score}`);
                await this.rememberLesson({
                    title: 'Auditoría revoca cambios que añaden contaminación',
                    lesson: `El LLM empeoró la pureza de nicho de score ${originalRisk.score} a ${correctedRisk.score}. Los cambios han sido descartados.`,
                    severity: 'warning',
                    lessonType: 'safety',
                    niche: input.niche,
                    city: input.city,
                });
                finalHtml = input.html.trim();
            }

            const changesMade = finalHtml !== input.html.trim();

            return {
                success: true,
                data: { html: finalHtml, changesMade },
                thoughts: `Revision completada. Cambios realizados: ${changesMade}. Safe: ${newLen >= origLen * 0.60}. Guard reverted: ${guarded.reverted}. CrossNiche=${correctedRisk.severity}/${correctedRisk.score}`
            };

        } catch (error: any) {
            await this.logThought(`[ERROR] en Auditor de Coherencia: ${error.message}`);
            await this.rememberFailure({
                errorMessage: error.message,
                failureType: 'llm_fallback',
                niche: input.niche,
                city: input.city,
            });
            return {
                success: true, // Graceful recovery
                data: { html: input.html, changesMade: false },
                thoughts: "Error durante la auditoría de coherencia. Devolviendo original por seguridad.",
                error: error.message
            };
        }
    }
}
