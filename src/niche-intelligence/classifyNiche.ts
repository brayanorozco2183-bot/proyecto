import type { BuyerIntent, NicheVertical } from './types.js';
import { normalizeForNicheMatch } from './text.js';

const VERTICAL_RULES: Array<{ vertical: NicheVertical; patterns: RegExp[] }> = [
  { vertical: 'home_services', patterns: [/cerraj/, /fontaner/, /electric/, /pintor/, /carpinter/, /reforma/, /climatiz/, /calefacci/, /persian/, /cristaler/, /jardin/, /limpieza/, /desatasc/, /mantenim.*hogar/] },
  { vertical: 'healthcare', patterns: [/dentist/, /clinic/, /m[eé]dic/, /psicolog/, /fisioter/, /podolog/, /veterin/, /oftalm/, /traumat/, /dermat/, /salud/, /nutricion/] },
  { vertical: 'legal', patterns: [/abogad/, /despacho/, /laboral/, /penal/, /civil/, /mercantil/, /familia/, /herencia/, /divorcio/, /juridic/, /procurador/, /notar/] },
  { vertical: 'education', patterns: [/academia/, /formaci/, /curso/, /clase/, /idioma/, /ingles/, /oposicion/, /profesor/, /colegio/, /escuela/, /master/] },
  { vertical: 'automotive', patterns: [/taller/, /mecanic/, /coche/, /auto/, /neumatic/, /itv/, /chapa/, /pintura.*veh/, /moto/, /grua/] },
  { vertical: 'hospitality', patterns: [/restaurante/, /bar\b/, /cafeter/, /hotel/, /hostal/, /menu/, /tapas/, /pizzeria/, /asador/, /catering/] },
  { vertical: 'beauty', patterns: [/peluquer/, /estetic/, /belleza/, /uñas/, /manicura/, /barber/, /depil/, /laser/, /maquillaje/, /spa/] },
  { vertical: 'real_estate', patterns: [/inmobili/, /pisos?/, /vivienda/, /alquiler/, /venta.*casa/, /tasaci/, /administrador.*fincas/, /finca/] },
  { vertical: 'finance', patterns: [/asesor.*financ/, /seguros?/, /hipotec/, /gestor.*patrimon/, /contabilidad/, /fiscal/, /inversion/, /prestamo/] },
  { vertical: 'b2b_services', patterns: [/consultor/, /marketing/, /seo\b/, /software/, /informat/, /agencia/, /auditor/, /recursos humanos/, /proteccion.*datos/, /logistic/] },
  { vertical: 'local_retail', patterns: [/tienda/, /comercio/, /zapater/, /optica/, /florister/, /muebles/, /ropa/, /joyer/, /ferreter/] }
];

export function classifyNicheVertical(niche: unknown): NicheVertical {
  const normalized = normalizeForNicheMatch(niche);
  for (const rule of VERTICAL_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) return rule.vertical;
  }
  return 'generic_services';
}

export function normalizeBuyerIntent(value: unknown, fallback: BuyerIntent): BuyerIntent {
  const normalized = normalizeForNicheMatch(value);
  if (!normalized) return fallback;
  if (/urgent|urgencia|24h|inmediata|averia|emergencia|ahora/.test(normalized)) return 'urgent_service';
  if (/diagnost|revision|averia|valoracion tecnica|reparacion|consulta tecnica/.test(normalized)) return 'diagnostic_service';
  if (/cita|consulta|valoracion inicial|primera visita|asesoria/.test(normalized)) return 'appointment_consulting';
  if (/presupuesto|proyecto|reforma|instalacion|medicion|propuesta/.test(normalized)) return 'quote_project';
  if (/comparar|mejor|opiniones|precio|guia|dudas/.test(normalized)) return 'comparison_research';
  if (/cerca|zona|horario|ubicacion|barrio|local/.test(normalized)) return 'local_discovery';
  return fallback;
}
