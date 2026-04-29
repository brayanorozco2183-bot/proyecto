
import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { AIFacade } from '../tools/aiFacade.js';
import { PageType, SearchIntent } from '../types/pipeline_v2.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { detectServiceFamily } from '../utils/researchQuality.js';
/**
 * SEO_Analyst_01 - The Strategic Lead (V5 Military Grade).
 * Designs the 'Market Dominance Statute' based on objective competitive data.
 */

interface StrategicAnalysis {
    primaryKeyword: string;
    secondaryKeywords: string[];
    entities: string[];
    pageTypeRecommendation: PageType;
    primaryIntent: SearchIntent;
    secondaryIntent?: SearchIntent;
    funnelStage: 'BOFU' | 'MOFU' | 'TOFU';
    wordCountTarget: number;
    serpFeaturesTarget: string[];
    contentAngles: string[];
    trustAssets: string[];
    internalLinkTargets: string[];
    titleStrategy: string;
    metaDescriptionStrategy: string;
    schemaTypes: string[];
    keywordReport: string;
    strategyConfidence: 'low' | 'medium' | 'high';
    classificationReasons: string[];
}

type PlaybookHints = {
    allowedVocabulary: string[];
    trustSignals: string[];
    services: string[];
    objections: string[];
    schemaTypes: string[];
    bofuVariants: Array<{ label: string; angle: string; }>;
};

export class SEOAnalystAgent extends BaseAgent {
    constructor() {
        super('SEO_Analyst_01', 'Strategic Intelligence', 'Estratega de Mercado', 'Experto en analizar la competencia en Google y extraer las mejores palabras clave para tu ciudad.', vault.OLLAMA_MODEL_RESEARCH);
    }

