import type { NichePlaybook, SupportedNicheId } from './types.js';
import { buildNicheIntelligenceProfile } from '../niche-intelligence/index.js';

function titleCase(value: string): string {
  return String(value || 'servicio local')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ') || 'Servicio Local';
}

function unique(values: string[], max = 64): string[] {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean))).slice(0, max);
}

export function buildGenericNichePlaybook(rawNiche: string): NichePlaybook {
  const displayName = titleCase(rawNiche);
  const profile = buildNicheIntelligenceProfile({ niche: displayName });
  const vocabulary = unique([
    displayName,
    ...profile.technicalVocabulary,
    ...profile.decisionCriteria,
    ...profile.serviceTemplates,
  ], 32);
  const trustAssets = unique(profile.trustAssets.length ? profile.trustAssets : [
    'diagnóstico inicial claro',
    'alcance explicado antes de empezar',
    'presupuesto según datos reales',
    'seguimiento del caso',
  ], 10);
  const services = unique(profile.serviceTemplates.length ? profile.serviceTemplates : [
    `Valoración de ${displayName}`,
    `Servicio especializado de ${displayName}`,
    `Seguimiento y resolución`,
    `Mantenimiento o mejora`,
  ], 8);
  const objections = unique(profile.buyerObjections.length ? profile.buyerObjections : [
    'dudas sobre el alcance real',
    'incertidumbre sobre el presupuesto',
    'necesidad de explicaciones claras',
  ], 8);
  const safeClaims = unique(profile.safeClaimAlternatives.length ? profile.safeClaimAlternatives : [
    'alcance condicionado a una valoración previa',
    'recomendación adaptada al caso concreto',
    'condiciones explicadas antes de contratar',
  ], 10);
  const forbiddenClaims = unique(profile.forbiddenClaims.length ? profile.forbiddenClaims : [
    'garantizado al 100%',
    'sin riesgos',
    'resultado asegurado',
    'mejor precio siempre',
  ], 12);
  const faqSeeds = unique(profile.faqSeeds.length ? profile.faqSeeds : [
    `¿Qué información conviene aportar antes de contratar ${displayName}?`,
    '¿Cómo se define el alcance del servicio?',
    '¿Qué factores pueden cambiar el presupuesto?',
    '¿Cuándo es recomendable una valoración previa?',
  ], 8);

  return {
    id: 'generic_services' as SupportedNicheId,
    displayName,
    aliases: unique([rawNiche, displayName, profile.verticalLabel], 8),
    schemaTypes: ['WebPage', 'Service', 'BreadcrumbList'],
    allowedVocabulary: vocabulary,
    forbiddenVocabulary: unique([...forbiddenClaims, '100% garantizado', 'ranking garantizado', 'reseñas verificadas sin fuente'], 16),
    prohibitedClaims: forbiddenClaims,
    validTrustSignals: trustAssets.slice(0, 6).map((label, index) => ({
      id: `generic-trust-${index + 1}`,
      label,
      description: `${label} aplicado a ${displayName} con datos verificables y sin promesas absolutas.`,
      requiresVerification: /reseñ|certific|colegiad|garant/i.test(label),
    })),
    coreServices: services,
    bofuVariants: services.slice(0, 5).map((label, index) => ({
      slug: label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `servicio-${index + 1}`,
      label,
      intent: index === 0 ? 'transactional' : 'commercial',
      funnelStage: 'BOFU',
      angle: profile.decisionCriteria[index] || 'decisión informada con alcance claro',
    })),
    commonObjections: objections,
    faqBank: faqSeeds.map((question) => ({
      question,
      answerGuidance: `La respuesta debe explicar ${displayName} de forma prudente, contextual y sin prometer resultados no verificados.`,
      intent: 'MOFU',
      blockHint: 'faq',
    })),
    commonMistakes: unique([
      'prometer resultados absolutos sin valoración previa',
      'usar vocabulario genérico sin señales del nicho',
      'inventar reseñas, direcciones o credenciales',
      'ocultar factores que cambian el presupuesto',
    ], 8),
    decisionCriteria: unique(profile.decisionCriteria.length ? profile.decisionCriteria : [
      'alcance real del caso',
      'datos disponibles para valorar',
      'plazos y recursos necesarios',
      'riesgos o limitaciones',
    ], 10).map((label, index) => ({
      id: `generic-decision-${index + 1}`,
      label,
      whyItMatters: `Ayuda a decidir con criterio antes de contratar ${displayName}.`,
      proofExpected: ['explicación clara', 'datos verificables', 'alcance por escrito'],
    })),
    usefulLocalEntities: [],
    toneProfile: {
      voice: ['claro', 'profesional', 'prudente', profile.tone],
      forbiddenCliches: ['los mejores', 'líderes indiscutibles', 'resultados garantizados', 'precio imbatible'],
      preferredOpenings: [`Antes de contratar ${displayName}, conviene aclarar el alcance real.`, `Un buen servicio de ${displayName} empieza por una valoración honesta.`],
      editorialAngles: unique([...profile.decisionCriteria, ...profile.trustAssets, ...safeClaims], 12),
    },
    legalRiskPolicy: {
      prohibitedClaims: forbiddenClaims,
      allowedSafeClaims: safeClaims,
      requiredDisclaimers: ['La valoración final depende de los datos reales del caso.', 'No se deben inventar credenciales, reseñas, dirección ni teléfono.'],
      verificationRequiredFor: ['reseñas', 'certificaciones', 'dirección física', 'garantías concretas', 'precios cerrados'],
      pricingPolicy: {
        allowExactPrices: false,
        allowedLanguage: ['presupuesto según alcance', 'orientación inicial', 'factores que influyen en el coste'],
        forbiddenLanguage: ['precio cerrado siempre', 'gratis garantizado', 'sin coste oculto garantizado'],
      },
      guaranteePolicy: {
        allowSpecificYears: false,
        allowedLanguage: ['condiciones explicadas por escrito', 'garantía sujeta al servicio y materiales reales'],
        forbiddenLanguage: ['garantía total', 'resultado permanente asegurado'],
      },
    },
    blockSemantics: {
      servicesGrid: {
        categories: services.slice(0, 4).map((label, index) => ({
          label,
          summary: `Servicio de ${displayName} explicado con alcance, límites y criterios de decisión.`,
          situations: objections.slice(0, 3),
          decisionFactor: profile.decisionCriteria[index] || 'alcance real del caso',
        })),
        trustBullets: trustAssets.slice(0, 4),
      },
      processSteps: {
        steps: [
          { title: 'Valoración inicial', detail: 'Se recogen datos del caso y del contexto local.', riskControl: 'No prometer resultados antes de validar información.' },
          { title: 'Definición del alcance', detail: 'Se separa lo necesario, lo opcional y lo que requiere revisión.', riskControl: 'Evitar presupuestos cerrados sin base real.' },
          { title: 'Propuesta y ejecución', detail: 'Se plantea una solución proporcional al objetivo.', riskControl: 'Documentar condiciones, límites y próximos pasos.' },
        ],
      },
      faq: {
        priorityQuestions: faqSeeds,
        answerPatterns: ['respuesta breve, útil y prudente', 'mencionar factores de decisión', 'evitar claims absolutos'],
      },
      priceGuidance: {
        factors: unique(profile.decisionCriteria, 5).map((label) => ({
          label,
          whyItChanges: `Puede cambiar el alcance o dedicación necesaria para ${displayName}.`,
          safeLanguage: 'Conviene valorarlo antes de cerrar presupuesto.',
        })),
        comparisonRows: [['Factor', 'Por qué importa'], ...unique(profile.decisionCriteria, 4).map((label) => [label, 'Afecta al alcance y a la recomendación final'])],
      },
    },
    examples: {
      good: safeClaims.slice(0, 4),
      bad: forbiddenClaims.slice(0, 4),
    },
  };
}
