import { ContentDraft } from '../types/pipeline_v2.js';

/**
 * IntegrityGuard - Utility for Phase 6: Pre-Assembly Integrity.
 * Verifies block content before it reaches the procedural engine.
 */
export class IntegrityGuard {
    /**
     * Checks a ContentDraft for corrupted text, placeholders or empty blocks.
     * Returns a list of issues found.
     */
    static check(draft: ContentDraft): string[] {
        const issues: string[] = [];

        if (!draft.blocks || draft.blocks.length === 0) {
            issues.push("INTEGRITY:EMPTY_DRAFT");
            return issues;
        }

        drawerBlocksCheck: for (const block of draft.blocks) {
            // Placeholder check
            if (block.html.includes("{{") || block.html.includes("[INSERT") || block.html.includes("[PLACEHOLDER]")) {
                issues.push(`INTEGRITY:PLACEHOLDER_DETECTED:block_${block.metadata.sectionIndex}`);
            }

            // Minimal length check (each block should have at least some HTML structure and text)
            if (block.html.length < 50) {
                issues.push(`INTEGRITY:BLOCK_TOO_SHORT:block_${block.metadata.sectionIndex}`);
            }

            // Common hallucinations check
            if (block.html.includes("AI Assistant") || block.html.includes("Your niche here") || block.html.includes("Lorem Ipsum")) {
                issues.push(`INTEGRITY:HALLUCINATION_DETECTED:block_${block.metadata.sectionIndex}`);
            }
        }

        // Global coherence check
        const totalHtml = draft.html || draft.blocks.map(b => b.html).join('');
        if (totalHtml.length < 500) {
            issues.push("INTEGRITY:CONTENT_VOLUME_TOO_LOW");
        }

        return issues;
    }

    /**
     * Checks if HTML fragment is safe (balanced tags, no scripts).
     */
    static isHtmlSafe(html: string): boolean {
        if (!html || !html.trim()) return false;
        
        // 1. Script injection check
        if (html.toLowerCase().includes("<script")) return false;
        
        try {
            // 2. DOM structural check using Cheerio
            const $ = cheerio.load(html);
            
            // Check for common signs of corruption:
            // - Mismatched headers
            // - Empty containers that shouldn't be empty
            // - Rogue classes from leaked prompts
            const raw = $.html();
            if (raw.includes('site-headername') || raw.includes('block-sectionheader')) return false;

            // 3. Heuristic tag balance
            const openTags = (html.match(/<[a-zA-Z]/g) || []).length;
            const closeTags = (html.match(/<\//g) || []).length;
            
            // We allow ZERO mismatch in a modern pipeline
            if (openTags !== closeTags) return false;

            return true;
        } catch {
            return false;
        }
    }
}
import * as cheerio from 'cheerio';