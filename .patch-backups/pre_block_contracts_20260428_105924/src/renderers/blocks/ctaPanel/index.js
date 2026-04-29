import { CtaPanelPayloadSchema } from './schema.js';
import { isCtaPanelPayload } from './guards.js';
import { renderCtaPanel } from './render.js';
export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';
export const ctaPanelBlock = {
    blockType: 'cta_panel',
    schema: CtaPanelPayloadSchema,
    is: isCtaPanelPayload,
    render: renderCtaPanel
};
