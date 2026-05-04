import type { PagePlan } from '../types/pipeline_v2.js';
import type { HeroRenderContract, ResolvedPageRenderPlan, SectionRenderContract } from '../types/design.js';
import {
  PRODUCTION_SAFE_BLOCK_ORDER,
  PRODUCTION_SAFE_VARIANTS,
  getProductionSafeVariant,
  isProductionSafeModeEnabled,
  normalizeProductionBlockType,
  productionSafeModeSummary
} from '../config/productionSafeMode.js';

export type StableBlockType =
  | 'hero_trust'
  | 'urgency_panel'
  | 'services_grid'
  | 'process_steps'
  | 'local_proof'
  | 'map'
  | 'price_guidance'
  | 'faq'
  | 'cta_panel'
  | 'trust_band'
  | 'comparison_table'
  | 'internal_linking';

export interface DeterministicAiKernelOptions {
  productionMode?: boolean;
  niche?: string;
  city?: string;
  pageType?: string;
}

export const STABLE_PRODUCTION_BLOCK_ORDER: StableBlockType[] = PRODUCTION_SAFE_BLOCK_ORDER.filter(
  (blockType): blockType is StableBlockType => blockType !== 'internal_linking'
);

export const STABLE_PRODUCTION_VARIANTS: Record<string, string> = PRODUCTION_SAFE_VARIANTS;

const KNOWN_BLOCK_TYPES = new Set<string>([
  'hero_trust', 'urgency_panel', 'services_grid', 'process_steps', 'local_proof',
  'map', 'price_guidance', 'faq', 'cta_panel', 'trust_band', 'comparison_table',
  'internal_linking', 'authority_note'
]);

