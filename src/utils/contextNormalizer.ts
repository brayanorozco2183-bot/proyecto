import { ResearchContext, NormalizedContext } from '../types/pipeline_v2.js';
import { sanitizeBrandName } from './brandGuard.js';

/**
 * ContextNormalizer - Utility for Phase 2: Context Normalization.
 * Handles cleaning, deduplication and clustering of raw research data.
 *
 * Goals for Phase 2:
 * - Never leave planning with an empty keyword universe when Phase 1 was conservative.
 * - Surface niche vocabulary/trust signals from the mission contextual data.
 * - Keep outputs deterministic and compact so later phases stay stable.
 */
export class ContextNormalizer {
    /**
     * Normalizes a ResearchContext into a strictly structured NormalizedContext.
     */
    static normalize(context: ResearchContext): NormalizedContext {
        const keywordUniverse = this.buildKeywordUniverse(context);
        const deduplicatedEntities = this.buildEntityUniverse(context, keywordUniverse);
        const cleanNAP = this.normalizeNAP(context.local_nap, context.city);
        const keywordsClustered = this.clusterKeywords(keywordUniverse, context);

        return {
            ...context,
            keywords: keywordUniverse,
            entities: deduplicatedEntities,
            deduplicated_entities: deduplicatedEntities,
            clustered_keywords: keywordsClustered,
            clean_nap: cleanNAP
        };
    }

    private static normalizeText(value: any): string {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9áéíóúñü\s\-\/]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private static compactWhitespace(value: any): string {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .trim()
            .replace(/^[\-–—,;:.\s]+|[\-–—,;:.\s]+$/g, '');
    }

    private static uniqueStrings(values: any[]): string[] {
        const out: string[] = [];
        const seen = new Set<string>();

        for (const raw of values || []) {
            const value = this.compactWhitespace(raw);
            const key = this.normalizeText(value);
            if (!value || !key || seen.has(key)) continue;
            seen.add(key);
            out.push(value);
        }

        return out;
    }

    private static isGarbageKeyword(value: string): boolean {
        const normalized = this.normalizeText(value);
        if (!normalized) return true;

        const bannedFragments = [
            'resultado sdi',
            'capturado via inyeccion de teclas',
            'capturado via inyeccion',
            'site not found',
            'utm_source',
            'utm_campaign',
            'utm_medium',
            'localo site',
            'http',
            'www.',
            'error'
        ];

        return bannedFragments.some(fragment => normalized.includes(fragment));
    }

    private static isUsefulKeyword(value: string, context: ResearchContext): boolean {
        const normalized = this.normalizeText(value);
        if (!normalized || normalized.length < 3 || normalized.length > 90) return false;
        if (this.isGarbageKeyword(value)) return false;

        const cityTokens = new Set(this.normalizeText(context.city).split(' ').filter(Boolean));
        const nicheTokens = new Set(this.normalizeText(context.niche).split(' ').filter(Boolean));
        const serviceTerms = new Set([
            'servicio', 'servicios', 'cerrajero', 'cerrajeros', 'cerrajeria', 'cerrajeria',
            'apertura', 'puerta', 'puertas', 'cerradura', 'cerraduras', 'bombin', 'bombines',
            'cilindro', 'cilindros', 'escudo', 'escudos', 'llave', 'llaves', 'persiana',
            'persianas', 'cierre', 'cierres', 'metalico', 'metalicos', 'seguridad',
            'antibumping', 'amaestramiento', 'mantenimiento', 'reparacion', 'instalacion',
            'instalacion', 'homologado', 'homologados'
        ]);

        const tokens = new Set(normalized.split(' ').filter(Boolean));

        for (const token of tokens) {
            if (cityTokens.has(token) || nicheTokens.has(token) || serviceTerms.has(token)) {
                return true;
            }
        }

        return false;
    }

