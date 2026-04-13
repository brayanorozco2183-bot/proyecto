import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { CTAPANELVARIANTS } from './schema.js';
import type { BlockRendererInput } from '../types.js';

export function isCtaPanelPayload(value: unknown): value is BlockRendererInput {
  return true;
}

export function resolveCtaPanelVariant(input?: string): string {
  const spec = BLOCK_VISUAL_SPECS.cta_panel;
  const allowed = (spec.allowedVisualVariants || CTAPANELVARIANTS) as string[];
  const resolved = allowed.includes(input || '')
    ? input
    : (spec.defaultVisualVariant || 'luxury_banner');
  return resolved as string;
}