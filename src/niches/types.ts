export type SupportedNicheId = 'cerrajeros' | 'fontaneros' | 'electricistas' | 'carpinteros' | 'pintores';

export type FunnelStage = 'BOFU' | 'MOFU' | 'TOFU';

export interface TrustSignal {
  id: string;
  label: string;
  description: string;
  requiresVerification?: boolean;
}

export interface ServiceVariant {
  slug: string;
  label: string;
  intent: 'transactional' | 'commercial' | 'informational';
  funnelStage: FunnelStage;
  angle: string;
}

export interface FaqEntry {
  question: string;
  answerGuidance: string;
  intent: FunnelStage;
  blockHint?: 'faq' | 'price_guidance' | 'services_grid' | 'process_steps';
}

export interface DecisionCriterion {
  id: string;
  label: string;
  whyItMatters: string;
  proofExpected?: string[];
}

export interface LocalEntityHint {
  type: 'district' | 'landmark' | 'public_body' | 'regulation' | 'infrastructure' | 'service_area';
  label: string;
  usage: string;
}

export interface ToneProfile {
  voice: string[];
  forbiddenCliches: string[];
  preferredOpenings: string[];
  editorialAngles: string[];
}

export interface LegalRiskPolicy {
  prohibitedClaims: string[];
  allowedSafeClaims: string[];
  requiredDisclaimers: string[];
  verificationRequiredFor: string[];
  pricingPolicy: {
    allowExactPrices: boolean;
    allowedLanguage: string[];
    forbiddenLanguage: string[];
  };
  guaranteePolicy: {
    allowSpecificYears: boolean;
    allowedLanguage: string[];
    forbiddenLanguage: string[];
  };
}

export interface BlockSemanticsPlaybook {
  servicesGrid: {
    categories: Array<{
      label: string;
      summary: string;
      situations: string[];
      decisionFactor: string;
    }>;
    trustBullets: string[];
  };
  processSteps: {
    steps: Array<{
      title: string;
      detail: string;
      riskControl: string;
    }>;
  };
  faq: {
    priorityQuestions: string[];
    answerPatterns: string[];
  };
  priceGuidance: {
    factors: Array<{
      label: string;
      whyItChanges: string;
      safeLanguage: string;
    }>;
    comparisonRows: string[][];
  };
}

export interface NicheExampleBank {
  good: string[];
  bad: string[];
}

export interface NichePlaybook {
  id: SupportedNicheId;
  displayName: string;
  aliases: string[];
  schemaTypes: string[];
  allowedVocabulary: string[];
  forbiddenVocabulary: string[];
  prohibitedClaims: string[];
  validTrustSignals: TrustSignal[];
  coreServices: string[];
  bofuVariants: ServiceVariant[];
  commonObjections: string[];
  faqBank: FaqEntry[];
  commonMistakes: string[];
  decisionCriteria: DecisionCriterion[];
  usefulLocalEntities: LocalEntityHint[];
  toneProfile: ToneProfile;
  legalRiskPolicy: LegalRiskPolicy;
  blockSemantics: BlockSemanticsPlaybook;
  examples?: NicheExampleBank;
}

export interface AgentPlaybookContext {
  playbook: NichePlaybook;
  analystBrief: string;
  architectBrief: string;
  writerBrief: string;
  technicalBrief: string;
}

export interface BlockPlaybookPayload {
  services?: Array<{ title: string; body: string; meta?: string[] }>;
  decisionFactors?: Array<{ title: string; body: string }>;
  commonMistakes?: string[];
  faqItems?: Array<{ question: string; answer: string }>;
  trustBullets?: string[];
  priceRows?: string[][];
}