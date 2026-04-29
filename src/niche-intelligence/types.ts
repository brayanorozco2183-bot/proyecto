export type NicheVertical =
  | 'home_services'
  | 'healthcare'
  | 'legal'
  | 'education'
  | 'automotive'
  | 'hospitality'
  | 'beauty'
  | 'real_estate'
  | 'finance'
  | 'b2b_services'
  | 'local_retail'
  | 'generic_services';

export type BuyerIntent =
  | 'urgent_service'
  | 'diagnostic_service'
  | 'appointment_consulting'
  | 'quote_project'
  | 'comparison_research'
  | 'local_discovery';

export type LegalSensitivity = 'low' | 'medium' | 'high';

export interface VerticalProfile {
  vertical: NicheVertical;
  label: string;
  defaultIntent: BuyerIntent;
  legalSensitivity: LegalSensitivity;
  tone: string;
  minimumTechnicalDepth: 'light' | 'standard' | 'deep';
  vocabulary: string[];
  decisionCriteria: string[];
  trustAssets: string[];
  buyerObjections: string[];
  preferredCtas: Partial<Record<BuyerIntent, string[]>>;
  forbiddenClaims: string[];
  safeClaimAlternatives: string[];
  localModifiers: string[];
  serviceTemplates: string[];
  faqSeeds: string[];
  complianceChecklist?: string[];
}

export interface NicheIntelligenceProfile {
  vertical: NicheVertical;
  verticalLabel: string;
  niche: string;
  city?: string;
  intent: BuyerIntent;
  legalSensitivity: LegalSensitivity;
  tone: string;
  minimumTechnicalDepth: VerticalProfile['minimumTechnicalDepth'];
  technicalVocabulary: string[];
  decisionCriteria: string[];
  trustAssets: string[];
  buyerObjections: string[];
  preferredCtas: string[];
  forbiddenClaims: string[];
  safeClaimAlternatives: string[];
  localModifiers: string[];
  serviceTemplates: string[];
  faqSeeds: string[];
  localAreas: string[];
  source: 'classified' | 'fallback';
  complianceChecklist: string[];
  copyBrief: string;
  verticalEnrichment?: any;
}

export interface BuildNicheProfileInput {
  niche?: string;
  city?: string;
  intent?: BuyerIntent | string;
  localAreas?: string[];
  businessName?: string;
  seedText?: string;
}
