import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { TRUSTBANDVARIANTS } from './schema.js';
export function isTrustBandPayload(value) {
    return true;
}
export function resolveTrustBandVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.trust_band;
    const allowed = (spec.allowedVisualVariants || TRUSTBANDVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'scrolling_strip');
    return resolved;
}
