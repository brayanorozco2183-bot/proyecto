import { resolvePriceGuidanceVariant } from './guards.js';
import { renderPriceGuidanceVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderPriceGuidance(input: BlockRendererInput): string {
  const variant = resolvePriceGuidanceVariant(input.variant);
  const renderer = renderPriceGuidanceVariants[variant as any] || renderPriceGuidanceVariants.table_simple;

  return renderer(input);
}