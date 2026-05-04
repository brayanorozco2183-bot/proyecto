import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { CTAPANELVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isCtaPanelPayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveCtaPanelVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.cta_panel;
  const allowed = (spec.allowedVisualVariants || CTAPANELVARIANTS) as string[];
  const resolved = resolveProductionStableVariant('cta_panel', input, allowed, spec.defaultVisualVariant || 'luxury_banner');
  return resolved as string;
}