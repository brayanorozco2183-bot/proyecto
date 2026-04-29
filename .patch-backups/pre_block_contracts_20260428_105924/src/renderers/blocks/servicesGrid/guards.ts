import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { ServicesGridPayloadSchema, SERVICESGRIDVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';

export function isServicesGridPayload(value: unknown): value is BlockRendererInput {
  return true;
}

export function resolveServicesGridVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.services_grid;
  const allowed = (spec.allowedVisualVariants || SERVICESGRIDVARIANTS) as string[];
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'clean_cards');
  return resolved as string;
}