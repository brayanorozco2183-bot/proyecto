import { resolveComparisonTableVariant } from './guards.js';
import { renderComparisonTableVariants } from './variants.js';
export function renderComparisonTable(input) {
    const variant = resolveComparisonTableVariant(input.variant);
    const renderer = renderComparisonTableVariants[variant] || renderComparisonTableVariants.matrix_clean;
    return renderer(input);
}
