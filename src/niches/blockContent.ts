import { requireNichePlaybook } from './playbookLoader.js';
import { buildBlockPayload } from './playbookSelectors.js';

export function resolveBlockPlaybookPayload(niche: string, blockType: string) {
  const playbook = requireNichePlaybook(niche);
  return buildBlockPayload(playbook, blockType);
}

export function hydrateSemanticDraftFromPlaybook(niche: string, blockType: string) {
  const payload = resolveBlockPlaybookPayload(niche, blockType);

  if (blockType === 'services_grid') {
    return {
      intro: [`Bloques de servicio y situaciones reales que suelen activar una contratación de ${niche}.`],
      items: payload.services || [],
      trustBullets: payload.trustBullets || [],
      decisionFactors: payload.decisionFactors || [],
      commonMistakes: payload.commonMistakes || []
    };
  }

  if (blockType === 'process_steps') {
    return {
      intro: [`Secuencia operativa que conviene seguir para resolver ${niche} con criterio y sin improvisaciones.`],
      items: payload.services || [],
      decisionFactors: payload.decisionFactors || [],
      commonMistakes: payload.commonMistakes || []
    };
  }

  if (blockType === 'faq') {
    return {
      intro: [`Objeciones y dudas que suelen aparecer antes de contratar un servicio de ${niche}.`],
      faqItems: payload.faqItems || [],
      trustBullets: payload.trustBullets || []
    };
  }

  if (blockType === 'price_guidance') {
    return {
      intro: [`Variables que mueven el presupuesto y conviene explicar con claridad antes de intervenir.`],
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