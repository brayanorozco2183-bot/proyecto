import { resolveServicesGridVariant } from './guards.js';
import { renderServicesGridVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderServicesGrid(input: BlockRendererInput): string {
  const variant = resolveServicesGridVariant(input.variant);
  const renderer = renderServicesGridVariants[variant] || renderServicesGridVariants.clean_cards;

  return renderer(input);
}