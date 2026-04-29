import { resolveComparisonTableVariant } from './guards.js';
import { renderComparisonTableVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderComparisonTable(input: BlockRendererInput): string {
  const variant = resolveComparisonTableVariant(input.variant);
  const renderer = renderComparisonTableVariants[variant] || renderComparisonTableVariants.matrix_clean;

  return renderer(input);
}