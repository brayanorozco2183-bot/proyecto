import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { COMPARISONTABLEVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isComparisonTablePayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveComparisonTableVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.comparison_table;
  const allowed = (spec.allowedVisualVariants || COMPARISONTABLEVARIANTS) as string[];
  const resolved = resolveProductionStableVariant('comparison_table', input, allowed, spec.defaultVisualVariant || 'matrix_clean');
  return resolved as string;
}