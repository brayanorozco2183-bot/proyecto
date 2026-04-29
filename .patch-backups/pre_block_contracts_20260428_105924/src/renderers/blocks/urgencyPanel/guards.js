import { BLOCK_VISUAL_SPECS } from '../../../config/blockVisualSpecs.js';
import { URGENCYPANELVARIANTS, UrgencyPanelPayloadSchema } from './schema.js';
export function isUrgencyPanelPayload(value) {
    return UrgencyPanelPayloadSchema.safeParse(value).success;
}
export function resolveUrgencyPanelVariant(input) {
    const spec = BLOCK_VISUAL_SPECS.urgency_panel;
    const allowed = (spec.allowedVisualVariants || URGENCYPANELVARIANTS);
    const resolved = allowed.includes(input || '')
        ? input
        : (spec.defaultVisualVariant || 'sidebar_alert');
    return resolved;
}
