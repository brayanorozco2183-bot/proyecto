import { PageFamily, GeneratedSection } from '../design-system/procedural-engine.js';
import { PageDesignDNA } from './design.js';

export interface DesignSeed {
    compositionFamily: string;
    heroVariant: string;
    sectionRhythm: string;
    cardStyle: string;
    densityProfile: string;
    proofStyle: string;
    ctaModel: string;
    asymmetryLevel: number;
    pageSkeleton?: string;
}

export interface StructuralFingerprint {
    hero: string;
    order: string[];
    shells: string[];
    cadence: string;
    density: string;
    composition: string;
    patterns: string[];
}

export interface ResearchContext {
    niche: string;
    city: string;
    local_nap: {
        business_name: string;
        address: string;
        phone: string;
        mapEmbedUrl?: string;
    };
    keywords: string[];
    entities: string[];
    competitors: any[];
    serp_gaps: any[];
    market_data: any;
    intentModel?: IntentModel;
    strategicAnalysis?: any;
    contextual_data?: any;
    geoData?: {
        neighborhoods: string[];
        sub_locations: { name: string, type: string }[];
    };
    serp_evidence?: {
        attempted?: boolean;
        executed: boolean;
        status?: string;
        fallbackUsed?: boolean;
        fallbackReason?: string;
        provider?: string;
        mode?: string;
        query?: string;
        organicResults?: any[];
        competitors?: any[];
        localPack?: any[];
        timestamp?: string;
        evidenceDir?: string;
        evidenceFiles?: string[];
        error?: string;
    };
    serpInsights?: {
        topCompetitorTitles?: string[];
        competitorUrls?: string[];
        extractedHeadings?: string[];
        recurringServices?: string[];
        recurringQuestions?: string[];
        contentAngles?: string[];
        city?: string;
        niche?: string;
    };
    researchConfig?: any;
}

export interface ResearchBundle {
    query: string;
    city: string;
    niche: string;
    localPack: any[];
    organicLeaders: any[];
    deepAudits: any[];
    entities: string[];
    geoSignals: any;
    serpFeatures: string[];
    competitorPatterns?: {
        avgWordCount?: number;
        commonBlockTypes?: string[];
        frequentFAQs?: string[];
        trustAssets?: string[];
    };
    timestamp: number;
    strategyConfidence?: 'low' | 'medium' | 'high';
}

/**
 * NEW Phase B: Context Normalization
 */
export interface NormalizedContext extends ResearchContext {
    clustered_keywords: { cluster: string; kws: string[] }[];
    deduplicated_entities: string[];
    clean_nap: {
        business_name: string;
        address: string;
        phone: string;
        phone_normalized: string;
        mapEmbedUrl?: string;
    };
}



export interface PageBlueprint {
    h1: string;
    meta_title: string;
    meta_description: string;
    page_family: PageFamily;
    variant: string;
    sections: {
        section_id: string;
        h2: string;
        h3s: string[];
        block_type: string;
        preferred_format?: string;
        content_density?: string;
        factuality_level?: string;
        mobile_priority?: string;
        target_words: number;
        objective?: string;
        introduction_style?: string;
        structure_type?: string;
        layout_hint?: string;
        visual_weight?: 'light' | 'medium' | 'heavy';
        emphasis?: 'content' | 'trust' | 'cta';
        pattern_hint?: string;
        depth_mode?: 'compact' | 'standard' | 'deep' | string;
        blockType?: string;
        visual_variant?: string;
        visual_spec?: Record<string, any>;
        qualityContract?: any;
        [key: string]: any;
    }[];
    global_tone: string;
    page_skeleton?: PageSkeleton;
}

export type PageSkeleton =
    | 'editorial-longform'
    | 'conversion-funnel'
    | 'local-directory'
    | 'premium-showcase'
    | 'technical-comparison';

export type PageType =
    | 'home_local'
    | 'service'
    | 'service_area'
    | 'urgent'
    | 'guide'
    | 'faq'
    | 'comparison'
    | 'category';

export type SearchIntent =
    | 'transactional'
    | 'commercial'
    | 'informational'
    | 'navigational';

export interface IntentModel {
    pageType: PageType;
    primaryIntent: SearchIntent;
    secondaryIntent?: SearchIntent;
    funnelStage: 'BOFU' | 'MOFU' | 'TOFU';
    primaryKeyword: string;
    secondaryKeywords: string[];
    semanticEntities: string[];
    serpFeaturesTarget: Array<'local_pack' | 'faq' | 'featured_snippet' | 'reviews' | 'sitelinks'>;
    mandatoryTrustElements: string[];
    mandatorySections: string[];
    internalLinkTargets: string[];
    conversionGoal: 'call' | 'lead_form' | 'quote_request' | 'visit';
    wordCountTarget?: number;
}

export interface DesignPlan {
    pageFamily: PageFamily;
    designTokens: any;
    visualVariantId: string;
    composition: string;
    dna?: PageDesignDNA;
    layout?: LayoutContract;
    seed?: DesignSeed;
}

export type SectionShell = 'plain' | 'panel' | 'band' | 'editorial' | 'hero-bridge';
export type ContentFlow = 'stack' | 'split' | 'zigzag' | 'asymmetric' | 'centered';
export type MediaPolicy = 'none' | 'iconic' | 'illustrated' | 'map' | 'proof';
export type CtaWeight = 'low' | 'medium' | 'high';
export type TrustDistribution = 'embedded' | 'separate' | 'mixed';

export interface SectionLayoutContract {
    shell: SectionShell;
    flow: ContentFlow;
    media: MediaPolicy;
    cta: CtaWeight;
    trust: TrustDistribution;
    density: 'compact' | 'standard' | 'rich';
    pattern?: string;
    visualVariant?: string;
    mergedWith?: string;
}

