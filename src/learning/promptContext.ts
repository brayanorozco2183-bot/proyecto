import { PromptLearningContext } from './types.js';
import { normalizeKey } from './utils.js';
import { canonicalBlockType, KNOWN_BLOCK_TYPES } from './blockTypeAliases.js';

function detectBlockType(prompt: string): string | undefined {
  const lower = normalizeKey(prompt);
  const exact = KNOWN_BLOCK_TYPES.find((item) => lower.includes(normalizeKey(item)));
  if (exact) return canonicalBlockType(exact);

  if (/servici|prestaci|reparaci|instalaci|grid/.test(lower)) return 'services_grid';
  if (/paso|proceso|metodo|como se organiza|workflow/.test(lower)) return 'process_steps';
  if (/precio|presupuesto|tarifa|coste|cost|price/.test(lower)) return 'price_guidance';
  if (/pregunta|faq|duda|questions/.test(lower)) return 'faq';
  if (/confianza|credencial|seguro|garantia|normativa/.test(lower)) return 'trust_band';
  if (/prueba|evidencia|testimonio|caso|proof/.test(lower)) return 'local_proof';
  if (/cta|contact|llamar|solicitar|conversion/.test(lower)) return 'cta_panel';
  if (/mapa|cobertura|zona|barrio|localidad|areas/.test(lower)) return 'map';
  if (/guia|checklist|comparativa|tabla|educaci/.test(lower)) return 'guide';
  if (/hero|h1|cabecera|above the fold/.test(lower)) return 'hero_trust';
  return undefined;
}

function findAfter(label: string, prompt: string): string | undefined {
  const regex = new RegExp(`${label}\\s*[:=]\\s*([^\\n]+)`, 'i');
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

  const rawBlockType = findAfter('block_type', prompt)
    || findAfter('blockType', prompt)
    || detectBlockType(prompt)
    || undefined;

  return {
    agentName,
    niche,
    city,
    pageType,
    blockType: canonicalBlockType(rawBlockType)
  };
}
