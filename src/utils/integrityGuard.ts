import * as cheerio from 'cheerio';
import { ContentBlock, ContentDraft } from '../types/pipeline_v2.js';

/**
 * IntegrityGuard - Utility for Phase 6: Pre-Assembly Integrity.
 * Verifies and normalizes block content before it reaches the procedural engine.
 */
export interface IntegrityContext {
    city?: string;
    niche?: string;
    targetTotal?: number;
}

export class IntegrityGuard {
    static sanitizeDraft(draft: ContentDraft, context: IntegrityContext = {}): ContentDraft {
        const sourceBlocks = Array.isArray(draft?.blocks) ? draft.blocks : [];
        const blocks = sourceBlocks.map((block, index) => this.sanitizeBlock(block, index, context));
        const totalWords = blocks.reduce((sum, block) => sum + Number(block.wordCount || 0), 0);
        const html = blocks.map((block) => String(block.html || '').trim()).filter(Boolean).join('\n');

        return {
            ...draft,
            blocks,
            totalWords,
            html
        };
    }

    /**
     * Checks a ContentDraft for corrupted text, placeholders or empty blocks.
     * Returns a list of unresolved issues found after normalization.
     */
    static check(draft: ContentDraft, context: IntegrityContext = {}): string[] {
        const issues: string[] = [];
        const normalizedDraft = this.sanitizeDraft(draft, context);

        if (!normalizedDraft.blocks || normalizedDraft.blocks.length === 0) {
            issues.push('INTEGRITY:EMPTY_DRAFT');
            return issues;
        }

        const seenSignatures = new Map<string, number>();
        const repeatedTailSentences = new Map<string, number>();

        for (const block of normalizedDraft.blocks) {
            const sectionIndex = Number.isFinite(block.metadata?.sectionIndex) ? block.metadata.sectionIndex : 0;
            const blockType = String(block.metadata?.block_type || '').toLowerCase().trim();
            const html = String(block.html || '');
            const visibleText = this.extractVisibleText(html);
            const visibleWords = this.countWords(visibleText);

            if (!html.trim()) {
                issues.push(`INTEGRITY:EMPTY_BLOCK:block_${sectionIndex}`);
                continue;
            }

            // Note: DOCUMENT_WRAPPER check removed here because unwrapDocumentHtml in sanitizeBlock 
            // already handles this. If it persists, it will be caught by isHtmlSafe or other filters.

            if (/(?:<script|<iframe|<object|<embed)/i.test(html)) {
                issues.push(`INTEGRITY:UNSAFE_TAG:block_${sectionIndex}`);
            }

            if (html.includes('{{') || html.includes('[INSERT') || html.includes('[PLACEHOLDER]')) {
                issues.push(`INTEGRITY:PLACEHOLDER_DETECTED:block_${sectionIndex}`);
            }

            if (html.includes('AI Assistant') || html.includes('Your niche here') || html.includes('Lorem Ipsum')) {
                issues.push(`INTEGRITY:HALLUCINATION_DETECTED:block_${sectionIndex}`);
            }

            const minHtmlLength = this.getMinimumHtmlLength(blockType);
            if (html.length < minHtmlLength) {
                issues.push(`INTEGRITY:BLOCK_TOO_SHORT:block_${sectionIndex}`);
            }

            const minVisibleWords = this.getMinimumVisibleWords(blockType);
            if (visibleWords < minVisibleWords) {
                issues.push(`INTEGRITY:VISIBLE_TEXT_TOO_LOW:block_${sectionIndex}`);
            }

            if (!this.isHtmlSafe(html)) {
                issues.push(`INTEGRITY:UNSAFE_OR_CORRUPTED_HTML:block_${sectionIndex}`);
            }

            const signature = this.buildDuplicateSignature(visibleText, context);
            if (signature && !this.isSupplementalBlock(blockType) && visibleWords >= 18) {
                if (seenSignatures.has(signature)) {
                    issues.push(`INTEGRITY:DUPLICATE_BLOCK_COPY:block_${sectionIndex}`);
                } else {
                    seenSignatures.set(signature, sectionIndex);
                }
            }

            const tailSentence = this.getLastSentence(visibleText, context);
            if (tailSentence) {
                repeatedTailSentences.set(tailSentence, (repeatedTailSentences.get(tailSentence) || 0) + 1);
            }
        }

        for (const [sentence, repeats] of repeatedTailSentences.entries()) {
            if (repeats >= 3) {
                issues.push(`INTEGRITY:REPEATED_LOCAL_TAIL:${sentence.slice(0, 80)}`);
            }
        }

        const totalHtml = normalizedDraft.html || normalizedDraft.blocks.map((b) => b.html).join('');
        const targetTotal = Number(context.targetTotal || 0);
        const minExpected = targetTotal > 0 ? Math.max(450, Math.floor(targetTotal * 0.25)) : 500;
        if (Math.max(normalizedDraft.totalWords, this.countWords(this.extractVisibleText(totalHtml))) < minExpected) {
            issues.push('INTEGRITY:CONTENT_VOLUME_TOO_LOW');
        }

        return Array.from(new Set(issues));
    }

