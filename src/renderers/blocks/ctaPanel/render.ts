import { resolveCtaPanelVariant } from './guards.js';
import { renderCtaPanelVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderCtaPanel(input: BlockRendererInput): string {
  const variant = resolveCtaPanelVariant(input.variant);
  const renderer = (renderCtaPanelVariants as any)[variant] || renderCtaPanelVariants.luxury_banner;

  return renderer(input);
}