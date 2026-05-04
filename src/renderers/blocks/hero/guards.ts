import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { HEROVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isHeroPayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveHeroVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.hero_trust;
  const allowed = (spec.allowedVisualVariants || HEROVARIANTS) as string[];
  const resolved = resolveProductionStableVariant('hero_trust', input, allowed, spec.defaultVisualVariant || 'split_premium');
  return resolved as string;
}