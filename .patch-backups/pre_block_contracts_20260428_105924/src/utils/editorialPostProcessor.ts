import * as cheerio from 'cheerio';
import { resolveVerticalPack } from '../knowledge-packs/base.js';

function normalizeForCompare(value: string): string {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-záéíóúñ0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripTraceArtifacts(value: string): string {
    return String(value || '')
        .replace(/\s*\((?:TR|REF|ID)-[a-z0-9_-]{4,}\)\.?/gi, '')
        .replace(/\b(?:TR|REF|ID)-[a-z0-9_-]{4,}\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

export function editorialPostProcessHtml(
    html: string,
    input: {
        city: string;
        brand: string;
        phone: string;
        maxBrandMentions: number;
        niche?: string;
    }
): string {
    let out = html || '';

    out = out.replace(/\s{2,}/g, ' ').trim();
    out = out.replace(/\[Provisional\]/gi, '').trim();
    out = stripTraceArtifacts(out);

    const roboticPhrases = [
        /altamente relevante/gi,
        /nuestra vasta experiencia/gi,
        /soluciones prestadas/gi,
        /cronograma de servicios/gi,
        /garantía local/gi,
        /arribo promedio/gi,
        /de forma excepcional/gi,
        /seguridad certificada/gi,
        /uso de sistemas avanzados/gi
    ];

    roboticPhrases.forEach((rx) => {
        out = out.replace(rx, '');
    });

    const $ = cheerio.load(out);
    const pack = input.niche ? resolveVerticalPack(input.niche) : undefined;
    const forbiddenTerms = (pack?.forbiddenTerms || []).map((term) => normalizeForCompare(String(term || ''))).filter(Boolean);
    const seenText = new Set<string>();

    let cityMentions = 0;
    let brandMentions = 0;
    const MAX_CITY_BODY = 12; // More generous for body text
    const MAX_BRAND_BODY = input.maxBrandMentions || 6;

    const cityRegex = input.city ? new RegExp(`\\b${input.city}\\b`, 'gi') : null;
    const brandRegex = input.brand ? new RegExp(`\\b${input.brand}\\b`, 'gi') : null;

    $('h1, h2, h3, h4, p, li, td, summary, .faq-answer').each((_: number, el: any) => {
        const $el = $(el);
        // SKIP if it's a structural container that we should not flatten
        if ($el.hasClass('internal-links-item') || $el.closest('.internal-links-grid, .internal-links-hub').length > 0) {
            return;
        }

        const inUtilityZone = $el.closest('footer, header, nav, .site-header, .footer-editorial, .site-footer').length > 0;
        
        // We iterate over actual text nodes to avoid destroying child tags (<a>, <strong>, etc.)
        $el.contents().each((_j, node) => {
            if (node.type !== 'text') return;

            const originalText = (node as any).data || '';
            const cleaned = stripTraceArtifacts(originalText);
            const key = normalizeForCompare(cleaned);

            if (!cleaned || !key) {
                // If it's just trace artifacts or empty, we clean it
                (node as any).data = '';
                return;
            }

            // 1. Exact duplicate check (only for meaningful lengths)
            if (key.length > 30 && seenText.has(key)) {
                (node as any).data = '';
                return;
            }
            if (key.length > 30) seenText.add(key);

            // 2. Mention Capping
            let processedText = cleaned;
            if (cityRegex && input.city) {
                processedText = processedText.replace(cityRegex, (match) => {
                    cityMentions++;
                    return cityMentions > MAX_CITY_BODY ? '' : match;
                });
            }
            if (brandRegex && input.brand) {
                processedText = processedText.replace(brandRegex, (match) => {
                    brandMentions++;
                    return brandMentions > MAX_BRAND_BODY ? '' : match;
                });
            }

            (node as any).data = processedText.replace(/\s{2,}/g, ' ');
        });

        // 3. Forbidden terms check (entire element removal if found in text)
        const fullText = normalizeForCompare($el.text());
        if (forbiddenTerms.some((term) => fullText.includes(term))) {
            $el.remove();
        }
    });

    // Special handling for FAQ items to avoid leaving empty items
    $('details.faq-item').each((_: number, el: any) => {
        if ($(el).text().trim().length < 5) {
            $(el).remove();
        }
    });

    out = $.html();
    if (input.phone) {
        const genericPattern = /9\d[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}/g;
        const intlPattern = /\+34\s*9\d[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}/g;

        out = out.replace(genericPattern, (match) => {
            const compactMatch = match.replace(/\D/g, '');
            const compactInput = input.phone.replace(/\D/g, '');
            if (compactMatch.length === 9 && compactMatch !== compactInput) {
                return input.phone;
            }
            return match;
        });

        out = out.replace(intlPattern, (match) => {
            const compactMatch = match.replace(/\D/g, '').slice(-9);
            const compactInput = input.phone.replace(/\D/g, '').slice(-9);
            if (compactMatch !== compactInput) {
                return input.phone;
            }
            return match;
        });
    }

    out = out.replace(/<p>\s*<\/p>/g, '');
    out = out.replace(/<li>\s*<\/li>/g, '');
    out = out.replace(/\s{2,}/g, ' ').trim();

    return out;
}