    /**
     * Compatibility alias for older pipeline calling validateDraft
     */
    static validateDraft(draft: ContentDraft, context: IntegrityContext = {}): string[] {
        return this.check(draft, context);
    }

    /**
     * Checks if HTML fragment is safe enough for the renderer.
     */
    static isHtmlSafe(html: string): boolean {
        if (!html || !html.trim()) return false;

        const lowered = html.toLowerCase();
        if (lowered.includes('<script') || lowered.includes('<iframe') || lowered.includes('<object') || lowered.includes('<embed')) {
            return false;
        }

        try {
            const $ = cheerio.load(html, { decodeEntities: false } as any);
            const raw = $.html() || '';

            if (raw.includes('site-headername') || raw.includes('block-sectionheader')) {
                console.warn(`[IntegrityGuard] Rejected: site-headername/block-sectionheader found`);
                return false;
            }
            // Note: html/head/body check removed from here to allow recovery via unwrapDocumentHtml

            const visibleText = this.extractVisibleText(raw);
            const hasRenderableNode = $.root().find('*').length > 0;
            const hasVisualPlaceholder = /map-placeholder|hero-visual|editorial-visual|img\b/i.test(raw);

            if (!hasRenderableNode) {
                console.warn(`[IntegrityGuard] Rejected: No renderable nodes`);
                return false;
            }
            if (!visibleText && !hasVisualPlaceholder) {
                console.warn(`[IntegrityGuard] Rejected: No visible text and no placeholder. TextLen: ${visibleText.length}`);
                return false;
            }

            return true;
        } catch (e: any) {
            console.warn(`[IntegrityGuard] Rejected: Parser error: ${e.message}`);
            return false;
        }
    }

    private static sanitizeBlock(block: ContentBlock, index: number, context: IntegrityContext): ContentBlock {
        const metadata = {
            ...(block.metadata || {}),
            sectionIndex: Number.isFinite(block.metadata?.sectionIndex) ? block.metadata.sectionIndex : index,
            section_id: block.metadata?.section_id || `section-${index}`,
            block_type: block.metadata?.block_type || 'content'
        };

        let html = this.unwrapDocumentHtml(String(block.html || ''));
        html = this.stripUnsafeTags(html);
        html = this.removeRepeatedLocalBoilerplateFromHtml(html, context);
        html = this.normalizeHtml(html);

        const semantic = (metadata as any).semantic !== undefined
            ? this.sanitizeSemanticValue((metadata as any).semantic, context)
            : (metadata as any).semantic;

        const visibleText = this.extractVisibleText(html);
        const wordCount = this.countWords(visibleText);

        return {
            ...block,
            id: block.id || `section-${index}`,
            html,
            wordCount,
            metadata: metadata as any
        };
    }

    private static unwrapDocumentHtml(html: string): string {
        if (!html.trim()) return '';
        if (!/<(?:html|head|body)\b/i.test(html)) return html.trim();

        const $ = cheerio.load(html, { decodeEntities: false });
        
        // If there's a body, take its content
        let content = $('body').html() || '';
        
        // If body is empty or not found, try the root but strip the document tags
        if (!content.trim()) {
            content = $.root().html() || '';
        }

        // Final safety: regex strip any remaining doc wrappers that Cheerio might have preserved or added
        return content
            .replace(/<\/?(?:html|head|body|!doctype)[^>]*>/gi, '')
            .trim();
    }

    private static stripUnsafeTags(html: string): string {
        if (!html.trim()) return '';
        const $ = cheerio.load(html, { decodeEntities: false } as any);
        $('script, iframe, object, embed, noscript, meta[http-equiv="refresh"], title').remove();
        return $.root().html()?.trim() || '';
    }

    private static normalizeHtml(html: string): string {
        return String(html || '')
            .replace(/\s{2,}/g, ' ')
            .replace(/>\s+</g, '><')
            .trim();
    }

