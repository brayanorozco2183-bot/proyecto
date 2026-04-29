import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { TRUSTBANDVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';

export function isTrustBandPayload(value: unknown): value is BlockRendererInput {
  return true;
}

export function resolveTrustBandVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.trust_band;
  const allowed = (spec.allowedVisualVariants || TRUSTBANDVARIANTS) as string[];
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'signal_grid');
  return resolved as string;
}