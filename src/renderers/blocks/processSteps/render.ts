import { resolveProcessStepsVariant } from './guards.js';
import { renderProcessStepsVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderProcessSteps(input: BlockRendererInput): string {
  const variant = resolveProcessStepsVariant(input.variant);
  const renderer = renderProcessStepsVariants[variant] || renderProcessStepsVariants.timeline_vertical;

  return renderer(input);
}