export type AgentModelTier = 'fast' | 'standard' | 'premium' | 'coder' | 'deterministic';

export interface AgentRoutingProfile {
  agentName: string;
  preferredTier: AgentModelTier;
  fallbackTier: Exclude<AgentModelTier, 'deterministic'>;
  capability:
    | 'research'
    | 'planning'
    | 'writing'
    | 'critic'
    | 'corrector'
    | 'code'
    | 'deploy'
    | 'deterministic'
    | 'operations';
  promptFolder: string;
  deterministicOnly?: boolean;
  learnFromFailures?: boolean;
  notes?: string;
}

const registryEntries: AgentRoutingProfile[] = [
  { agentName: 'SEO_Analyst_01', preferredTier: 'standard', fallbackTier: 'fast', capability: 'research', promptFolder: 'SEO_Analyst_01', learnFromFailures: true, notes: 'Competitive and SEO strategy JSON.' },
  { agentName: 'GeoIntel_Agent', preferredTier: 'standard', fallbackTier: 'fast', capability: 'research', promptFolder: 'GeoIntel_Agent', learnFromFailures: true, notes: 'Geographic enrichment and local signals.' },
  { agentName: 'Competitor_Audit_Agent', preferredTier: 'standard', fallbackTier: 'fast', capability: 'research', promptFolder: 'Competitor_Audit_Agent', learnFromFailures: true, notes: 'Competitor pattern extraction.' },
  { agentName: 'SERP_Gap_Agent', preferredTier: 'standard', fallbackTier: 'fast', capability: 'research', promptFolder: 'SERP_Gap_Agent', learnFromFailures: true, notes: 'TOP10 content gap analysis.' },
  { agentName: 'Entity_Extractor', preferredTier: 'fast', fallbackTier: 'fast', capability: 'research', promptFolder: 'Entity_Extractor', learnFromFailures: true, notes: 'Structured entity extraction.' },
  { agentName: 'NAP_Guardian_01', preferredTier: 'fast', fallbackTier: 'fast', capability: 'critic', promptFolder: 'NAP_Guardian_01', learnFromFailures: true, notes: 'NAP consistency and render-safe data.' },
  { agentName: 'Content_Architect_01', preferredTier: 'premium', fallbackTier: 'standard', capability: 'planning', promptFolder: 'Content_Architect_01', learnFromFailures: true, notes: 'High-impact semantic/visual blueprinting.' },
  { agentName: 'Art_Director_01', preferredTier: 'standard', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Art_Director_01', learnFromFailures: true, notes: 'Visual DNA, families, originality risk.' },
  { agentName: 'Layout_Composer_01', preferredTier: 'standard', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Layout_Composer_01', learnFromFailures: true, notes: 'Layout contract and shells.' },
  { agentName: 'Content_Variety_01', preferredTier: 'fast', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Content_Variety_01', learnFromFailures: true, notes: 'Variation and semantic drift.' },
  { agentName: 'Contextual_Variation_Agent', preferredTier: 'standard', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Contextual_Variation_Agent', learnFromFailures: true, notes: 'Hyperlocal variations.' },
  { agentName: 'Content_Writer_01', preferredTier: 'premium', fallbackTier: 'standard', capability: 'writing', promptFolder: 'Content_Writer_01', learnFromFailures: true, notes: 'Main longform section writer.' },
  { agentName: 'Niche_Coherence_Auditor', preferredTier: 'standard', fallbackTier: 'fast', capability: 'critic', promptFolder: 'Niche_Coherence_Auditor', learnFromFailures: true, notes: 'Cross-niche and semantic coherence.' },
  { agentName: 'Spanish_Linguistic_Corrector_V2', preferredTier: 'standard', fallbackTier: 'fast', capability: 'corrector', promptFolder: 'Spanish_Linguistic_Corrector_V2', learnFromFailures: true, notes: 'Spanish correction without breaking HTML.' },
  { agentName: 'Quality_Auditor_10', preferredTier: 'standard', fallbackTier: 'fast', capability: 'critic', promptFolder: 'Quality_Auditor_10', learnFromFailures: true, notes: 'QA scoring and issue summary.' },
  { agentName: 'Technical_Specialist_05', preferredTier: 'coder', fallbackTier: 'standard', capability: 'code', promptFolder: 'Technical_Specialist_05', learnFromFailures: true, notes: 'Technical validation using specialized coder models.' },
  { agentName: 'Static_Deploy_09', preferredTier: 'deterministic', fallbackTier: 'fast', capability: 'deploy', promptFolder: 'Static_Deploy_09', deterministicOnly: true, learnFromFailures: false, notes: 'Static output assembly and filesystem.' },
  { agentName: 'WP_Bridge_06', preferredTier: 'deterministic', fallbackTier: 'fast', capability: 'deploy', promptFolder: 'WP_Bridge_06', deterministicOnly: true, learnFromFailures: false, notes: 'WordPress publishing bridge.' },
  { agentName: 'Linguist_Interpreter_08', preferredTier: 'fast', fallbackTier: 'fast', capability: 'operations', promptFolder: 'Linguist_Interpreter_08', learnFromFailures: true, notes: 'Intent parsing for commands.' },
  { agentName: 'ROI_Auditor_15', preferredTier: 'fast', fallbackTier: 'fast', capability: 'critic', promptFolder: 'ROI_Auditor_15', learnFromFailures: true, notes: 'ROI and prioritization audits.' },
  { agentName: 'Sentinel_Observer_14', preferredTier: 'deterministic', fallbackTier: 'fast', capability: 'operations', promptFolder: 'Sentinel_Observer_14', deterministicOnly: true, learnFromFailures: false, notes: 'Runtime sentinel / health status.' },
  { agentName: 'Video_Architect_12', preferredTier: 'standard', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Video_Architect_12', learnFromFailures: true, notes: 'Video micro-script planning.' },
  { agentName: 'Visual', preferredTier: 'standard', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Visual', learnFromFailures: true, notes: 'Visual creativity and art direction support.' },
  { agentName: 'Authority_Weaver_13', preferredTier: 'standard', fallbackTier: 'fast', capability: 'planning', promptFolder: 'Authority_Weaver_13', learnFromFailures: true, notes: 'Authority weaving / EEAT support.' },
];

export const AGENT_ROUTING_REGISTRY: Record<string, AgentRoutingProfile> = Object.fromEntries(
  registryEntries.map((entry) => [entry.agentName, entry])
);

export function getAgentRoutingProfile(agentName: string): AgentRoutingProfile {
  const direct = AGENT_ROUTING_REGISTRY[agentName];
  if (direct) return direct;

  const normalized = String(agentName || '').trim().toLowerCase();
  const fallback = registryEntries.find((entry) => entry.agentName.toLowerCase() === normalized)
    || registryEntries.find((entry) => normalized.includes(entry.agentName.toLowerCase()))
    || registryEntries.find((entry) => entry.agentName.toLowerCase().includes(normalized));

  if (fallback) return fallback;

  return {
    agentName,
    preferredTier: 'standard',
    fallbackTier: 'fast',
    capability: 'operations',
    promptFolder: agentName,
    learnFromFailures: true,
    notes: 'Generic fallback routing profile.',
  };
}

export function listAgentRoutingProfiles(): AgentRoutingProfile[] {
  return [...registryEntries];
}
