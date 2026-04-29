import { resolveCtaPanelVariant } from './guards.js';
import { renderCtaPanelVariants } from './variants.js';
export function renderCtaPanel(input) {
    const variant = resolveCtaPanelVariant(input.variant);
    const renderer = renderCtaPanelVariants[variant] || renderCtaPanelVariants.luxury_banner;
    return renderer(input);
}
