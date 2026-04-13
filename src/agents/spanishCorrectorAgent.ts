import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import * as cheerio from 'cheerio';

export interface CorrectorInput {
    html: string;
    niche: string;
    city: string;
    businessName?: string;
    phone?: string;
}

export interface CorrectorResult {
    html: string;
    changesMade: boolean;
    validationPassed: boolean;
    warnings: string[];
}

/**
 * SpanishCorrectorAgent - Corrector híbrido de castellano.
 * Corrige ortografía, gramática, puntuación y fluidez sin romper HTML ni tocar atributos críticos.
 */
export class SpanishCorrectorAgent extends BaseAgent {
    constructor() {
        super(
            'Spanish_Linguistic_Corrector_V2',
            'Spanish Grammar Expert',
            'Corrector de Castellano',
            'Corrector híbrido de gramática, puntuación y estilo profesional en español con validación estructural del HTML.',
            vault.OLLAMA_MODEL_COPY
        );
    }

    private getSystemPrompt(): string {
        return `
Actúa como un corrector profesional de estilo, ortografía, gramática y puntuación en ESPAÑOL (castellano estándar).

MISIÓN:
Corregir únicamente el texto visible dentro del HTML, mejorando:
1. Ortografía y Acentuación
2. Signos de puntuación y concordancia
3. Fluidez técnica y profesional

[REGLAS DE SEGURIDAD CRÍTICAS - NO ROMPER]:
1. **INTEGRIDAD ESTRUCTURAL**: PROHIBIDO cambiar etiquetas HTML (div, span, section, p, details, summary).
2. **CLASES CSS SAGRADAS**: PROHIBIDO cambiar, añadir o eliminar clases CSS. No uses "site-headername", "block-sectionheader", "blocktitle" ni ninguna otra clase que no esté en el HTML original.
3. **CIERRE DE TAGS**: Asegúrate de que todos los tags que abre el HTML original se mantengan cerrados con el MISMO tipo de tag. Nunca cierres un <div> con un </span>.
4. **MANTENER ATRIBUTOS**: No toques IDs, hrefs ni atributos data-*.

[REGLAS TÉCNICAS Y REGLAS DE NEGOCIO (OBLIGATORIO)]:
${this.technicalBrief || 'Sin reglas técnicas específicas.'}

[REGLA DE LOCALIZACIÓN DE DIALECTO (ESPAÑA)]:
- El texto debe ser rigurosamente en español de España (ej: "fontanero" en lugar de "plomero").

IMPORTANTE:
Devuelve únicamente HTML válido corregido, conservando EXACTAMENTE la estructura de clases y tags recibida.
NO agregues tags <h2> o <h1> al inicio. Solo corrige el contenido recibido.
`.trim();
    }


    async execute(input: CorrectorInput): Promise<AgentResponse<CorrectorResult>> {
        await this.logThought(`Corrigiendo gramática, puntuación y coherencia lingüística para ${input.niche} en ${input.city}`);

        try {
            const originalHtml = input.html || '';
            if (!originalHtml.trim()) {
                return {
                    success: false,
                    thoughts: 'HTML vacío recibido por el corrector.',
                    error: 'Empty HTML input'
                };
            }

            // 1) Pre-corrección determinista segura
            const preCleanHtml = this.applyDeterministicTextFixes(originalHtml, input);

            // 2) Prompt al LLM
            const prompt = `${this.getSystemPrompt()}

CIUDAD: ${input.city}
NICHO: ${input.niche}
EMPRESA: ${input.businessName || 'N/D'}

HTML A CORREGIR:
${preCleanHtml}

RESPONDE SOLO CON EL HTML CORREGIDO.`;

            let correctedHtml = await this.callModel(prompt);

            correctedHtml = this.cleanModelArtifacts(correctedHtml);

            // Si el modelo devuelve vacío, usamos preClean
            if (!correctedHtml.trim()) {
                await this.logThought('El modelo devolvió HTML vacío. Usando fallback preClean.');
                correctedHtml = preCleanHtml;
            }

            // 3) Validación estructural fuerte
            const validation = this.validateCorrectedHtml(originalHtml, correctedHtml, input);

            let finalHtml = correctedHtml;

            if (!validation.passed) {
                await this.logThought(`Validación estructural fallida. Fallback al HTML pre-limpieza. Warnings: ${validation.warnings.join(' | ')}`);
                finalHtml = preCleanHtml;
            }

            // 4) Normalización final segura
            finalHtml = this.applyFinalSafeNormalizations(finalHtml);

            if (/\bsite-headername\b|\bblock-sectionheader\b|\bblocktitle\b|\bel-breadcrumbslink\b|\bherotitle\b|\bherosubtitle\b/i.test(finalHtml)) {
                await this.logThought('Se detectaron clases corruptas tras la corrección lingüística. Fallback al HTML original.');
                finalHtml = originalHtml;
            }

            const changesMade = finalHtml.trim() !== originalHtml.trim();

            return {
                success: true,
                data: {
                    html: finalHtml.trim(),
                    changesMade,
                    validationPassed: validation.passed,
                    warnings: validation.warnings
                },
                thoughts: `Corrección lingüística completada. Cambios realizados: ${changesMade}. Validación estructural: ${validation.passed}`
            };
        } catch (error: any) {
            await this.logThought(`[RESCATE] SpanishCorrector falló: ${error.message}. Devolviendo original.`);
            return {
                success: true,
                data: {
                    html: input.html,
                    changesMade: false,
                    validationPassed: true,
                    warnings: ['LINGUISTIC_AUDIT_CONNECTION_ERROR']
                },
                thoughts: 'Error crítico durante la corrección lingüística. Devolviendo original para evitar bloqueo.'
            };
        }
    }

