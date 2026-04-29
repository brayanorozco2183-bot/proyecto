import type { GenerationMission } from '../types/pipeline_v2.js';

export type ResearchMode = 'live_serp_required' | 'live_serp_optional' | 'offline_debug';

export interface ResearchConfig {
    mode: ResearchMode;
    provider: 'sdi' | 'serpapi' | 'valueserp' | 'dataforseo' | 'custom';
    minOrganicResults: number;
    minCompetitors: number;
    saveEvidence: boolean;
    /**
     * When true, the mission can continue with pre-fetched/default context if
     * live SERP fails or returns too little data. This is the recommended
     * production-safe default: always attempt SERP, never silently pretend it
     * succeeded, and do not lose a whole mission because a provider timed out.
     */
    allowPrefetchedFallback: boolean;
    /** Adds explicit fallback flags to context/evidence so generated pages are auditable. */
    markFallback: boolean;
}

function normalizeMode(value: unknown): ResearchMode | null {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'live_serp_required' || raw === 'required' || raw === 'strict' || raw === 'block_on_serp_failure') return 'live_serp_required';
    if (raw === 'live_serp_optional' || raw === 'optional' || raw === 'production' || raw === 'always_attempt') return 'live_serp_optional';
    if (raw === 'offline_debug' || raw === 'debug' || raw === 'offline') return 'offline_debug';
    return null;
}

function positiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.floor(parsed);
}

function boolFromEnv(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') return fallback;
    const raw = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'si', 'sí'].includes(raw)) return true;
    if (['0', 'false', 'no', 'off'].includes(raw)) return false;
    return fallback;
}

export function resolveResearchConfig(mission?: Partial<GenerationMission>): ResearchConfig {
    const missionResearch = (mission?.contextual_data as any)?.research || {};
    const envMode = process.env.GRAVITY_RESEARCH_MODE || process.env.RESEARCH_MODE;

    // Safe default: always attempt live SERP, but do not block the mission.
    // Use GRAVITY_RESEARCH_MODE=live_serp_required only for strict audits.
    const defaultMode: ResearchMode = 'live_serp_optional';

    const mode =
        normalizeMode(missionResearch.mode) ||
        normalizeMode(envMode) ||
        defaultMode;

    const provider = String(missionResearch.provider || process.env.SERP_PROVIDER || 'sdi').toLowerCase() as ResearchConfig['provider'];

    return {
        mode,
        provider: ['sdi', 'serpapi', 'valueserp', 'dataforseo', 'custom'].includes(provider) ? provider : 'sdi',
        minOrganicResults: positiveInt(missionResearch.minOrganicResults ?? process.env.SERP_MIN_ORGANIC_RESULTS, 5),
        minCompetitors: positiveInt(missionResearch.minCompetitors ?? process.env.SERP_MIN_COMPETITORS, 3),
        saveEvidence: boolFromEnv(missionResearch.saveEvidence ?? process.env.SERP_SAVE_EVIDENCE, true),
        allowPrefetchedFallback: boolFromEnv(
            missionResearch.allowPrefetchedFallback ?? process.env.SERP_ALLOW_FALLBACK,
            mode !== 'live_serp_required'
        ),
        markFallback: boolFromEnv(missionResearch.markFallback ?? process.env.SERP_MARK_FALLBACK, true)
    };
}

export function isLiveSerpRequired(config: ResearchConfig): boolean {
    return config.mode === 'live_serp_required';
}
