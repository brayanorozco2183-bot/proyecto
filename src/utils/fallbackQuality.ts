import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';

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
  reason?: FallbackReason | string;
}

const NICHE_SERVICE_FALLBACKS: Record<string, string[]> = {
  electricistas: ['cuadro eléctrico', 'averías eléctricas', 'enchufes e iluminación', 'boletín eléctrico', 'sobrecargas', 'mantenimiento eléctrico'],
  cerrajeros: ['apertura de puertas', 'cambio de cerraduras', 'bombines de seguridad', 'escudos protectores', 'amaestramiento de llaves', 'cierres metálicos'],
  fontaneros: ['fugas de agua', 'atascos', 'grifería', 'llaves de paso', 'desagües', 'termos y calderas'],
  carpinteros: ['puertas de madera', 'armarios a medida', 'muebles a medida', 'ajustes de herrajes', 'tarima y parquet', 'reparaciones de madera'],
  reformas: ['medición previa', 'alicatados y solados', 'pladur', 'acabados', 'licencias', 'coordinación de gremios'],
  pintores: ['pintura interior', 'alisado de paredes', 'humedades', 'esmaltado', 'papel pintado', 'acabados decorativos'],
  climatizacion: ['instalación de split', 'mantenimiento de aire acondicionado', 'conductos', 'bomba de calor', 'filtros', 'carga de gas'],
  limpieza: ['limpieza de comunidades', 'oficinas', 'cristales', 'abrillantado', 'limpieza final de obra', 'mantenimiento periódico'],
  jardineria: ['poda', 'riego', 'mantenimiento de jardines', 'césped', 'control de plagas vegetales', 'diseño de zonas verdes'],
  mudanzas: ['embalaje', 'desmontaje de muebles', 'traslado local', 'protección de enseres', 'montaje final', 'planificación de acceso']
};

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
  const key = normalizeKey(getPublicServiceLabel(niche));
  const match = Object.entries(NICHE_SERVICE_FALLBACKS).find(([candidate]) => key.includes(candidate) || candidate.includes(key));
  return (match?.[1] || ['diagnóstico inicial', 'presupuesto claro', 'materiales adecuados', 'planificación del trabajo', 'revisión final', 'seguimiento']).slice(0, limit);
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

export function buildPublicFallbackParagraphs(context: PublicFallbackContext): string[] {
  const city = normalizePublicText(context.city || 'tu zona');
  const niche = getPublicServiceLabel(context.niche).toLowerCase();
  const topics = (context.technicalTerms && context.technicalTerms.length ? context.technicalTerms : getFallbackServiceTopics(context.niche, 4)).slice(0, 4);
  const topicText = topics.length ? topics.join(', ') : 'diagnóstico, materiales, tiempos y revisión final';
  const blockType = normalizeKey(context.blockType || 'content');

  if (/faq/.test(blockType)) {
    return [
      `En ${city}, conviene valorar cada trabajo de ${niche} según el alcance real, el estado previo y la urgencia del caso.`,
      `Antes de aceptar una intervención, es recomendable confirmar qué se revisará, qué materiales pueden hacer falta y cómo se comprobará el resultado.`
    ];
  }

  if (/price|precio|pricing|budget|presupuesto/.test(blockType)) {
    return [
      `El presupuesto de ${niche} en ${city} depende del alcance del trabajo, el acceso, los materiales y el tiempo necesario para dejar la intervención bien terminada.`,
      `Una valoración seria debe separar mano de obra, piezas o materiales, desplazamiento si aplica y cualquier remate necesario antes de empezar.`
    ];
  }

  if (/trust|proof|confianza|local/.test(blockType)) {
    return [
      `Para contratar ${niche} en ${city}, ayuda trabajar con un proceso claro: revisión previa, explicación del alcance, presupuesto entendible y comprobación final.`,
      `Las señales útiles son concretas: comunicación directa, materiales definidos, tiempos razonables y ausencia de promesas que no se puedan verificar.`
    ];
  }

  if (/cta|contact|conversion|hero/.test(blockType)) {
    return [
      `Si necesitas ${niche} en ${city}, prepara una descripción breve del problema, fotos si las tienes y el horario en el que se puede revisar el trabajo.`,
      `Con esa información es más fácil orientar el alcance, priorizar la urgencia y evitar presupuestos genéricos.`
    ];
  }

  return [
    `En ${city}, un servicio de ${niche} debe empezar con una revisión clara del caso y una explicación sencilla de las opciones disponibles.`,
    `Para evitar soluciones genéricas, se tienen en cuenta aspectos como ${topicText}, además del estado real del trabajo y el nivel de acabado esperado.`
  ];
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
