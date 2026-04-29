import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { CTAPANELVARIANTS } from './schema.js';
export function isCtaPanelPayload(value) {
    return true;
}
export function resolveCtaPanelVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.cta_panel;
    const allowed = (spec.allowedVisualVariants || CTAPANELVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'luxury_banner');
    return resolved;
}