    private static sanitizeSemanticValue(value: any, context: IntegrityContext): any {
        if (Array.isArray(value)) {
            return value.map((item: any) => this.sanitizeSemanticValue(item, context));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, raw]) => [key, this.sanitizeSemanticValue(raw, context)])
            );
        }

        if (typeof value === 'string') {
            return this.removeRepeatedLocalBoilerplateFromText(value, context);
        }

        return value;
    }

    private static removeRepeatedLocalBoilerplateFromHtml(html: string, context: IntegrityContext): string {
        if (!html.trim()) return '';
        const $ = cheerio.load(html, { decodeEntities: false } as any);
        $('p, li, dd, blockquote').each((_: any, el: any) => {
            const $el = $(el);
            if ($el.children().length > 0) return;
            const cleaned = this.removeRepeatedLocalBoilerplateFromText($el.text(), context);
            if (cleaned && cleaned !== this.normalizeText($el.text())) {
                $el.text(cleaned);
            }
        });
        return $.root().html()?.trim() || html.trim();
    }

    private static removeRepeatedLocalBoilerplateFromText(text: string, context: IntegrityContext): string {
        let out = this.normalizeText(text);
        const patterns = this.getLocalBoilerplatePatterns(context);

        for (const pattern of patterns) {
            const cleaned = out.replace(pattern, '').trim();
            if (cleaned && cleaned.length >= 70) {
                out = cleaned;
            }
        }

        return this.normalizeText(out);
    }

    private static getLocalBoilerplatePatterns(context: IntegrityContext): RegExp[] {
        const city = this.escapeRegex(context.city || '');
        if (!city) return [];

        return [
            new RegExp(`\\s*En\\s+${city},\\s+este\\s+trabajo\\s+de\\s+[^.]{0,140}?conviene\\s+resolverlo\\s+con\\s+una\\s+valoraci[oó]n\\s+previa\\s+y\\s+una\\s+propuesta\\s+ajustada\\s+al\\s+alcance\\s+real\\.?$`, 'i'),
            new RegExp(`\\s*En\\s+${city},\\s+este\\s+servicio\\s+de\\s+[^.]{0,140}?conviene\\s+resolverlo\\s+con\\s+una\\s+valoraci[oó]n\\s+previa\\s+y\\s+una\\s+propuesta\\s+ajustada\\s+al\\s+alcance\\s+real\\.?$`, 'i'),
            new RegExp(`\\s*En\\s+${city},\\s+el\\s+servicio\\s+de\\s+[^.]{0,160}?se\\s+organiza\\s+con\\s+valoraci[oó]n\\s+previa,?\\s*criterio\\s+t[eé]cnico\\s+y\\s+una\\s+ejecuci[oó]n\\s+proporcionada\\s+al\\s+caso\\.?$`, 'i')
        ];
    }

    private static getMinimumHtmlLength(blockType: string): number {
        if (blockType === 'map') return 40;
        if (blockType === 'urgency_panel' || blockType === 'cta_panel' || blockType === 'micro_cta') return 80;
        return 120;
    }

    private static getMinimumVisibleWords(blockType: string): number {
        if (blockType === 'map') return 8;
        if (blockType === 'urgency_panel' || blockType === 'cta_panel' || blockType === 'micro_cta') return 12;
        return 24;
    }

    private static isSupplementalBlock(blockType: string): boolean {
        return ['map', 'authority_note', 'micro_cta', 'trust_band'].includes(blockType);
    }

    private static buildDuplicateSignature(text: string, context: IntegrityContext): string {
        const city = String(context.city || '').toLowerCase().trim();
        const niche = String(context.niche || '').toLowerCase().trim();
        let normalized = this.normalizeText(text)
            .toLowerCase()
            .replace(/[0-9]+/g, '')
            .replace(city ? new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'gi') : /$^/, '')
            .replace(niche ? new RegExp(`\\b${this.escapeRegex(niche)}\\b`, 'gi') : /$^/, '')
            .replace(/\b(servicio|trabajo|empresa|profesional|local|t[eé]cnico|valoraci[oó]n|previa|criterio|caso)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (normalized.length > 180) {
            normalized = normalized.slice(0, 180).trim();
        }

        return normalized.length >= 90 ? normalized : '';
    }

    private static getLastSentence(text: string, context: IntegrityContext): string {
        const normalized = this.normalizeText(text);
        if (!normalized) return '';
        const parts = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
        const last = parts.at(-1) || '';
        if (!last) return '';
        const city = String(context.city || '').trim();
        if (city && !new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'i').test(last)) {
            return '';
        }
        return last.length >= 60 ? last : '';
    }

    private static extractVisibleText(html: string): string {
        if (!html.trim()) return '';
        const $ = cheerio.load(html, { decodeEntities: false } as any);
        return this.normalizeText($.text());
    }

    private static countWords(text: string): number {
        const normalized = this.normalizeText(text);
        return normalized ? normalized.split(/\s+/).length : 0;
    }

    private static normalizeText(value: string): string {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .replace(/\s+([,.;:!?])/g, '$1')
            .trim();
    }

    private static escapeRegex(value: string): string {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}