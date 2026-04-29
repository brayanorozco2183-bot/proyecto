import axios from 'axios';
import { vault } from '../tools/vault.js';

type ModelTagResponse = { models?: Array<{ name?: string; model?: string }>; };

const RUNTIME_ALIASES: Record<string, string[]> = {
  'gemma3:4b': ['qwen2.5:latest', 'qwen2.5:1.5b'],
  'qwen2.5:7b-instruct-q4_K_M': ['qwen2.5:latest', 'qwen2.5:1.5b'],
  'qwen2.5-coder:3b-instruct': ['qwen2.5-coder:1.5b', 'qwen2.5:1.5b'],
  'qwen2.5-coder:7b-instruct-q4_K_M': ['qwen2.5-coder:1.5b', 'qwen2.5:1.5b'],
  'qwen3:1.7b': ['qwen2.5:1.5b'],
  'qwen3:4b': ['qwen2.5:latest', 'qwen2.5:1.5b'],
  'qwen3:8b': ['qwen2.5:latest'],
};

let cachedModels: Set<string> | null = null;
let cachedAt = 0;

function normalize(value: any): string {
  return String(value || '').trim();
}

function parseAliasJson(): Record<string, string[]> {
  try {
    const raw = JSON.parse(String(vault.OLLAMA_MODEL_ALIAS_JSON || '{}'));
    if (!raw || typeof raw !== 'object') return {};
    const out: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(raw)) {
      const arr = Array.isArray(value) ? value : [value];
      out[normalize(key)] = arr.map(normalize).filter(Boolean);
    }
    return out;
  } catch {
    return {};
  }
}

function buildAliasCandidates(requestedModel: string): string[] {
  const requested = normalize(requestedModel);
  const envAliases = parseAliasJson();
  const out = [
    requested,
    ...(envAliases[requested] || []),
    ...(RUNTIME_ALIASES[requested] || []),
    vault.OLLAMA_MODEL_PREMIUM,
    vault.OLLAMA_MODEL_COPY,
    vault.OLLAMA_MODEL_STANDARD,
    vault.OLLAMA_MODEL_RESEARCH,
    vault.OLLAMA_MODEL_FAST,
  ].map(normalize).filter(Boolean);

  const seen = new Set<string>();
  return out.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

export async function fetchInstalledModels(force = false): Promise<Set<string>> {
  const enabled = Boolean(vault.OLLAMA_PREFLIGHT_ENABLED);
  if (!enabled) return new Set();

  if (!force && cachedModels && (Date.now() - cachedAt) < 30_000) {
    return new Set(cachedModels);
  }

  try {
    const endpoint = `${vault.OLLAMA_URL}/api/tags`;
    const response = await axios.get<ModelTagResponse>(endpoint, { timeout: 10_000 });
    const names = new Set<string>();

    for (const item of response.data?.models || []) {
      const name = normalize(item?.name || item?.model);
      if (name) names.add(name);
    }

    cachedModels = names;
    cachedAt = Date.now();
    return new Set(names);
  } catch (error: any) {
    console.warn(`[ModelAvailability] No se pudo consultar /api/tags: ${error?.message || 'unknown error'}`);
    return new Set();
  }
}

export async function resolveInstalledModel(requestedModel: string): Promise<{ selectedModel: string; requestedModel: string; installed: string[]; reason: string; }> {
  const requested = normalize(requestedModel);
  const installed = await fetchInstalledModels();
  const installedList = [...installed.values()];

  if (!requested) {
    const fallback = normalize(vault.OLLAMA_MODEL_RESEARCH || vault.OLLAMA_MODEL_FAST || 'qwen2.5:1.5b');
    return {
      requestedModel: requested,
      selectedModel: fallback,
      installed: installedList,
      reason: 'Modelo vacío; usando fallback de configuración.'
    };
  }

  if (!installed.size) {
    return {
      requestedModel: requested,
      selectedModel: requested,
      installed: installedList,
      reason: 'Prefight no disponible; se mantiene el modelo solicitado.'
    };
  }

  if (installed.has(requested)) {
    return {
      requestedModel: requested,
      selectedModel: requested,
      installed: installedList,
      reason: 'Modelo solicitado encontrado en Ollama.'
    };
  }

  for (const candidate of buildAliasCandidates(requested)) {
    if (installed.has(candidate)) {
      return {
        requestedModel: requested,
        selectedModel: candidate,
        installed: installedList,
        reason: `Modelo solicitado no instalado; se remapea a ${candidate}.`
      };
    }
  }

  const emergency = normalize(vault.OLLAMA_MODEL_FAST || 'qwen2.5:1.5b');
  return {
    requestedModel: requested,
    selectedModel: emergency,
    installed: installedList,
    reason: `No se encontró coincidencia instalada para ${requested}; se usa fallback de emergencia ${emergency}.`
  };
}
