import { resolveTrustBandVariant } from './guards.js';
import { renderTrustBandVariants } from './variants.js';
export function renderTrustBand(input) {
    const variant = resolveTrustBandVariant(input.variant);
    const renderer = renderTrustBandVariants[variant] || renderTrustBandVariants.scrolling_strip;
    return renderer(input);
}