    private normalizeKeyword(keyword: string): string {
        return String(keyword || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private normalizeText(value: any): string {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private escapeRegex(value: string): string {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private uniqueNormalized(items: any[], max = 999): string[] {
        const seen = new Set<string>();
        const out: string[] = [];

        for (const item of items || []) {
            const cleaned = this.normalizeText(item);
            const normalized = this.normalizeKeyword(cleaned);
            if (!cleaned || !normalized || seen.has(normalized)) continue;
            seen.add(normalized);
            out.push(cleaned);
            if (out.length >= max) break;
        }

        return out;
    }

    private extractBulletSection(source: string, title: string): string[] {
        const text = String(source || '');
        if (!text || !title) return [];

        const pattern = new RegExp(`${this.escapeRegex(title)}:\\s*([\\s\\S]*?)(?:\\n[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\\s]+:|$)`, 'i');
        const match = text.match(pattern);
        if (!match?.[1]) return [];

        return match[1]
            .split('\n')
            .map(line => line.replace(/^\s*-\s*/, '').trim())
            .filter(Boolean);
    }

    private parsePlaybookHints(): PlaybookHints {
        const source = String(this.nicheBrief || '');

        const bofuVariants = this.extractBulletSection(source, 'VARIANTES BOFU')
            .map(line => {
                const [label, angle] = line.split('|').map(part => part.trim());
                return { label: label || line.trim(), angle: angle || '' };
            })
            .filter(item => item.label);

        return {
            allowedVocabulary: this.extractBulletSection(source, 'VOCABULARIO PERMITIDO'),
            trustSignals: this.extractBulletSection(source, 'SEÑALES DE CONFIANZA VÁLIDAS').map(line => {
                const [label] = line.split(':');
                return label.trim();
            }),
            services: this.extractBulletSection(source, 'SERVICIOS PRINCIPALES'),
            objections: this.extractBulletSection(source, 'OBJECIONES REALES'),
            schemaTypes: this.extractBulletSection(source, 'TIPOS DE SCHEMA PERMITIDOS'),
            bofuVariants
        };
    }

    private classifyKeyword(keyword: string): { pageType: PageType, intent: SearchIntent, stage: 'BOFU' | 'MOFU' | 'TOFU', reasons: string[] } {
        const k = this.normalizeKeyword(keyword);
        const reasons: string[] = ['Análisis determinista de keyword principal'];

        if (/(precio|cuanto cuesta|tarifas?|coste|presupuesto)/.test(k)) {
            reasons.push('Keyword detectada como intención de comparación de precios');
            return { pageType: 'comparison', intent: 'commercial', stage: 'MOFU', reasons };
        }
        if (/(24h|urgente|urgencia|rapido|rápido|inmediato|hoy mismo)/.test(k)) {
            reasons.push('Keyword detectada como intención de urgencia inmediata');
            return { pageType: 'urgent', intent: 'transactional', stage: 'BOFU', reasons };
        }
        const localIndicators = ['cerca', 'cerca de mi', 'cerca de mí', 'proximo', 'próximo', 'barrio', 'distrito', 'sector', 'zona de', 'junto a', 'al lado'];
        const hasSpecificLocalDetail = localIndicators.some(ind => k.includes(ind));

        if (hasSpecificLocalDetail) {
            reasons.push('Keyword detectada como intención de área de servicio específica (barrio/proximidad)');
            return { pageType: 'service_area', intent: 'transactional', stage: 'BOFU', reasons };
        }
        if (/(que es|qué es|como|cómo|guia|guía|pasos|cuando conviene|cuándo conviene|consejos)/.test(k)) {
            reasons.push('Keyword detectada como intención informacional/guía');
            return { pageType: 'guide', intent: 'informational', stage: 'TOFU', reasons };
        }
        if (/(mejor|vs|comparativa|opiniones|alternativas)/.test(k)) {
            reasons.push('Keyword detectada como intención de comparativa de mercado');
            return { pageType: 'comparison', intent: 'commercial', stage: 'MOFU', reasons };
        }

        reasons.push('Keyword detectada como servicio local estándar');
        return { pageType: 'service', intent: 'transactional', stage: 'BOFU', reasons };
    }

    private getWordCountTarget(pageType: PageType, avgCompetitorWords: number): number {
        const base: Record<string, number> = {
            service: 2100,
            urgent: 1700,
            service_area: 1700,
            guide: 2600,
            faq: 2200,
            comparison: 2400,
            category: 2100,
            home_local: 2200
        };

        const min = base[pageType] || 1700;
        const competitorDriven = avgCompetitorWords > 0 ? avgCompetitorWords + 250 : min;

        const safeCeilings: Record<string, number> = {
            service: 2600,
            urgent: 1900,
            service_area: 2200,
            guide: 3200,
            faq: 2600,
            comparison: 2800,
            category: 2500,
            home_local: 2600
        };

        return Math.min(Math.max(min, competitorDriven), safeCeilings[pageType] || 2600);
    }

    private getConfidenceCaps(confidence: 'low' | 'medium' | 'high') {
        if (confidence === 'low') {
            return { secondaryKeywords: 4, entities: 5, contentAngles: 3, internalLinks: 3 };
        }
        if (confidence === 'medium') {
            return { secondaryKeywords: 6, entities: 7, contentAngles: 4, internalLinks: 4 };
        }
        return { secondaryKeywords: 8, entities: 10, contentAngles: 5, internalLinks: 5 };
    }

    private buildSignalTokens(input: { niche: string; }, playbook: PlaybookHints): string[] {
        const raw = [
            input.niche,
            ...playbook.allowedVocabulary,
            ...playbook.services,
            ...playbook.bofuVariants.map(item => item.label)
        ];

        return this.uniqueNormalized(
            raw.flatMap(item => this.normalizeKeyword(item).split(/[^a-z0-9]+/)).filter(token => token.length >= 4),
            48
        ).map(token => this.normalizeKeyword(token));
    }

    private scoreAuditRelevance(audit: any, niche: string, playbook: PlaybookHints): number {
        const title = this.normalizeKeyword(audit?.title || '');
        const headings = this.normalizeKeyword([...(audit?.h1s || []), ...(audit?.h2s || []), ...(audit?.h3s || [])].join(' '));
        const haystack = `${title} ${headings}`.trim();
        if (!haystack) return 0;

        let score = 0;
        const nicheTokens = this.normalizeKeyword(niche).split(' ').filter(Boolean);
        const signalTokens = this.buildSignalTokens({ niche }, playbook);

        for (const token of nicheTokens) {
            if (token.length >= 4 && haystack.includes(token)) score += 3;
        }

        for (const token of signalTokens) {
            if (haystack.includes(token)) score += 1;
        }

        if (/(error|site not found|404|not found)/.test(haystack)) score -= 6;
        if (/(blog|galeria|galería|redes sociales|resenas|reseñas|contacto|sobre nosotros)/.test(haystack)) score -= 2;
        const auditFamily = detectServiceFamily(haystack);
        const nicheFamily = detectServiceFamily(niche);
        const suspiciousForeignTrade = Boolean(auditFamily && nicheFamily && auditFamily !== nicheFamily);
        const targetSignals = signalTokens.filter(token => token.length >= 5 && haystack.includes(token)).length;
        if (suspiciousForeignTrade && targetSignals < 2) score -= 8;

        return score;
    }

    private selectAuditsForStrategy(audits: any[], niche: string, playbook: PlaybookHints): any[] {
        const scored = (audits || [])
            .map((audit: any) => ({ audit, score: this.scoreAuditRelevance(audit, niche, playbook) }))
            .sort((a, b) => b.score - a.score);

        const positive = scored.filter(item => item.score > 0).map(item => item.audit);
        return positive.length ? positive : (audits || []);
    }

    private collectCompetitorPhrases(audits: any[]): string[] {
        const ignored = /(sobre nosotros|contacto|contáctanos|blog|galeria|galería|redes sociales|opiniones|reseñas|site not found|error|llámanos|pide presupuesto)/i;
        const phrases: string[] = [];

        for (const audit of audits || []) {
            const candidates = [
                audit?.title,
                ...(audit?.h1s || []),
                ...(audit?.h2s || []),
                ...(audit?.h3s || [])
            ];

            for (const candidate of candidates) {
                const cleaned = this.normalizeText(candidate);
                if (!cleaned || ignored.test(cleaned)) continue;
                if (cleaned.length < 4 || cleaned.length > 90) continue;
                phrases.push(cleaned);
            }
        }

        return this.uniqueNormalized(phrases, 40);
    }

    private localizeKeyword(keyword: string, city: string): string {
        const cleaned = this.normalizeText(keyword);
        if (!cleaned) return '';
        if (this.normalizeKeyword(cleaned).includes(this.normalizeKeyword(city))) return cleaned;
        if (/\b(en|de|para|con|sin)\b/i.test(cleaned)) return `${cleaned} ${city}`.trim();
        return `${cleaned} ${city}`.trim();
    }

    private deriveSecondaryKeywords(input: { niche: string; city: string; }, classification: { pageType: PageType; }, playbook: PlaybookHints, audits: any[], confidence: 'low' | 'medium' | 'high'): string[] {
        const caps = this.getConfidenceCaps(confidence);
        const competitorPhrases = this.collectCompetitorPhrases(audits);
        const candidates: string[] = [];

        candidates.push(`${input.niche} en ${input.city}`);

        if (classification.pageType === 'urgent') {
            candidates.push(`${input.niche} 24 horas ${input.city}`);
            candidates.push(`${input.niche} urgente ${input.city}`);
        }

        for (const service of playbook.services.slice(0, 6)) {
            candidates.push(this.localizeKeyword(service, input.city));
        }

        for (const variant of playbook.bofuVariants.slice(0, 4)) {
            candidates.push(this.localizeKeyword(variant.label, input.city));
        }

        for (const phrase of competitorPhrases.slice(0, 10)) {
            candidates.push(this.localizeKeyword(phrase, input.city));
        }

        return this.uniqueNormalized(
            candidates.filter(Boolean).filter(candidate => this.normalizeKeyword(candidate) !== this.normalizeKeyword(input.niche)),
            caps.secondaryKeywords
        );
    }

    private deriveEntities(input: { niche: string; city: string; }, playbook: PlaybookHints, audits: any[], confidence: 'low' | 'medium' | 'high'): string[] {
        const caps = this.getConfidenceCaps(confidence);
        const competitorPhrases = this.collectCompetitorPhrases(audits);

        const candidates: string[] = [
            input.city,
            ...playbook.allowedVocabulary,
            ...playbook.services,
            ...playbook.bofuVariants.map(item => item.label),
            ...competitorPhrases
        ];

        return this.uniqueNormalized(candidates, caps.entities);
    }

    private deriveSerpFeatures(classification: { pageType: PageType; }, marketData: { localPack: any[]; organicLeaders: any[]; deepAudits: any[]; }, playbook: PlaybookHints): string[] {
        const features = new Set<string>();

        if (marketData.localPack?.length || ['service', 'service_area', 'urgent', 'home_local', 'category'].includes(classification.pageType)) {
            features.add('local_pack');
        }

        if (playbook.bofuVariants.length || playbook.services.length) {
            features.add('faq');
        }

        const haystack = this.normalizeKeyword(JSON.stringify(marketData.deepAudits || []));
        if (/(reseñas|resenas|opiniones|reviews)/.test(haystack)) features.add('reviews');
        if (classification.pageType === 'guide' || classification.pageType === 'comparison') features.add('featured_snippet');

        return Array.from(features);
    }

    private deriveTrustAssets(playbook: PlaybookHints, audits: any[]): string[] {
        const defaults = [
            'diagnóstico previo',
            'presupuesto claro',
            'cobertura real',
            'equipo especializado',
            'garantía por escrito'
        ];

        const auditSignals: string[] = [];
        const haystack = this.normalizeKeyword(JSON.stringify(audits || []));
        if (/(factura|justificante|desglose)/.test(haystack)) auditSignals.push('factura detallada');
        if (/(certificad|sostenib|fsc|materiales)/.test(haystack)) auditSignals.push('materiales certificados');
        if (/(taller propio|fabricacion propia|fabricación propia)/.test(haystack)) auditSignals.push('taller propio');
        if (/(medicion|medición|visita tecnica|visita técnica|planos|bocetos)/.test(haystack)) auditSignals.push('diagnóstico y medición previa');

        return this.uniqueNormalized([
            ...playbook.trustSignals,
            ...auditSignals,
            ...defaults
        ], 6);
    }

    private deriveInternalLinkTargets(playbook: PlaybookHints, secondaryKeywords: string[], confidence: 'low' | 'medium' | 'high'): string[] {
        const caps = this.getConfidenceCaps(confidence);
        const candidates = [
            ...playbook.bofuVariants.map(item => item.label),
            ...secondaryKeywords
        ];

        return this.uniqueNormalized(candidates, caps.internalLinks);
    }

    private deriveContentAngles(
        input: { niche: string; city: string; },
        classification: { pageType: PageType; },
        playbook: PlaybookHints,
        confidence: 'low' | 'medium' | 'high'
    ): string[] {
        const caps = this.getConfidenceCaps(confidence);
        const angles: string[] = [];

        switch (classification.pageType) {
            case 'urgent':
                angles.push(`Respuesta prioritaria para ${input.niche} en ${input.city} sin prometer tiempos falsos`);
                break;
            case 'service_area':
                angles.push(`Cobertura real por zonas para ${input.niche} en ${input.city}`);
                break;
            case 'comparison':
                angles.push(`Comparar opciones de ${input.niche} en ${input.city} con criterio profesional`);
                break;
            case 'guide':
                angles.push(`Guía práctica de ${input.niche} en ${input.city} orientada a resolver dudas reales`);
                break;
            default:
                angles.push(`Servicio de ${input.niche} en ${input.city} con foco en conversión local`);
                break;
        }

        for (const variant of playbook.bofuVariants) {
            if (variant.angle) angles.push(variant.angle);
        }

        for (const objection of playbook.objections.slice(0, 2)) {
            angles.push(`Resolver objeción real: ${objection}`);
        }

        return this.uniqueNormalized(angles, caps.contentAngles);
    }

    private deriveSchemaTypes(classification: { pageType: PageType; }, playbook: PlaybookHints): string[] {
        const preferred = ['WebPage', 'BreadcrumbList', 'LocalBusiness', 'Service'];
        if (classification.pageType !== 'category') preferred.push('FAQPage');

        const allowed = new Set(this.uniqueNormalized(playbook.schemaTypes.length ? playbook.schemaTypes : preferred));
        const picked = preferred.filter(item => allowed.has(item));

        if (!picked.length) return preferred;
        return picked;
    }

    private deriveTitleStrategy(input: { niche: string; city: string; }, classification: { pageType: PageType; }): string {
        switch (classification.pageType) {
            case 'urgent':
                return `Keyword principal + ${input.city} + urgencia real + CTA`;
            case 'service_area':
                return `Keyword principal + ${input.city} + cobertura por zonas + beneficio`;
            case 'comparison':
                return `Keyword principal + ${input.city} + criterio profesional + diferenciador`;
            case 'guide':
                return `Guía de ${input.niche} + ${input.city} + duda principal`;
            default:
                return `Keyword principal + ${input.city} + prueba de criterio técnico + CTA`;
        }
    }

    private deriveMetaDescriptionStrategy(input: { niche: string; city: string; }, classification: { pageType: PageType; }, trustAssets: string[]): string {
        const proof = trustAssets[0] || 'criterio técnico';

        switch (classification.pageType) {
            case 'urgent':
                return `Resolver urgencia + ${input.city} + ${proof} + llamada a la acción`;
            case 'comparison':
                return `Comparativa útil + ${input.city} + ${proof} + siguiente paso`;
            case 'guide':
                return `Resolver duda principal + ${input.city} + ${proof}`;
            default:
                return `Beneficio local + ${input.city} + ${proof} + CTA`;
        }
    }

    private deriveKeywordReport(
        input: { niche: string; city: string; },
        audits: any[],
        organicLeaders: any[],
        secondaryKeywords: string[],
        classification: { pageType: PageType; },
        confidence: 'low' | 'medium' | 'high'
    ): string {
        const avgWords = audits.length > 0
            ? Math.round(audits.reduce((acc: number, audit: any) => acc + Number(audit?.wordCount || 0), 0) / audits.length)
            : 0;

        const thematicSignals = secondaryKeywords
            .map(keyword => this.normalizeKeyword(keyword).replace(new RegExp(`\\b${this.escapeRegex(this.normalizeKeyword(input.city))}\\b`, 'g'), '').trim())
            .filter(Boolean)
            .slice(0, 4);

        return [
            `Base determinista enriquecida con ${audits.length} auditorías útiles y ${organicLeaders.length} resultados orgánicos filtrados.`,
            avgWords > 0 ? `Promedio competidor útil: ${avgWords} palabras.` : 'Sin promedio útil de competidores.',
            thematicSignals.length ? `Tópicos detectados: ${thematicSignals.join(', ')}.` : `Cobertura temática basada en ${input.niche} y señales del playbook.`,
            `PageType priorizado: ${classification.pageType}. Confianza: ${confidence}.`
        ].join(' ');
    }

    private buildDeterministicStrategy(input: {
        niche: string;
        city: string;
        marketData: {
            localPack: any[];
            organicLeaders: any[];
            deepAudits: any[];
        };
    }, classification: { pageType: PageType; intent: SearchIntent; stage: 'BOFU' | 'MOFU' | 'TOFU'; reasons: string[]; }, strategyConfidence: 'low' | 'medium' | 'high'): StrategicAnalysis {
        const playbook = this.parsePlaybookHints();
        const auditsForAnalysis = this.selectAuditsForStrategy(input.marketData.deepAudits || [], input.niche, playbook);
        const avgWords = auditsForAnalysis.length > 0
            ? auditsForAnalysis.reduce((acc: number, audit: any) => acc + Number(audit?.wordCount || 0), 0) / auditsForAnalysis.length
            : 0;

        const secondaryKeywords = this.deriveSecondaryKeywords(input, classification, playbook, auditsForAnalysis, strategyConfidence);
        const entities = this.deriveEntities(input, playbook, auditsForAnalysis, strategyConfidence);
        const trustAssets = this.deriveTrustAssets(playbook, auditsForAnalysis);

        return {
            primaryKeyword: input.niche,
            secondaryKeywords,
            entities,
            pageTypeRecommendation: classification.pageType,
            primaryIntent: classification.intent,
            secondaryIntent: classification.intent === 'informational' ? 'commercial' : 'commercial',
            funnelStage: classification.stage,
            wordCountTarget: this.getWordCountTarget(classification.pageType, avgWords),
            serpFeaturesTarget: this.deriveSerpFeatures(classification, input.marketData, playbook),
            contentAngles: this.deriveContentAngles(input, classification, playbook, strategyConfidence),
            trustAssets,
            internalLinkTargets: this.deriveInternalLinkTargets(playbook, secondaryKeywords, strategyConfidence),
            titleStrategy: this.deriveTitleStrategy(input, classification),
            metaDescriptionStrategy: this.deriveMetaDescriptionStrategy(input, classification, trustAssets),
            schemaTypes: this.deriveSchemaTypes(classification, playbook),
            keywordReport: this.deriveKeywordReport(input, auditsForAnalysis, input.marketData.organicLeaders || [], secondaryKeywords, classification, strategyConfidence),
            strategyConfidence,
            classificationReasons: classification.reasons
        };
    }

    private sanitizePageType(value: any, fallback: PageType): PageType {
        const allowed: PageType[] = ['home_local', 'service', 'service_area', 'urgent', 'guide', 'faq', 'comparison', 'category'];
        return allowed.includes(value as PageType) ? value as PageType : fallback;
    }

    private sanitizeIntent(value: any, fallback: SearchIntent): SearchIntent {
        const allowed: SearchIntent[] = ['transactional', 'commercial', 'informational', 'navigational'];
        return allowed.includes(value as SearchIntent) ? value as SearchIntent : fallback;
    }

    private sanitizeFunnelStage(value: any, fallback: 'BOFU' | 'MOFU' | 'TOFU'): 'BOFU' | 'MOFU' | 'TOFU' {
        const allowed = ['BOFU', 'MOFU', 'TOFU'];
        return allowed.includes(String(value)) ? value as 'BOFU' | 'MOFU' | 'TOFU' : fallback;
    }

    private mergeStrategies(
        parsed: StrategicAnalysis,
        deterministic: StrategicAnalysis,
        classification: { pageType: PageType; intent: SearchIntent; stage: 'BOFU' | 'MOFU' | 'TOFU'; reasons: string[]; },
        strategyConfidence: 'low' | 'medium' | 'high'
    ): StrategicAnalysis {
        const minWordCount = this.getWordCountTarget(classification.pageType, 0);

        return {
            primaryKeyword: this.normalizeText(parsed?.primaryKeyword || deterministic.primaryKeyword || ''),
            secondaryKeywords: this.uniqueNormalized([...(parsed?.secondaryKeywords || []), ...deterministic.secondaryKeywords], deterministic.secondaryKeywords.length || 8),
            entities: this.uniqueNormalized([...(parsed?.entities || []), ...deterministic.entities], deterministic.entities.length || 10),
            pageTypeRecommendation: this.sanitizePageType(parsed?.pageTypeRecommendation, deterministic.pageTypeRecommendation),
            primaryIntent: this.sanitizeIntent(parsed?.primaryIntent, deterministic.primaryIntent),
            secondaryIntent: this.sanitizeIntent(parsed?.secondaryIntent, deterministic.secondaryIntent || 'commercial'),
            funnelStage: this.sanitizeFunnelStage(parsed?.funnelStage, deterministic.funnelStage),
            wordCountTarget: Math.max(minWordCount, Number(parsed?.wordCountTarget || 0) || deterministic.wordCountTarget),
            serpFeaturesTarget: this.uniqueNormalized([...(parsed?.serpFeaturesTarget || []), ...deterministic.serpFeaturesTarget], 5),
            contentAngles: this.uniqueNormalized([...(parsed?.contentAngles || []), ...deterministic.contentAngles], deterministic.contentAngles.length || 5),
            trustAssets: this.uniqueNormalized([...(parsed?.trustAssets || []), ...deterministic.trustAssets], 6),
            internalLinkTargets: this.uniqueNormalized([...(parsed?.internalLinkTargets || []), ...deterministic.internalLinkTargets], deterministic.internalLinkTargets.length || 5),
            titleStrategy: this.normalizeText(parsed?.titleStrategy || deterministic.titleStrategy),
            metaDescriptionStrategy: this.normalizeText(parsed?.metaDescriptionStrategy || deterministic.metaDescriptionStrategy),
            schemaTypes: this.uniqueNormalized([...(parsed?.schemaTypes || []), ...deterministic.schemaTypes], 5),
            keywordReport: this.normalizeText(parsed?.keywordReport || deterministic.keywordReport),
            strategyConfidence,
            classificationReasons: this.uniqueNormalized([...(parsed?.classificationReasons || []), ...classification.reasons, ...deterministic.classificationReasons], 6)
        };
    }

    async execute(input: {
        niche: string;
        city: string;
        marketData: {
            localPack: any[];
            organicLeaders: any[];
            deepAudits: any[];
        }
    }): Promise<AgentResponse<any>> {
        const knowledge = await this.getPersistentKnowledge({
            city: input.city,
            niche: input.niche
        });

        const playbook = this.parsePlaybookHints();
        const auditsForConfidence = this.selectAuditsForStrategy(input.marketData.deepAudits || [], input.niche, playbook);

        const classification = this.classifyKeyword(input.niche);
        const avgWords = auditsForConfidence.length > 0
            ? auditsForConfidence.reduce((acc, audit) => acc + (Number(audit?.wordCount || 0)), 0) / auditsForConfidence.length
            : 0;

        const qualityAudits = auditsForConfidence.filter((audit: any) => Number(audit?.wordCount || 0) >= 250);
        const strategyConfidence = qualityAudits.length >= 3 ? 'high' : (qualityAudits.length >= 2 ? 'medium' : 'low');
        const shouldUseDeterministicAnalyst = (() => {
            const force = String(process.env.ANALYST_FORCE_DETERMINISTIC || '').toLowerCase() === 'true';
            const explicitLlm = String(process.env.ANALYST_USE_LLM || '').toLowerCase() === 'true';
            if (force) return true;
            if (explicitLlm) return false;
            return strategyConfidence !== 'low' && ['service', 'urgent', 'service_area', 'comparison', 'faq', 'home_local', 'category'].includes(classification.pageType);
        })();

        const deterministicStrategy = this.buildDeterministicStrategy({
            ...input,
            marketData: {
                ...input.marketData,
                deepAudits: auditsForConfidence
            }
        }, classification, strategyConfidence);

        await this.logThought(`[INTEL] Sintetizando Estatuto de Dominación para "${input.niche}" en "${input.city}". Confianza: ${strategyConfidence}`);

        const prompt = `
Eres el Director General de Estrategia SEO de una agencia premium.

Tu misión es analizar el mercado para "${input.niche}" en "${input.city}" y devolver una estrategia lista para producción editorial y de diseño.

${knowledge}

${this.nicheBrief}

DATOS DE COMPETIDORES:
${auditsForConfidence.map(a => `
URL: ${a.url}
- WordCount: ${a.wordCount}
- Título: ${a.title || ''}
- H1: ${(a.h1s || []).slice(0, 2).join(' | ')}
- H2: ${(a.h2s || []).slice(0, 3).join(' | ')}
- H3: ${(a.h3s || []).slice(0, 3).join(' | ')}
`).join('\n')}

ANÁLISIS PRELIMINAR:
- Clasificación sugerida: ${classification.pageType}
- Intención: ${classification.intent}
- Etapa funnel: ${classification.stage}
- Razones: ${classification.reasons.join(', ')}

BASE DETERMINISTA ENRIQUECIDA:
${JSON.stringify(deterministicStrategy, null, 2)}

TU TAREA:
Refina la base determinista con los datos reales de los competidores. Si detectas un patrón claro, mejóralo; si no, conserva la base determinista. Nunca empobrezcas la estrategia.

Devuelve SOLO JSON válido con esta estructura:
{
  "primaryKeyword": "string",
  "secondaryKeywords": ["string"],
  "entities": ["string"],
  "pageTypeRecommendation": "${classification.pageType}",
  "primaryIntent": "${classification.intent}",
  "secondaryIntent": "commercial",
  "funnelStage": "${classification.stage}",
  "wordCountTarget": ${this.getWordCountTarget(classification.pageType, avgWords)},
  "serpFeaturesTarget": ["local_pack", "faq"],
  "contentAngles": ["string"],
  "trustAssets": ["atención directa", "presupuesto claro", "cobertura real", "equipo especializado", "plazos realistas", "garantía por escrito"],
  "internalLinkTargets": ["string"],
  "titleStrategy": "string",
  "metaDescriptionStrategy": "string",
  "schemaTypes": ["LocalBusiness", "Service", "FAQPage", "BreadcrumbList", "WebPage"],
  "keywordReport": "string",
  "strategyConfidence": "${strategyConfidence}",
  "classificationReasons": ["string"]
}

REGLAS ESTRATÉGICAS:
- pageTypeRecommendation: home_local, service, service_area, urgent, guide, faq, comparison, category.
- Si strategyConfidence es 'low', sé más conservador con las entidades y keywords secundarias.
- Nunca reduzcas el wordCountTarget por debajo de ${this.getWordCountTarget(classification.pageType, 0)}.
- Anti-Canibalización: prioriza intenciones BOFU.
- Mantén señales de confianza y vocabulario coherentes con el playbook.
`.trim();

        if (shouldUseDeterministicAnalyst) {
            await this.logThought(`[FASTPATH] Strategy resolved in deterministic mode for ${input.city}.`);
            return {
                success: true,
                data: deterministicStrategy,
                thoughts: `Estrategia determinista enriquecida aplicada. Tipo=${classification.pageType}. Confianza=${strategyConfidence}.`
            };
        }

        try {
            await this.logThought(`[INTEL] Consultando modelo estratégico (${this.model}) para ${input.city}.`);
            const rawText = await this.callModel(prompt, this.model, {
                json: true,
                timeoutMs: vault.ANALYST_TIMEOUT_MS,
                numPredict: 1200,
                temperature: 0.2,
                maxRetries: 0,
                fallbackResponse: () => JSON.stringify(deterministicStrategy)
            });
            const parsed = safeJsonParse<StrategicAnalysis>(rawText, deterministicStrategy);
            const merged = this.mergeStrategies(parsed, deterministicStrategy, classification, strategyConfidence);

            await this.logThought(`[INTEL] Estrategia resuelta para ${input.city}. Tipo=${merged.pageTypeRecommendation}.`);

            return {
                success: true,
                data: merged,
                thoughts: `Estrategia generada. Tipo=${merged.pageTypeRecommendation}. Confianza=${merged.strategyConfidence}.`
            };

        } catch (error: any) {
            console.error(`[CRITICAL FAILURE] Pipeline V3 aborted: ${error.message}`);
            await this.rememberFailure({
                errorMessage: error.message,
                failureType: 'llm_fallback',
                niche: input.niche,
                city: input.city,
            });
            return {
                success: true,
                data: deterministicStrategy,
                thoughts: 'RECUPERACIÓN: Fallo del LLM, se aplicó la estrategia determinista enriquecida.'
            };
        }
    }
}

