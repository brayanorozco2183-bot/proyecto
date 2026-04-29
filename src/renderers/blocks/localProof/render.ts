import { resolveLocalProofVariant } from './guards.js';
import { renderLocalProofVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderLocalProof(input: BlockRendererInput): string {
  const variant = resolveLocalProofVariant(input.variant);
  const renderer = renderLocalProofVariants[variant] || renderLocalProofVariants.coverage_split;

  return renderer(input);
}