import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { HEROVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';

export function isHeroPayload(value: unknown): value is BlockRendererInput {
  return true;
}

export function resolveHeroVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.hero_trust;
  const allowed = (spec.allowedVisualVariants || HEROVARIANTS) as string[];
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'split_premium');
  return resolved as string;
}