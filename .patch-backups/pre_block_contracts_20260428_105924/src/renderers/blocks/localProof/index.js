import { LocalProofPayloadSchema } from './schema.js';
import { isLocalProofPayload } from './guards.js';
import { renderLocalProof } from './render.js';
export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';
export const localProofBlock = {
    blockType: 'local_proof',
    schema: LocalProofPayloadSchema,
    is: isLocalProofPayload,
    render: renderLocalProof
};
