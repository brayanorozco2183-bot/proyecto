import { requireNichePlaybook } from './playbookLoader.js';

export interface PremiumNicheContract {
  niche: string;
  allowedTerms: string[];
  forbiddenTerms: string[];
  requiredSections: string[];
  requiredFaqSignals: string[];
  premiumAngles: string[];
  scoreFloor: number;
}

const CONTRACTS: Record<string, Omit<PremiumNicheContract, 'niche'>> = {
  cerrajeros: {
    scoreFloor: 85,
    allowedTerms: ['cerradura', 'bombín', 'cilindro', 'escudo protector', 'apertura', 'llaves', 'antibumping', 'persiana metálica', 'cierre metálico', 'control de acceso', 'amaestramiento', 'cerradero', 'resbalón'],
    forbiddenTerms: ['tubería', 'fuga de agua', 'grifo', 'bajante', 'rodillo', 'pintura plástica', 'cuadro eléctrico', 'enchufe'],
    requiredSections: ['apertura y diagnóstico', 'cerraduras y bombines', 'seguridad preventiva', 'zonas de cobertura', 'faq'],
    requiredFaqSignals: ['cambio de bombín', 'apertura', 'cerradura', 'seguridad'],
    premiumAngles: ['diagnóstico antes de sustituir piezas', 'diferenciar bombín, escudo y cerradura', 'explicar cuándo reparar y cuándo cambiar', 'evitar promesas absolutas de apertura sin daño']
  },
  fontaneros: {
    scoreFloor: 88,
    allowedTerms: ['fuga', 'tubería', 'grifo', 'cisterna', 'desagüe', 'bajante', 'atasco', 'desatasco', 'termo', 'sanitario', 'llave de paso', 'presión', 'sifón'],
    forbiddenTerms: ['cerradura', 'bombín', 'cilindro', 'antibumping', 'ganzúa', 'llaves maestras', 'rodillo', 'pintura plástica'],
    requiredSections: ['averías de agua', 'diagnóstico de fugas', 'desatascos', 'materiales y reparación', 'faq'],
    requiredFaqSignals: ['fuga', 'atasco', 'tubería', 'grifo'],
    premiumAngles: ['priorizar corte de agua y diagnóstico', 'explicar factores que cambian el presupuesto', 'distinguir reparación puntual y sustitución de tramo']
  },
  pintores: {
    scoreFloor: 85,
    allowedTerms: ['pintura interior', 'pintura exterior', 'alisado de paredes', 'humedades', 'preparación de superficies', 'esmalte', 'lacado', 'barniz', 'fachada', 'gotelé', 'plastecido', 'acabado lavable', 'imprimación', 'masillado'],
    forbiddenTerms: ['cerradura', 'bombín', 'antibumping', 'ganzúa', 'tubería', 'fuga de agua', 'grifo', 'bajante', 'cuadro eléctrico', 'enchufe'],
    requiredSections: ['preparación de superficies', 'pintura interior y exterior', 'acabados y materiales', 'protección de vivienda', 'faq'],
    requiredFaqSignals: ['alisado', 'humedades', 'acabado', 'pintura'],
    premiumAngles: ['explicar preparación antes de pintar', 'diferenciar acabados por uso de estancia', 'tratar humedades antes de cubrir', 'limpieza y protección del inmueble']
  },
  electricistas: {
    scoreFloor: 85,
    allowedTerms: ['cuadro eléctrico', 'diferencial', 'magnetotérmico', 'enchufe', 'cableado', 'iluminación', 'boletín eléctrico', 'avería eléctrica', 'cortocircuito', 'potencia'],
    forbiddenTerms: ['cerradura', 'bombín', 'antibumping', 'tubería', 'fuga de agua', 'rodillo', 'pintura plástica', 'barniz'],
    requiredSections: ['diagnóstico eléctrico', 'cuadro y protecciones', 'averías y puntos de luz', 'seguridad normativa', 'faq'],
    requiredFaqSignals: ['cuadro eléctrico', 'diferencial', 'enchufe', 'boletín'],
    premiumAngles: ['priorizar seguridad y corte de suministro', 'diferenciar avería, mejora y legalización', 'evitar prometer boletines sin inspección']
  },
  carpinteros: {
    scoreFloor: 85,
    allowedTerms: ['madera', 'puerta', 'armario', 'tarima', 'mueble a medida', 'herraje', 'bisagra', 'lacado', 'ajuste', 'acabado'],
    forbiddenTerms: ['antibumping', 'ganzúa', 'fuga de agua', 'cuadro eléctrico', 'pintura plástica', 'desatasco'],
    requiredSections: ['medición y diseño', 'materiales y acabados', 'instalación y ajuste', 'mantenimiento', 'faq'],
    requiredFaqSignals: ['medición', 'material', 'acabado', 'instalación'],
    premiumAngles: ['explicar medición previa', 'diferenciar madera, tablero y acabado', 'tratar holguras y ajustes como señales de calidad']
  }
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean)));
}

