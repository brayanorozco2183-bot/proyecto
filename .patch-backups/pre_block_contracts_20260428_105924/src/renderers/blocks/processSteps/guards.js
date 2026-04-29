import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { ProcessStepsPayloadSchema, PROCESSSTEPSVARIANTS } from './schema.js';
export function isProcessStepsPayload(value) {
    return ProcessStepsPayloadSchema.safeParse(value).success;
}
export function assertProcessStepsPayload(value) {
    return ProcessStepsPayloadSchema.parse(value);
}
export function resolveProcessStepsVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.process_steps;
    const allowed = (spec.allowedVisualVariants || PROCESSSTEPSVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'timeline_vertical');
    return resolved;
}
export function normalizeProcessStepsPayload(value) {
    const spec = BLOCK_VISUAL_SPECS.process_steps;
    const payload = assertProcessStepsPayload(value);
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
            visual_variant: resolveProcessStepsVariant(payload.section.visual_variant)
        }
    };
}
export function supportsProcessStepsPayload(blockType) {
    return blockType === 'process_steps';
}
