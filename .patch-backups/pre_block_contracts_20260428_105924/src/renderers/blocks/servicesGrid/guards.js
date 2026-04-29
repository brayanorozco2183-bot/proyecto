import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { SERVICESGRIDVARIANTS } from './schema.js';
export function isServicesGridPayload(value) {
    return true;
}
export function resolveServicesGridVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.services_grid;
    const allowed = (spec.allowedVisualVariants || SERVICESGRIDVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'clean_cards');
    return resolved;
}
