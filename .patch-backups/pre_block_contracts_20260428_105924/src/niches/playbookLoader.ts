import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NichePlaybook, SupportedNicheId } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLAYBOOKS_DIR = path.join(__dirname, 'playbooks');

const aliasIndex: Record<string, SupportedNicheId> = {
  cerrajero: 'cerrajeros',
  cerrajeros: 'cerrajeros',
  cerrajeria: 'cerrajeros',
  'cerrajería': 'cerrajeros',
  fontanero: 'fontaneros',
  fontaneros: 'fontaneros',
  fontaneria: 'fontaneros',
  'fontanería': 'fontaneros',
  plomero: 'fontaneros',
  plomeros: 'fontaneros',
  electricista: 'electricistas',
  electricistas: 'electricistas',
  electricidad: 'electricistas',
  instalador_electrico: 'electricistas',
  'instalador eléctrico': 'electricistas',
  carpintero: 'carpinteros',
  carpinteros: 'carpinteros',
  carpinteria: 'carpinteros',
  'carpintería': 'carpinteros',
  ebanista: 'carpinteros',
  pintor: 'pintores',
  pintores: 'pintores',
  pintura: 'pintores',
  'pintura decorativa': 'pintores',
};

const serviceTermIndex: Record<SupportedNicheId, string[]> = {
  cerrajeros: [
    'apertura', 'puerta', 'puertas', 'apertura de puertas', 'apertura urgente', 'apertura urgente de puertas',
    'cerradura', 'cerraduras', 'bombin', 'bombín', 'cambio de bombin', 'cambio de bombín', 'cilindro', 'cilindros',
    'escudo', 'escudos', 'llave', 'llaves', 'amaestramiento', 'amaestramiento de llaves',
    'persiana', 'persianas', 'persiana metalica', 'persiana metálica', 'persianas metalicas', 'persianas metálicas',
    'cierre', 'cierres', 'cierres metalicos', 'cierres metálicos', 'cierre metalico', 'cierre metálico',
    'control de acceso', 'cierrapuertas', 'antibumping', 'cerramiento', 'cerrojo', 'cerrojos', 'mirilla', 'mirillas'
  ],
  fontaneros: [
    'tuberia', 'tubería', 'tuberias', 'tuberías', 'fuga', 'fugas', 'desatasco', 'desatascos', 'atasco', 'grifos',
    'grifo', 'caldera', 'termo', 'cisterna', 'sanitario', 'fontaneria', 'fontanería', 'bajante', 'desague', 'desagüe'
  ],
  electricistas: [
    'cuadro', 'cuadros', 'enchufe', 'enchufes', 'cableado', 'iluminacion', 'iluminación', 'boletin', 'boletín',
    'diferencial', 'magnetotermico', 'magnetotérmico', 'electricidad', 'electricista'
  ],
  carpinteros: [
    'madera', 'puerta corredera', 'armario', 'armarios', 'tarima', 'tarimas', 'mueble', 'muebles', 'ebanisteria', 'ebanistería'
  ],
  pintores: [
    'pintura', 'pintor', 'pintores', 'fachada', 'fachadas', 'esmalte', 'barniz', 'alisar', 'humedad', 'lacado'
  ]
};

const strongLongTailMatchers: Array<{ niche: SupportedNicheId; regex: RegExp }> = [
  { niche: 'cerrajeros', regex: /\b(?:cambio\s+de\s+bomb[ií]n|bomb[ií]n(?:es)?\s+de\s+seguridad|cerradura(?:s)?\s+antibumping|antibumping|apertura\s+urgente(?:\s+de\s+puertas?)?|apertura\s+de\s+puertas?|cierres?\s+met[aá]licos?|persianas?\s+(?:de\s+local|met[aá]licas?)|amaestramiento\s+de\s+llaves|llaves?\s+maestr(?:a|e)|control\s+de\s+acceso|cierrapuertas?)\b/i },
  { niche: 'fontaneros', regex: /\b(?:desatascos?|fugas?|tuber[ií]as?|cisternas?|bajantes?)\b/i },
  { niche: 'electricistas', regex: /\b(?:cuadros?\s+el[eé]ctricos?|bolet[ií]n(?:es)?|diferencial|magnetot[eé]rmico|enchufes?)\b/i },
  { niche: 'carpinteros', regex: /\b(?:armarios?\s+a\s+medida|tarimas?|muebles?|ebanister[ií]a)\b/i },
  { niche: 'pintores', regex: /\b(?:pintura\s+decorativa|fachadas?|barnizado|lacado|alisar\s+paredes?)\b/i },
];

const cache = new Map<SupportedNicheId, NichePlaybook>();

