import type { BlockRendererInput } from './types.js';
import { heroBlock } from './hero/index.js';
import { servicesGridBlock } from './servicesGrid/index.js';
import { localProofBlock } from './localProof/index.js';
import { urgencyPanelBlock } from './urgencyPanel/index.js';
import { trustBandBlock } from './trustBand/index.js';
import { processStepsBlock } from './processSteps/index.js';
import { priceGuidanceBlock } from './priceGuidance/index.js';
import { faqBlock } from './faq/index.js';
import { ctaPanelBlock } from './ctaPanel/index.js';
import { comparisonTableBlock } from './comparisonTable/index.js';
import { mapBlock } from './map/index.js';
import { renderInternalLinkingBlock } from './shared/internalLinking.js';
import { normalizeBlockRendererInput } from './contracts.js';

export * from './types.js';
export * from './shared.js';
export * from './contracts.js';

export * from './hero/index.js';
export * from './servicesGrid/index.js';
export * from './localProof/index.js';
export * from './urgencyPanel/index.js';
export * from './trustBand/index.js';
export * from './processSteps/index.js';
export * from './priceGuidance/index.js';
export * from './faq/index.js';
export * from './ctaPanel/index.js';
export * from './comparisonTable/index.js';
export * from './map/index.js';

export const blockRegistry = {
  hero_trust: heroBlock.render,
  services_grid: servicesGridBlock.render,
  urgency_panel: urgencyPanelBlock.render,
  local_proof: localProofBlock.render,
  faq: faqBlock.render,
  cta_panel: ctaPanelBlock.render,
  process_steps: processStepsBlock.render,
  trust_band: trustBandBlock.render,
  price_guidance: priceGuidanceBlock.render,
  comparison_table: comparisonTableBlock.render,
  map: mapBlock.render,
  authority_note: (input: BlockRendererInput) => input.content.html || '',
  internal_linking: (input: BlockRendererInput) =>
    renderInternalLinkingBlock(
      input,
      []
    )
} as const;

export function renderBlock(input: BlockRendererInput): string {
  const normalizedInput = normalizeBlockRendererInput(input);
  const handler = blockRegistry[normalizedInput.blockType as keyof typeof blockRegistry];

  if (!handler) {
    throw new Error(`Renderer not found for block type: ${normalizedInput.blockType}`);
  }

  return handler(normalizedInput);
}
