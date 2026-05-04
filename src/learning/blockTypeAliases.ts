import { normalizeKey } from './utils.js';

const BLOCK_TYPE_ALIASES: Record<string, string[]> = {
  hero: ['hero', 'hero_trust', 'hero_split', 'hero_immersive', 'hero_local', 'hero_section'],
  hero_trust: ['hero_trust', 'hero', 'hero_split', 'hero_immersive', 'hero_local', 'hero_section'],
  content: ['content', 'semantic_content', 'rich_content', 'editorial_content', 'body_content'],
  features: ['features', 'services_grid', 'service_grid', 'services', 'service_cards', 'service_list'],
  services_grid: ['services_grid', 'features', 'service_grid', 'services', 'service_cards', 'service_list'],
  process: ['process', 'process_steps', 'steps', 'method', 'workflow'],
  process_steps: ['process_steps', 'process', 'steps', 'method', 'workflow'],
  faq: ['faq', 'faqs', 'questions', 'faq_block'],
  pricing: ['pricing', 'price_guidance', 'prices', 'budget', 'presupuesto'],
  price_guidance: ['price_guidance', 'pricing', 'prices', 'budget', 'presupuesto'],
  proof: ['proof', 'local_proof', 'social_proof', 'case_proof', 'evidence'],
  local_proof: ['local_proof', 'proof', 'social_proof', 'case_proof', 'evidence'],
  trust: ['trust', 'trust_band', 'trust_strip', 'credentials', 'guarantees'],
  trust_band: ['trust_band', 'trust', 'trust_strip', 'credentials', 'guarantees'],
  cta: ['cta', 'cta_panel', 'closing_cta', 'conversion', 'contact'],
  cta_panel: ['cta_panel', 'cta', 'closing_cta', 'conversion', 'contact'],
  local: ['local', 'map', 'coverage', 'geo', 'areas'],
  map: ['map', 'local', 'coverage', 'geo', 'areas'],
  guide: ['guide', 'checklist', 'comparison_table', 'explainer', 'educational'],
  checklist: ['checklist', 'guide', 'comparison_table', 'explainer', 'educational'],
  comparison_table: ['comparison_table', 'guide', 'checklist', 'explainer', 'educational'],
  urgency_panel: ['urgency_panel', 'cta', 'cta_panel', 'emergency', 'priority']
};

const AGENT_ALIASES: Record<string, string[]> = {
  Content_Writer_01: ['Content_Writer_01', 'ContentWriterAgent', 'Content_Writer_Agent'],
  ContentWriterAgent: ['ContentWriterAgent', 'Content_Writer_01', 'Content_Writer_Agent'],
  Content_Architect_01: ['Content_Architect_01', 'ContentArchitectAgent', 'Content_Architect_Agent'],
  ContentArchitectAgent: ['ContentArchitectAgent', 'Content_Architect_01', 'Content_Architect_Agent'],
  Spanish_Linguistic_Corrector_V2: ['Spanish_Linguistic_Corrector_V2', 'SpanishCorrectorAgent', 'Spanish_Corrector_Agent'],
  SpanishCorrectorAgent: ['SpanishCorrectorAgent', 'Spanish_Linguistic_Corrector_V2', 'Spanish_Corrector_Agent']
};

export function expandBlockTypeAliases(blockType?: string): string[] {
  const key = normalizeKey(blockType || '');
  if (!key) return [];
  const aliases = BLOCK_TYPE_ALIASES[key] || [key];
  return Array.from(new Set(aliases.map(normalizeKey).filter(Boolean)));
}

export function expandAgentAliases(agentName?: string): string[] {
  const raw = String(agentName || '').trim();
  if (!raw) return [];
  const aliases = AGENT_ALIASES[raw] || [raw];
  return Array.from(new Set(aliases.filter(Boolean)));
}

export function canonicalBlockType(blockType?: string): string | undefined {
  const key = normalizeKey(blockType || '');
  if (!key) return undefined;
  for (const [canonical, aliases] of Object.entries(BLOCK_TYPE_ALIASES)) {
    if (aliases.map(normalizeKey).includes(key)) return canonical;
  }
  return key;
}

export const KNOWN_BLOCK_TYPES = Object.keys(BLOCK_TYPE_ALIASES);
