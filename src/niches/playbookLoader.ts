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
  cerrajería: 'cerrajeros',
  fontanero: 'fontaneros',
  fontaneros: 'fontaneros',
  fontaneria: 'fontaneros',
  fontanería: 'fontaneros',
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
  carpintería: 'carpinteros',
  ebanista: 'carpinteros',
  pintor: 'pintores',
  pintores: 'pintores',
  pintura: 'pintores',
  'pintura decorativa': 'pintores'
};

const cache = new Map<SupportedNicheId, NichePlaybook>();

function normalize(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveNicheId(rawNiche: string): SupportedNicheId | null {
  const norm = normalize(rawNiche);
  const key = norm.replace(/\s+/g, '_');
  const resolved = aliasIndex[key] || aliasIndex[norm] || null;
  console.log(`[PlaybookLoader] Resolving "${rawNiche}" (norm: "${norm}", key: "${key}") -> ${resolved}`);
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

export function listAvailablePlaybooks(): SupportedNicheId[] {
  return ['cerrajeros', 'fontaneros', 'electricistas', 'carpinteros', 'pintores'];
}