    private static sanitizeKeywordCandidate(value: any, context: ResearchContext): string {
        const clean = this.compactWhitespace(value)
            .replace(/^[-–—]\s*/, '')
            .replace(/\s*\|\s*\+?\d(?:[\d\s-]{6,})$/g, '')
            .replace(/\s+\([^)]*utm[^)]*\)/gi, '')
            .replace(/[?&]utm_[^\s]+/gi, '')
            .trim();

        if (!clean || this.isGarbageKeyword(clean)) return '';
        if (!this.isUsefulKeyword(clean, context)) return '';
        return clean;
    }

    private static localizedKeywordVariants(keyword: string, context: ResearchContext): string[] {
        const clean = this.compactWhitespace(keyword);
        const normalized = this.normalizeText(clean);
        const city = this.compactWhitespace(context.city);

        if (!clean || !city) return [];
        if (normalized.includes(this.normalizeText(city))) return [];
        if (clean.startsWith('¿') || clean.endsWith('?')) return [];

        const localizableMarkers = [
            'cerraj', 'apertura', 'puerta', 'cerradura', 'bombin', 'cilindro',
            'escudo', 'llave', 'persiana', 'cierre', 'amaestramiento', 'seguridad', 'reparacion'
        ];

        if (!localizableMarkers.some(marker => normalized.includes(marker))) return [];

        return [`${clean} en ${city}`];
    }

    private static extractPlaybook(context: ResearchContext): any {
        return context.contextual_data?.nichePlaybook?.playbook || {};
    }

    private static extractMarketData(context: ResearchContext): any {
        return context.contextual_data?.marketData || {};
    }

    private static collectKeywordCandidates(context: ResearchContext): string[] {
        const playbook = this.extractPlaybook(context);
        const marketData = this.extractMarketData(context);
        const strategic: any = context.strategicAnalysis || {};
        const intentModel: any = context.intentModel || {};

        const candidates: string[] = [];
        const push = (...values: any[]) => {
            for (const value of values) {
                if (value === undefined || value === null) continue;
                if (Array.isArray(value)) {
                    push(...value);
                    continue;
                }
                if (typeof value === 'object') continue;
                const sanitized = this.sanitizeKeywordCandidate(value, context);
                if (sanitized) candidates.push(sanitized);
            }
        };

        push(
            context.keywords,
            intentModel.primaryKeyword,
            intentModel.secondaryKeywords,
            strategic.primaryKeyword,
            strategic.secondaryKeywords,
            strategic.contentAngles,
            strategic.internalLinkTargets,
            context.serp_gaps,
            `${context.niche} en ${context.city}`,
            `${context.niche} ${context.city}`,
            `servicio de ${context.niche} en ${context.city}`
        );

        push(
            playbook.aliases,
            playbook.allowedVocabulary,
            playbook.coreServices,
            (playbook.bofuVariants || []).map((item: any) => item?.label),
            (playbook.faqBank || []).map((item: any) => item?.question)
        );

        for (const audit of marketData.deepAudits || []) {
            push(audit?.title, audit?.h1s, audit?.h2s, audit?.h3s);
        }

        const uniqueBase = this.uniqueStrings(candidates);
        const localized = uniqueBase.flatMap(keyword => this.localizedKeywordVariants(keyword, context));

        return this.uniqueStrings([...uniqueBase, ...localized]).slice(0, 80);
    }

    private static buildKeywordUniverse(context: ResearchContext): string[] {
        const keywords = this.collectKeywordCandidates(context);

        if (keywords.length > 0) return keywords;

        return this.uniqueStrings([
            context.intentModel?.primaryKeyword,
            context.niche,
            `${context.niche} en ${context.city}`,
            `${context.niche} ${context.city}`
        ]);
    }

    private static sanitizeEntityCandidate(value: any, context: ResearchContext): string {
        const clean = this.compactWhitespace(value)
            .replace(/^¿|\?$/g, '')
            .replace(/\s+en\s+\b.+$/i, (match) => {
                const normalizedMatch = this.normalizeText(match);
                const city = this.normalizeText(context.city);
                return normalizedMatch.includes(city) ? '' : match;
            })
            .trim();

        if (!clean) return '';
        if (clean.length < 3 || clean.length > 70) return '';
        if (this.isGarbageKeyword(clean)) return '';

        const normalized = this.normalizeText(clean);
        const bannedEntityFragments = ['resultado sdi', 'site not found', 'utm_', 'http'];
        if (bannedEntityFragments.some(fragment => normalized.includes(fragment))) return '';

        return clean;
    }

    private static buildEntityUniverse(context: ResearchContext, keywordUniverse: string[]): string[] {
        const playbook = this.extractPlaybook(context);
        const strategic = context.strategicAnalysis || {};

        const candidates: string[] = [];
        const push = (...values: any[]) => {
            for (const value of values) {
                if (value === undefined || value === null) continue;
                if (Array.isArray(value)) {
                    push(...value);
                    continue;
                }
                if (typeof value === 'object') continue;
                const sanitized = this.sanitizeEntityCandidate(value, context);
                if (sanitized) candidates.push(sanitized);
            }
        };

        push(
            context.city,
            context.niche,
            context.entities,
            context.intentModel?.semanticEntities,
            strategic.entities,
            strategic.trustAssets,
            playbook.allowedVocabulary?.slice(0, 10),
            playbook.validTrustSignals?.map((signal: any) => signal?.label),
            playbook.coreServices?.slice(0, 6)
        );

        for (const keyword of keywordUniverse) {
            if (keyword.startsWith('¿') || keyword.endsWith('?')) continue;
            push(keyword);
        }

        return this.uniqueStrings(candidates).slice(0, 20);
    }

    private static deduplicateEntities(entities: any[]): string[] {
        return this.uniqueStrings(Array.isArray(entities) ? entities : []);
    }

    private static sanitizeBusinessName(value: string, city: string): string {
        let out = String(value || '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^(?:de|del)\s+/i, '')
            .replace(/\bde\s+(cerrajeros|fontaneros|electricistas|carpinteros|pintores)\b/gi, '$1')
            .trim();

        if (!out) return out;

        const cityEscaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cityRegex = new RegExp(`\\b${cityEscaped}\\b`, 'i');

        // Remove duplications like "Master en Getafe" if it ends with "en [City]"
        out = out.replace(new RegExp(`\\s+en\\s+${cityEscaped}$`, 'i'), '').trim();

        // Clean hallucinations from LLM like "Master en Cerrajeros"
        out = out.replace(/\b(Master|Pro|Express|Elite|Perfect)\s+en\s+[\p{L}'’\-\s]+$/iu, '$1').trim();

        // Ensure city is present but not repeated
        if (city && !cityRegex.test(out)) {
            out = `${out} ${city}`.trim();
        }

        return out.replace(/\s+/g, ' ').trim();
    }

    private static normalizeNAP(
        nap: { business_name?: string; address?: string; phone?: string; mapEmbedUrl?: string } | any,
        city?: string
    ) {
        if (!nap) nap = {};

        const safeCity = String(city || '').trim();
        const bName = typeof nap.business_name === 'string' ? nap.business_name : '';
        const addr = typeof nap.address === 'string' ? nap.address : (safeCity || '');
        const ph = typeof nap.phone === 'string' ? nap.phone : '';

        const phoneRaw = ph.replace(/\D/g, '').replace(/^00/, '');
        let phoneNormalized = '';

        if (phoneRaw.length >= 9 && phoneRaw.length <= 15 && !/^(\d)\1+$/.test(phoneRaw)) {
            if (ph.trim().startsWith('+')) {
                phoneNormalized = `+${phoneRaw}`;
            } else if (phoneRaw.length === 11 && phoneRaw.startsWith('34')) {
                phoneNormalized = `+${phoneRaw}`;
            } else {
                phoneNormalized = phoneRaw;
            }
        }

        const sanitizedBusinessName = this.sanitizeBusinessName(bName, safeCity);

        const mapQuery = this.compactWhitespace(addr || safeCity || sanitizedBusinessName);
        const mapEmbedUrl = this.compactWhitespace(nap.mapEmbedUrl)
            || (mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : undefined);

        return {
            ...nap,
            business_name: this.compactWhitespace(sanitizedBusinessName),
            address: this.compactWhitespace(addr),
            phone: this.compactWhitespace(ph),
            phone_normalized: phoneNormalized,
            mapEmbedUrl
        };
    }

    private static clusterKeywords(
        keywords: string[],
        context: ResearchContext
    ): { cluster: string; kws: string[] }[] {
        if (!Array.isArray(keywords) || keywords.length === 0) return [];

        const primaryKeyword = this.normalizeText(context.intentModel?.primaryKeyword || context.niche);
        const city = this.normalizeText(context.city);
        const buckets = new Map<string, string[]>([
            ['primary_intent', []],
            ['service_variants', []],
            ['urgent_need', []],
            ['trust_and_risk', []],
            ['faq_support', []],
            ['local_scope', []],
            ['semantic_latents', []]
        ]);
        const seen = new Set<string>();

        const push = (cluster: string, keyword: string) => {
            const normalized = this.normalizeText(keyword);
            if (!normalized || seen.has(`${cluster}::${normalized}`)) return;
            const bucket = buckets.get(cluster);
            if (!bucket || bucket.length >= 8) return;
            bucket.push(keyword);
            seen.add(`${cluster}::${normalized}`);
        };

        for (const keyword of this.uniqueStrings(keywords)) {
            const normalized = this.normalizeText(keyword);

            if (
                normalized === primaryKeyword
                || normalized === this.normalizeText(`${context.niche} ${context.city}`)
                || normalized === this.normalizeText(`${context.niche} en ${context.city}`)
            ) {
                push('primary_intent', keyword);
                continue;
            }

            if (/(24h|24 horas|urgente|urgencia|inmediat|robo|perdida de llaves|p[ée]rdida de llaves)/.test(normalized)) {
                push('urgent_need', keyword);
                continue;
            }

            if (/^(que|qué|como|cómo|cuando|cuándo)\b/.test(normalized) || keyword.startsWith('¿')) {
                push('faq_support', keyword);
                continue;
            }

            if (/(presupuesto|garantia|garantia|factura|diagnostico|seguridad|homologad|sin danos|sin da[ñn]os|riesgo)/.test(normalized)) {
                push('trust_and_risk', keyword);
                continue;
            }

            if ((city && /(cerca de|cerca|barrio|zona|cobertura|proximidad)/.test(normalized)) || (city && normalized.includes(city))) {
                push('local_scope', keyword);
                continue;
            }

            if (/(apertura|puerta|cerradura|bombin|cilindro|escudo|persiana|cierre|amaestramiento|llaves|cerrajer)/.test(normalized)) {
                push('service_variants', keyword);
                continue;
            }

            push('semantic_latents', keyword);
        }

        if ((buckets.get('primary_intent') || []).length === 0) {
            push('primary_intent', context.intentModel?.primaryKeyword || context.niche);
            push('primary_intent', `${context.niche} en ${context.city}`);
        }

        return Array.from(buckets.entries())
            .filter(([, kws]) => kws.length > 0)
            .map(([cluster, kws]) => ({ cluster, kws }));
    }
}