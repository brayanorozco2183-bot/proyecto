import { FaqPayloadSchema } from './schema.js';
import { isFaqPayload } from './guards.js';
import { renderFaq } from './render.js';

export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';

export const faqBlock = {
  blockType: 'faq',
  schema: FaqPayloadSchema,
  is: isFaqPayload,
  render: renderFaq
};