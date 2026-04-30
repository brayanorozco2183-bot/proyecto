import type { LocalContextKind } from './types.js';

const PREMIUM_TERMS = ['salamanca', 'retiro', 'sarria', 'pedralbes', 'eixample', 'chamberi', 'neguri', 'soto', 'monteclaro', 'pozuelo', 'majadahonda'];
const INDUSTRIAL_TERMS = ['poligono', 'industrial', 'nave', 'zona franca', 'almacen', 'logistica', 'parque empresarial'];
const COAST_TERMS = ['playa', 'costa', 'mar', 'puerto', 'maritimo', 'mediterraneo', 'atlántico', 'atlantico'];
const CENTRO_TERMS = ['centro', 'casco', 'histórico', 'historico', 'old town', 'ensanche', 'raval', 'sol'];
const CAPITALS = ['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'malaga', 'murcia', 'palma', 'bilbao', 'alicante', 'cordoba', 'valladolid', 'vigo', 'gijon', 'granada', 'a coruña', 'santander', 'toledo'];

function normalize(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function detectLocalContextKind(city?: string, contextualData?: Record<string, any>): LocalContextKind {
  const raw = [city, contextualData?.neighborhood, contextualData?.barrio, contextualData?.district, contextualData?.zona, contextualData?.subLocation]
    .filter(Boolean)
    .join(' ');
  const text = normalize(raw);
  if (!text.trim()) return 'general';
  if (INDUSTRIAL_TERMS.some((term) => text.includes(normalize(term)))) return 'zona-industrial';
  if (COAST_TERMS.some((term) => text.includes(normalize(term)))) return 'costa';
  if (PREMIUM_TERMS.some((term) => text.includes(normalize(term)))) return 'zona-premium';
  if (CENTRO_TERMS.some((term) => text.includes(normalize(term)))) return 'centro';
  if (CAPITALS.some((term) => text === normalize(term) || text.includes(` ${normalize(term)} `))) return 'capital';
  if (/barrio|urbanizacion|residencial|colonia|distrito/.test(text)) return 'barrio-residencial';
  if (text.split(/\s+/).length <= 2 && !CAPITALS.includes(text.trim())) return 'municipio-pequeno';
  return 'general';
}

export function getLocalContextAngles(kind: LocalContextKind, city: string): string[] {
  const safeCity = city || 'tu zona';
  const packs: Record<LocalContextKind, string[]> = {
    centro: [
      `accesos más complicados y fincas con instalaciones antiguas en ${safeCity}`,
      'intervenciones que deben ordenar tiempos, ruido y acceso al edificio',
      'soluciones que respetan el estado previo sin improvisar',
    ],
    'barrio-residencial': [
      `trabajos pensados para viviendas y comunidades de ${safeCity}`,
      'horarios compatibles con el uso diario de la vivienda',
      'explicaciones claras para propietarios, inquilinos o administradores',
    ],
    'zona-premium': [
      `acabados cuidados y comunicación precisa en ${safeCity}`,
      'especial atención a protección de superficies y detalles visibles',
      'presupuestos claros para evitar decisiones apresuradas',
    ],
    'zona-industrial': [
      `accesos, horarios y continuidad de actividad en ${safeCity}`,
      'coordinación para reducir paradas o molestias operativas',
      'criterio técnico antes de sustituir piezas o sistemas completos',
    ],
    costa: [
      `materiales y mantenimiento condicionados por humedad y salinidad en ${safeCity}`,
      'revisión preventiva cuando el entorno acelera desgaste',
      'soluciones pensadas para vivienda habitual, segunda residencia o local',
    ],
    'municipio-pequeno': [
      `atención cercana y alcance bien explicado en ${safeCity}`,
      'priorización realista según disponibilidad y urgencia',
      'presupuesto entendible antes de desplazar materiales o gremios',
    ],
    capital: [
      `coordinación por distritos, accesos y horarios en ${safeCity}`,
      'respuesta orientada a reducir visitas innecesarias',
      'información previa para filtrar urgencia, materiales y tiempos',
    ],
    general: [
      `criterio local aplicado al caso concreto en ${safeCity}`,
      'revisión previa para evitar soluciones genéricas',
      'explicación sencilla de opciones, materiales y tiempos',
    ],
  };
  return packs[kind] || packs.general;
}
