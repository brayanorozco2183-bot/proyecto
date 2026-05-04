import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { URGENCYPANELVARIANTS, type UrgencyPanelVariant, UrgencyPanelPayloadSchema, type UrgencyPanelPayload } from './schema.js';
import { resolveProductionStableVariant } from '../productionVariants.js';

export function isUrgencyPanelPayload(value: unknown): value is UrgencyPanelPayload {
  return UrgencyPanelPayloadSchema.safeParse(value).success;
}

export function resolveUrgencyPanelVariant(input?: string): UrgencyPanelVariant {
  const spec = BLOCK_VISUAL_SPECS.urgency_panel;
  const allowed = ((spec.allowedVisualVariants || URGENCYPANELVARIANTS) as readonly string[]);
  const resolved = resolveProductionStableVariant('urgency_panel', input, allowed, spec.defaultVisualVariant || 'sidebar_alert');
  return resolved as UrgencyPanelVariant;
}
