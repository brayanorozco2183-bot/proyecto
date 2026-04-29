import { resolveLocalProofVariant } from './guards.js';
import { renderLocalProofVariants } from './variants.js';
export function renderLocalProof(input) {
    const variant = resolveLocalProofVariant(input.variant);
    const renderer = renderLocalProofVariants[variant] || renderLocalProofVariants.grid_logos;
    return renderer(input);
}
