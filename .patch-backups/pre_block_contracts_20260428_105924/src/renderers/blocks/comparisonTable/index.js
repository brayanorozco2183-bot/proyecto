import { ComparisonTablePayloadSchema } from './schema.js';
import { isComparisonTablePayload } from './guards.js';
import { renderComparisonTable } from './render.js';
export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';
export const comparisonTableBlock = {
    blockType: 'comparison_table',
    schema: ComparisonTablePayloadSchema,
    is: isComparisonTablePayload,
    render: renderComparisonTable
};
