import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { LOCALPROOFVARIANTS } from './schema.js';
export function isLocalProofPayload(value) {
    return true;
}
export function resolveLocalProofVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.local_proof;
    const allowed = (spec.allowedVisualVariants || LOCALPROOFVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'grid_logos');
    return resolved;
}
