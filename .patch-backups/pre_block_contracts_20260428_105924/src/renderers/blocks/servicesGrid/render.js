import { resolveServicesGridVariant } from './guards.js';
import { renderServicesGridVariants } from './variants.js';
export function renderServicesGrid(input) {
    const variant = resolveServicesGridVariant(input.variant);
    const renderer = renderServicesGridVariants[variant] || renderServicesGridVariants.clean_cards;
    return renderer(input);
}
