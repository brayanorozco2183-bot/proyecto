import { requireNichePlaybook } from './playbookLoader.js';
import { buildBlockPayload } from './playbookSelectors.js';
import { buildSeed, rotateSeeded } from '../utils/designSeed.js';

export function resolveBlockPlaybookPayload(niche: string, blockType: string, scope = '') {
  const playbook = requireNichePlaybook(niche);
  return buildBlockPayload(playbook, blockType, scope);
}

function pickIntroVariant(options: string[], niche: string, blockType: string, city = ''): string {
  return rotateSeeded(options, buildSeed(niche, city, blockType, 'intro_variant'))[0] || options[0] || '';
}

function normalizeText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function enrichServiceItems(items: any[] = [], niche: string, city = '') {
  const place = city ? ` en ${city}` : '';
  const service = normalizeText(niche) || 'servicio especializado';

  return items.map((item: any, index: number) => {
    const title = normalizeText(item?.title || item?.label || item?.name);
    const summary = normalizeText(item?.body || item?.summary);
    const meta = Array.isArray(item?.meta) ? item.meta.map(normalizeText).filter(Boolean) : [];
    const criterion = normalizeText(meta[0] || item?.decisionFactor);
    const criterionSentence = criterion
      ? `Criterio de decisión: ${criterion}.`
      : `Criterio de decisión: confirmar causa, alcance, materiales y riesgo antes de ejecutar.`;

    const body = [
      summary || `Se revisa el caso real de ${service}${place} antes de proponer una solución cerrada.`,
      criterionSentence,
      `Antes de intervenir se prioriza diagnóstico, explicación del alcance y comprobación final para evitar una descripción genérica del servicio.`
    ].join(' ');

    return {
      title: title || `Servicio ${index + 1}`,
      body,
      meta: meta.length ? meta : ['Diagnóstico previo', 'Alcance explicado']
    };
  });
}

export function hydrateSemanticDraftFromPlaybook(niche: string, blockType: string, city = '') {
  const payload = resolveBlockPlaybookPayload(niche, blockType, city);

  if (blockType === 'services_grid') {
    return {
      intro: [pickIntroVariant([
        `Casos habituales y decisiones técnicas que suelen activar un servicio de ${niche}.`,
        `Servicios y situaciones frecuentes que conviene ordenar con criterio antes de intervenir.`,
        `Qué suele resolver un servicio de ${niche} cuando el problema exige diagnóstico y ejecución clara.`
      ], niche, blockType, city)],
      items: enrichServiceItems(payload.services || [], niche, city),
      trustBullets: payload.trustBullets || [],
      decisionFactors: payload.decisionFactors || [],
      commonMistakes: payload.commonMistakes || []
    };
  }

  if (blockType === 'process_steps') {
    return {
      intro: [pickIntroVariant([
        `Secuencia de trabajo que conviene seguir para resolver ${niche} con criterio y sin improvisaciones.`,
        `Pasos que ayudan a organizar ${niche} con una lógica de diagnóstico, intervención y revisión final.`,
        `Proceso recomendado para ejecutar ${niche} de forma ordenada y con menos margen para rehacer trabajo.`
      ], niche, blockType, city)],
      items: payload.services || [],
      decisionFactors: payload.decisionFactors || [],
      commonMistakes: payload.commonMistakes || []
    };
  }

  if (blockType === 'faq') {
    return {
      intro: [pickIntroVariant([
        `Dudas habituales que conviene resolver antes de contratar un servicio de ${niche}.`,
        `Preguntas frecuentes que ayudan a valorar alcance, proceso y expectativas realistas.`,
        `Respuestas útiles para entender qué cambia según el caso y qué conviene confirmar antes de empezar.`
      ], niche, blockType, city)],
      faqItems: payload.faqItems || [],
      trustBullets: payload.trustBullets || []
    };
  }

  if (blockType === 'price_guidance') {
    return {
      intro: [pickIntroVariant([
        `Factores que mueven el presupuesto y conviene explicar con claridad antes de intervenir.`,
        `Variables que cambian el alcance del trabajo y por tanto la valoración final del servicio.`,
        `Puntos que influyen en el presupuesto cuando el acceso, las piezas o el estado previo no son iguales en todos los casos.`
      ], niche, blockType, city)],
      decisionFactors: payload.decisionFactors || [],
      commonMistakes: payload.commonMistakes || [],
      table: payload.priceRows
        ? {
            columns: ['Factor', 'Qué cambia', 'Cómo se explica al cliente'],
            rows: payload.priceRows
          }
        : undefined
    };
  }

  return null;
}