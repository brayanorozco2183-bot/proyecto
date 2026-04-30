import type { FallbackBlockType, FallbackIntent, PremiumFallbackInput, PremiumFallbackResult } from './types.js';
import { resolveNicheBank } from './contentBanks.js';
import { detectLocalContextKind, getLocalContextAngles } from './localContextPacks.js';
import { resolveBlockRecipe } from './layoutRecipes.js';
import { renderRecipeBody, RecipeRenderPayload } from './renderers/recipeRendererRouter.js';

function normalizeText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: unknown): string {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wordCount(html: string): number {
  return String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

export function normalizeFallbackBlockType(blockType?: string): FallbackBlockType {
  const key = normalizeKey(blockType || 'content');
  if (/hero|cabecera/.test(key)) return 'hero';
  if (/service|servicio|grid|features/.test(key)) return 'servicesGrid';
  if (/process|paso|step|metodo/.test(key)) return 'processSteps';
  if (/price|precio|tarifa|presupuesto|budget/.test(key)) return 'priceGuidance';
  if (/faq|pregunta/.test(key)) return 'faq';
  if (/trust|confianza|garantia/.test(key)) return 'trustBand';
  if (/proof|local|zona|area/.test(key)) return 'localProof';
  if (/cta|contact|conversion|lead/.test(key)) return 'ctaPanel';
  if (/urgenc|emergenc|24h|rapido/.test(key)) return 'urgencyPanel';
  if (/compar/.test(key)) return 'comparisonTable';
  if (/map|mapa|ubicacion/.test(key)) return 'map';
  return 'content';
}

function resolveIntent(input: PremiumFallbackInput, blockType: FallbackBlockType): FallbackIntent {
  const raw = normalizeKey(`${input.primaryIntent || ''} ${input.pageType || ''} ${blockType}`);
  if (/urgent|urgenc|emergenc|24h/.test(raw)) return 'urgent';
  if (/informational|informativo|guide|guia|faq/.test(raw)) return 'informational';
  if (/commercial|compar|precio|price/.test(raw)) return 'commercial';
  if (/proof|local/.test(raw)) return 'local-proof';
  return 'transactional';
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function buildDefaultHeading(blockType: FallbackBlockType, bankLabel: string, city: string): string {
  switch (blockType) {
    case 'hero': return `${bankLabel} en ${city}`;
    case 'servicesGrid': return `Servicios habituales de ${bankLabel} en ${city}`;
    case 'processSteps': return `Cómo se organiza el trabajo en ${city}`;
    case 'priceGuidance': return `Qué influye en el presupuesto en ${city}`;
    case 'faq': return `Preguntas frecuentes sobre ${bankLabel} en ${city}`;
    case 'trustBand': return `Señales para contratar con más criterio`;
    case 'localProof': return `Criterio local aplicado en ${city}`;
    case 'ctaPanel': return `Cuéntanos qué necesitas revisar`;
    case 'urgencyPanel': return `Cuándo conviene priorizar la intervención`;
    default: return `${bankLabel} en ${city}: información útil antes de decidir`;
  }
}

export function buildPremiumFallback(input: PremiumFallbackInput): PremiumFallbackResult {
  const city = normalizeText(input.city || 'tu zona');
  const bank = resolveNicheBank(input.niche);
  const blockType = normalizeFallbackBlockType(input.blockType);
  const h2 = normalizeText(input.sectionTitle || buildDefaultHeading(blockType, bank.label, city));
  const contextKind = detectLocalContextKind(city, input.contextualData);
  const intent = resolveIntent(input, blockType);
  const seed = `${input.seedHint || ''}:${input.niche || ''}:${city}:${input.sectionId || ''}:${h2}:${blockType}:${intent}`;
  
  // USAR EL NUEVO SISTEMA DE RECETAS EXPANDIDO
  const recipe = resolveBlockRecipe(blockType, seed, contextKind);
  
  const localAngles = getLocalContextAngles(contextKind, city);
  const topics = unique([...(input.technicalTerms || []), ...bank.technicalTerms, ...bank.services]).slice(0, 8);
  const businessName = normalizeText(input.businessName || 'Servicio local');
  const phone = normalizeText(input.phone || '');
  const kicker = `${city} · ${bank.label}`;

  const payload: RecipeRenderPayload = {
    h2,
    kicker,
    city,
    nicheLabel: bank.label,
    lead: `Si necesitas ${bank.label} en ${city}, esta página prioriza información técnica clara sobre procesos, materiales y señales de confianza.`,
    cards: unique(bank.services).slice(0, 6).map((s, i) => ({ title: s, text: `${localAngles[i % localAngles.length]}.` })),
    list: unique([...bank.trustSignals, ...bank.objections]).slice(0, 6),
    faqs: bank.faq.slice(0, 4),
    ctaHtml: phone ? `<a class="pfb__cta" href="tel:${phone.replace(/\D/g, '')}">Hablar ahora: ${phone}</a>` : `<a class="pfb__cta" href="#contacto">Pedir valoración</a>`
  };

  // DELEGAR EL RENDERIZADO AL ROUTER DE RECETAS
  const body = renderRecipeBody(recipe, payload);

  const html = `<section class="${escapeHtml(recipe.className)}" data-fallback="premium" data-fallback-variant="${escapeHtml(recipe.id)}" data-context-kind="${escapeHtml(contextKind)}" data-block="${escapeHtml(blockType)}"><div class="pfb__inner"><span class="pfb__kicker">${escapeHtml(kicker)}</span><h2>${escapeHtml(h2)}</h2>${body}</div></section>`;

  return {
    html,
    h2,
    wordCount: wordCount(html),
    blockType,
    variantId: recipe.id,
    contextKind,
    intent,
    topics,
    meta: {
      degraded: true,
      fallback_source: 'premium_fallback_registry',
      fallback_variant: recipe.id,
      fallback_context_kind: contextKind,
      fallback_intent: intent,
      public_copy_safe: true,
      reason: normalizeText(input.reason || 'quality_control'),
    },
  };
}