function normalize(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeRegExp(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeAliasKey(input: string): string {
  return normalize(input)
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(input: string): string {
  return String(input || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function stripLeadingNoise(input: string): string {
  return normalizeAliasKey(input)
    .replace(/^(?:quiero|necesito|crea(?:r)?|genera(?:r)?|generame|haz|lanza|monta|produce|redacta|prepara)\s+/i, '')
    .replace(/^(?:una?|el|la|los|las)\s+/i, '')
    .replace(/^(?:pagina|pagina web|página|página web|sitio|landing|web|cluster|mission|mision|misión)\s+/i, '')
    .replace(/^(?:de|del|para|sobre|servicio(?:s)?\s+de|especialistas?\s+en)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTrailingLocation(input: string): string {
  return String(input || '')
    .replace(/\b(?:en|para|desde)\s+[\p{L}'’\-\s]{2,60}$/iu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collapseQueryNoise(input: string): string {
  return stripTrailingLocation(stripLeadingNoise(input))
    .replace(/^(?:de|del|sobre|para|servicio(?:s)?\s+de|especialistas?\s+en|empresa\s+de)\s+/i, '')
    .replace(/^(?:presupuesto(?:s)?|precio(?:s)?|coste(?:s)?|guia|gu[ií]a|consejo(?:s)?|ayuda|pasos|blog|informacion|informaci[oó]n|cu[aá]nto\s+cuesta|cuanto\s+cuesta)\s+(?:de|para|sobre)\s+/i, '')
    .replace(/\b(?:familia|family|modo|mode|arquetipo|archetype)\s+[\w_-]+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMissionNiche(rawNiche: string): string {
  const collapsed = collapseQueryNoise(rawNiche);
  return collapsed || normalizeAliasKey(rawNiche);
}

function scoreServiceTerms(norm: string, niche: SupportedNicheId): number {
  const haystack = ` ${normalize(norm)} `;
  let score = 0;

  for (const term of serviceTermIndex[niche] || []) {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) continue;

    const regex = new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm).replace(/\s+/g, '\\s+')}($|\\s)`, 'i');
    if (regex.test(haystack)) {
      score += normalizedTerm.includes(' ') ? 5 : 2;
    }
  }

  return score;
}

function resolveByAlias(norm: string): SupportedNicheId | null {
  const key = norm.replace(/\s+/g, '_');
  if (aliasIndex[key]) return aliasIndex[key];
  if (aliasIndex[norm]) return aliasIndex[norm];

  const candidates = Object.entries(aliasIndex)
    .map(([alias, id]) => ({ alias: normalizeAliasKey(alias), id }))
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const candidate of candidates) {
    const boundary = new RegExp(`(^|\\s)${escapeRegExp(candidate.alias).replace(/\s+/g, '\\s+')}($|\\s)`, 'i');
    if (boundary.test(norm)) return candidate.id;
  }

  return null;
}

function resolveByStrongLongTail(norm: string): SupportedNicheId | null {
  for (const matcher of strongLongTailMatchers) {
    if (matcher.regex.test(norm)) return matcher.niche;
  }
  return null;
}

function resolveByServiceTerms(norm: string): SupportedNicheId | null {
  const scores = (Object.keys(serviceTermIndex) as SupportedNicheId[])
    .map((id) => ({ id, score: scoreServiceTerms(norm, id) }))
    .sort((a, b) => b.score - a.score);

  if (!scores.length) return null;
  const best = scores[0];
  const second = scores[1];

  if (!best || best.score <= 0) return null;
  if (second && best.score === second.score && best.score < 5) return null;
  return best.id;
}

export function resolveCanonicalServiceNiche(rawNiche: string): SupportedNicheId | null {
  const normalized = normalizeMissionNiche(rawNiche);
  return resolveByAlias(normalized)
    || resolveByStrongLongTail(normalized)
    || resolveByServiceTerms(normalized)
    || resolveByAlias(normalizeAliasKey(rawNiche))
    || null;
}

export function resolveNicheId(rawNiche: string): SupportedNicheId | null {
  const norm = normalizeMissionNiche(rawNiche);
  const resolved = resolveCanonicalServiceNiche(norm || rawNiche);
  console.log(`[PlaybookLoader] Resolving "${rawNiche}" (norm: "${norm}") -> ${resolved}`);
  return resolved;
}

export function loadNichePlaybookById(id: SupportedNicheId): NichePlaybook {
  if (cache.has(id)) return cache.get(id)!;
  const fullPath = path.join(PLAYBOOKS_DIR, `${id}.json`);
  const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as NichePlaybook;
  cache.set(id, parsed);
  return parsed;
}

export function loadNichePlaybook(rawNiche: string): NichePlaybook | null {
  const id = resolveNicheId(rawNiche);
  if (!id) return null;
  return loadNichePlaybookById(id);
}

export function requireNichePlaybook(rawNiche: string): NichePlaybook {
  const playbook = loadNichePlaybook(rawNiche);
  if (!playbook) {
    throw new Error(`No niche playbook found for "${rawNiche}"`);
  }
  return playbook;
}

export function getCanonicalNicheLabel(rawNiche: string): string {
  const resolved = resolveNicheId(rawNiche);
  if (resolved) {
    const playbook = loadNichePlaybookById(resolved);
    return titleCase(playbook.displayName);
  }
  const cleaned = normalizeMissionNiche(rawNiche);
  return cleaned ? titleCase(cleaned) : 'Servicio Local';
}

export function listAvailablePlaybooks(): SupportedNicheId[] {
  return ['cerrajeros', 'fontaneros', 'electricistas', 'carpinteros', 'pintores'];
}

export function loadAllNichePlaybooks(): NichePlaybook[] {
  return listAvailablePlaybooks().map((id) => loadNichePlaybookById(id));
}
