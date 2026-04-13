import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { PriceGuidancePayloadSchema, PRICEGUIDANCEVARIANTS, type PriceGuidancePayload, type PriceGuidanceVariant } from './schema.js';

export function isPriceGuidancePayload(value: unknown): value is PriceGuidancePayload {
  return PriceGuidancePayloadSchema.safeParse(value).success;
}

export function assertPriceGuidancePayload(value: unknown): PriceGuidancePayload {
  return PriceGuidancePayloadSchema.parse(value);
}

export function resolvePriceGuidanceVariant(input?: string): PriceGuidanceVariant {
  const spec = BLOCK_VISUAL_SPECS.price_guidance;
  const allowed = ((spec.allowedVisualVariants || PRICEGUIDANCEVARIANTS) as readonly string[]);
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'table_simple');
  return resolved as PriceGuidanceVariant;
}

export function normalizePriceGuidancePayload(value: unknown): PriceGuidancePayload {
  const spec = BLOCK_VISUAL_SPECS.price_guidance;
  const payload = assertPriceGuidancePayload(value);

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
      visual_variant: resolvePriceGuidanceVariant(payload.section.visual_variant)
    }
  };
}

export function supportsPriceGuidancePayload(blockType?: string): boolean {
  return blockType === 'price_guidance';
}