import { classifyNicheVertical, normalizeBuyerIntent } from './classifyNiche.js';
import { uniqueClean } from './text.js';
import type { BuildNicheProfileInput, NicheIntelligenceProfile, VerticalProfile } from './types.js';
import { VERTICAL_PROFILES } from './verticalProfiles.js';
import { resolveVerticalPack } from '../knowledge-packs/base.js';

const NICHE_OVERRIDES: Record<string, Partial<Pick<VerticalProfile, 'vocabulary' | 'decisionCriteria' | 'trustAssets' | 'buyerObjections' | 'serviceTemplates' | 'faqSeeds'>>> = {
  cerrajeros: {
    vocabulary: ['bombín', 'cilindro', 'escudo protector', 'cerradura multipunto', 'resbalón', 'cerradero', 'perfil europeo', 'antibumping', 'antitaladro', 'llaves', 'puerta blindada'],
    decisionCriteria: ['si la llave gira', 'estado del bombín', 'alineación del cerradero', 'tipo de escudo', 'riesgo de apertura destructiva'],
    trustAssets: ['diagnóstico antes de sustituir piezas', 'apertura no destructiva cuando procede', 'presupuesto antes de cambiar bombín', 'factura del servicio'],
    buyerObjections: ['miedo a romper la puerta', 'duda sobre cambiar bombín o cerradura completa', 'recargo por urgencia', 'seguridad tras pérdida de llaves'],
    serviceTemplates: ['Apertura con diagnóstico previo', 'Cambio de bombín o cilindro', 'Revisión de cerradura y escudo', 'Refuerzo de seguridad', 'Ajuste de cerradero y resbalón'],
    faqSeeds: ['¿Cuándo basta con cambiar el bombín?', '¿Se puede abrir sin dañar la puerta?', '¿Qué influye en el precio de una urgencia?']
  },
  fontaneros: {
    vocabulary: ['fuga', 'tubería', 'llave de paso', 'bajante', 'sifón', 'bote sifónico', 'latiguillo', 'junta', 'presión', 'desagüe', 'termo'],
    decisionCriteria: ['origen visible u oculto', 'corte de agua', 'presión', 'estado de juntas', 'tramo afectado', 'riesgo de humedad'],
    trustAssets: ['localización de fuga antes de romper', 'presupuesto por tramo afectado', 'prioridad al corte de agua', 'comprobación de presión'],
    buyerObjections: ['miedo a romper más de lo necesario', 'urgencia por humedad', 'duda entre reparar o cambiar tramo', 'coste de materiales'],
    serviceTemplates: ['Diagnóstico de fuga', 'Reparación de tubería o latiguillo', 'Desatasco y revisión de sifón', 'Cambio de grifo o sanitario', 'Comprobación de presión'],
    faqSeeds: ['¿Cómo saber si la fuga es visible u oculta?', '¿Cuándo conviene cambiar un tramo?', '¿Qué datos ayudan a presupuestar?']
  },
  electricistas: {
    vocabulary: ['cuadro eléctrico', 'diferencial', 'magnetotérmico', 'PIA', 'IGA', 'toma de tierra', 'derivación', 'cableado', 'boletín eléctrico', 'REBT'],
    decisionCriteria: ['protección que salta', 'línea afectada', 'carga eléctrica', 'toma de tierra', 'estado del cuadro', 'adecuación normativa'],
    trustAssets: ['corte de suministro seguro', 'diagnóstico de línea antes de cambiar piezas', 'explicación normativa', 'comprobación de protecciones'],
    buyerObjections: ['miedo a riesgo eléctrico', 'duda por diferencial que salta', 'coste de boletín', 'compatibilidad de nuevas líneas'],
    serviceTemplates: ['Diagnóstico eléctrico', 'Revisión de cuadro y protecciones', 'Instalación de puntos de luz', 'Adecuación normativa', 'Comprobación de seguridad'],
    faqSeeds: ['¿Por qué salta el diferencial?', '¿Cuándo hace falta boletín eléctrico?', '¿Qué se revisa antes de ampliar potencia?']
  },
  abogados: {
    vocabulary: ['consulta inicial', 'documentación', 'plazos', 'viabilidad', 'demanda', 'reclamación', 'contrato', 'notificación', 'prueba'],
    decisionCriteria: ['plazo aplicable', 'prueba documental', 'coste del procedimiento', 'vía adecuada', 'riesgo procesal'],
    trustAssets: ['valoración documental', 'honorarios claros', 'explicación de plazos', 'estrategia según pruebas'],
    buyerObjections: ['miedo a costes ocultos', 'duda sobre viabilidad', 'plazos que vencen', 'lenguaje jurídico confuso'],
    serviceTemplates: ['Consulta inicial', 'Revisión documental', 'Valoración de viabilidad', 'Estrategia legal', 'Seguimiento del expediente'],
    faqSeeds: ['¿Qué documentación debo aportar?', '¿Cómo se valora la viabilidad?', '¿Qué plazos pueden afectar?']
  },
  dentistas: {
    vocabulary: ['primera valoración', 'diagnóstico dental', 'radiografía', 'higiene', 'implante', 'ortodoncia', 'encía', 'caries', 'tratamiento', 'seguimiento'],
    decisionCriteria: ['estado bucodental', 'pruebas diagnósticas', 'historial', 'urgencia del dolor', 'plan de tratamiento', 'seguimiento'],
    trustAssets: ['primera valoración', 'plan de tratamiento explicado', 'consentimiento informado', 'seguimiento clínico'],
    buyerObjections: ['miedo al dolor', 'duda sobre presupuesto', 'duración del tratamiento', 'ansiedad dental'],
    serviceTemplates: ['Primera valoración dental', 'Diagnóstico y pruebas', 'Tratamiento planificado', 'Seguimiento', 'Prevención e higiene'],
    faqSeeds: ['¿Qué incluye la primera valoración?', '¿Cuándo se confirma el presupuesto?', '¿Qué opciones hay si tengo dolor?']
  }
};

