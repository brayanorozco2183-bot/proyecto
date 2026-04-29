import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { PriceGuidancePayloadSchema, PRICEGUIDANCEVARIANTS } from './schema.js';
export function isPriceGuidancePayload(value) {
    return PriceGuidancePayloadSchema.safeParse(value).success;
}
export function assertPriceGuidancePayload(value) {
    return PriceGuidancePayloadSchema.parse(value);
}
export function resolvePriceGuidanceVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.price_guidance;
    const allowed = (spec.allowedVisualVariants || PRICEGUIDANCEVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'table_simple');
    return resolved;
}
export function normalizePriceGuidancePayload(value) {
    const spec = BLOCK_VISUAL_SPECS.price_guidance;
    const payload = assertPriceGuidancePayload(value);
    return {
        ...payload,
        section: {
            ...payload.section,
            preferred_format: spec.allowedFormats.includes(payload.section.preferred_format)
                ? payload.section.preferred_format
                : spec.defaultFormat,
            layout_hint: spec.allowedLayouts.includes(payload.section.layout_hint)
                ? payload.section.layout_hint
                : spec.defaultLayout,
            content_density: payload.section.content_density || spec.densityBias,
            visual_variant: resolvePriceGuidanceVariant(payload.section.visual_variant)
        }
    };
}
export function supportsPriceGuidancePayload(blockType) {
    return blockType === 'price_guidance';
}