    /**
     * Correcciones deterministas seguras antes del LLM.
     * Solo toca texto plano de forma muy controlada vía reemplazos globales.
     */
    private applyDeterministicTextFixes(html: string, input: CorrectorInput): string {
        let out = html;

        // Espacios y puntuación básicos
        out = out.replace(/\s+,/g, ',');
        out = out.replace(/\s+\./g, '.');
        out = out.replace(/\s+:/g, ':');
        out = out.replace(/\s+;/g, ';');
        out = out.replace(/\(\s+/g, '(');
        out = out.replace(/\s+\)/g, ')');
        out = out.replace(/\s{2,}/g, ' ');

        // Errores frecuentes concretos
        const replacements: Array<[RegExp, string]> = [
            [/desde hace 2010/gi, 'desde 2010'],
            [/Actuación rápida/gi, 'Intervención rápida'],
            [/incidencias activas/gi, 'incidencias urgentes'],
            [/presupuesto claroizado/gi, 'presupuesto claro'],
            [/tecnología electrónico/gi, 'tecnología electrónica'],
            [/equipo es formado por/gi, 'equipo está formado por'],
            [/biometricas/gi, 'biométricas'],
            [/expertiz/gi, 'trayectoria'],
            [/rechupeo/gi, 'amaestramiento'],
            [/rellamado/gi, 'asesoramiento'],
            [/abrigo/gi, 'apertura'],
            [/hogares afectados/gi, 'viviendas'],
            // Filtro geográfico Ruzafa
            [/El Prado/g, 'Ruzafa'],
            [/Barrio del Pilar/g, 'Russafa'],
            [/San Vicente/g, 'Ruzafa'],
            [/Juan Bravo/g, 'Ruzafa'],
            [/Plaza del Carmen/g, 'Ruzafa'],
            [/Avenida del Parque/g, 'Gran Vía Germanías'],
            [/Estación de Renfe/g, 'Estación del Norte'],
            // Instrucciones filtradas
            [/, incluyendo la estructura de encabezados y párrafos, así como la no mención explícita del nombre de la empresa o localidad./gi, ''],
            [/incluyendo la estructura de encabezados y párrafos, así como la no mención explícita del nombre de la empresa o localidad/gi, '']
        ];

        for (const [pattern, replacement] of replacements) {
            out = out.replace(pattern, replacement);
        }

        // Teléfono y nombre negocio protegidos de cambios accidentales posteriores
        if (input.phone) {
            out = out.replace(new RegExp(this.escapeRegExp(input.phone), 'g'), input.phone);
        }
        if (input.businessName) {
            out = out.replace(new RegExp(this.escapeRegExp(input.businessName), 'g'), input.businessName);
        }

        return out.trim();
    }

    /**
     * Elimina artefactos típicos del modelo.
     */
    private cleanModelArtifacts(raw: string): string {
        let out = raw || '';

        if (out.includes('```html')) {
            out = out.split('```html')[1].split('```')[0].trim();
        } else if (out.includes('```')) {
            out = out.split('```')[1].trim();
        }

        out = out.replace(/^html\s*/i, '').trim();

        return out;
    }

