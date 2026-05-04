import type { ZodTypeAny } from 'zod';
import type { HeroRenderContract, SectionRenderContract } from '../../types/design.js';
import type { SectionSemanticData } from '../../agents/contentWriterAgent.js';
import type { DesignSystemTheme } from '../../design-system/types.js';
import type { NicheIntelligenceProfile } from '../../niche-intelligence/types.js';

export type BlockType =
  | 'hero_trust'
  | 'services_grid'
  | 'urgency_panel'
  | 'local_proof'
  | 'trust_band'
  | 'process_steps'
  | 'price_guidance'
  | 'faq'
  | 'cta_panel'
  | 'comparison_table'
  | 'map'
  | 'authority_note'
  | 'internal_linking';

export type PreferredFormat = 'cards' | 'bullets' | 'prose' | 'faq' | 'trust_cards' | 'table';
export type LayoutHint =
  | 'split_feature'
  | 'boxed_content'
  | 'full_width_text'
  | 'minimal_centered'
  | 'two_column_trust';

export type ContentDensity = 'compact' | 'standard' | 'rich';
export type BlockEmphasis = 'content' | 'trust' | 'cta';

export interface BlockVisualMeta {
  spacingProfile?: 'tight' | 'normal' | 'airy';
  emphasis?: BlockEmphasis;
  mobilePattern?: 'stack' | 'split-collapse' | 'cards' | 'accordion' | 'swipe-cards';
  decorativeLevel?: 'none' | 'soft' | 'strong';
}

export interface BlockSectionBase {
  section_id: string;
  block_type: BlockType | string;
  h2?: string;
  h3s?: string[];
  preferred_format?: PreferredFormat;
  layout_hint?: LayoutHint;
  visual_variant?: string;
  content_density?: ContentDensity;
  emphasis?: BlockEmphasis;
  target_words?: number;
  visual_spec?: BlockVisualMeta;
}

export interface BlockContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
  mapEmbedUrl?: string;
  ctaHref?: string;
  labels?: Record<string, string>;
}

export interface SectionBlockPayload<TSemantic = SectionSemanticData> {
  section: BlockSectionBase;
  semantic?: TSemantic;
  contract?: Partial<SectionRenderContract>;
  context?: BlockContext;
}

export interface HeroBlockData {
  block_type?: 'hero_trust' | 'hero';
  h1: string;
  subtitle?: string;
  trust_bullets?: string[];
  cta_text?: string;
  secondary_cta_text?: string;
  phone?: string;
  city?: string;
  niche?: string;
  hero_eyebrow?: string;
  hero_card_eyebrow?: string;
  hero_card_title?: string;
  hero_card_text?: string;
  visual_variant?: string;
}

export interface HeroBlockPayload {
  hero: HeroBlockData;
  contract?: Partial<HeroRenderContract>;
  context?: BlockContext;
}

export interface BlockCtaContent {
  text?: string;
  href?: string;
  phone?: string;
  note?: string;
}

export interface BlockContentItem {
  title: string;
  body: string;
  meta?: string[];
  href?: string;
  label?: string;
  value?: string;
}

export interface BlockFaqItem {
  question: string;
  answer: string;
}

export interface BlockReadiness {
  ready: boolean;
  score: number;
  missing: string[];
  repaired: string[];
  checkedAt: string;
}

export interface BlockContent {
  heading?: string;
  subheading?: string[];
  items?: BlockContentItem[];
  bullets?: string[];
  trustBullets?: string[];
  faqItems?: BlockFaqItem[];
  table?: unknown;
  cta?: BlockCtaContent;
  mapNote?: string;
  decisionFactors?: string[];
  commonMistakes?: string[];
  links?: Array<Record<string, unknown>>;
  h1?: string;
  h2?: string;
  h3s?: string[];
  html?: string;
  phone?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  eyebrow?: string;
  subtitle?: string;
  trust_bullets?: string[];
  hero_card_eyebrow?: string;
  hero_card_title?: string;
  hero_card_text?: string;
  [key: string]: unknown;
}

export interface BlockSeoData {
  city?: string;
  niche?: string;
  canonical?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BlockLocalData extends BlockContext {
  address?: string;
  labels?: Record<string, string>;
  [key: string]: unknown;
}

export interface BlockRendererInput {
  sectionId: string;
  blockType: string;
  variant: string;
  layoutHint: string;
  content: BlockContent;
  seo: BlockSeoData;
  design?: DesignSystemTheme;
  local: BlockLocalData;
  payload?: unknown;
  contract?: Partial<SectionRenderContract>;
  nicheProfile?: NicheIntelligenceProfile;
  quality?: BlockReadiness;
}

export type HtmlRenderer<TPayload = BlockRendererInput> = (payload: TPayload) => string;

export interface BlockRendererModule<TPayload = BlockRendererInput> {
  blockType: BlockType | string;
  schema: ZodTypeAny;
  is: (payload: unknown) => payload is TPayload;
  render: HtmlRenderer<TPayload>;
}
