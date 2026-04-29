import { ServicesGridPayloadSchema } from './schema.js';
import { isServicesGridPayload } from './guards.js';
import { renderServicesGrid } from './render.js';

export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';

export const servicesGridBlock = {
  blockType: 'services_grid',
  schema: ServicesGridPayloadSchema,
  is: isServicesGridPayload,
  render: renderServicesGrid
};