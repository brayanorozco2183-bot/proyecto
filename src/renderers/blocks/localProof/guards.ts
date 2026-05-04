import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { LOCALPROOFVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isLocalProofPayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveLocalProofVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.local_proof;
  const allowed = (spec.allowedVisualVariants || LOCALPROOFVARIANTS) as string[];
  const resolved = resolveProductionStableVariant('local_proof', input, allowed, spec.defaultVisualVariant || 'coverage_split');
  return resolved as string;
}