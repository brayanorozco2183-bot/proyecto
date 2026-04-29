import { resolveHeroVariant } from './guards.js';
import { renderHeroVariants } from './variants.js';
export function renderHero(input) {
    const variant = resolveHeroVariant(input.variant);
    const renderer = renderHeroVariants[variant] || renderHeroVariants.split_premium;
    return renderer(input);
}
