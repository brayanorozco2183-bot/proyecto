import { vault } from '../tools/vault.js';
import { getAgentRoutingProfile, listAgentRoutingProfiles } from './agentRegistry.js';
import { formatHardwareProfile, getHardwareProfile } from './hardwareProfile.js';

export interface AgentModelDecision {
  agentName: string;
  requestedModel: string;
  selectedModel: string;
  selectedTier: string;
  profile: string;
  hardwareSummary: string;
  reason: string;
}

function safeJsonParse<T>(value: string | undefined, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeAgentEnvKey(agentName: string): string {
  return String(agentName || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function getTierPlan() {
  const hardware = getHardwareProfile();
  const baseFast = vault.OLLAMA_MODEL_FAST || 'qwen2.5:1.5b';
  const baseStandard = vault.OLLAMA_MODEL_STANDARD || 'qwen2.5:1.5b';
  const basePremium = vault.OLLAMA_MODEL_PREMIUM || 'qwen2.5:latest';
  const baseCoder = vault.OLLAMA_MODEL_CODER || 'qwen2.5-coder:1.5b';

  const runtimeProfile = String(vault.MODEL_ROUTER_PROFILE || 'auto').toLowerCase().trim();

  if (runtimeProfile === 'fast') {
    return { fast: baseFast, standard: baseFast, premium: baseStandard, coder: baseCoder };
  }

  if (runtimeProfile === 'balanced') {
    return { fast: baseFast, standard: baseStandard, premium: hardware.resourceTier === 'edge' ? baseStandard : basePremium, coder: baseCoder };
  }

  if (runtimeProfile === 'premium-local') {
    return { fast: baseFast, standard: baseStandard, premium: basePremium, coder: baseCoder };
  }

  if (hardware.resourceTier === 'edge') {
    return { fast: baseFast, standard: baseStandard, premium: basePremium, coder: baseCoder };
  }

  if (hardware.resourceTier === 'balanced') {
    return { fast: baseFast, standard: baseStandard, premium: basePremium, coder: baseCoder };
  }

  return { fast: baseFast, standard: baseStandard, premium: basePremium, coder: baseCoder };
}

function resolveExplicitOverride(agentName: string): string | undefined {
  const key = `OLLAMA_AGENT_MODEL_${sanitizeAgentEnvKey(agentName)}`;
  const envOverride = (process.env as Record<string, string | undefined>)[key];
  if (envOverride?.trim()) return envOverride.trim();

  const jsonOverrides = safeJsonParse<Record<string, string>>(vault.AGENT_MODEL_OVERRIDES_JSON, {});
  if (jsonOverrides[agentName]) return String(jsonOverrides[agentName]).trim();
  return undefined;
}

export function resolveModelForAgent(agentName: string, requestedModel = ''): AgentModelDecision {
  const routing = getAgentRoutingProfile(agentName);
  const hardwareSummary = formatHardwareProfile();

  if (!vault.MODEL_ROUTER_ENABLED) {
    const fallbackModel = requestedModel || vault.OLLAMA_MODEL_COPY || vault.OLLAMA_MODEL_RESEARCH || 'qwen2.5:1.5b';
    return {
      agentName,
      requestedModel,
      selectedModel: fallbackModel,
      selectedTier: 'router_disabled',
      profile: vault.MODEL_ROUTER_PROFILE,
      hardwareSummary,
      reason: 'Model router disabled by configuration.',
    };
  }

  const explicitOverride = resolveExplicitOverride(agentName);
  if (explicitOverride) {
    return {
      agentName,
      requestedModel,
      selectedModel: explicitOverride,
      selectedTier: 'override',
      profile: vault.MODEL_ROUTER_PROFILE,
      hardwareSummary,
      reason: 'Explicit override from environment or AGENT_MODEL_OVERRIDES_JSON.',
    };
  }

  const tierPlan = getTierPlan();
  const tier = routing.preferredTier;
  let selectedModel = requestedModel || vault.OLLAMA_MODEL_COPY || vault.OLLAMA_MODEL_RESEARCH || tierPlan.standard;

  if (tier === 'fast') selectedModel = tierPlan.fast;
  if (tier === 'standard') selectedModel = tierPlan.standard;
  if (tier === 'premium') selectedModel = tierPlan.premium;
  if (tier === 'coder') selectedModel = tierPlan.coder;
  if (tier === 'deterministic') selectedModel = requestedModel || tierPlan.fast;

  console.log(`[Router] Agent: ${agentName} | Tier: ${tier} | Selected: ${selectedModel} | TierPlan: ${JSON.stringify(tierPlan)}`);


  return {
    agentName,
    requestedModel,
    selectedModel,
    selectedTier: tier,
    profile: vault.MODEL_ROUTER_PROFILE,
    hardwareSummary,
    reason: routing.notes || `Resolved from ${tier} tier.`,
  };
}

export function buildAgentModelManifest(): AgentModelDecision[] {
  return listAgentRoutingProfiles().map((entry) => resolveModelForAgent(entry.agentName));
}
