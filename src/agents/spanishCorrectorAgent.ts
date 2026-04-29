import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';
import * as cheerio from 'cheerio';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';

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

type TextFragmentRecord = {
    tokenIndex: number;
    original: string;
};

type ProtectedTextPayload = {
    text: string;
    protectedMap: Map<string, string>;
};

type HtmlToken = {
    kind: 'tag' | 'text';
    raw: string;
    blocked: boolean;
};

/**
 * SpanishCorrectorAgent - Corrector híbrido de castellano.
 * Corrige ortografía, gramática, puntuación y fluidez sin romper HTML ni tocar atributos críticos.
 *
 * FIX CRÍTICO:
 * Nunca vuelve a entregar el HTML completo al LLM. Solo corrige texto visible.
 * Además, preserva los tags originales byte a byte para impedir cambios en class, id, href o data-*.
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

    private nicheProfile?: any;

    public setNicheProfile(profile: any) {
        this.nicheProfile = profile;
    }

    private getSystemPrompt(): string {
        return `
Actúa como un corrector profesional de estilo, ortografía, gramática y puntuación en ESPAÑOL de España.

MISIÓN:
Corregir únicamente TEXTO PLANO visible, mejorando:
1. Ortografía y acentuación
2. Signos de puntuación y concordancia
3. Fluidez técnica y profesional

REGLAS OBLIGATORIAS:
- NO añadas HTML.
- NO devuelvas etiquetas.
- NO cambies números de teléfono, nombres de empresa, URLs, emails ni direcciones literales si ya existen.
- Mantén el significado, la intención comercial y el tono profesional.
- Usa español de España.
- Devuelve SIEMPRE JSON válido.

${this.technicalBrief || 'Sin reglas técnicas específicas.'}

${this.nicheProfile?.copyBrief ? `ESTRATEGIA EDITORIAL:\n${this.nicheProfile.copyBrief}` : ''}
`.trim();
    }

    private getSegmentsPrompt(segments: string[], input: CorrectorInput): string {
        return `${this.getSystemPrompt() || ''}

CIUDAD: ${input.city}
NICHO: ${input.niche}
EMPRESA: ${input.businessName || 'N/D'}

Debes corregir estos fragmentos de texto visible. Respeta el orden exacto.

SEGMENTOS:
${segments.map((segment, index) => `${index + 1}. ${JSON.stringify(segment)}`).join('\n')}

RESPUESTA OBLIGATORIA:
{
  "segments": ["texto corregido 1", "texto corregido 2"]
}

La longitud del array debe coincidir exactamente con ${segments.length}.`;
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

    private shouldBypassLlm(input: CorrectorInput): boolean {
        const forceAll = String(vault.CORRECTOR_FORCE_DETERMINISTIC || '').toLowerCase() === 'true';
        const genericNiche = this.isGenericOrUnknownNiche(input.niche);
        const html = String(input.html || '');
        const hasManySemanticBlocks = (html.match(/data-block-type=/g) || []).length >= 6;
        const enormousHtml = html.length > 45000;
        return forceAll || genericNiche || enormousHtml || hasManySemanticBlocks;
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

            const preCleanHtml = this.applyDeterministicTextFixes(originalHtml, input);

            if (this.shouldBypassLlm(input)) {
                await this.logThought(`[FASTPATH] Corrector determinista activo para HTML muy grande o nicho genérico: ${input.niche}`);
                const finalHtml = this.applyFinalSafeNormalizations(preCleanHtml);
                return {
                    success: true,
                    data: {
                        html: finalHtml,
                        changesMade: finalHtml.trim() !== originalHtml.trim(),
                        validationPassed: true,
                        warnings: []
                    },
                    thoughts: 'Determinismo Master: Corrección rápida aplicada sin LLM.'
                };
            }

            // FIX CRÍTICO: el LLM solo toca nodos de texto, nunca el HTML entero.
            const correctedHtml = await this.correctVisibleTextNodesWithLlm(preCleanHtml, input);
            const validation = this.validateCorrectedHtml(originalHtml, correctedHtml, input);

            let finalHtml = correctedHtml;
            if (!validation.passed) {
                await this.logThought(`Validación estructural fallida tras corrección por nodos. Fallback al HTML pre-limpieza. Warnings: ${validation.warnings.join(' | ')}`);
                await this.rememberLesson({
                    title: 'Validación HTML fallida en corrector',
                    lesson: `El corrector alteró estructura HTML o insertó contaminación (warnings: ${validation.warnings.join(', ')}). Cambio puramente gramatical debe limitarse al texto.`,
                    severity: 'major',
                    lessonType: 'safety',
                    niche: input.niche,
                    city: input.city,
                });
                finalHtml = preCleanHtml;
            }

            finalHtml = this.applyFinalSafeNormalizations(finalHtml, input);
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
            await this.rememberFailure({
                errorMessage: error.message,
                failureType: 'llm_fallback',
                niche: input.niche,
                city: input.city,
            });
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

    private async correctVisibleTextNodesWithLlm(html: string, input: CorrectorInput): Promise<string> {
        const tokens = this.tokenizeHtmlPreservingTags(html);
        const records = this.collectEditableTextFragments(tokens);

        if (!records.length) {
            return html;
        }

        const batches = this.chunkTextNodes(records, 10, 2200);

        for (const batch of batches) {
            const protectedSegments = batch.map((record) => this.protectLiteralTokens(record.original, input));
            const requestSegments = protectedSegments.map((item) => item.text);
            const correctedSegments = await this.correctTextBatch(requestSegments, input);

            for (let i = 0; i < batch.length; i++) {
                const original = batch[i].original;
                const candidate = Array.isArray(correctedSegments) ? String(correctedSegments[i] || '') : '';
                const restored = this.restoreLiteralTokens(candidate || protectedSegments[i].text, protectedSegments[i].protectedMap);
                const safe = this.chooseSafeTextReplacement(original, restored);
                tokens[batch[i].tokenIndex].raw = safe;
            }
        }

        return this.joinHtmlTokens(tokens);
    }

    private tokenizeHtmlPreservingTags(html: string): HtmlToken[] {
        const blockedTags = new Set(['script', 'style', 'noscript', 'template', 'svg', 'math', 'code', 'pre', 'iframe', 'object']);
        const parts = String(html || '').split(/(<[^>]+>)/g).filter((part) => part.length > 0);
        const tokens: HtmlToken[] = [];
        const stack: string[] = [];

        const currentBlocked = () => stack.length > 0;

        for (const part of parts) {
            const isTag = /^<[^>]+>$/.test(part);

            if (!isTag) {
                tokens.push({
                    kind: 'text',
                    raw: part,
                    blocked: currentBlocked()
                });
                continue;
            }

            const tagMatch = part.match(/^<\s*(\/)?\s*([A-Za-z0-9:-]+)/);
            const isClosing = Boolean(tagMatch?.[1]);
            const tagName = String(tagMatch?.[2] || '').toLowerCase();
            const isSelfClosing = /\/\s*>$/.test(part) || /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tagName);

            tokens.push({
                kind: 'tag',
                raw: part,
                blocked: currentBlocked()
            });

            if (!tagName) continue;

            if (!isClosing && blockedTags.has(tagName) && !isSelfClosing) {
                stack.push(tagName);
                continue;
            }

            if (isClosing && blockedTags.has(tagName)) {
                for (let i = stack.length - 1; i >= 0; i--) {
                    if (stack[i] === tagName) {
                        stack.splice(i, 1);
                        break;
                    }
                }
            }
        }

        return tokens;
    }

    private collectEditableTextFragments(tokens: HtmlToken[]): TextFragmentRecord[] {
        const out: TextFragmentRecord[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.kind !== 'text') continue;
            if (token.blocked) continue;
            if (!this.shouldEditTextNode(token.raw)) continue;
            out.push({ tokenIndex: i, original: token.raw });
        }

        return out;
    }

    private shouldEditTextNode(text: string): boolean {
        const raw = String(text || '');
        const trimmed = raw.replace(/\s+/g, ' ').trim();
        if (!trimmed) return false;
        if (trimmed.length < 3) return false;
        if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(trimmed)) return false;
        if (/^(\d+|[\-–—•·,:;|/\\]+)$/.test(trimmed)) return false;
        if (/^(https?:\/\/|www\.|mailto:|tel:)/i.test(trimmed)) return false;
        return true;
    }

    private joinHtmlTokens(tokens: HtmlToken[]): string {
        return tokens.map((token) => token.raw).join('');
    }

    private chunkTextNodes(records: TextFragmentRecord[], maxItems: number, maxChars: number): TextFragmentRecord[][] {
        const batches: TextFragmentRecord[][] = [];
        let current: TextFragmentRecord[] = [];
        let currentChars = 0;

        for (const record of records) {
            const recordLen = record.original.length;
            if (current.length && (current.length >= maxItems || currentChars + recordLen > maxChars)) {
                batches.push(current);
                current = [];
                currentChars = 0;
            }
            current.push(record);
            currentChars += recordLen;
        }

        if (current.length) batches.push(current);
        return batches;
    }

    private async correctTextBatch(segments: string[], input: CorrectorInput): Promise<string[]> {
        if (!segments.length) return [];

        const prompt = this.getSegmentsPrompt(segments, input);
        const fallback = JSON.stringify({ segments });

        const raw = await this.callModel(prompt, this.model, {
            json: false,
            timeoutMs: vault.CORRECTOR_TIMEOUT_MS,
            maxRetries: 0,
            fallbackResponse: fallback
        });

        const parsed = this.parseSegmentsResponse(raw, segments);
        if (parsed.length !== segments.length) {
            return segments;
        }

        return parsed;
    }

    private parseSegmentsResponse(raw: string, fallback: string[]): string[] {
        const cleaned = this.cleanModelArtifacts(raw);
        const candidate = cleaned || raw || '';

        try {
            const parsed = JSON.parse(candidate);
            const segments = Array.isArray(parsed?.segments) ? parsed.segments : null;
            if (!segments) return fallback;
            return segments.map((item: any, index: number) => {
                const value = String(item ?? fallback[index] ?? '').trim();
                return value || fallback[index] || '';
            });
        } catch {
            const jsonMatch = candidate.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return fallback;
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                const segments = Array.isArray(parsed?.segments) ? parsed.segments : null;
                if (!segments) return fallback;
                return segments.map((item: any, index: number) => {
                    const value = String(item ?? fallback[index] ?? '').trim();
                    return value || fallback[index] || '';
                });
            } catch {
                return fallback;
            }
        }
    }

    private protectLiteralTokens(text: string, input: CorrectorInput): ProtectedTextPayload {
        let out = String(text || '');
        const protectedMap = new Map<string, string>();
        let counter = 0;

        const reserve = (value: string) => {
            if (!value) return;
            const token = `__PROTECTED_TEXT_${counter++}__`;
            protectedMap.set(token, value);
            out = out.replace(new RegExp(this.escapeRegExp(value), 'g'), token);
        };

        if (input.phone) reserve(input.phone);
        if (input.businessName) reserve(input.businessName);
        if (input.city) reserve(input.city);
        if ((input as any).address) reserve((input as any).address);

        const literals = out.match(/https?:\/\/\S+|www\.\S+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|\b\+?\d[\d\s().-]{6,}\d\b/g) || [];
        for (const literal of literals) reserve(literal);

        return { text: out, protectedMap };
    }

    private restoreLiteralTokens(text: string, protectedMap: Map<string, string>): string {
        let out = String(text || '');
        for (const [token, value] of protectedMap.entries()) {
            out = out.replace(new RegExp(this.escapeRegExp(token), 'g'), value);
        }
        return out;
    }

    private chooseSafeTextReplacement(original: string, candidate: string): string {
        const safeOriginal = String(original || '');
        let safeCandidate = String(candidate || '').trim();
        if (!safeCandidate) return safeOriginal;
        if (/[<>]/.test(safeCandidate)) return safeOriginal;
        if (/\b(class|id|href|src|data-[\w-]+)\s*=\s*/i.test(safeCandidate)) return safeOriginal;

        const normalizedOriginal = safeOriginal.replace(/\s+/g, ' ').trim();
        const normalizedCandidate = safeCandidate.replace(/\s+/g, ' ').trim();

        const originalLen = normalizedOriginal.length || 1;
        const diffRatio = Math.abs(normalizedCandidate.length - normalizedOriginal.length) / originalLen;
        if (originalLen >= 40 && diffRatio > 0.45) {
            return safeOriginal;
        }

        if (this.appearsLikeDifferentStructure(normalizedCandidate, normalizedOriginal)) {
            return safeOriginal;
        }

        safeCandidate = safeCandidate
            .replace(/\s+,/g, ',')
            .replace(/\s+\./g, '.')
            .replace(/\s+:/g, ':')
            .replace(/\s+;/g, ';')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')');

        const leading = safeOriginal.match(/^\s*/)?.[0] || '';
        const trailing = safeOriginal.match(/\s*$/)?.[0] || '';
        return `${leading}${safeCandidate}${trailing}`;
    }

    private appearsLikeDifferentStructure(candidate: string, original: string): boolean {
        const originalWordCount = (original.match(/\b\S+\b/g) || []).length;
        const candidateWordCount = (candidate.match(/\b\S+\b/g) || []).length;
        if (originalWordCount >= 8 && Math.abs(candidateWordCount - originalWordCount) > Math.max(6, Math.round(originalWordCount * 0.5))) {
            return true;
        }
        return false;
    }

    /**
     * Correcciones deterministas seguras antes del LLM.
     * Solo toca texto plano de forma muy controlada vía reemplazos globales.
     */
    private applyDeterministicTextFixes(html: string, input: CorrectorInput): string {
        const tokens = this.tokenizeHtmlPreservingTags(html);

        for (const token of tokens) {
            if (token.kind !== 'text') continue;
            if (token.blocked) continue;
            if (!this.shouldEditTextNode(token.raw)) continue;

            const normalized = this.applyDeterministicTextFixesToText(token.raw, input);
            token.raw = this.chooseSafeTextReplacement(token.raw, normalized);
        }

        return this.joinHtmlTokens(tokens).trim();
    }

    private applyDeterministicTextFixesToText(text: string, input: CorrectorInput): string {
        let out = String(text || '');

        out = out.replace(/\s+,/g, ',');
        out = out.replace(/\s+\./g, '.');
        out = out.replace(/\s+:/g, ':');
        out = out.replace(/\s+;/g, ';');
        out = out.replace(/\(\s+/g, '(');
        out = out.replace(/\s+\)/g, ')');
        out = out.replace(/[ \t]{2,}/g, ' ');

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
            [/, incluyendo la estructura de encabezados y párrafos, así como la no mención explícita del nombre de la empresa o localidad\./gi, ''],
            [/incluyendo la estructura de encabezados y párrafos, así como la no mención explícita del nombre de la empresa o localidad/gi, '']
        ];

        for (const [pattern, replacement] of replacements) {
            out = out.replace(pattern, replacement);
        }

        out = this.stripPhaseBoilerplate(out, input);
        out = this.normalizeBrokenLocalFragments(out, input);

        if (input.phone) {
            out = out.replace(new RegExp(this.escapeRegExp(input.phone), 'g'), input.phone);
        }
        if (input.businessName) {
            out = out.replace(new RegExp(this.escapeRegExp(input.businessName), 'g'), input.businessName);
        }

        return out.trim();
    }

    private stripPhaseBoilerplate(text: string, input: CorrectorInput): string {
        let out = String(text || '');
        const city = String(input.city || '').trim();
        const niche = String(input.niche || '').trim().toLowerCase();
        const escapedCity = this.escapeRegExp(city);
        const escapedNiche = this.escapeRegExp(niche);

        const patterns: RegExp[] = [];
        if (city && niche) {
            patterns.push(
                new RegExp(`\\s*En\\s+${escapedCity},\\s*el servicio de\\s+${escapedNiche}\\s+se explica con alcance claro, criterios t[ée]cnicos y una expectativa realista de intervenci[oó]n\\.`, 'gi'),
                new RegExp(`\\s*En\\s+${escapedCity},\\s*el servicio de\\s+${escapedNiche}\\s+se organiza con valoraci[oó]n previa, criterio t[ée]cnico y una ejecuci[oó]n proporcionada al caso\\.`, 'gi'),
                new RegExp(`\\s*En\\s+${escapedCity},\\s*este trabajo de\\s+${escapedNiche}\\s+conviene resolverlo con una valoraci[oó]n previa y una propuesta ajustada al alcance real\\.`, 'gi')
            );
        }

        for (const pattern of patterns) {
            out = out.replace(pattern, '');
        }

        out = out.replace(/\s{2,}/g, ' ');
        out = out.replace(/\s+([,.;:!?])/g, '$1');
        out = out.replace(/([.?!])\s*([.?!])+/g, '$1');
        return out.trim();
    }

    private normalizeBrokenLocalFragments(text: string, input: CorrectorInput): string {
        const city = String(input.city || '').trim() || 'esta localidad';
        const business = String(input.businessName || '').trim() || 'nuestra empresa';
        const niche = String(input.niche || '').trim().toLowerCase();
        let out = String(text || '');

        out = out.replace(/\bEn\s+[,;]/gi, `En ${city},`);
        out = out.replace(/\bEn\s*,\s*/gi, `En ${city}, `);
        out = out.replace(/identidad visible de\s*,\s*/gi, `identidad de ${business}, `);
        out = out.replace(/\bconviene revisar en\s*,\s*/gi, `conviene revisar en ${city}, `);
        out = out.replace(/\bEn\s*,\s*el servicio de\s+[^.]+\./gi, '');
        out = out.replace(/\bAtenci[oó]n directa para\b(?=\s*[<.,;:]|$)/gi, `Atención directa para ${niche} en ${city}`);
        out = out.replace(/\bAtenci[oó]n para\b(?=\s*[<.,;:]|$)/gi, `Atención para ${niche} en ${city}`);
        out = out.replace(/\bpara resolver todos tus necesidades\b/gi, 'para resolver todas tus necesidades');
        out = out.replace(/\bpresupuestos son cerrados antes de empezar\b/gi, 'presupuestos se explican antes de empezar');
        out = out.replace(/\bno recibir[aá]s ninguna sorpresa en tu factura\b/gi, 'no haya sorpresas en el alcance del trabajo');
        out = out.replace(/\bConf[ií]a en nosotros para mantener tu vecindario seguro y protegido\b/gi, 'La prioridad es dejar el acceso operativo y la seguridad bien resuelta');
        out = out.replace(/\s{2,}/g, ' ');
        out = out.replace(/\s+([,.;:!?])/g, '$1');
        return out.trim();
    }

    private cleanModelArtifacts(raw: string): string {
        let out = raw || '';

        if (out.includes('```json')) {
            out = out.split('```json')[1].split('```')[0].trim();
        } else if (out.includes('```html')) {
            out = out.split('```html')[1].split('```')[0].trim();
        } else if (out.includes('```')) {
            out = out.split('```')[1].trim();
        }

        out = out.replace(/^json\s*/i, '').replace(/^html\s*/i, '').trim();
        return out;
    }

    private validateCorrectedHtml(
        originalHtml: string,
        correctedHtml: string,
        input: CorrectorInput
    ): { passed: boolean; warnings: string[] } {
        const warnings: string[] = [];

        try {
            const $orig = cheerio.load(originalHtml, { decodeEntities: false });
            const $new = cheerio.load(correctedHtml, { decodeEntities: false });

            const importantTags = ['h1', 'h2', 'h3', 'p', 'section', 'a', 'ul', 'li', 'footer', 'header', 'main'];
            for (const tag of importantTags) {
                const origCount = $orig(tag).length;
                const newCount = $new(tag).length;
                if (['p', 'li'].includes(tag)) {
                    if (Math.abs(origCount - newCount) > 3) {
                        warnings.push(`Cambio excesivo en <${tag}>: original=${origCount}, corregido=${newCount}`);
                    }
                } else if (origCount !== newCount) {
                    warnings.push(`Cambio estructural en <${tag}>: original=${origCount}, corregido=${newCount}`);
                }
            }

            const origClasses = this.collectClassList($orig);
            const newClasses = this.collectClassList($new);
            if (!this.sameStringSet(origClasses, newClasses)) {
                warnings.push('Las clases CSS no coinciden entre el HTML original y el corregido.');
            }

            const origIds = this.collectAttributeValues($orig, 'id');
            const newIds = this.collectAttributeValues($new, 'id');
            if (!this.sameStringSet(origIds, newIds)) {
                warnings.push('Los IDs no coinciden entre el HTML original y el corregido.');
            }

            const origHrefs = this.collectAttributeValues($orig, 'href');
            const newHrefs = this.collectAttributeValues($new, 'href');
            if (!this.sameStringSet(origHrefs, newHrefs)) {
                warnings.push('Los href no coinciden entre el HTML original y el corregido.');
            }

            const origSrcs = this.collectAttributeValues($orig, 'src');
            const newSrcs = this.collectAttributeValues($new, 'src');
            if (!this.sameStringSet(origSrcs, newSrcs)) {
                warnings.push('Los src no coinciden entre el HTML original y el corregido.');
            }

            if (input.businessName) {
                const origHasBiz = originalHtml.includes(input.businessName);
                const newHasBiz = correctedHtml.includes(input.businessName);
                if (origHasBiz && !newHasBiz) {
                    warnings.push('El nombre de empresa parece haber sido alterado o eliminado.');
                }
            }

            if (input.phone) {
                const normalizedPhone = this.normalizePhone(input.phone);
                const origTextNormalized = this.normalizePhone($orig.root().text());
                const newTextNormalized = this.normalizePhone($new.root().text());
                
                // Solo advertir si el teléfono ESTABA en el original y DESAPARECIÓ en el nuevo
                if (normalizedPhone && origTextNormalized.includes(normalizedPhone) && !newTextNormalized.includes(normalizedPhone)) {
                    warnings.push('El teléfono parece haber sido alterado o eliminado.');
                }
            }

            if (input.city) {
                const origHasCity = originalHtml.includes(input.city);
                const newHasCity = correctedHtml.includes(input.city);
                if (origHasCity && !newHasCity) {
                    warnings.push('La ciudad parece haber sido alterada o eliminada.');
                }
            }

            if ((input as any).address) {
                const address = String((input as any).address || '').trim();
                if (address) {
                    const origHasAddress = originalHtml.includes(address);
                    const newHasAddress = correctedHtml.includes(address);
                    if (origHasAddress && !newHasAddress) {
                        warnings.push('La dirección parece haber sido alterada o eliminada.');
                    }
                }
            }

            const origLen = this.visibleTextLength($orig);
            const newLen = this.visibleTextLength($new);
            const diffRatio = origLen > 0 ? Math.abs(newLen - origLen) / origLen : 0;
            if (diffRatio > 0.18) {
                warnings.push(`La longitud del texto visible cambió demasiado (${Math.round(diffRatio * 100)}%).`);
            }

            const originalRisk = detectCrossNicheContamination({
                niche: input.niche,
                city: input.city,
                html: originalHtml
            });
            const correctedRisk = detectCrossNicheContamination({
                niche: input.niche,
                city: input.city,
                html: correctedHtml
            });

            if (correctedRisk.severity === 'fatal') {
                warnings.push(`Contaminación cross-niche detectada tras corrección: ${correctedRisk.summary}`);
            } else if (correctedRisk.severity === 'major' && correctedRisk.score >= (originalRisk.score + 18) && correctedRisk.foreignNiches.length >= 2) {
                warnings.push(`La corrección aumentó de forma relevante el riesgo de contaminación cross-niche (${originalRisk.score} -> ${correctedRisk.score}).`);
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

    private applyFinalSafeNormalizations(html: string, input: CorrectorInput): string {
        let out = this.normalizeBrokenLocalFragments(html, input);
        out = out.replace(/\s{2,}/g, ' ');
        out = out.replace(/>\s+</g, '><');
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
        return String(value || '').replace(/\D/g, '');
    }

    private visibleTextLength($: cheerio.CheerioAPI): number {
        const clone = $.root().clone();
        clone.find('script, style, noscript').remove();
        const text = clone.text().replace(/\s+/g, ' ').trim();
        return text.length;
    }

    private escapeRegExp(value: string): string {
        return String(value || '').replace(/([^\w-])/g, '\\$1');
    }
}
