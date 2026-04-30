export type FallbackBlockType =
  | 'hero'
  | 'servicesGrid'
  | 'processSteps'
  | 'priceGuidance'
  | 'faq'
  | 'trustBand'
  | 'localProof'
  | 'ctaPanel'
  | 'urgencyPanel'
  | 'comparisonTable'
  | 'map'
  | 'content';

export type LocalContextKind =
  | 'centro'
  | 'barrio-residencial'
  | 'zona-premium'
  | 'zona-industrial'
  | 'costa'
  | 'municipio-pequeno'
  | 'capital'
  | 'general';

export type FallbackIntent = 'transactional' | 'commercial' | 'informational' | 'urgent' | 'local-proof';

export interface PremiumFallbackInput {
  niche?: string;
  city?: string;
  sectionId?: string;
  sectionTitle?: string;
  blockType?: string;
  technicalTerms?: string[];
  phone?: string;
  businessName?: string;
  pageType?: string;
  primaryIntent?: string;
  reason?: string;
  contextualData?: Record<string, any>;
  seedHint?: string;
}

export interface PremiumFallbackResult {
  html: string;
  h2: string;
  wordCount: number;
  blockType: FallbackBlockType;
  variantId: string;
  contextKind: LocalContextKind;
  intent: FallbackIntent;
  topics: string[];
  meta: Record<string, unknown>;
}

export interface NicheContentBank {
  label: string;
  singular?: string;
  services: string[];
  technicalTerms: string[];
  objections: string[];
  trustSignals: string[];
  process: string[];
  priceFactors: string[];
  faq: Array<{ q: string; a: string }>;
  urgency: string[];
  proofAngles: string[];
}
