import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { COMPARISONTABLEVARIANTS } from './schema.js';
export function isComparisonTablePayload(value) {
    return true;
}
export function resolveComparisonTableVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.comparison_table;
    const allowed = (spec.allowedVisualVariants || COMPARISONTABLEVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'matrix_clean');
    return resolved;
}
