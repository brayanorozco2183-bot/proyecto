/**
 * Gravity Production Safe Mode
 *
 * Surgical delivery stabilizer: keeps the existing pipeline intact while forcing
 * only mature, low-risk block variants for production delivery.
 *
 * The goal is not maximum visual diversity; it is predictable, publishable output.
 */

export type ProductionSafeBlockType =
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

export const PRODUCTION_SAFE_MODE_VERSION = 'production-safe-mode@1';

export const PRODUCTION_SAFE_BLOCK_ORDER: ProductionSafeBlockType[] = [
  'urgency_panel',
  'services_grid',
  'process_steps',
  'local_proof',
  'map',
  'price_guidance',
  'faq',
  'cta_panel',
  'internal_linking'
];

/**
 * Variants selected for immediate delivery stability.
 *
 * Intentionally avoids variants that previously produced compressed grids,
 * oversized panels, floating CTAs, weak map compositions or rail/magazine layouts
 * that depend on fragile CSS combinations.
 */
export const PRODUCTION_SAFE_VARIANTS: Record<ProductionSafeBlockType, string> = {
  hero_trust: 'centered_clean',
  urgency_panel: 'status_banner',
  services_grid: 'clean_cards',
  process_steps: 'numbered_list',
  local_proof: 'cards_minimal',
  map: 'boxed_with_text',
  price_guidance: 'cards_price',
  faq: 'accordion_clean',
  cta_panel: 'minimal_phone_bar',
  trust_band: 'static_pills',
  comparison_table: 'matrix_clean',
  internal_linking: 'default'
};

export const PRODUCTION_UNSAFE_VARIANTS: Record<string, string[]> = {
  hero_trust: ['stacked_dark'],
  urgency_panel: ['command_center'],
  services_grid: ['magazine_panels', 'editorial_columns'],
  process_steps: ['stepped_rail'],
  local_proof: ['coverage_split', 'evidence_stack', 'grid_logos'],
  map: ['context_frame', 'spotlight_card', 'full_width'],
  price_guidance: ['insight_panels', 'table_simple'],
  cta_panel: ['consultation_split'],
  trust_band: ['signal_grid', 'scrolling_strip'],
  faq: ['editorial_list'],
  comparison_table: ['matrix_bold']
};

export function readEnv(name: string): string {
  return String(((globalThis as any)?.process?.env || {})[name] || '').trim();
}

export function envFlag(name: string, defaultValue = false): boolean {
  const raw = readEnv(name).toLowerCase();
  if (!raw) return defaultValue;
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(raw);
}

export function isProductionSafeModeEnabled(): boolean {
  if (envFlag('GRAVITY_DISABLE_PRODUCTION_SAFE_MODE')) return false;
  if (envFlag('GRAVITY_PRODUCTION_SAFE_MODE')) return true;
  if (envFlag('GRAVITY_DETERMINISTIC_AI_KERNEL')) return true;
  if (envFlag('GRAVITY_PRODUCTION_VISUAL_STABILITY', true)) return true;
  return readEnv('NODE_ENV').toLowerCase() === 'production';
}

export function normalizeProductionBlockType(value: unknown): ProductionSafeBlockType | string {
  const raw = String(value || '').trim().toLowerCase().replace(/-/g, '_');
  if (!raw) return 'services_grid';
  if (raw === 'hero' || raw === 'hero_block') return 'hero_trust';
  if (raw === 'services' || raw === 'service_grid') return 'services_grid';
  if (raw === 'steps' || raw === 'process') return 'process_steps';
  if (raw === 'localproof' || raw === 'local_proofs') return 'local_proof';
  if (raw === 'google_map' || raw === 'location_map') return 'map';
  if (raw === 'trust_strip' || raw === 'trust') return 'trust_band';
  if (raw === 'cta' || raw === 'contact_panel') return 'cta_panel';
  if (raw === 'faqs') return 'faq';
  return raw;
}

export function getProductionSafeVariant(blockType: string, requested?: string): string {
  const normalized = normalizeProductionBlockType(blockType) as ProductionSafeBlockType;
  const safe = PRODUCTION_SAFE_VARIANTS[normalized];
  if (isProductionSafeModeEnabled() && safe) return safe;
  return requested || safe || 'default';
}

export function resolveProductionSafeVariant(
  blockType: string,
  input: string | undefined,
  allowed: readonly string[],
  fallback: string
): string {
  const normalized = normalizeProductionBlockType(blockType) as ProductionSafeBlockType;
  const safe = PRODUCTION_SAFE_VARIANTS[normalized] || fallback;

  if (isProductionSafeModeEnabled()) {
    if (allowed.includes(safe)) return safe;
    if (allowed.includes(fallback)) return fallback;
    return allowed[0] || fallback;
  }

  if (input && allowed.includes(input)) return input;
  if (allowed.includes(fallback)) return fallback;
  return allowed[0] || fallback;
}

export function productionSafeModeSummary(): Record<string, unknown> {
  return {
    schemaVersion: PRODUCTION_SAFE_MODE_VERSION,
    enabled: isProductionSafeModeEnabled(),
    principle: 'publishable stable layouts over experimental visual variety',
    blockOrder: PRODUCTION_SAFE_BLOCK_ORDER,
    safeVariants: PRODUCTION_SAFE_VARIANTS,
    unsafeVariants: PRODUCTION_UNSAFE_VARIANTS
  };
}
