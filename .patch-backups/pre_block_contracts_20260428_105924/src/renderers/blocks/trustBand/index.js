import { TrustBandPayloadSchema } from './schema.js';
import { isTrustBandPayload } from './guards.js';
import { renderTrustBand } from './render.js';
export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';
export const trustBandBlock = {
    blockType: 'trust_band',
    schema: TrustBandPayloadSchema,
    is: isTrustBandPayload,
    render: renderTrustBand
};
