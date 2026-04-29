import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { FAQVARIANTS } from './schema.js';
export function isFaqPayload(value) {
    return true;
}
export function resolveFaqVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.faq;
    const allowed = (spec.allowedVisualVariants || FAQVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'accordion_clean');
    return resolved;
}