export interface LayoutContract {
    pageComposition: string;
    sections: Record<string, SectionLayoutContract>;
    visualRhythm: 'calm' | 'dynamic' | 'cinematic';
    widthAlternation: boolean;
    heroTemplate?: 'split' | 'centered' | 'proof-first' | 'form-first' | 'conversion' | 'local' | 'urgency' | 'educational' | 'binary_cta' | 'cta-heavy';
    cadencePattern?: 'alternating' | 'stacked' | 'contrast-bursts' | 'cinematic' | 'calm';
    proofStrategy?: 'early' | 'mid' | 'distributed' | 'none';
    ctaStrategy?: 'terminal' | 'distributed' | 'hero-heavy' | 'minimal';
    pageSkeleton?: PageSkeleton;
    orderedSectionIds?: string[];
}

export interface PagePlan extends PageBlueprint {
    design: DesignPlan;
    layoutContract?: LayoutContract;
    pageVariety?: any;
    pageProfile: any;
    intentModel: IntentModel;
    seoBrief: {
        titleStrategy: string;
        metaDescriptionStrategy: string;
        canonicalSlug?: string;
        schemaTypes: string[];
        faqEligible: boolean;
        localModifiers: string[];
        indexationHint?: 'index' | 'noindex';
    };
    contentRules: {
        prohibitedClaims: string[];
        disallowedLocalEntities: string[];
        factOnlyFields: string[];
        maxBrandMentionsPerSection: number;
    };
    internalLinking?: {
        graph?: any;
        currentNodeId?: string;
        architectContext?: any;
        linkPlan?: any;
        autoBlocks?: any[];
    };
    originalityPlan?: {
        score: number;
        passed: boolean;
        issues: Array<{ code: string; severity: string; message: string; penalty: number }>;
        architectDirective?: string;
    };
}

export interface BlockScore {
    blockId: string;
    blockType: string;
    score: number;
    passed: boolean;
    issues: string[];
    retryCount: number;
}

export interface ContentBlock {
    id: string;
    h2: string;
    html: string;
    wordCount: number;
    /** Backwards-compatible alias still used by several pipeline phases. */
    type?: string;
    score?: number;
    metadata: {
        block_type: string;
        sectionIndex: number;
        score?: number;
        corruptionDetected?: boolean;
        unsafeHtml?: boolean;
        degraded?: boolean;
        requires_editorial_review?: boolean;
        [key: string]: any;
    };
}

export interface ContentDraft {
    h1?: string;
    meta_title?: string;
    meta_description?: string;
    pageProfile?: any;
    blocks: ContentBlock[];
    totalWords: number;
    html?: string;
    metadata?: {
        seo?: any; // Will be cast to RenderedSeoContract in the pipeline
        blocks_generated?: number;
        plan_sections?: number;
        enrichment?: any;
        [key: string]: any;
    };
}

export interface RenderedPage {
    html: string;
    metadata: {
        qaScore: number;
        validation_errors: string[];
        technical_passed: boolean;
        editorial_passed: boolean;
        blockScores?: BlockScore[];
        seo?: any;
        semantic_guard?: {
            passed: boolean;
            issues: any[];
        };
        output_path?: string;
        internal_linking_reconciliation?: any;
        image_generation_error?: string;
        images_phase?: any;
        phaseRepairImages?: any;
        [key: string]: any;
    };
}

export interface ObservabilityMetadata {
    durations: Record<string, number>;
    scores: Record<string, number>;
    retries: Record<string, { count: number; reason: string }>;
    agent_logs: string[];
    tokenUsage?: number;
    tokenBudget?: number;
    totalCost?: number;
    agentConfidence?: Record<string, number>;
}

export interface PostDeployAuditResult {
    passed: boolean;
    score?: number;
    status?: string;
    reasoning?: string;
    url: string;
    html_path?: string;
    lighthouse?: any;
    schema_valid: boolean;
    broken_links: string[];
    issues: string[];
    warnings: string[];
    recommendations: string[];
    notes?: string[];
    stats?: any;
}

export interface PipelineResult {
    success: boolean;
    data?: {
        html: string;
        html_path: string;
        word_count: number;
        score: number;
        notes: string[];
        status: 'published' | 'draft' | 'premium' | 'needs_review' | 'critical_error_soft';
        url: string;
        h1: string;
        faqs: { question: string; answer: string }[];
        metadata: {
            h1?: string;
            total_words?: number;
            sectionsCount?: number;
            qaScore?: number;
            issues?: string[];
            observability: ObservabilityMetadata;
            audit?: PostDeployAuditResult;
            [key: string]: any;
        };
        observability?: ObservabilityMetadata;
    };
    error?: string;
    observability?: ObservabilityMetadata;
}

export interface GenerationMission {
    niche: string;
    city: string;
    local_nap: {
        business_name: string;
        address: string;
        phone: string;
        mapEmbedUrl?: string;
    };
    entities?: string[];
    contextual_data?: any;
    cluster_data?: {
        geo: { name: string; sub_path?: string }[];
        topical: { name: string; sub_path?: string }[];
    };
    cluster_folder_name?: string;
    subPath?: string;
    missionId?: string;
    forcedTemplateId?: 'premium' | 'classic' | 'local' | 'modern';
    forcedComposition?: string;
    forcedFamily?: PageFamily;
    siteConfig?: {
        baseUrl: string;
        defaultOgImage?: string;
        brandName?: string;
    };
    wordpress?: {
        enabled: boolean;
        apiUrl?: string;
        username?: string;
        applicationPassword?: string;
    };
    designOverrides?: any;
    mode?: 'production' | 'sandbox';
    debugMode?: boolean;
}