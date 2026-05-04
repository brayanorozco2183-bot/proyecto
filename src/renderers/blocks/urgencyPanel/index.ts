import { UrgencyPanelPayloadSchema } from './schema.js';
import { isUrgencyPanelPayload } from './guards.js';
import { renderUrgencyPanel } from './render.js';

export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';

export const urgencyPanelBlock = {
  blockType: 'urgency_panel',
  schema: UrgencyPanelPayloadSchema,
  is: isUrgencyPanelPayload,
  render: renderUrgencyPanel
};
