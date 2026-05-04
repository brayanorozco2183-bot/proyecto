import type { ResearchContext } from '../types/pipeline_v2.js';
import type { ResearchConfig } from '../config/research.js';

export interface SerpGateReport {
    ok: boolean;
    shouldBlock: boolean;
    fallbackUsed: boolean;
    status: 'success' | 'fallback' | 'skipped' | 'failed';
    reason?: string;
    organicResultsCount: number;
    competitorsCount: number;
    mode: ResearchConfig['mode'];
}

export function buildSerpGateReport(context: Partial<ResearchContext>, config: ResearchConfig): SerpGateReport {
    const evidence = (context as any)?.serp_evidence || {};
    const organic = Array.isArray(evidence.organicResults) ? evidence.organicResults : [];
    const competitors = Array.isArray(evidence.competitors) ? evidence.competitors : (Array.isArray(context.competitors) ? context.competitors : []);
    const attempted = Boolean(evidence.attempted ?? evidence.executed);
    const executed = Boolean(evidence.executed);
    const error = evidence.error ? String(evidence.error) : '';

    const base = {
        organicResultsCount: organic.length,
        competitorsCount: competitors.length,
        mode: config.mode
    };

    if (config.mode === 'offline_debug') {
        return {
            ok: true,
            shouldBlock: false,
            fallbackUsed: true,
            status: 'skipped',
            reason: 'SERP live desactivada por offline_debug.',
            ...base
        };
    }

    let reason = '';
    if (!attempted) {
        reason = 'SERP live no fue intentada.';
    } else if (!executed) {
        reason = error ? `SERP live intentada sin éxito: ${error}` : 'SERP live intentada sin éxito.';
    } else if (organic.length < config.minOrganicResults) {
        reason = `Resultados orgánicos insuficientes: ${organic.length}/${config.minOrganicResults}.`;
    } else if (competitors.length < config.minCompetitors) {
        reason = `Competidores analizados insuficientes: ${competitors.length}/${config.minCompetitors}.`;
    }

    if (!reason) {
        return {
            ok: true,
            shouldBlock: false,
            fallbackUsed: false,
            status: 'success',
            ...base
        };
    }

    const shouldBlock = config.mode === 'live_serp_required' && !config.allowPrefetchedFallback;
    return {
        ok: !shouldBlock,
        shouldBlock,
        fallbackUsed: !shouldBlock,
        status: shouldBlock ? 'failed' : 'fallback',
        reason,
        ...base
    };
}

/**
 * Strict compatibility helper. It only throws when the research mode is strict
 * and fallback is explicitly disabled. In the recommended mode
 * `live_serp_optional`, it returns a fallback report and the mission continues.
 */
export function assertSerpResearchCompleted(context: Partial<ResearchContext>, config: ResearchConfig): SerpGateReport {
    const report = buildSerpGateReport(context, config);
    if (report.shouldBlock) {
        throw new Error(`[SERP_GATE] ${report.reason}`);
    }
    return report;
}
