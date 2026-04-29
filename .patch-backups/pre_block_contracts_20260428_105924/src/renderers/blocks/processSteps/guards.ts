import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { ProcessStepsPayloadSchema, PROCESSSTEPSVARIANTS, type ProcessStepsPayload, type ProcessStepsVariant } from './schema.js';

export function isProcessStepsPayload(value: unknown): value is ProcessStepsPayload {
  return ProcessStepsPayloadSchema.safeParse(value).success;
}

export function assertProcessStepsPayload(value: unknown): ProcessStepsPayload {
  return ProcessStepsPayloadSchema.parse(value);
}

export function resolveProcessStepsVariant(input?: string): ProcessStepsVariant {
  const spec = BLOCK_VISUAL_SPECS.process_steps;
  const allowed = ((spec.allowedVisualVariants || PROCESSSTEPSVARIANTS) as readonly string[]);
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'timeline_vertical');
  return resolved as ProcessStepsVariant;
}

export function normalizeProcessStepsPayload(value: unknown): ProcessStepsPayload {
  const spec = BLOCK_VISUAL_SPECS.process_steps;
  const payload = assertProcessStepsPayload(value);

  return {
    ...payload,
    section: {
      ...payload.section,
      preferred_format: spec.allowedFormats.includes(payload.section.preferred_format as any)
        ? payload.section.preferred_format
        : spec.defaultFormat,
      layout_hint: spec.allowedLayouts.includes(payload.section.layout_hint as any)
        ? payload.section.layout_hint
        : spec.defaultLayout,
      content_density: payload.section.content_density || spec.densityBias,
      visual_variant: resolveProcessStepsVariant(payload.section.visual_variant)
    }
  };
}

export function supportsProcessStepsPayload(blockType?: string): boolean {
  return blockType === 'process_steps';
}