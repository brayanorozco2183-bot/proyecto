import { resolveUrgencyPanelVariant } from './guards.js';
import { renderUrgencyPanelVariants } from './variants.js';
export function renderUrgencyPanel(input) {
    const variant = resolveUrgencyPanelVariant(input.variant);
    const renderer = renderUrgencyPanelVariants[variant] || renderUrgencyPanelVariants.sidebar_alert;
    return renderer(input);
}
