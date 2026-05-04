import * as cheerio from 'cheerio';
import { loadAllNichePlaybooks, requireNichePlaybook } from './playbookLoader.js';

export type CrossNicheSeverity = 'none' | 'warning' | 'major' | 'fatal';

export interface CrossNicheHit {
  term: string;
  sourceNiche: string;
  scope: 'target_forbidden' | 'foreign_vocabulary' | 'foreign_service' | 'foreign_claim';
  count: number;
  weight: number;
}

export interface CrossNicheReport {
  niche: string;
  score: number;
  severity: CrossNicheSeverity;
  hits: CrossNicheHit[];
  foreignNiches: string[];
  reasons: string[];
  summary: string;
  shouldRegenerate: boolean;
  shouldBlockPublish: boolean;
}

export interface CrossNicheDetectionInput {
  niche: string;
  html?: string;
  textFragments?: string[];
  city?: string;
  blockType?: string;
}

const GENERIC_SHARED_TERMS = new Set([
  'servicio', 'servicios', 'profesional', 'profesionales', 'urgente', 'urgencias', 'presupuesto', 'atencion', 'atención',
  'seguridad', 'proteccion', 'protección', 'hogar', 'local', 'negocio', 'puerta', 'puertas'
].map((item) => normalize(item)));

function normalize(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/[\s-]+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function htmlToVisibleText(html: string): string {
  if (!html) return '';
  try {
    const $ = cheerio.load(html, { decodeEntities: false });
    $('script, style, noscript').remove();
    return normalize($.root().text());
  } catch {
    return normalize(String(html).replace(/<[^>]+>/g, ' '));
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toLexicon(values: string[] = []): string[] {
  return unique(
    values
      .map((value) => normalize(value))
      .filter((value) => value.length >= 4 && !GENERIC_SHARED_TERMS.has(value))
  );
}

function matchCount(haystack: string, term: string): number {
  if (!haystack || !term) return 0;
  const source = normalize(haystack);
  const normalizedTerm = normalize(term);
  if (!source || !normalizedTerm) return 0;

  const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm).replace(/\s+/g, '\\s+')}($|\\s)`, 'g');
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function buildTermOwnership() {
  const ownership = new Map<string, Set<string>>();
  for (const playbook of loadAllNichePlaybooks()) {
    const terms = toLexicon([
      playbook.displayName,
      ...playbook.aliases,
      ...playbook.coreServices,
      ...playbook.bofuVariants.map((item) => item.label),
      ...playbook.allowedVocabulary.filter((value) => value.split(/\s+/).length >= 2),
    ]);
    for (const term of terms) {
      if (!ownership.has(term)) ownership.set(term, new Set());
      ownership.get(term)!.add(playbook.id);
    }
  }
  return ownership;
}

function isUniqueForeignTerm(term: string, ownership: Map<string, Set<string>>, targetId: string): boolean {
  const owners = ownership.get(term);
  if (!owners || owners.size === 0) return true;
  if (owners.size === 1 && owners.has(targetId)) return false;
  return owners.size === 1 && !owners.has(targetId);
}

function blockThresholds(blockType?: string) {
  const block = normalize(blockType || '');
  if (block === 'faq' || block === 'price guidance' || block === 'price_guidance') {
    return { warning: 24, major: 48, fatal: 72 };
  }
  if (block === 'cta panel' || block === 'cta_panel') {
    return { warning: 28, major: 52, fatal: 78 };
  }
  return { warning: 18, major: 40, fatal: 64 };
}

function shouldSkipForeignTerm(term: string, targetAllowed: Set<string>, sourceNiche: string, blockType?: string): boolean {
  const normalized = normalize(term);
  if (!normalized) return true;
  if (targetAllowed.has(normalized)) return true;
  if (GENERIC_SHARED_TERMS.has(normalized)) return true;

  if (blockType && ['internal_linking', 'authority_note', 'internal-links-hub'].includes(blockType)) return true;
  if (sourceNiche === 'carpinteros' && /^puertas?$/.test(normalized)) return true;

  return false;
}

export function detectCrossNicheContamination(input: CrossNicheDetectionInput): CrossNicheReport {
  const targetPlaybook = requireNichePlaybook(input.niche);
  const allPlaybooks = loadAllNichePlaybooks();
  const targetId = targetPlaybook.id;
  const ownership = buildTermOwnership();
  const blockType = String(input.blockType || '').trim();

  // EXEMPTION: Cross-niche blocks that are meant to link across the site
  if (['internal_linking', 'authority_note', 'internal-links-hub'].includes(blockType)) {
    return {
      niche: targetId,
      score: 0,
      severity: 'none',
      hits: [],
      foreignNiches: [],
      reasons: [],
      summary: 'Bloque exento de análisis cross-niche por enlazado transversal controlado.',
      shouldRegenerate: false,
      shouldBlockPublish: false
    };
  }

  const visibleText = [
    htmlToVisibleText(input.html || ''),
    ...(Array.isArray(input.textFragments) ? input.textFragments.map((item) => normalize(item)) : [])
  ].filter(Boolean).join(' ');

  const targetAllowed = new Set(toLexicon([
    targetPlaybook.displayName,
    ...targetPlaybook.aliases,
    ...targetPlaybook.allowedVocabulary,
    ...targetPlaybook.coreServices,
    ...targetPlaybook.bofuVariants.map((item) => item.label),
    ...targetPlaybook.validTrustSignals.map((item) => item.label)
  ]));

  const hits: CrossNicheHit[] = [];
  const seen = new Set<string>();

  const explicitForbidden = String(process.env.GRAVITY_FORBIDDEN_TERMS || '').split('|').filter(Boolean);
  for (const forbidden of toLexicon([...targetPlaybook.forbiddenVocabulary, ...explicitForbidden])) {
    const count = matchCount(visibleText, forbidden);
    if (!count) continue;
    const key = `target_forbidden:${forbidden}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ term: forbidden, sourceNiche: targetId, scope: 'target_forbidden', count, weight: 12 });
  }

  for (const playbook of allPlaybooks) {
    if (playbook.id === targetId) continue;

    const foreignVocabulary = toLexicon([
      playbook.displayName,
      ...playbook.aliases,
      ...playbook.coreServices,
      ...playbook.bofuVariants.map((item) => item.label),
      ...playbook.allowedVocabulary.filter((value) => value.split(/\s+/).length >= 2),
    ]).filter((term) => !shouldSkipForeignTerm(term, targetAllowed, playbook.id, blockType) && isUniqueForeignTerm(term, ownership, targetId));

    const foreignClaims = toLexicon(
      (playbook.legalRiskPolicy?.prohibitedClaims || []).filter((term) => term.split(/\s+/).length >= 2)
    ).filter((term) => !shouldSkipForeignTerm(term, targetAllowed, playbook.id, blockType));

    for (const term of foreignVocabulary) {
      const count = matchCount(visibleText, term);
      if (!count) continue;
      const key = `foreign:${playbook.id}:${term}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const scope: CrossNicheHit['scope'] = playbook.coreServices.some((item) => normalize(item) === term)
        ? 'foreign_service'
        : 'foreign_vocabulary';
      const weight = scope === 'foreign_service' ? 12 : 6;
      hits.push({ term, sourceNiche: playbook.id, scope, count, weight });
    }

    for (const term of foreignClaims) {
      const count = matchCount(visibleText, term);
      if (!count || count < 2) continue;
      const key = `claim:${playbook.id}:${term}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ term, sourceNiche: playbook.id, scope: 'foreign_claim', count, weight: 5 });
    }
  }

  const score = hits.reduce((acc, hit) => acc + (hit.weight * Math.min(hit.count, 2)), 0);
  const uniqueForeignHits = hits.filter((hit) => hit.sourceNiche !== targetId);
  const uniqueForeignTerms = uniqueForeignHits.length;
  const uniqueForeignNiches = unique(uniqueForeignHits.map((hit) => hit.sourceNiche));
  const thresholds = blockThresholds(input.blockType);

  let severity: CrossNicheSeverity = 'none';
  if (score >= thresholds.fatal || (uniqueForeignNiches.length >= 2 && score >= thresholds.major + 12)) severity = 'fatal';
  else if (score >= thresholds.major || uniqueForeignTerms >= 4) severity = 'major';
  else if (score >= thresholds.warning || uniqueForeignTerms >= 2) severity = 'warning';

  const reasons = uniqueForeignHits.slice(0, 8).map((hit) => `${hit.term} (${hit.sourceNiche})`);
  const summary = severity === 'none'
    ? 'Sin contaminación cross-niche relevante.'
    : `Score ${score}. Nichos ajenos detectados: ${uniqueForeignNiches.join(', ')}. Términos: ${reasons.join(', ')}.`;

  const shouldRegenerate = severity === 'fatal' || (severity === 'major' && uniqueForeignNiches.length >= 2 && score >= thresholds.major + 8);

  return {
    niche: targetId,
    score,
    severity,
    hits,
    foreignNiches: uniqueForeignNiches,
    reasons,
    summary,
    shouldRegenerate,
    shouldBlockPublish: severity === 'fatal'
  };
}
