import { resolvePriceGuidanceVariant } from './guards.js';
import { renderPriceGuidanceVariants } from './variants.js';
export function renderPriceGuidance(input) {
    const variant = resolvePriceGuidanceVariant(input.variant);
    const renderer = renderPriceGuidanceVariants[variant] || renderPriceGuidanceVariants.table_simple;
    return renderer(input);
}
