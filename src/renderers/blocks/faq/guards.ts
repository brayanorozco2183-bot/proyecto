import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { FAQVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isFaqPayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveFaqVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.faq;
  const allowed = (spec.allowedVisualVariants || FAQVARIANTS) as string[];
  const resolved = resolveProductionStableVariant('faq', input, allowed, spec.defaultVisualVariant || 'accordion_clean');
  return resolved as string;
}