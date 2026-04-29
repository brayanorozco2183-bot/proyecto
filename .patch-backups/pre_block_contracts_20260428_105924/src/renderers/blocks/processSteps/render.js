import { resolveProcessStepsVariant } from './guards.js';
import { renderProcessStepsVariants } from './variants.js';
export function renderProcessSteps(input) {
    const variant = resolveProcessStepsVariant(input.variant);
    const renderer = renderProcessStepsVariants[variant] || renderProcessStepsVariants.timeline_vertical;
    return renderer(input);
}
