import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { MAPVARIANTS } from './schema.js';
export function isMapPayload(value) {
    return true;
}
export function resolveMapVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.map;
    const allowed = (spec.allowedVisualVariants || MAPVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'full_width');
    return resolved;
}
