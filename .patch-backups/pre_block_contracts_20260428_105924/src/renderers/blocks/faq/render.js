import { resolveFaqVariant } from './guards.js';
import { renderFaqVariants } from './variants.js';
export function renderFaq(input) {
    const variant = resolveFaqVariant(input.variant);
    const renderer = renderFaqVariants[variant] || renderFaqVariants.accordion_clean;
    return renderer(input);
}
