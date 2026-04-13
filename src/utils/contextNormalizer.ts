import { ResearchContext, NormalizedContext } from '../types/pipeline_v2.js';

/**
 * ContextNormalizer - Utility for Phase 2: Context Normalization.
 * Handles cleaning, deduplication and clustering of raw research data.
 */
export class ContextNormalizer {
    /**
     * Normalizes a ResearchContext into a strictly structured NormalizedContext.
     */
    static normalize(context: ResearchContext): NormalizedContext {
        const deduplicatedEntities = this.deduplicateEntities(context.entities);
        const cleanNAP = this.normalizeNAP(context.local_nap);
        const keywordsClustered = this.clusterKeywords(context.keywords);

        return {
            ...context,
            entities: deduplicatedEntities,
            deduplicated_entities: deduplicatedEntities,
            clustered_keywords: keywordsClustered,
            clean_nap: cleanNAP
        };
    }

    private static deduplicateEntities(entities: string[]): string[] {
        // Simple Set-based dedup + trim + lowercase for comparison
        const map = new Map<string, string>();
        for (const e of entities) {
            const normalized = e.trim().toLowerCase();
            if (normalized && !map.has(normalized)) {
                map.set(normalized, e.trim());
            }
        }
        return Array.from(map.values());
    }

    private static normalizeNAP(nap: { business_name: string; address: string; phone: string; mapEmbedUrl?: string }) {
        const phoneRaw = nap.phone.replace(/\D/g, '');
        // Standardize to Spanish format if 9 digits
        let phoneNormalized = phoneRaw;
        if (phoneRaw.length === 9) {
            phoneNormalized = `+34${phoneRaw}`;
        } else if (phoneRaw.length === 11 && phoneRaw.startsWith('34')) {
            phoneNormalized = `+${phoneRaw}`;
        }

        return {
            ...nap,
            business_name: nap.business_name.trim(),
            address: nap.address.trim(),
            phone: nap.phone.trim(),
            phone_normalized: phoneNormalized
        };
    }

    private static clusterKeywords(keywords: string[]): { cluster: string; kws: string[] }[] {
        // Logic for clustering (simplified for MVP: all in primary or by common prefix)
        if (keywords.length === 0) return [];
        
        return [
            {
                cluster: 'primary_intent',
                kws: keywords.slice(0, 10)
            },
            {
                cluster: 'semantic_latents',
                kws: keywords.slice(10)
            }
        ];
    }
}