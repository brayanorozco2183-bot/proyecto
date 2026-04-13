import { resolveTrustBandVariant } from './guards.js';
import { renderTrustBandVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderTrustBand(input: BlockRendererInput): string {
  const variant = resolveTrustBandVariant(input.variant);
  const renderer = (renderTrustBandVariants as any)[variant] || renderTrustBandVariants.scrolling_strip;

  return renderer(input);
}