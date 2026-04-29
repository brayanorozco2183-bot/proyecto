import { DesignSeed } from './pipeline_v2.js';
import { DesignSystemTheme, DesignSystemThemeId, OfficialShell } from '../design-system/types.js';

export type CompositionFamily =
  | 'editorial'
  | 'conversion_heavy'
  | 'local_trust'
  | 'technical_grid'
  | 'asymmetric_premium'
  | 'minimal_authority';

export interface PageDesignDNA {
  designId: string;
  pageType: string;
  personality: 'luxury' | 'modern_tech' | 'organic' | 'editorial';
  family: CompositionFamily;
  artDirection: string;
  contrastModel: 'soft' | 'balanced' | 'dramatic';
  tensionCurve: Array<'low' | 'medium' | 'high'>;
  heroTreatment: 'split' | 'centered' | 'stacked' | 'proof_first' | 'cta_heavy';
  surfaceStyle: 'flat' | 'tinted' | 'glass' | 'paper';
  cardTreatment: 'elevated' | 'outlined' | 'flat' | 'editorial';
  navbarTreatment: 'solid' | 'glass' | 'minimal';
  footerTreatment: 'directory' | 'minimal' | 'editorial';
  ornamentPolicy: 'none' | 'subtle' | 'hero_only' | 'hero_and_cta';
  spacingScale: 'compact' | 'balanced' | 'luxury';
  sectionCadence: 'calm' | 'alternating' | 'contrast' | 'cinematic';
  pageComposition: 'editorial' | 'conversion' | 'local_dense' | 'trust_first';
  heroDisposition?: 'content_left' | 'content_center' | 'content_right';
  sectionFlow?: Array<'immersive' | 'compact' | 'framed' | 'dialogue'>;
  visualSystem: 'grid' | 'editorial' | 'panelled' | 'minimal' | 'mixed';
  pageSkeleton?: string;
  heroTemplate?: string;
  visualIdentityContract?: any;
  pageArchetype?: string;
  visualDialect?: string;
  blockDialects?: Record<string, string>;
  layoutSignature?: Record<string, string>;
  cadencePattern?: string;
  proofStrategy?: string;
  ctaStrategy?: string;
  fingerprint: string[];
  seed?: DesignSeed;
  repetitionRisk?: number;
}

export interface HeroRenderContract {
  template: 'split' | 'centered' | 'stacked' | 'proof_first' | 'cta_heavy';
  contentDisposition: 'left' | 'center' | 'right';
  ctaWeight: 'low' | 'medium' | 'high';
  proofPlacement: 'inline' | 'below_headline' | 'right_column';
  mediaMode: 'none' | 'shape' | 'illustration' | 'photo_slot';
  spacingProfile: 'compact' | 'balanced' | 'luxury';
  mobileBehavior: 'stack' | 'content_first' | 'cta_first';
}

export interface SectionRenderContract {
  sectionId: string;
  blockType: string;
  variant: string;
  shell: OfficialShell;
  flow: 'stack' | 'split' | 'zigzag' | 'asymmetric' | 'centered';
  widthMode: 'narrow' | 'standard' | 'wide' | 'full_bleed';
  emphasis: 'content' | 'trust' | 'cta';
  density: 'compact' | 'standard' | 'rich';
  cardStyle: 'elevated' | 'outlined' | 'flat' | 'editorial';
  ornamentLevel: 'none' | 'soft' | 'strong';
  sectionPattern: string;
  eyebrow?: string;
  mobilePattern: 'stack' | 'split-collapse' | 'cards' | 'accordion' | 'swipe-cards';
  constraints: {
    maxColumnsDesktop: number;
    maxColumnsTablet: number;
    maxColumnsMobile: number;
    textMeasure: 'narrow' | 'medium' | 'wide';
  };
}

export interface ResponsivePlan {
  breakpointDesktop: number;
  breakpointTablet: number;
  breakpointMobile: number;
  baseFontSize: number;
  scalingFactor: number;
}

export interface ResolvedPageRenderPlan {
  pageId: string;
  pageType: string;
  renderMode: 'web' | 'wordpress';
  visualSystem: {
    family: string;
    pageComposition: string;
    heroTreatment: string;
    cadence: string;
    contrastModel: string;
    spacingScale: string;
    surfaceStyle: string;
    cardTreatment: string;
    navbarTreatment: string;
    footerTreatment: string;
    ornamentPolicy: string;
  };
  hero: HeroRenderContract;
  sections: SectionRenderContract[];
  theme: DesignSystemTheme;
  themeId: DesignSystemThemeId;
  responsivePlan: ResponsivePlan;
  outputFingerprintSeed: string[];
}