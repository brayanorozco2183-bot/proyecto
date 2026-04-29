import { resolveMapVariant } from './guards.js';
import { renderMapVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderMap(input: BlockRendererInput): string {
  const variant = resolveMapVariant(input.variant);
  const renderer = (renderMapVariants as any)[variant] || renderMapVariants.full_width;

  return renderer(input);
}