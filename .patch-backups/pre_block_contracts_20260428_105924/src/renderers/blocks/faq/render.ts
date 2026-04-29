import { resolveFaqVariant } from './guards.js';
import { renderFaqVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderFaq(input: BlockRendererInput): string {
  const variant = resolveFaqVariant(input.variant);
  const renderer = (renderFaqVariants as any)[variant] || renderFaqVariants.accordion_clean;

  return renderer(input);
}