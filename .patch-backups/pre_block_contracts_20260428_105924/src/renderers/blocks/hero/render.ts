import { resolveHeroVariant } from './guards.js';
import { renderHeroVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderHero(input: BlockRendererInput): string {
  const variant = resolveHeroVariant(input.variant);
  const renderer = renderHeroVariants[variant as any] || renderHeroVariants.split_premium;

  return renderer(input);
}