function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findOverride(niche: string): Partial<VerticalProfile> {
  const key = normalizeKey(niche);
  const direct = NICHE_OVERRIDES[key];
  if (direct) return direct;
  const match = Object.entries(NICHE_OVERRIDES).find(([overrideKey]) => key.includes(overrideKey) || overrideKey.includes(key));
  return match?.[1] ?? {};
}

export function buildNicheIntelligenceProfile(input: BuildNicheProfileInput = {}): NicheIntelligenceProfile {
  const niche = String(input.niche || 'servicio especializado').replace(/\s+/g, ' ').trim();
  const vertical = classifyNicheVertical(niche);
  const base = VERTICAL_PROFILES[vertical] ?? VERTICAL_PROFILES.generic_services;
  const override = findOverride(niche);
  const intentSeed = `${input.intent ?? ''} ${input.seedText ?? ''} ${niche}`;
  const intent = normalizeBuyerIntent(intentSeed, base.defaultIntent);
  const preferredCtas = uniqueClean([
    ...(base.preferredCtas[intent] ?? []),
    ...(base.preferredCtas[base.defaultIntent] ?? []),
    ...(base.preferredCtas.diagnostic_service ?? []),
    'Solicitar orientación inicial'
  ], 5);

  const complianceChecklist = uniqueClean([
    ...(base.complianceChecklist ?? []),
    `Verificar ${niche} en ${input.city || 'localidad'}`,
    'Confirmar señales de confianza específicas',
    'Validar alternativas legales a claims absolutos'
  ], 8);

  const copyBrief = `
MODO DE REDACCIÓN: Corporativo Minimalista Premium
NICHE: ${niche}
VERTICAL: ${base.label}
INTENT: ${intent}
TONO: ${base.tone}

DIRECTRICES CLAVE:
- Evitar claims absolutos (garantizado, 100%, siempre).
- Priorizar vocabulario técnico: ${uniqueClean([...(override.vocabulary ?? []), ...base.vocabulary], 8).join(', ')}.
- Enfoque en: ${uniqueClean([...(override.decisionCriteria ?? []), ...base.decisionCriteria], 5).join(', ')}.
- Pruebas de confianza: ${uniqueClean([...(override.trustAssets ?? []), ...base.trustAssets], 4).join(', ')}.
`.trim();

  const verticalPack = resolveVerticalPack(niche);

  const technicalVocabulary = uniqueClean([
    ...(override.vocabulary ?? []),
    ...verticalPack.allowedEntities,
    ...base.vocabulary,
    niche
  ], 28);

  const decisionCriteria = uniqueClean([
    ...(override.decisionCriteria ?? []),
    ...verticalPack.technicalConcepts,
    ...base.decisionCriteria
  ], 16);

  const trustAssets = uniqueClean([
    ...(override.trustAssets ?? []),
    ...verticalPack.trustSignals,
    ...base.trustAssets
  ], 12);

  const source = verticalPack.allowedEntities.length > 0 ? 'expert_pack' : (vertical === 'generic_services' ? 'fallback' : 'classified');

  return {
    vertical,
    verticalLabel: base.label,
    niche,
    city: input.city,
    intent,
    legalSensitivity: base.legalSensitivity,
    tone: base.tone,
    minimumTechnicalDepth: base.minimumTechnicalDepth,
    technicalVocabulary,
    decisionCriteria,
    trustAssets,
    buyerObjections: uniqueClean([...(override.buyerObjections ?? []), ...base.buyerObjections], 12),
    preferredCtas,
    forbiddenClaims: uniqueClean([...(base.forbiddenClaims || []), ...(verticalPack.forbiddenTerms || [])], 18),
    safeClaimAlternatives: uniqueClean(base.safeClaimAlternatives, 12),
    localModifiers: uniqueClean(base.localModifiers, 12),
    serviceTemplates: uniqueClean([...(override.serviceTemplates ?? []), ...base.serviceTemplates], 8),
    faqSeeds: uniqueClean([...(override.faqSeeds ?? []), ...base.faqSeeds], 8),
    localAreas: uniqueClean(input.localAreas ?? [], 10),
    source,
    complianceChecklist,
    copyBrief,
    verticalEnrichment: {
      ...(base as any).enrichment || {},
      authorityConcepts: verticalPack.technicalConcepts,
      trustMarkers: verticalPack.trustSignals
    }
  };
}
