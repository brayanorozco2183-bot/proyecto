import {
  PRODUCTION_SAFE_VARIANTS,
  isProductionSafeModeEnabled,
  resolveProductionSafeVariant,
  type ProductionSafeBlockType
} from '../../config/productionSafeMode.js';

/**
 * Stable renderer variant resolver for large-scale production runs.
 *
 * Kept as the renderer-facing compatibility layer. The actual safe-mode policy
 * lives in src/config/productionSafeMode.ts so planning, rendering and audits use
 * a single source of truth.
 */
export type ProductionBlockType = Exclude<ProductionSafeBlockType, 'internal_linking'>;

export const STABLE_VARIANTS: Record<ProductionBlockType, string> = {
  hero_trust: PRODUCTION_SAFE_VARIANTS.hero_trust,
  services_grid: PRODUCTION_SAFE_VARIANTS.services_grid,
  urgency_panel: PRODUCTION_SAFE_VARIANTS.urgency_panel,
  local_proof: PRODUCTION_SAFE_VARIANTS.local_proof,
  faq: PRODUCTION_SAFE_VARIANTS.faq,
  cta_panel: PRODUCTION_SAFE_VARIANTS.cta_panel,
  price_guidance: PRODUCTION_SAFE_VARIANTS.price_guidance,
  process_steps: PRODUCTION_SAFE_VARIANTS.process_steps,
  trust_band: PRODUCTION_SAFE_VARIANTS.trust_band,
  map: PRODUCTION_SAFE_VARIANTS.map,
  comparison_table: PRODUCTION_SAFE_VARIANTS.comparison_table
};

export function shouldUseProductionStableVariants(): boolean {
  return isProductionSafeModeEnabled();
}

export function resolveProductionStableVariant(
  blockType: ProductionBlockType,
  input: string | undefined,
  allowed: readonly string[],
  fallback: string
): string {
  return resolveProductionSafeVariant(blockType, input, allowed, fallback);
}
