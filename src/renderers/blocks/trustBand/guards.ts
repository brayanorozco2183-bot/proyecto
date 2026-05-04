import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { TRUSTBANDVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isTrustBandPayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveTrustBandVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.trust_band;
  const allowed = (spec.allowedVisualVariants || TRUSTBANDVARIANTS) as string[];
  const resolved = resolveProductionStableVariant('trust_band', input, allowed, spec.defaultVisualVariant || 'signal_grid');
  return resolved as string;
}