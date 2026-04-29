import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { HEROVARIANTS } from './schema.js';
export function isHeroPayload(value) {
    return true;
}
export function resolveHeroVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.hero_trust;
    const allowed = (spec.allowedVisualVariants || HEROVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'split_premium');
    return resolved;
}
