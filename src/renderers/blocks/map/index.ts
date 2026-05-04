import { MapPayloadSchema } from './schema.js';
import { isMapPayload } from './guards.js';
import { renderMap } from './render.js';

export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';

export const mapBlock = {
  blockType: 'map',
  schema: MapPayloadSchema,
  is: isMapPayload,
  render: renderMap
};