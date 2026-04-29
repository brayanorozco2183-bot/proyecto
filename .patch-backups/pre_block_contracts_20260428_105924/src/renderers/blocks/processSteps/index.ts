import { ProcessStepsPayloadSchema } from './schema.js';
import { isProcessStepsPayload } from './guards.js';
import { renderProcessSteps } from './render.js';

export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';

export const processStepsBlock = {
  blockType: 'process_steps',
  schema: ProcessStepsPayloadSchema,
  is: isProcessStepsPayload,
  render: renderProcessSteps
};