export interface ValidationIssue {
    type: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    match?: string;
}

export interface ValidationResult {
    valid: boolean;
    score: number;
    issues: ValidationIssue[];
    cleanedHtml?: string;
}

export interface ValidationContext {
    city?: string;
    businessName?: string;
    niche?: string;
    phone?: string;
}

/**
 * ContentGuard V1 - Deterministic Quality Firewall.
 * Blocks corruption, placeholders, and SEO-negative patterns without LLM.
 */
export function scanHtmlContent(html: string, context: ValidationContext): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 100;

    // 1. Non-Latin & Control Characters
    const nonLatinRegex = /[\u2E80-\u9FFF\uAC00-\uD7FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u0400-\u04FF\u3040-\u30FF]/g;
    const ctrlCharsRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

    const nonLatinMatches = html.match(nonLatinRegex);
    if (nonLatinMatches) {
        issues.push({
            type: 'CORRUPTION_CHARSET',
            severity: 'critical',
            message: `Detected ${nonLatinMatches.length} non-latin characters.`,
            match: nonLatinMatches.slice(0, 5).join(', ')
        });
        score -= 40;
    }

    const ctrlMatches = html.match(ctrlCharsRegex);
    if (ctrlMatches) {
        issues.push({
            type: 'CORRUPTION_CTRL',
            severity: 'critical',
            message: `Detected ${ctrlMatches.length} control/invisible characters.`,
        });
        score -= 40;
    }

    // 2. Broken Placeholders
    const placeholderRegex = /undefined|null|\[object Object\]|{{.*?}}/gi;
    const placeholderMatches = html.match(placeholderRegex);
    if (placeholderMatches) {
        issues.push({
            type: 'BROKEN_PLACEHOLDER',
            severity: 'critical',
            message: `Detected ${placeholderMatches.length} broken placeholders or JS artifacts.`,
            match: placeholderMatches[0]
        });
        score -= 50;
    }

    // 3. Merged Words & Long Strings
    const mergedWordsRegex = /comprompersonal|precpersonal|formadopersonal|ppersonal|formadopersonal/gi;
    const mergedMatches = html.match(mergedWordsRegex);
    if (mergedMatches) {
        issues.push({
            type: 'TEXT_CORRUPTION_MERGED',
            severity: 'critical',
            message: 'Detected merged/truncated logic words.',
            match: mergedMatches[0]
        });
        score -= 30;
    }

    // Long words (likely corruption or base64 junk)
    const longWords = html.split(/\s+/).filter(w => w.length > 25 && !w.includes('data:image') && !w.includes('http'));
    if (longWords.length > 0) {
        issues.push({
            type: 'TEXT_CORRUPTION_LONG_WORD',
            severity: 'error',
            message: `Detected ${longWords.length} abnormally long words (>25 chars).`,
            match: longWords[0]
        });
        score -= 20;
    }

    // 4. Duplicate H2
    const h2Regex = /<h2.*?>(.*?)<\/h2>/gi;
    const h2Map = new Map<string, number>();
    let h2Match;
    while ((h2Match = h2Regex.exec(html)) !== null) {
        const text = h2Match[1].toLowerCase().trim().replace(/<[^>]*>?/gm, '');
        h2Map.set(text, (h2Map.get(text) || 0) + 1);
    }

    for (const [text, count] of h2Map.entries()) {
        if (count > 1) {
            issues.push({
                type: 'SEO_DUPLICATE_H2',
                severity: 'error',
                message: `Duplicate H2 heading detected: "${text}"`,
            });
            score -= 10;
        }
    }

    // 5. Keyword Stuffing
    if (context.city) {
        const cityRegex = new RegExp(`\\b${context.city}\\b`, 'gi');
        const cityCount = (html.match(cityRegex) || []).length;
        if (cityCount > 25) {
            issues.push({ type: 'SEO_STUFFING_CITY', severity: 'warning', message: `City "${context.city}" appears ${cityCount} times (Max recommended: 25).` });
            score -= 5;
        }

        // City repetition in same heading
        const duplicateCityInHeader = new RegExp(`<h[1-3].*?>(?=.*${context.city}.*${context.city}).*?<\/h[1-3]>`, 'gi');
        if (duplicateCityInHeader.test(html)) {
            issues.push({ type: 'SEO_CITY_REPEAT_HEADER', severity: 'error', message: `City "${context.city}" repeated twice in the same header.` });
            score -= 15;
        }
    }

    if (context.businessName) {
        const brandRegex = new RegExp(`\\b${context.businessName}\\b`, 'gi');
        const brandCount = (html.match(brandRegex) || []).length;
        if (brandCount > 12) {
            issues.push({ type: 'SEO_STUFFING_BRAND', severity: 'warning', message: `Brand "${context.businessName}" appears ${brandCount} times (Max recommended: 12).` });
            score -= 5;
        }
    }

    // 6. Link & URL Integrity
    const emptyLinkRegex = /href=["']\s*["']/gi;
    if (emptyLinkRegex.test(html)) {
        issues.push({ type: 'BROKEN_LINK_EMPTY', severity: 'error', message: 'Detected empty href anchors.' });
        score -= 10;
    }

    const brokenPathRegex = /index\.html\/index\.html/gi;
    if (brokenPathRegex.test(html)) {
        issues.push({ type: 'BROKEN_PATH', severity: 'error', message: 'Detected recursive index.html paths.' });
        score -= 20;
    }

    // 7. Phone Corruption
    const corruptedPhoneRegex = /\+\d{2}\s*\+\d{2}|\(\d{3}\)\s*\d\(\d{3}\)/g;
    if (corruptedPhoneRegex.test(html)) {
        issues.push({ type: 'CORRUPTION_PHONE', severity: 'critical', message: 'Detected corrupted/duplicated phone number prefixes.' });
        score -= 50;
    }

    // 8. Forbidden exact prices
    const exactPriceRegex = /\b\d+(?:[,.]\d+)?\s*(?:€|euros?\b|eur\b)/gi;
    const priceMatches = html.match(exactPriceRegex);
    if (priceMatches) {
        issues.push({
            type: 'FORBIDDEN_EXACT_PRICE',
            severity: 'error',
            message: `Detected forbidden exact price mentions: ${priceMatches.join(', ')}.`,
            match: priceMatches[0]
        });
        score -= 20;
    }

    // 9. Sector Incongruencies
    // (Deprecated: hardcoded niche logic removed to support any vertical)


    // 9. Writing Quality & AI Residue
    const incompleteSentenceRegex = /[a-z0-9],\s*$/gi; // Ends with comma
    if (incompleteSentenceRegex.test(html.replace(/<[^>]*>?/gm, '').trim())) {
        issues.push({ type: 'TEXT_INCOMPLETE', severity: 'error', message: 'Detected content trailing off with a comma.' });
        score -= 20;
    }

    const aiInternalInstructions = /este\s+fragmento\s+html\s+cumple|reglas\s+proporcionadas|aquí\s+tienes\s+el\s+html/gi;
    if (aiInternalInstructions.test(html)) {
        issues.push({ type: 'AI_INTERNAL_INSTRUCTIONS', severity: 'error', message: 'Detected AI internal instructions in content.' });
        score -= 30;
    }

    return {
        valid: score >= 70 && !issues.some(i => i.severity === 'critical'),
        score: Math.max(0, score),
        issues,
        cleanedHtml: autoCleanHtml(html)
    };
}

