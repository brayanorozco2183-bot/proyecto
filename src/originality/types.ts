export type OriginalitySeverity = 'critical' | 'error' | 'warning';

export type OriginalityScopeType =
  | 'same_niche_nearby_cities'
  | 'same_city_related_services';

export interface DatabaseLike {
  run(sql: string, params?: any[]): Promise<any>;
  all<T = any[]>(sql: string, params?: any[]): Promise<T>;
  get?<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
}

export interface OriginalityScope {
  key: string;
  type: OriginalityScopeType;
  label: string;
}

export interface StructuralFingerprint {
  hero?: string;
  order?: string[];
  shells?: string[];
  cadence?: string;
  density?: string;
  composition?: string;
  patterns?: string[];
}

export interface PlanSectionLike {
  section_id?: string;
  h2?: string;
  h3s?: string[];
  block_type?: string;
  visual_variant?: string;
  preferred_format?: string;
  layout_hint?: string;
}

export interface PagePlanLike {
  h1?: string;
  hero?: {
    h1?: string;
    subtitle?: string;
    cta_text?: string;
    trust_bullets?: string[];
    visual_intent?: string;
  };
  sections?: PlanSectionLike[];
  intentModel?: {
    pageType?: string;
    primaryKeyword?: string;
    primaryIntent?: string;
    funnelStage?: 'BOFU' | 'MOFU' | 'TOFU';
  };
  design?: {
    dna?: {
      family?: string;
      heroTreatment?: string;
      sectionCadence?: string;
      surfaceStyle?: string;
      tensionCurve?: string[];
      repetitionRisk?: number;
      seed?: {
        densityProfile?: string;
      };
    };
  };
  layoutContract?: {
    heroTemplate?: string;
    orderedSectionIds?: string[];
    pageComposition?: string;
    cadencePattern?: string;
    sections?: Record<string, {
      shell?: string;
      pattern?: string;
      blockType?: string;
      block_type?: string;
      visualVariant?: string;
      visual_variant?: string;
    }>;
  };
}

export interface MissionLike {
  niche: string;
  city: string;
  subPath?: string;
  cluster_data?: {
    geo?: any;
    topical?: any;
    [key: string]: any;
  };
}

export interface VisualMemoryEntry {
  pageId: string;
  clusterScopes: string[];
  city: string;
  niche: string;
  pageType: string;
  serviceKey: string;
  family?: string;
  heroSignature: string;
  blockSequenceSignature: string;
  blockVariantsSignature: string;
  navPatternSignature: string;
  ctaPatternSignature: string;
  createdAt?: string;
}

export interface EditorialMemoryEntry {
  pageId: string;
  clusterScopes: string[];
  city: string;
  niche: string;
  pageType: string;
  serviceKey: string;
  h2Openings: string[];
  paragraphSignatures: string[];
  faqOpenings: string[];
  localProofOpenings: string[];
  ctaOpenings: string[];
  createdAt?: string;
}

export interface SiteStructureMemoryEntry {
  pageId: string;
  clusterScopes: string[];
  city: string;
  niche: string;
  pageType: string;
  serviceKey: string;
  blockSequence: string[];
  blockVariants: string[];
  heroSignature: string;
  navSignature: string;
  ctaSignature: string;
  faqStructureSignature: string;
  structural?: StructuralFingerprint;
  createdAt?: string;
}

export interface OriginalitySnapshot {
  pageId: string;
  scopes: OriginalityScope[];
  pageType: string;
  funnelStage?: 'BOFU' | 'MOFU' | 'TOFU';
  city: string;
  niche: string;
  serviceKey: string;
  heroSignature: string;
  blockSequence: string[];
  blockVariants: string[];
  blockSequenceSignature: string;
  blockVariantsSignature: string;
  navPatternSignature: string;
  ctaPatternSignature: string;
  h2Openings: string[];
  faqOpenings: string[];
  localProofOpenings: string[];
  paragraphSignatures: string[];
  faqStructureSignature: string;
  structural?: StructuralFingerprint;
}

export interface OriginalityIssue {
  code: string;
  severity: OriginalitySeverity;
  message: string;
  penalty: number;
  evidence?: string[];
}

export interface OriginalityGuidance {
  avoidHeroSignatures: string[];
  avoidBlockSequenceSignatures: string[];
  avoidH2Openings: string[];
  avoidFaqOpenings: string[];
  avoidLocalProofOpenings: string[];
  avoidNavPatterns: string[];
  avoidCtaPatterns: string[];
  suggestedHeroTreatments: string[];
  suggestedSectionFlips: Array<[string, string]>;
}

export interface PreRenderOriginalityResult {
  passed: boolean;
  score: number;
  issues: OriginalityIssue[];
  guidance: OriginalityGuidance;
  snapshot: OriginalitySnapshot;
}

export interface SiteOriginalityGateResult {
  passed: boolean;
  scoreDelta: number;
  issues: OriginalityIssue[];
}