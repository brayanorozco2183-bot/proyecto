import { getFallbackServiceTopics, getPublicServiceLabel } from './fallbackQuality.js';

function normalizeText(value: unknown): string {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function uniqueLimit(values: string[], limit: number): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values.map(normalizeText).filter(Boolean)) {
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(value);
        if (out.length >= limit) break;
    }
    return out;
}

const SERVICE_HINTS = [
    'armarios', 'puertas', 'muebles', 'tarima', 'parquet', 'cocinas', 'ventanas', 'persianas',
    'instalación', 'reparación', 'mantenimiento', 'urgencias', 'presupuesto', 'boletín', 'cuadro eléctrico',
    'enchufes', 'iluminación', 'averías', 'fugas', 'atascos', 'grifería', 'cerraduras', 'bombines'
];

function buildFallbackQuestions(niche: string, city: string): string[] {
    const service = getPublicServiceLabel(niche).toLowerCase();
    const where = normalizeText(city || 'tu zona');
    return [
        `¿Qué incluye un servicio de ${service} en ${where}?`,
        '¿Qué datos conviene aportar antes de pedir presupuesto?',
        '¿Qué factores pueden cambiar el precio final?',
        '¿Cuándo conviene reparar y cuándo sustituir?'
    ];
}

function normalizeFallbackStatus(organicResults: any[], deepAudits: any[], recurringServices: string[], recurringQuestions: string[]) {
    if (organicResults.length && deepAudits.length) return 'serp_enriched';
    if (organicResults.length) return 'serp_partial';
    if (recurringServices.length || recurringQuestions.length) return 'deterministic_fallback';
    return 'minimal_fallback';
}

export function buildSerpInsights(args: { organicResults: any[]; deepAudits: any[]; niche: string; city: string; serpGaps?: any[] }) {
    const organicResults = Array.isArray(args.organicResults) ? args.organicResults : [];
    const deepAudits = Array.isArray(args.deepAudits) ? args.deepAudits : [];
    const headings = uniqueLimit(
        deepAudits.flatMap((audit) => [
            ...(Array.isArray(audit?.h1s) ? audit.h1s : []),
            ...(Array.isArray(audit?.h2s) ? audit.h2s : []),
            ...(Array.isArray(audit?.h3s) ? audit.h3s : [])
        ]),
        40
    );
    const titleSnippetText = uniqueLimit(
        organicResults.flatMap((result) => [result?.title, result?.snippet]),
        40
    );
    const haystack = [...headings, ...titleSnippetText].join(' ').toLowerCase();
    const serpDetectedServices = SERVICE_HINTS.filter((hint) => haystack.includes(hint.toLowerCase())).slice(0, 12);
    const recurringServices = serpDetectedServices.length
        ? serpDetectedServices
        : getFallbackServiceTopics(args.niche, 8);
    const serpQuestions = uniqueLimit(
        headings.filter((heading) => /^(qué|que|cómo|como|cuánto|cuanto|cuándo|cuando|dónde|donde|por qué|por que|faq|preguntas)/i.test(heading) || heading.includes('?')),
        12
    );
    const recurringQuestions = serpQuestions.length
        ? serpQuestions
        : buildFallbackQuestions(args.niche, args.city);
    const contentAngles = uniqueLimit([
        ...recurringServices.map((service) => `${service} en ${args.city}`),
        ...((Array.isArray(args.serpGaps) ? args.serpGaps : []).map((gap) => typeof gap === 'string' ? gap : gap?.topic || gap?.name || ''))
    ], 12);

    return {
        topCompetitorTitles: uniqueLimit(organicResults.map((result) => result?.title), 10),
        competitorUrls: uniqueLimit(organicResults.map((result) => result?.link), 10),
        extractedHeadings: headings,
        recurringServices,
        recurringQuestions,
        contentAngles,
        city: args.city,
        niche: args.niche,
        fallbackStatus: normalizeFallbackStatus(organicResults, deepAudits, recurringServices, recurringQuestions),
        fallbackUsed: organicResults.length === 0 || deepAudits.length === 0,
        source: organicResults.length ? 'serp_plus_deterministic' : 'deterministic_safe'
    };
}
