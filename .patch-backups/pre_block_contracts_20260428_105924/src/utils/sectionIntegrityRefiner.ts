import { CONTENT_BLACKLIST } from '../config/content_blacklist.js';

export class SectionIntegrityRefiner {

    public static detectTextCorruption(text: string): boolean {
        for (const pattern of CONTENT_BLACKLIST.CORRUPTION.PHONE_CORRUPTION) {
            if (pattern.test(text)) {
                console.log(`[Corruption] Phone corruption detected: ${pattern.source}`);
                return true;
            }
        }

        const scanText = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');

        const mergedWords = scanText.match(CONTENT_BLACKLIST.CORRUPTION.MERGED_WORDS) || [];
        const technicalExemptions = [
            'postalAddress', 'streetAddress', 'addressLocality', 'addressRegion',
            'addressCountry', 'openingHours', 'openingHoursSpecification', 'geoCoordinates',
            'esignValidator', 'visualVariant', 'designVariant', 'layoutVariant'
        ];

        const validCorruption = mergedWords.filter(w => !technicalExemptions.some(e => w.toLowerCase().includes(e.toLowerCase())));
        if (validCorruption.length > 0) {
            console.log(`[Corruption] Merged words detected: ${validCorruption.join(', ')}`);
            return true;
        }

        const specificMatch = scanText.match(CONTENT_BLACKLIST.CORRUPTION.SPECIFIC_MERGED);
        if (specificMatch) {
            const index = scanText.indexOf(specificMatch[0]);
            const contextText = scanText.substring(Math.max(0, index - 20), Math.min(scanText.length, index + 20));
            console.log(`[Corruption] Specific merged pattern found: "${specificMatch.join(', ')}" at context: "...${contextText}..."`);
            return true;
        }

        const words = scanText.split(/[\s<>&;]/);
        for (const w of words) {
            const cleanWord = w.replace(/[.,:;()]/g, '');
            if (cleanWord.length > 22 && /^[a-záéíóúñ]+$/i.test(cleanWord)) {
                console.log(`[Corruption] Unusually long word detected: "${cleanWord}"`);
                return true;
            }
        }

        for (const pattern of CONTENT_BLACKLIST.IA_PATTERNS) {
            if (pattern.test(scanText)) {
                console.log(`[Corruption] IA pattern detected: ${pattern.source}`);
                return true;
            }
        }

        const h2Match = scanText.match(/<h2[^>]*>(.*?)<\/h2>/i);
        if (h2Match && h2Match[1].toLowerCase().includes("servicio en ciudad")) {
            console.log(`[Corruption] H2 "servicio en ciudad" detected.`);
            return true;
        }

        return false;
    }

    public static refine(text: string, niche = '', city = ''): string {
        let refined = String(text || '');

        refined = refined.replace(/<!DOCTYPE[^>]*>/gi, '');
        if (/<body\b/i.test(refined)) {
            const bodyMatch = refined.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch?.[1]) refined = bodyMatch[1];
        }
        refined = refined.replace(/<html[^>]*>|<\/html>/gi, '');
        refined = refined.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
        refined = refined.replace(/<body[^>]*>|<\/body>/gi, '');

        refined = refined.replace(/ppersonal/gi, 'personal');
        refined = refined.replace(/comprompersonal/gi, 'compromiso personal');
        refined = refined.replace(/precpersonal/gi, 'precio personal');
        refined = refined.replace(/formadodel?/gi, 'formado del');
        refined = refined.replace(/conacredit/gi, 'con acreditación');
        refined = refined.replace(/profesionalt[eé]cnico/gi, 'técnico profesional');

        const preambles = [
            /Este HTML cumple con.*?\.?/gi,
            /Aquí tienes el contenido.*?[:.]?/gi,
            /Presento la sección.*?[:.]?/gi,
            /He redactado.*?[:.]?/gi,
            /Espero que este contenido.*?\.?/gi,
            /\[\s*(?:Nota|Comentario|Explicación).*?\]/gi,
            /Markdown\s*[:.-]/gi,
            /Contenido HTML para.*?[:.]?/gi
        ];
        preambles.forEach(p => refined = refined.replace(p, ''));

        if (city) {
            refined = refined.replace(/(^|[\s>\(])En\s*,(?=\s|<|[.;,:!?])/g, `$1En ${city},`);
            refined = refined.replace(/(^|[\s>\(])en\s*,(?=\s|<|[.;,:!?])/g, `$1en ${city},`);
            refined = refined.replace(/\ben\s+compensa\b/gi, `en ${city} compensa`);
            refined = refined.replace(/\ben\s+conviene\b/gi, `en ${city} conviene`);
            refined = refined.replace(/\ben\s+para\s+realizar\b/gi, `en ${city} para realizar`);
        }

        refined = refined
            .replace(/\s\s+/g, ' ')
            .replace(/\s+([,.;:!?])/g, '$1')
            .trim();

        return refined;
    }
}