export function hasCriticalIssues(result: ValidationResult): boolean {
    const isCritical = result.issues.some(i => i.severity === 'critical') || result.score < 50;
    if (isCritical) {
        console.warn(`[ContentGuard-DEBUG] Critical issues: ${JSON.stringify(result.issues.filter(i => i.severity === 'critical'))}`);
    }
    return isCritical;
}

export function autoCleanHtml(html: string): string {
    // HOTFIX: when this helper receives a full document with <html>/<head>/<style>,
    // it must stay conservative. Raw regex surgery over the entire document was
    // contributing to structural breakage.
    const raw = String(html || '');
    const looksLikeFullDocument = /<html\b|<head\b|<body\b|<style\b/i.test(raw);

    if (looksLikeFullDocument) {
        return raw
            .normalize('NFC')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
            .replace(/\{\{.*?\}\}|\[\[.*?\]\]|\[object Object\]/gi, '')
            .replace(/\s{3,}/g, '  ')
            .trim();
    }

    let clean = raw;

    // 1. Remove non-latin and control chars
    clean = clean.replace(/[\u2E80-\u9FFF\uAC00-\uD7FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u0400-\u04FF\u3040-\u30FF]/g, '');
    clean = clean.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

    // 2. Normalize and fix common merged words
    const commonFails = [
        { bad: /comprompersonal|compromiso\s+personal/gi, good: 'compromiso profesional' },
        { bad: /precpersonal|precio\s+personal/gi, good: 'presupuesto claro' },
        { bad: /formadopersonal|formado\s+personal/gi, good: 'técnico cualificado' },
        { bad: /ppersonal/gi, good: 'personal' },
        { bad: /profesionalpersonal/gi, good: 'profesionales' }
    ];

    for (const fail of commonFails) {
        clean = clean.replace(fail.bad, fail.good);
    }

    // 3. AI Preamble & Markdown Stripping
    const aiPatterns = [
        /aquí\s+tienes\s+el\s+contenido/gi,
        /sección\s+\d+:/gi,
        /```html/gi,
        /```/gi,
        /claro,\s+aquí\s+está/gi,
        /hope\s+this\s+helps/gi,
        /este\s+es\s+el\s+html/gi
    ];
    for (const pattern of aiPatterns) {
        clean = clean.replace(pattern, '');
    }

    // 4. Clean broken placeholders
    clean = clean.replace(/undefined|null|\[object Object\]/gi, '');
    clean = clean.replace(/\s*\((?:TR|REF|ID)-[a-z0-9_-]{4,}\)\.?/gi, '');
    clean = clean.replace(/\b(?:TR|REF|ID)-[a-z0-9_-]{4,}\b/gi, '');

    // 5. Fix potential broken HTML tags from corruption removal
    clean = clean.replace(/<([^>]+?)\s*>/g, (match, p1) => `<${p1.trim()}>`);

    // 6. Deduplicate excessive whitespace
    clean = clean.replace(/\s{3,}/g, '  ');

    // 7. Clean AI Internal Instructions (Surgical replacements only)
    const aiLeakedPhrases = [
        /este\s+contenido\s+cumple\s+con\s+las\s+reglas/gi,
        /este\s+código\s+html\s+cumple\s+con\s+todas/gi,
        /aquí\s+tienes\s+el\s+html\s+siguiendo\s+todas\s+las\s+instrucciones/gi,
        /todas\s+las\s+reglas\s+especificadas/gi,
        /las\s+reglas\s+y\s+directivas\s+establecidas/gi,
        /este\s+texto\s+sigue\s+todas\s+las\s+directrices/gi
    ];
    for (const p of aiLeakedPhrases) {
        clean = clean.replace(p, '');
    }
    clean = clean.replace(/<!--\s*Validación\s+de\s+legibilidad[\s\S]*?-->/gi, '');
    clean = clean.replace(/todas\s+las\s+directrices\s+proporcionadas[\s\S]*?[.]?/gi, '');

    // 8. Fix broken phrases / artifacts (More robust)
    clean = clean.replace(/y\s+con[.!\?]\s+([A-Z])/g, '$1');
    clean = clean.replace(/y\s+con[.!\?]?$/gm, '');
    clean = clean.replace(/Nuestro\s+se\s+ha\s+formado/gi, 'Nuestro equipo se ha formado');
    clean = clean.replace(/Nuestro\s+se\s+mantiene/gi, 'Nuestro equipo se mantiene');
    clean = clean.replace(/Contamos\s+con\s+un\s+que\s+se\s+encarga/gi, 'Nuestro equipo se encarga');
    clean = clean.replace(/desde\s+hace,\s*asegurando/gi, 'desde hace años, asegurando');
    clean = clean.replace(/Desde\s+hace,\s*hemos/gi, 'Desde hace años hemos');
    clean = clean.replace(/<h3>\s*a\s+más\s+de\s+10\s+años\s+de\s+servicio<\/h3>/gi, '<h3>Más de 10 años de experiencia técnica</h3>');
    clean = clean.replace(/Ahire\s+a\s+un\s+profesional/gi, 'Contrate a un profesional');
    clean = clean.replace(/Profesional\s+especializado/gi, 'Profesional especializado');
    clean = clean.replace(/un\s+profesional\s+especializado/gi, 'un profesional experto');
    clean = clean.replace(/como\s+la\s+de\s+Serrape/gi, 'de alta seguridad');
    clean = clean.replace(/Servicio\s+especializado\s+profesional\s+técnico\s+cualificado\s+formado/gi, 'Servicio especializado');
    clean = clean.replace(/Servicio\s+especializado\s+profesional\s+formado[.]?/gi, 'Servicio especializado.');
    clean = clean.replace(/Instale\s+sistemas\s+de\s+alarma\s+si\s+es\s+posible.*?protección[.]?/gi, '');

    // 8.1 Remove leaked trace tokens
    clean = clean.replace(/\s*\((?:TR|TK|AQ)-[a-z0-9]+\)\.?/gi, '');
    clean = clean.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1');


    // 9. Merged words and Duplication fixes
    clean = clean.replace(/formadocon/gi, 'formado con');
    clean = clean.replace(/formadoes/gi, 'formado es');
    clean = clean.replace(/formadose/gi, 'formado se');
    clean = clean.replace(/Especializadoprofesional/gi, 'especializado profesional');
    clean = clean.replace(/Artísticosísticos/gi, 'Artísticos');
    clean = clean.replace(/Llamar al \+34 \d{2,3}\s*\d{2,3}\s*\d{2,3}\s*\d{2,3}/gi, '');
    clean = clean.replace(/Servicio\s+especializado\s+profesional\s+técnico\s+cualificado\s+formado/gi, 'Servicio especializado');

    // 11. Specific AI instruction leakage (Ruzafa/Barcelona patterns)
    clean = clean.replace(/incluyendo\s+la\s+estructura\s+requerida,\s+el\s+uso\s+de\s+listas.*?marca[.]?/gi, '');
    clean = clean.replace(/ofrece\s+una\s+sección\s+informativa\s+sobre\s+recomendaciones.*?regul?ar[.]?/gi, '');
    clean = clean.replace(/y\s+ofrece\s+una\s+sección\s+informativa.*?regul?ar[.]?/gi, '');
    clean = clean.replace(/Este\s+contenido\s+se\s+centra\s+en.*?estilo[.]?/gi, '');
    clean = clean.replace(/Este\s+contenido\s+proporciona\s+información\s+valiosa.*?marca[.]?/gi, '');
    clean = clean.replace(/Este\s+código\s+HTML\s+cumple\s+con\s+todas\s+las\s+directivas.*?marca[.]?/gi, '');

    // 12. Forbidden Price Cleanup
    clean = clean.replace(/\bdesde\s+\d+(?:[,.]\d+)?\s*(?:€|euros?\b|eur\b)/gi, 'presupuesto personalizado tras valoración');
    clean = clean.replace(/\b\d+(?:[,.]\d+)?\s*(?:€|euros?\b|eur\b)/gi, 'presupuesto ajustado');

    // 13. Surgical removal of empty links or links with only whitespace/non-breaking spaces
    clean = clean.replace(/<a\b[^>]*>(?:&nbsp;|\s|<br\s*\/?>)*<\/a>/gi, '');

    return clean.trim();
}