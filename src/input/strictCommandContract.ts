import { normalizeMissionNiche, resolveCanonicalServiceNiche, getCanonicalNicheLabel } from '../niches/playbookLoader.js';

export interface StrictCommandParseResult {
  niche: string;
  locations: string[];
  topic?: string;
  publish_mode: 'draft' | 'publish';
  site_type: 'static' | 'wordpress';
  archetype?: string;
  mode?: string;
  scope: 'auto' | 'neighborhoods' | 'municipalities' | 'provinces' | 'autonomous_communities' | 'country';
  is_cluster: boolean;
}

const SPANISH_CITIES = [
  'Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia','Palma','Bilbao','Alicante',
  'Córdoba','Valladolid','Vigo','Gijón','Hospitalet','A Coruña','Granada','Vitoria','Elche','Oviedo',
  'Getafe','Móstoles','Alcorcón','Leganés','Fuenlabrada','Parla','Alcobendas','Torrejón de Ardoz'
];

function normalizeText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

function detectScope(command: string): StrictCommandParseResult['scope'] {
  const c = command.toLowerCase();
  if (/barrios|distritos|zonas|vecindarios/.test(c)) return 'neighborhoods';
  if (/municipios|pueblos|localidades/.test(c)) return 'municipalities';
  if (/provincias/.test(c)) return 'provinces';
  if (/comunidades\s+aut[oó]nomas/.test(c)) return 'autonomous_communities';
  if (/pais|pa[ií]s|nacional/.test(c)) return 'country';
  return 'auto';
}

function detectCluster(command: string): boolean {
  return /cluster|barrios|distritos|zonas|municipios|muchas\s+paginas|muchas\s+p[aá]ginas|varias\s+paginas|varias\s+p[aá]ginas/.test(command.toLowerCase());
}

function extractLocations(command: string): string[] {
  const matches: string[] = [];
  for (const city of SPANISH_CITIES) {
    const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(command)) matches.push(city);
  }
  const explicit = command.match(/\ben\s+([A-ZÁÉÍÓÚÑ][\p{L}'’\-\s]{1,40}?)(?:\s+(?:sobre|modo|mode|familia|family|arquetipo|archetype)\b|$)/iu)?.[1];
  if (explicit) matches.push(normalizeText(explicit).replace(/[.,;:!?]+$/g, ''));
  return unique(matches).filter(Boolean);
}

export function parseStrictServiceCommand(rawCommand: string): StrictCommandParseResult {
  const command = normalizeText(rawCommand);
  if (!command) throw new Error('Comando vacío. Usa el formato: "crea una página de [nicho] en [ciudad]".');

  const publish_mode: 'draft' | 'publish' = /borrador|draft/i.test(command) ? 'draft' : 'publish';
  const site_type: 'static' | 'wordpress' = /wordpress/i.test(command) ? 'wordpress' : 'static';
  const archetype = command.match(/\b(?:familia|family|arquetipo|archetype)\s+([\w_-]+)\b/i)?.[1];
  const mode = command.match(/\b(?:modo|mode)\s+([\w_-]+)\b/i)?.[1] || (/premium/i.test(command) ? 'premium' : 'standard');

  const coreMatch = command.match(/(?:crea(?:r)?|genera(?:r)?|haz|prepara|monta|produce|redacta)(?:me)?\s+(?:una|un)?\s*(?:p[aá]gina|landing|sitio|web|misi[oó]n)?\s*de\s+(.+?)\s+en\s+([A-ZÁÉÍÓÚÑ][\p{L}'’\-\s]{1,40}?)(?:\s+sobre\s+(.+?))?(?:\s+(?:\b(?:modo|mode|familia|family|arquetipo|archetype|wordpress|draft|borrador)\b|\[PUBLISH_NOW\]).*|$)/iu)
    || command.match(/(?:p[aá]gina|landing|sitio|web|misi[oó]n)\s+de\s+(.+?)\s+en\s+([A-ZÁÉÍÓÚÑ][\p{L}'’\-\s]{1,40}?)(?:\s+sobre\s+(.+?))?(?:\s+(?:\b(?:modo|mode|familia|family|arquetipo|archetype|wordpress|draft|borrador)\b|\[PUBLISH_NOW\]).*|$)/iu)
    || command.match(/^(.+?)(?:\s+en\s+|\s+)([A-ZÁÉÍÓÚÑ][\p{L}'’\-\s]{1,40}?)(?:\s+(?:\b(?:modo|mode|familia|family|arquetipo|archetype|wordpress|draft|borrador)\b|\[PUBLISH_NOW\]).*|$)/iu);

  if (!coreMatch) {
    throw new Error('Formato no válido. Usa el formato exacto: "crea una página de [nicho] en [ciudad]" o "crea una página de [nicho] en [ciudad] sobre [tema]".');
  }

  const rawNiche = normalizeMissionNiche(coreMatch[1] || '');
  const city = normalizeText(coreMatch[2] || '');
  const topic = normalizeText(coreMatch[3] || '');
  const canonicalId = resolveCanonicalServiceNiche(rawNiche);
  if (!canonicalId) {
    throw new Error(`Nicho no soportado o ambiguo: "${rawNiche}". Usa un nicho explícito como cerrajeros, fontaneros, electricistas, carpinteros o pintores.`);
  }

  const locations = extractLocations(command);
  if (!locations.length) throw new Error('No se ha podido identificar una ciudad válida. Usa el formato "en [ciudad]".');

  return {
    niche: getCanonicalNicheLabel(canonicalId).toLowerCase(),
    locations: unique([city, ...locations]).filter(Boolean),
    topic: topic || undefined,
    publish_mode,
    site_type,
    archetype,
    mode,
    scope: detectScope(command),
    is_cluster: detectCluster(command),
  };
}