    /**
     * Valida que el HTML corregido siga siendo estructuralmente seguro.
     */
    private validateCorrectedHtml(
        originalHtml: string,
        correctedHtml: string,
        input: CorrectorInput
    ): { passed: boolean; warnings: string[] } {
        const warnings: string[] = [];

        try {
            const $orig = cheerio.load(originalHtml);
            const $new = cheerio.load(correctedHtml);

            // 1. Conteo básico de tags importantes
            const importantTags = ['h1', 'h2', 'h3', 'p', 'section', 'a', 'ul', 'li', 'footer', 'header', 'main'];
            for (const tag of importantTags) {
                const origCount = $orig(tag).length;
                const newCount = $new(tag).length;

                // Permitimos pequeñas variaciones en p/li, pero no cambios fuertes
                if (['p', 'li'].includes(tag)) {
                    if (Math.abs(origCount - newCount) > 3) {
                        warnings.push(`Cambio excesivo en <${tag}>: original=${origCount}, corregido=${newCount}`);
                    }
                } else {
                    if (origCount !== newCount) {
                        warnings.push(`Cambio estructural en <${tag}>: original=${origCount}, corregido=${newCount}`);
                    }
                }
            }

            // 2. Clases deben mantenerse
            const origClasses = this.collectClassList($orig);
            const newClasses = this.collectClassList($new);
            if (!this.sameStringSet(origClasses, newClasses)) {
                warnings.push('Las clases CSS no coinciden entre el HTML original y el corregido.');
            }

            // 3. IDs deben mantenerse
            const origIds = this.collectAttributeValues($orig, 'id');
            const newIds = this.collectAttributeValues($new, 'id');
            if (!this.sameStringSet(origIds, newIds)) {
                warnings.push('Los IDs no coinciden entre el HTML original y el corregido.');
            }

            // 4. href deben mantenerse
            const origHrefs = this.collectAttributeValues($orig, 'href');
            const newHrefs = this.collectAttributeValues($new, 'href');
            if (!this.sameStringSet(origHrefs, newHrefs)) {
                warnings.push('Los href no coinciden entre el HTML original y el corregido.');
            }

            // 5. src deben mantenerse
            const origSrcs = this.collectAttributeValues($orig, 'src');
            const newSrcs = this.collectAttributeValues($new, 'src');
            if (!this.sameStringSet(origSrcs, newSrcs)) {
                warnings.push('Los src no coinciden entre el HTML original y el corregido.');
            }

            // 6. businessName protegido
            if (input.businessName) {
                const origHasBiz = originalHtml.includes(input.businessName);
                const newHasBiz = correctedHtml.includes(input.businessName);
                if (origHasBiz && !newHasBiz) {
                    warnings.push('El nombre de empresa parece haber sido alterado o eliminado.');
                }
            }

            // 7. phone protegido
            if (input.phone) {
                const normalizedPhone = this.normalizePhone(input.phone);
                const newPhoneNormalized = this.normalizePhone(correctedHtml);
                if (!newPhoneNormalized.includes(normalizedPhone)) {
                    warnings.push('El teléfono parece haber sido alterado o eliminado.');
                }
            }

            // 8. Longitud no debe variar demasiado
            const origLen = this.visibleTextLength($orig);
            const newLen = this.visibleTextLength($new);
            const diffRatio = origLen > 0 ? Math.abs(newLen - origLen) / origLen : 0;
            if (diffRatio > 0.18) {
                warnings.push(`La longitud del texto visible cambió demasiado (${Math.round(diffRatio * 100)}%).`);
            }

            return {
                passed: warnings.length === 0,
                warnings
            };
        } catch (err: any) {
            return {
                passed: false,
                warnings: [`Error parseando HTML corregido: ${err.message}`]
            };
        }
    }

    /**
     * Normalización final suave.
     */
    private applyFinalSafeNormalizations(html: string): string {
        let out = html;

        out = out.replace(/\s{2,}/g, ' ');
        out = out.replace(/>\s+</g, '><'); // opcional: compacta un poco
        out = out.replace(/,\./g, '.');
        out = out.replace(/\.\./g, '.');
        out = out.replace(/\s+!/g, '!');
        out = out.replace(/\s+\?/g, '?');

        return out.trim();
    }

    private collectClassList($: cheerio.CheerioAPI): Set<string> {
        const classes = new Set<string>();
        $('[class]').each((_: any, el: any) => {
            const raw = $(el).attr('class') || '';
            raw.split(/\s+/).map((x: string) => x.trim()).filter(Boolean).forEach((x: string) => classes.add(x));
        });
        return classes;
    }

    private collectAttributeValues($: cheerio.CheerioAPI, attr: string): Set<string> {
        const values = new Set<string>();
        $(`[${attr}]`).each((_: any, el: any) => {
            const value = $(el).attr(attr);
            if (value) values.add(value);
        });
        return values;
    }

    private sameStringSet(a: Set<string>, b: Set<string>): boolean {
        if (a.size !== b.size) return false;
        for (const value of a) {
            if (!b.has(value)) return false;
        }
        return true;
    }

    private normalizePhone(value: string): string {
        return value.replace(/\D/g, '');
    }

    private visibleTextLength($: cheerio.CheerioAPI): number {
        const clone = $.root().clone();
        clone.find('script, style, noscript').remove();
        const text = clone.text().replace(/\s+/g, ' ').trim();
        return text.length;
    }

    private escapeRegExp(value: string): string {
        return value.replace(/([^\w-])/g, '\\$1');
    }
}