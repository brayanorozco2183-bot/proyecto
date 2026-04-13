import { resolveLocalProofVariant } from './guards.js';
import { renderLocalProofVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderLocalProof(input: BlockRendererInput): string {
  const variant = resolveLocalProofVariant(input.variant);
  const renderer = (renderLocalProofVariants as any)[variant] || renderLocalProofVariants.grid_logos;

  return renderer(input);
}