import { resolveNicheId, loadNichePlaybook } from '../niches/playbookLoader.js';
import { buildNicheIntelligenceProfile, type BuildNicheProfileInput, type NicheIntelligenceProfile } from '../niche-intelligence/index.js';

export interface LegalClaimSanitizerReport {
  html: string;
  replacements: string[];
  source: 'niche-intelligence' | 'playbook-fallback' | 'base-only' | 'mixed';
}

export interface LegalClaimSanitizerOptions extends BuildNicheProfileInput {
  profile?: NicheIntelligenceProfile;
  seedHtml?: string;
}

type Replacement = [RegExp, string, string, 'base' | 'niche-intelligence' | 'playbook'];

const BASE_REPLACEMENTS: Replacement[] = [
  [/garant[ií]a\s+de\s+por\s+vida/gi, 'garantía por escrito', 'garantía de por vida', 'base'],
  [/garant[ií]a\s+de\s+20\s*a[nñ]os/gi, 'garantía por escrito', 'garantía de 20 años', 'base'],
  [/garant[ií]a\s+(?:de\s+)?\d+\s*a[nñ]os/gi, 'garantía por escrito', 'garantía específica en años', 'base'],
  [/maderas?\s+indestructibles?/gi, 'madera seleccionada según el uso previsto', 'maderas indestructibles', 'base'],
  [/muebles?\s+irrompibles?/gi, 'muebles fabricados con materiales adecuados al uso previsto', 'muebles irrompibles', 'base'],
  [/madera\s+que\s+nunca\s+se\s+raya/gi, 'acabados adecuados al uso y mantenimiento previsto', 'madera que nunca se raya', 'base'],
  [/presupuesto\s+final\s+sin\s+ver\s+el\s+trabajo/gi, 'presupuesto detallado tras valorar el trabajo', 'presupuesto final sin ver el trabajo', 'base'],
  [/precio\s+exacto\s+sin\s+ver/gi, 'presupuesto personalizado tras valorar el trabajo', 'precio exacto sin ver', 'base'],
  [/\b\d+(?:[,.]\d+)?\s*(?:€|euros?\b|eur\b)/gi, 'un presupuesto ajustado al caso real', 'precio exacto con moneda', 'base'],
  [/\bdesde\s+\d+(?:[,.]\d+)?\s*(?:€|euros?\b|eur\b)/gi, 'un presupuesto personalizado tras valorar el trabajo', 'precio desde con moneda', 'base'],
  [/somos\s+los\s+m[aá]s\s+baratos\s+de\s+la\s+ciudad/gi, 'ofrecemos tarifas competitivas con alcance detallado', 'somos los más baratos de la ciudad', 'base'],
  [/instalaci[oó]n\s+en\s+10\s+minutos/gi, 'instalación planificada según el alcance real', 'instalación en 10 minutos', 'base'],
  [/24\/7\s+atenci[oó]n/gi, 'atención directa según disponibilidad declarada', '24/7 atención', 'base'],
  [/reparaciones?\s+urgentes?/gi, 'ajustes y reparaciones priorizadas según disponibilidad', 'reparaciones urgentes', 'base'],
  [/la\s+mejor\s+opci[oó]n\s+para\s+tu\s+hogar/gi, 'una opción técnica para tu hogar', 'la mejor opción para tu hogar', 'base'],
  [/curaci[oó]n\s+garantizada/gi, 'valoración individual y seguimiento profesional', 'curación garantizada', 'base'],
  [/resultado\s+garantizado/gi, 'resultado sujeto a valoración del caso', 'resultado garantizado', 'base'],
  [/sin\s+riesgos?/gi, 'con riesgos y limitaciones explicados previamente', 'sin riesgos', 'base'],
  [/ganamos\s+tu\s+caso/gi, 'valoramos la viabilidad del caso según documentación', 'ganamos tu caso', 'base'],
  [/100%\s+(?:asegurado|garantizado)/gi, 'estimación condicionada a la valoración real', '100% asegurado/garantizado', 'base'],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function replacementForClaim(claim: string, profile?: NicheIntelligenceProfile): string {
  const normalized = normalize(claim);
  const alternatives = profile?.safeClaimAlternatives?.filter(Boolean) ?? [];

  if (normalized.includes('cura') || normalized.includes('curacion') || normalized.includes('sanar')) {
    return alternatives.find((item) => /valoraci|seguimiento|diagn[oó]stico|tratamiento/i.test(item)) || 'valoración individual y seguimiento profesional';
  }
  if (normalized.includes('ganamos') || normalized.includes('caso') || normalized.includes('sentencia')) {
    return alternatives.find((item) => /viabilidad|documentaci|caso|plazo/i.test(item)) || 'valoración de viabilidad según documentación';
  }
  if (normalized.includes('rentabilidad') || normalized.includes('beneficio') || normalized.includes('inversion')) {
    return alternatives.find((item) => /riesgo|estimaci|perfil|condicion/i.test(item)) || 'estimación condicionada al perfil y al riesgo';
  }
  if (normalized.includes('garantia') || normalized.includes('garantizado') || normalized.includes('asegurado')) {
    return alternatives.find((item) => /seg[uú]n|sujeto|valoraci|alcance|caso/i.test(item)) || 'resultado sujeto a valoración del caso real';
  }
  if (normalized.includes('precio') || normalized.includes('presupuesto')) return 'presupuesto detallado tras valorar el trabajo';
  if (normalized.includes('barat') || normalized.includes('mejor') || normalized.includes('numero 1')) return 'propuesta comparativa con alcance verificable';
  if (normalized.includes('madera') || normalized.includes('mueble')) return 'materiales adecuados al uso previsto';
  if (normalized.includes('instalacion')) return 'instalación planificada según el alcance real';

  return alternatives[0] || 'afirmación verificable y ajustada al caso real';
}

function getProfile(optionsOrNiche?: string | LegalClaimSanitizerOptions, html = ''): NicheIntelligenceProfile | undefined {
  if (typeof optionsOrNiche === 'object' && optionsOrNiche?.profile) return optionsOrNiche.profile;

  const input: LegalClaimSanitizerOptions = typeof optionsOrNiche === 'string'
    ? { niche: optionsOrNiche, seedText: html.slice(0, 2000) }
    : { ...(optionsOrNiche ?? {}), seedText: optionsOrNiche?.seedText || optionsOrNiche?.seedHtml || html.slice(0, 2000) };

  if (!input.niche && !input.seedText) return undefined;
  return buildNicheIntelligenceProfile(input);
}

function replacementsFromProfile(profile?: NicheIntelligenceProfile): Replacement[] {
  const claims = profile?.forbiddenClaims ?? [];
  return Array.from(new Set(claims.map(String).filter(Boolean))).map((claim) => [
    new RegExp(escapeRegExp(claim), 'gi'),
    replacementForClaim(claim, profile),
    claim,
    'niche-intelligence'
  ] as Replacement);
}

function replacementsFromLegacyPlaybook(niche?: string): Replacement[] {
  const id = resolveNicheId(niche || '');
  if (!id) return [];
  const playbook = loadNichePlaybook(id);
  const claims = [
    ...(playbook?.prohibitedClaims || []),
    ...(playbook?.legalRiskPolicy?.prohibitedClaims || []),
  ];
  return Array.from(new Set(claims.map(String).filter(Boolean))).map((claim) => [
    new RegExp(escapeRegExp(claim), 'gi'),
    replacementForClaim(claim),
    claim,
    'playbook'
  ] as Replacement);
}

function resolveSource(sources: Set<string>): LegalClaimSanitizerReport['source'] {
  if (sources.has('niche-intelligence') && sources.has('playbook')) return 'mixed';
  if (sources.has('niche-intelligence')) return 'niche-intelligence';
  if (sources.has('playbook')) return 'playbook-fallback';
  return 'base-only';
}

export function sanitizeLegalRiskClaims(html: string, nicheOrOptions?: string | LegalClaimSanitizerOptions): LegalClaimSanitizerReport {
  let out = String(html || '');
  const replacements: string[] = [];
  const matchedSources = new Set<string>();
  const profile = getProfile(nicheOrOptions, out);
  const legacyNiche = typeof nicheOrOptions === 'string' ? nicheOrOptions : nicheOrOptions?.niche;

  const allReplacements = [
    ...BASE_REPLACEMENTS,
    ...replacementsFromProfile(profile),
    ...replacementsFromLegacyPlaybook(legacyNiche)
  ];

  for (const [pattern, replacement, label, source] of allReplacements) {
    pattern.lastIndex = 0;
    if (pattern.test(out)) {
      replacements.push(label);
      matchedSources.add(source);
      pattern.lastIndex = 0;
      out = out.replace(pattern, replacement);
    }
  }

  return {
    html: out,
    replacements: Array.from(new Set(replacements)),
    source: resolveSource(matchedSources)
  };
}

export function sanitizeLegalRiskClaimsWithProfile(html: string, profile: NicheIntelligenceProfile): LegalClaimSanitizerReport {
  return sanitizeLegalRiskClaims(html, { profile, niche: profile.niche, city: profile.city });
}

export function hasUnsafeLegalClaims(html: string, nicheOrOptions?: string | LegalClaimSanitizerOptions): boolean {
  return sanitizeLegalRiskClaims(html, nicheOrOptions).replacements.length > 0;
}
