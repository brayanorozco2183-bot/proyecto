import { resolveUrgencyPanelVariant } from './guards.js';
import { renderUrgencyPanelVariants } from './variants.js';
import type { BlockRendererInput } from '../types.js';

export function renderUrgencyPanel(input: BlockRendererInput): string {
  const variant = resolveUrgencyPanelVariant(input.variant);
  const renderer = renderUrgencyPanelVariants[variant] || renderUrgencyPanelVariants.sidebar_alert;
  return renderer(input);
}
