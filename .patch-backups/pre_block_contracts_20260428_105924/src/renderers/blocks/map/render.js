import { resolveMapVariant } from './guards.js';
import { renderMapVariants } from './variants.js';
export function renderMap(input) {
    const variant = resolveMapVariant(input.variant);
    const renderer = renderMapVariants[variant] || renderMapVariants.full_width;
    return renderer(input);
}
