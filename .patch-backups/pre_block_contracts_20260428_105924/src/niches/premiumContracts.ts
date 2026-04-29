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
    allowedTerms: ['cerradura', 'bombín', 'cilindro', 'escudo protector', 'apertura', 'llaves', 'antibumping', 'persiana metálica', 'cierre metálico', 'control de acceso', 'amaestramiento', 'cerradero', 'resbalón', 'antitaladro', 'antiganzúa', 'antirotura', 'perfil europeo', 'leva larga', 'leva corta', 'picaporte', 'cerradura multipunto', 'cerradura de sobreponer', 'puerta blindada', 'puerta acorazada', 'escudo magnético', 'cilindro modular', 'igualamiento de llaves'],
    forbiddenTerms: ['tubería', 'fuga de agua', 'grifo', 'bajante', 'rodillo', 'pintura plástica', 'cuadro eléctrico', 'enchufe'],
    requiredSections: ['apertura y diagnóstico', 'cerraduras y bombines', 'seguridad preventiva', 'zonas de cobertura', 'faq'],
    requiredFaqSignals: ['cambio de bombín', 'apertura', 'cerradura', 'seguridad'],
    premiumAngles: ['diagnóstico antes de sustituir piezas', 'diferenciar bombín, escudo y cerradura', 'explicar cuándo reparar y cuándo cambiar', 'evitar promesas absolutas de apertura sin daño', 'revisar alineación de puerta, cerradero y resbalón antes de culpar al bombín', 'diferenciar cilindro de perfil europeo, cerradura multipunto y escudo protector', 'explicar compatibilidad entre bombín, leva, escudo y grosor de puerta']
  },
  fontaneros: {
    scoreFloor: 88,
    allowedTerms: ['fuga', 'tubería', 'grifo', 'cisterna', 'desagüe', 'bajante', 'atasco', 'desatasco', 'termo', 'sanitario', 'llave de paso', 'presión', 'sifón', 'latiguillo', 'junta', 'válvula', 'colector', 'arquetas', 'bote sifónico', 'humedad', 'caudal', 'purga', 'manguito', 'llave de escuadra', 'calentador', 'radiador'],
    forbiddenTerms: ['cerradura', 'bombín', 'cilindro', 'antibumping', 'ganzúa', 'llaves maestras', 'rodillo', 'pintura plástica'],
    requiredSections: ['averías de agua', 'diagnóstico de fugas', 'desatascos', 'materiales y reparación', 'faq'],
    requiredFaqSignals: ['fuga', 'atasco', 'tubería', 'grifo'],
    premiumAngles: ['priorizar corte de agua y diagnóstico', 'explicar factores que cambian el presupuesto', 'distinguir reparación puntual y sustitución de tramo', 'separar fuga visible, fuga oculta y atasco antes de presupuestar', 'comprobar presión, llaves de paso y estado de juntas antes de sustituir', 'explicar cuándo conviene reparar, limpiar o cambiar un tramo']
  },
  pintores: {
    scoreFloor: 85,
    allowedTerms: ['pintura interior', 'pintura exterior', 'alisado de paredes', 'humedades', 'preparación de superficies', 'esmalte', 'lacado', 'barniz', 'fachada', 'gotelé', 'plastecido', 'acabado lavable', 'imprimación', 'masillado', 'lijado', 'selladora', 'pintura plástica', 'pintura al silicato', 'pintura antihumedad', 'veladura', 'rodillo', 'brocha', 'cinta de carrocero', 'protección de suelos', 'repaso de juntas'],
    forbiddenTerms: ['cerradura', 'bombín', 'antibumping', 'ganzúa', 'tubería', 'fuga de agua', 'grifo', 'bajante', 'cuadro eléctrico', 'enchufe'],
    requiredSections: ['preparación de superficies', 'pintura interior y exterior', 'acabados y materiales', 'protección de vivienda', 'faq'],
    requiredFaqSignals: ['alisado', 'humedades', 'acabado', 'pintura'],
    premiumAngles: ['explicar preparación antes de pintar', 'diferenciar acabados por uso de estancia', 'tratar humedades antes de cubrir', 'limpieza y protección del inmueble', 'diferenciar imprimación, selladora y acabado final', 'valorar soporte, absorción y reparación previa antes de aplicar pintura', 'explicar tiempos de secado y repasos sin prometer resultados imposibles']
  },
  electricistas: {
    scoreFloor: 85,
    allowedTerms: ['cuadro eléctrico', 'diferencial', 'magnetotérmico', 'enchufe', 'cableado', 'iluminación', 'boletín eléctrico', 'avería eléctrica', 'cortocircuito', 'potencia', 'ICP', 'IGA', 'PIA', 'protección diferencial', 'toma de tierra', 'derivación', 'línea eléctrica', 'punto de luz', 'canalización', 'reglamento electrotécnico', 'REBT', 'carga eléctrica', 'sobrecarga'],
    forbiddenTerms: ['cerradura', 'bombín', 'antibumping', 'tubería', 'fuga de agua', 'rodillo', 'pintura plástica', 'barniz'],
    requiredSections: ['diagnóstico eléctrico', 'cuadro y protecciones', 'averías y puntos de luz', 'seguridad normativa', 'faq'],
    requiredFaqSignals: ['cuadro eléctrico', 'diferencial', 'enchufe', 'boletín'],
    premiumAngles: ['priorizar seguridad y corte de suministro', 'diferenciar avería, mejora y legalización', 'evitar prometer boletines sin inspección', 'comprobar cuadro, diferencial y magnetotérmicos antes de cambiar componentes', 'explicar cuándo una derivación exige revisión de línea o toma de tierra', 'separar reparación urgente, ampliación de puntos y adecuación normativa']
  },
  carpinteros: {
    scoreFloor: 85,
    allowedTerms: ['madera', 'puerta', 'armario', 'tarima', 'mueble a medida', 'herraje', 'bisagra', 'lacado', 'ajuste', 'acabado', 'tablero MDF', 'melamina', 'contrachapado', 'barnizado', 'canteado', 'rodapié', 'jamba', 'tapajuntas', 'guía corredera', 'cajón', 'escuadra', 'escuadrado', 'nivelación', 'holgura'],
    forbiddenTerms: ['antibumping', 'ganzúa', 'fuga de agua', 'cuadro eléctrico', 'pintura plástica', 'desatasco'],
    requiredSections: ['medición y diseño', 'materiales y acabados', 'instalación y ajuste', 'mantenimiento', 'faq'],
    requiredFaqSignals: ['medición', 'material', 'acabado', 'instalación'],
    premiumAngles: ['explicar medición previa', 'diferenciar madera, tablero y acabado', 'tratar holguras y ajustes como señales de calidad', 'comprobar nivelación, herrajes y holguras antes de instalar', 'separar fabricación, ajuste en obra y acabado final', 'explicar mantenimiento según material y uso']
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
    premiumAngles: unique([...(playbook.toneProfile?.editorialAngles || []), ...playbook.decisionCriteria.map(c => c.whyItMatters), ...playbook.validTrustSignals.map(s => s.label)]).slice(0, 12)
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
