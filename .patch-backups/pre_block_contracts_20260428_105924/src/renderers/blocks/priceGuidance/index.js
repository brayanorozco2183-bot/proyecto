import { PriceGuidancePayloadSchema } from './schema.js';
import { isPriceGuidancePayload } from './guards.js';
import { renderPriceGuidance } from './render.js';
export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';
export const priceGuidanceBlock = {
    blockType: 'price_guidance',
    schema: PriceGuidancePayloadSchema,
    is: isPriceGuidancePayload,
    render: renderPriceGuidance
};
