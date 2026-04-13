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

    $('p, li, td').each((_: number, el: any) => {
        const cleaned = stripTraceArtifacts($(el).text());
        const key = normalizeForCompare(cleaned);

        if (!cleaned || !key) {
            $(el).remove();
            return;
        }

        if (forbiddenTerms.some((term) => key.includes(term))) {
            $(el).remove();
            return;
        }

        if (key.length > 20 && seenText.has(key)) {
            $(el).remove();
            return;
        }

        seenText.add(key);
        $(el).text(cleaned);
    });

    $('details.faq-item').each((_: number, el: any) => {
        const summary = stripTraceArtifacts($(el).find('summary').first().text());
        const answer = stripTraceArtifacts($(el).find('p').first().text());
        const combo = normalizeForCompare(`${summary} ${answer}`);

        if (!summary || !answer || (combo.length > 20 && seenText.has(`faq:${combo}`))) {
            $(el).remove();
            return;
        }

        seenText.add(`faq:${combo}`);
        $(el).find('summary').first().text(summary);
        $(el).find('p').first().text(answer);
    });

    out = $.html();

    const cityMentions = (out.match(new RegExp(input.city, 'gi')) || []).length;
    if (cityMentions > 6) {
        let remaining = 6;
        out = out.replace(new RegExp(input.city, 'gi'), (match) => {
            if (remaining > 0) {
                remaining--;
                return match;
            }
            return '';
        });
    }

    if (input.brand) {
        const brandRegex = new RegExp(input.brand, 'gi');
        const mentions = (out.match(brandRegex) || []).length;
        if (mentions > input.maxBrandMentions) {
            let remaining = input.maxBrandMentions;
            out = out.replace(brandRegex, (match) => {
                if (remaining > 0) {
                    remaining--;
                    return match;
                }
                return '';
            });
        }
    }

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