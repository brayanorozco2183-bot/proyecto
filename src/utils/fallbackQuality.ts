import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';
import { resolveNicheBank } from '../fallbacks/contentBanks.js';
import { createPremiumFallbackBlock, createPremiumFallbackHtml } from '../fallbacks/fallbackRegistry.js';
import type { ContentBlock } from '../types/pipeline_v2.js';
import type { PremiumFallbackInput, PremiumFallbackResult } from '../fallbacks/types.js';

export type FallbackReason =
  | 'serp_unavailable'
  | 'serp_insufficient'
  | 'llm_unavailable'
  | 'semantic_guard'
  | 'assembly_error'
  | 'unknown';

export interface PublicFallbackContext {
  niche?: string;
  city?: string;
  sectionTitle?: string;
  blockType?: string;
  technicalTerms?: string[];
  phone?: string;
  businessName?: string;
  reason?: FallbackReason | string;
  pageType?: string;
  primaryIntent?: string;
  contextualData?: Record<string, any>;
  sectionId?: string;
  seedHint?: string;
}

function normalizeKey(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizePublicText(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

export function getPublicServiceLabel(niche?: string): string {
  const canonical = String(getCanonicalNicheLabel(niche || 'servicio local') || niche || 'servicio local')
    .replace(/^de\s+/i, '')
    .trim();
  return canonical || 'servicio local';
}

export function getFallbackServiceTopics(niche?: string, limit = 6): string[] {
  const bank = resolveNicheBank(getPublicServiceLabel(niche));
  return Array.from(new Set([...bank.services, ...bank.technicalTerms])).slice(0, limit);
}

export function sanitizeFallbackReason(value?: string): string {
  const raw = normalizePublicText(value || '');
  if (!raw) return 'criterio de calidad interno';
  return raw
    .replace(/\b(fallback|undefined|null|stack trace|llm|json|exception|error)\b/gi, 'revisión interna')
    .replace(/[\[\]{}<>`]/g, '')
    .slice(0, 160)
    .trim() || 'criterio de calidad interno';
}

/**
 * Paragraph-level compatibility API used by old guards and emergency renderers.
 * It now reads from the same premium fallback banks, so even legacy fallbacks vary by niche/block.
 */
export function buildPublicFallbackParagraphs(context: PublicFallbackContext): string[] {
  const city = normalizePublicText(context.city || 'tu zona');
  const niche = getPublicServiceLabel(context.niche).toLowerCase();
  const bank = resolveNicheBank(niche);
  const topics = (context.technicalTerms && context.technicalTerms.length ? context.technicalTerms : getFallbackServiceTopics(context.niche, 5)).slice(0, 5);
  const topicText = topics.length ? topics.join(', ') : 'diagnóstico, materiales, tiempos y revisión final';
  const blockType = normalizeKey(context.blockType || 'content');
  const primaryService = bank.services[0] || 'diagnóstico inicial';
  const trustSignal = bank.trustSignals[0] || 'presupuesto entendible';
  const objection = bank.objections[0] || 'evitar presupuestos genéricos';

  if (/faq/.test(blockType)) {
    return [
      `En ${city}, conviene valorar cada trabajo de ${niche} según el alcance real, el estado previo y la urgencia del caso.`,
      `Antes de aceptar una intervención, confirma qué se revisará, qué materiales pueden hacer falta y cómo se comprobará el resultado.`,
      `Una buena pregunta inicial es si el caso encaja mejor con ${primaryService} o requiere una revisión más amplia.`
    ];
  }

  if (/price|precio|pricing|budget|presupuesto/.test(blockType)) {
    return [
      `El presupuesto de ${niche} en ${city} depende de factores como ${topicText}, además del acceso y el nivel de urgencia.`,
      `Una valoración seria debe separar mano de obra, piezas o materiales, desplazamiento si aplica y cualquier remate necesario antes de empezar.`,
      `Pide que el alcance quede claro para ${objection}.`
    ];
  }

  if (/trust|proof|confianza|local/.test(blockType)) {
    return [
      `Para contratar ${niche} en ${city}, ayuda trabajar con un proceso claro: revisión previa, explicación del alcance, presupuesto entendible y comprobación final.`,
      `Las señales útiles son concretas: ${trustSignal}, materiales definidos, tiempos razonables y ausencia de promesas que no se puedan verificar.`,
      `El contexto local importa porque cada zona puede cambiar accesos, horarios, materiales o prioridad de la intervención.`
    ];
  }

  if (/cta|contact|conversion|hero/.test(blockType)) {
    return [
      `Si necesitas ${niche} en ${city}, prepara una descripción breve del problema, fotos si las tienes y el horario en el que se puede revisar el trabajo.`,
      `Con esa información es más fácil orientar el alcance, priorizar la urgencia y evitar presupuestos genéricos.`,
      `Indica si el caso afecta a ${primaryService}, a otro servicio relacionado o a una duda todavía sin diagnosticar.`
    ];
  }

  return [
    `En ${city}, un servicio de ${niche} debe empezar con una revisión clara del caso y una explicación sencilla de las opciones disponibles.`,
    `Para evitar soluciones genéricas, se tienen en cuenta aspectos como ${topicText}, además del estado real del trabajo y el nivel de acabado esperado.`,
    `El objetivo es que cada decisión tenga sentido técnico y no dependa solo de una plantilla de contenido.`
  ];
}

export function buildPremiumFallbackContentBlock(context: PublicFallbackContext): ContentBlock {
  return createPremiumFallbackBlock(toPremiumInput(context));
}

export function buildPremiumFallbackHtml(context: PublicFallbackContext): PremiumFallbackResult {
  return createPremiumFallbackHtml(toPremiumInput(context));
}

function toPremiumInput(context: PublicFallbackContext): PremiumFallbackInput {
  return {
    niche: context.niche,
    city: context.city,
    sectionId: context.sectionId,
    sectionTitle: context.sectionTitle,
    blockType: context.blockType,
    technicalTerms: context.technicalTerms,
    phone: context.phone,
    businessName: context.businessName,
    pageType: context.pageType,
    primaryIntent: context.primaryIntent,
    reason: sanitizeFallbackReason(String(context.reason || 'quality_control')),
    contextualData: context.contextualData,
    seedHint: context.seedHint,
  };
}

export function buildInternalFallbackMeta(reason: unknown, source: string): Record<string, unknown> {
  return {
    degraded: true,
    fallback_source: source,
    fallback_reason: String(reason || 'unknown').slice(0, 240),
    public_copy_safe: true,
    audit_only: true
  };
}
