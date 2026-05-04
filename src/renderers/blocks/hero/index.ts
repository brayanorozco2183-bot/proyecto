import { HeroPayloadSchema } from './schema.js';
import { isHeroPayload } from './guards.js';
import { renderHero } from './render.js';

export * from './schema.js';
export * from './guards.js';
export * from './variants.js';
export * from './render.js';

export const heroBlock = {
  blockType: 'hero_trust',
  schema: HeroPayloadSchema,
  is: isHeroPayload,
  render: renderHero
};