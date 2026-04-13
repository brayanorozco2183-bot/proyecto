import { CONTENT_BLACKLIST } from '../config/content_blacklist.js';

/**
 * Nueva capa de refinamiento y validación para detectar corrupción textual suave
 */
export class SectionIntegrityRefiner {

    public static detectTextCorruption(text: string): boolean {
        // 1. Corrupted phone numbers: (506) 8(506) 8... or 9(9...
        for (const pattern of CONTENT_BLACKLIST.CORRUPTION.PHONE_CORRUPTION) {
            if (pattern.test(text)) {
                console.log(`[Corruption] Phone corruption detected: ${pattern.source}`);
                return true;
            }
        }

        // Pre-processing: Strip script tags as they contain valid camelCase keys (Schema.org)
        const scanText = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');

        // 2. Stuck words without spaces (CamelCase in middle of lowercase)
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

        // 3. Specific known merged patterns
        const specificMatch = scanText.match(CONTENT_BLACKLIST.CORRUPTION.SPECIFIC_MERGED);
        if (specificMatch) {
            const index = scanText.indexOf(specificMatch[0]);
            const contextText = scanText.substring(Math.max(0, index - 20), Math.min(scanText.length, index + 20));
            console.log(`[Corruption] Specific merged pattern found: "${specificMatch.join(', ')}" at context: "...${contextText}..."`);
            return true;
        }

        // 4. Unusually long words (> 22 chars)
        const words = scanText.split(/[\s<>&;]/);
        for (const w of words) {
            const cleanWord = w.replace(/[.,:;()]/g, '');
            if (cleanWord.length > 22 && /^[a-záéíóúñ]+$/i.test(cleanWord)) {
                console.log(`[Corruption] Unusually long word detected: "${cleanWord}"`);
                return true;
            }
        }

        // 5. Model legacy/residue
        for (const pattern of CONTENT_BLACKLIST.IA_PATTERNS) {
            if (pattern.test(scanText)) {
                console.log(`[Corruption] IA pattern detected: ${pattern.source}`);
                return true;
            }
        }

        // 6. Generic banned phrases that indicate total failure
        const h2Match = scanText.match(/<h2[^>]*>(.*?)<\/h2>/i);
        if (h2Match && h2Match[1].toLowerCase().includes("servicio en ciudad")) {
            console.log(`[Corruption] H2 "servicio en ciudad" detected.`);
            return true;
        }

        return false;
    }

    public static refine(text: string): string {
        let refined = text;

        // 1. Repair specific merged corruptions (Aggressive fix)
        // We remove boundaries to catch things like <td>Comprompersonal</td>
        refined = refined.replace(/ppersonal/gi, 'personal');
        refined = refined.replace(/comprompersonal/gi, 'compromiso personal');
        refined = refined.replace(/precpersonal/gi, 'precio personal');
        refined = refined.replace(/formadodel?/gi, 'formado del');
        refined = refined.replace(/conacredit/gi, 'con acreditación');
        refined = refined.replace(/profesionalt[eé]cnico/gi, 'técnico profesional');

        // 2. Clear known IA residue & Preambles
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

        // 3. Normalize spaces
        refined = refined.replace(/\s\s+/g, ' ');

        return refined.trim();
    }
}