function envFlag(name: string): boolean {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

export function isDeterministicProductionEnabled(options: DeterministicAiKernelOptions = {}): boolean {
  if (typeof options.productionMode === 'boolean') return options.productionMode;
  if (envFlag('GRAVITY_AI_CREATIVE_MODE')) return false;
  return isProductionSafeModeEnabled();
}

export function normalizeBlockType(value: unknown): StableBlockType | string {
  return normalizeProductionBlockType(value);
}

export function stableVariantForBlock(blockType: string, requested?: string): string {
  return getProductionSafeVariant(blockType, requested);
}

function normalizeSectionId(blockType: string, index: number, current?: string): string {
  const clean = String(current || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
  if (clean && clean !== 'undefined' && clean !== 'null') return clean;
  return `${blockType}_${String(index + 1).padStart(2, '0')}`;
}

function stableSectionContract(section: Partial<SectionRenderContract>, index: number): SectionRenderContract {
  const blockType = normalizeBlockType(section.blockType || (section as any).block_type || 'services_grid');
  const isCta = blockType === 'cta_panel' || blockType === 'urgency_panel';
  const isMap = blockType === 'map';
  const isFaq = blockType === 'faq';
  const sectionId = normalizeSectionId(blockType, index, section.sectionId);

  return {
    sectionId,
    blockType,
    variant: stableVariantForBlock(blockType, section.variant),
    shell: isCta || blockType === 'trust_band' ? 'band' : (isMap || isFaq || blockType === 'price_guidance' ? 'panel' : 'plain'),
    flow: isMap ? 'split' : (isFaq ? 'centered' : 'stack'),
    widthMode: isMap ? 'wide' : 'standard',
    emphasis: isCta ? 'cta' : (blockType === 'local_proof' || blockType === 'trust_band' ? 'trust' : 'content'),
    density: blockType === 'faq' ? 'compact' : 'standard',
    cardStyle: 'elevated',
    ornamentLevel: isCta ? 'soft' : 'none',
    sectionPattern: 'stable_production',
    eyebrow: section.eyebrow,
    mobilePattern: isFaq ? 'accordion' : 'stack',
    constraints: {
      maxColumnsDesktop: isMap || isFaq || isCta ? 1 : 3,
      maxColumnsTablet: isMap || isFaq || isCta ? 1 : 2,
      maxColumnsMobile: 1,
      textMeasure: isFaq ? 'narrow' : 'medium'
    }
  };
}

function orderedStableSections(sections: SectionRenderContract[]): SectionRenderContract[] {
  const byType = new Map<string, SectionRenderContract[]>();
  const unknown: SectionRenderContract[] = [];
  for (const section of sections) {
    const bt = normalizeBlockType(section.blockType);
    if (!KNOWN_BLOCK_TYPES.has(bt) || bt === 'authority_note') {
      unknown.push(section);
      continue;
    }
    if (!byType.has(bt)) byType.set(bt, []);
    byType.get(bt)!.push(section);
  }
  const ordered: SectionRenderContract[] = [];
  for (const blockType of STABLE_PRODUCTION_BLOCK_ORDER) {
    const bucket = byType.get(blockType) || [];
    ordered.push(...bucket);
  }
  for (const section of sections) {
    const bt = normalizeBlockType(section.blockType);
    if (!STABLE_PRODUCTION_BLOCK_ORDER.includes(bt as StableBlockType) && bt !== 'authority_note') {
      ordered.push(section);
    }
  }
  return ordered.filter((section, index, arr) => {
    const bt = normalizeBlockType(section.blockType);
    if (['map', 'price_guidance', 'faq', 'cta_panel', 'urgency_panel'].includes(bt)) {
      return arr.findIndex(other => normalizeBlockType(other.blockType) === bt) === index;
    }
    return true;
  });
}

export function enforceDeterministicResolvedRenderPlan(
  plan: ResolvedPageRenderPlan,
  options: DeterministicAiKernelOptions = {}
): ResolvedPageRenderPlan {
  if (!isDeterministicProductionEnabled(options)) return plan;

  const hero: HeroRenderContract = {
    ...plan.hero,
    template: 'centered',
    contentDisposition: 'center',
    ctaWeight: 'high',
    proofPlacement: 'below_headline',
    mediaMode: 'illustration',
    spacingProfile: 'balanced',
    mobileBehavior: 'content_first'
  };

  const sections = orderedStableSections((plan.sections || []).map((section, index) => stableSectionContract(section, index)));

  return {
    ...plan,
    visualSystem: {
      ...plan.visualSystem,
      family: 'local_trust',
      pageComposition: 'conversion',
      heroTreatment: 'centered',
      cadence: 'calm',
      contrastModel: 'balanced',
      spacingScale: 'balanced',
      surfaceStyle: 'tinted',
      cardTreatment: 'elevated',
      navbarTreatment: 'solid',
      footerTreatment: 'directory',
      ornamentPolicy: 'subtle',
      visualSystem: 'panelled',
      system: 'panelled'
    },
    hero,
    sections,
    outputFingerprintSeed: [...(plan.outputFingerprintSeed || []), 'deterministic-ai-kernel@1']
  };
}

export function enforceDeterministicPagePlan<T extends PagePlan>(plan: T, options: DeterministicAiKernelOptions = {}): T {
  if (!isDeterministicProductionEnabled(options)) return plan;
  const sections = Array.isArray((plan as any).sections) ? [...(plan as any).sections] : [];
  const normalizedSections = sections.map((section: any, index: number) => {
    const blockType = normalizeBlockType(section.block_type || section.blockType || section.type || 'services_grid');
    return {
      ...section,
      section_id: normalizeSectionId(blockType, index, section.section_id || section.id),
      block_type: blockType,
      visual_variant: stableVariantForBlock(blockType, section.visual_variant),
      layout_hint: blockType === 'map' ? 'split_feature' : (blockType === 'faq' ? 'minimal_centered' : 'boxed_content'),
      content_density: blockType === 'faq' ? 'compact' : 'standard'
    };
  });

  const ordered = orderedStableSections(normalizedSections.map((section: any, index: number) => stableSectionContract({
    sectionId: section.section_id,
    blockType: section.block_type,
    variant: section.visual_variant
  } as any, index))).map((contract) => {
    const original = normalizedSections.find((section: any) => section.section_id === contract.sectionId) || {};
    return { ...original, section_id: contract.sectionId, block_type: contract.blockType, visual_variant: contract.variant };
  });

  return {
    ...(plan as any),
    sections: ordered,
    deterministic_ai_kernel: {
      schemaVersion: 'deterministic-ai-kernel@1',
      mode: 'production-safe',
      principle: 'deterministic structure, AI-controlled content variation, stable visual variants for delivery',
      stableBlockOrder: STABLE_PRODUCTION_BLOCK_ORDER,
      stableVariants: STABLE_PRODUCTION_VARIANTS,
      productionSafeMode: productionSafeModeSummary()
    }
  } as T;
}
