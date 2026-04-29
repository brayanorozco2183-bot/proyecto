import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { MAPVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';
import { BlockRendererInputSchema } from '../contracts.js';

export function isMapPayload(value: unknown): value is BlockRendererInput {
  return BlockRendererInputSchema.safeParse(value).success;
}

export function resolveMapVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.map;
  const allowed = (spec.allowedVisualVariants || MAPVARIANTS) as string[];
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'full_width');
  return resolved as string;
}