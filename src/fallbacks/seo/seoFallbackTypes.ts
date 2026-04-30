export type SeoPageType = 'city' | 'neighborhood' | 'service-city' | 'service-neighborhood' | 'generic';

export type SeoFallbackIntent =
  | 'urgent'
  | 'price'
  | 'neighborhood'
  | 'communities'
  | 'business'
  | 'maintenance'
  | 'installation'
  | 'repair'
  | 'comparison'
  | 'trust';

export interface SeoFaqSeed {
  question: string;
  answerAngle: string;
}

export interface SeoFallbackGroup {
  groupId: string;
  niche: string;
  schemaType: string;
  intent: SeoFallbackIntent | string;
  pageTypes: SeoPageType[];
  description: string;
  titles: string[];
  metaDescriptions: string[];
  h1s: string[];
  serviceKeywords: string[];
  longTailKeywords: string[];
  trustPhrases: string[];
  localAngles: string[];
  customerTypes: string[];
  faqSeeds: SeoFaqSeed[];
  ctas: string[];
  avoidClaims: string[];
}

export interface SeoFallbackPickInput {
  niche?: string;
  city?: string;
  neighborhood?: string;
  intent?: string;
  pageType?: SeoPageType | string;
  serviceKeyword?: string;
  seedHint?: string;
}

export interface SeoFallbackPick {
  group: SeoFallbackGroup;
  title: string;
  metaDescription: string;
  h1: string;
  serviceKeyword: string;
  longTailKeyword: string;
  trustPhrase: string;
  localAngle: string;
  customerType: string;
  faq: SeoFaqSeed;
  cta: string;
  avoidClaims: string[];
  schemaType: string;
  tokens: Record<string, string>;
}
