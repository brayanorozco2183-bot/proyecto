import { PromptLearningContext } from './types.js';
import { normalizeKey } from './utils.js';

function detectBlockType(prompt: string): string | undefined {
  const lower = normalizeKey(prompt);
  const blockTypes = [
    'services_grid',
    'process_steps',
    'price_guidance',
    'faq',
    'local_proof',
    'urgency_panel',
    'trust_band',
    'cta_panel',
    'comparison_table',
    'checklist',
    'map'
  ];
  return blockTypes.find((item) => lower.includes(item));
}

function findAfter(label: string, prompt: string): string | undefined {
  const regex = new RegExp(`${label}\s*[:=]\s*([^\n]+)`, 'i');
  const match = String(prompt || '').match(regex);
  return match?.[1]?.trim() || undefined;
}

export function inferPromptLearningContext(agentName: string, prompt: string): PromptLearningContext {
  const niche = findAfter('NICHO', prompt)
    || findAfter('nicho', prompt)
    || findAfter('Niche', prompt)
    || undefined;

  const city = findAfter('CIUDAD', prompt)
    || findAfter('city', prompt)
    || findAfter('Ciudad', prompt)
    || undefined;

  const pageType = findAfter('PageType', prompt)
    || findAfter('PAGE TYPE', prompt)
    || undefined;

  const blockType = detectBlockType(prompt)
    || findAfter('block_type', prompt)
    || undefined;

  return {
    agentName,
    niche,
    city,
    pageType,
    blockType
  };
}