function normalize(value: any): string {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ\s-]/g, ' ').replace(/[\s-]+/g, ' ').trim();
}

export function getPremiumNicheContract(niche: string): PremiumNicheContract {
  const key = normalize(niche).replace(/ /g, '_');
  const base = CONTRACTS[key];
  if (base) return { niche: key, ...base, allowedTerms: unique(base.allowedTerms), forbiddenTerms: unique(base.forbiddenTerms) };

  const playbook = requireNichePlaybook(niche || 'cerrajeros');
  return {
    niche: playbook.id,
    scoreFloor: 85,
    allowedTerms: unique([playbook.displayName, ...playbook.aliases, ...playbook.allowedVocabulary, ...playbook.coreServices]),
    forbiddenTerms: unique(playbook.forbiddenVocabulary),
    requiredSections: ['servicios', 'proceso', 'precios orientativos', 'cobertura local', 'faq'],
    requiredFaqSignals: playbook.coreServices.slice(0, 4),
    premiumAngles: playbook.toneProfile?.editorialAngles || []
  };
}

export function evaluatePremiumContractCoverage(niche: string, text: string): { matchedAllowed: string[]; forbiddenHits: string[]; requiredCoverage: number; scoreFloor: number } {
  const contract = getPremiumNicheContract(niche);
  const source = normalize(text);
  const has = (term: string) => {
    const t = normalize(term);
    return t.length >= 3 && source.includes(t);
  };
  const matchedAllowed = contract.allowedTerms.filter(has);
  const forbiddenHits = contract.forbiddenTerms.filter(has);
  const denominator = Math.max(8, Math.min(24, contract.allowedTerms.length));
  const requiredCoverage = Math.min(100, Math.round((matchedAllowed.length / denominator) * 100));
  return { matchedAllowed, forbiddenHits, requiredCoverage, scoreFloor: contract.scoreFloor };
}

export function buildPremiumContractBrief(niche: string): string {
  const c = getPremiumNicheContract(niche);
  return `CONTRATO PREMIUM BLE V2.1 (${c.niche})\nVOCABULARIO DE AUTORIDAD QUE DEBE APARECER NATURALMENTE:\n${c.allowedTerms.slice(0, 24).map(t => `- ${t}`).join('\n')}\nSECCIONES/INTENCIONES OBLIGATORIAS:\n${c.requiredSections.map(t => `- ${t}`).join('\n')}\nÁNGULOS PREMIUM:\n${c.premiumAngles.map(t => `- ${t}`).join('\n')}\nFAQS: las preguntas no deben llevar numeración visible; nunca generar patrones como ¿3¿Cómo...? o 4) ¿Qué...?\nPROHIBIDO POR CONTAMINACIÓN:\n${c.forbiddenTerms.map(t => `- ${t}`).join('\n')}`;
}
