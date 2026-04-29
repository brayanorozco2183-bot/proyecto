import { resolveNicheId, loadNichePlaybook } from '../niches/playbookLoader.js';

export interface LegalClaimSanitizerReport {
  html: string;
  replacements: string[];
}

type Replacement = [RegExp, string, string];

const BASE_REPLACEMENTS: Replacement[] = [
  [/garant[ií]a\s+de\s+por\s+vida/gi, 'garantía por escrito', 'garantía de por vida'],
  [/garant[ií]a\s+de\s+20\s*a[nñ]os/gi, 'garantía por escrito', 'garantía de 20 años'],
  [/garant[ií]a\s+(?:de\s+)?\d+\s*a[nñ]os/gi, 'garantía por escrito', 'garantía específica en años'],
  [/maderas?\s+indestructibles?/gi, 'madera seleccionada según el uso previsto', 'maderas indestructibles'],
  [/muebles?\s+irrompibles?/gi, 'muebles fabricados con materiales adecuados al uso previsto', 'muebles irrompibles'],
  [/madera\s+que\s+nunca\s+se\s+raya/gi, 'acabados adecuados al uso y mantenimiento previsto', 'madera que nunca se raya'],
  [/presupuesto\s+final\s+sin\s+ver\s+el\s+trabajo/gi, 'presupuesto detallado tras visita', 'presupuesto final sin ver el trabajo'],
  [/precio\s+exacto\s+sin\s+ver/gi, 'presupuesto personalizado tras valorar el trabajo', 'precio exacto sin ver'],
  [/somos\s+los\s+m[aá]s\s+baratos\s+de\s+la\s+ciudad/gi, 'ofrecemos tarifas competitivas con alcance detallado', 'somos los más baratos de la ciudad'],
  [/instalaci[oó]n\s+en\s+10\s+minutos/gi, 'instalación planificada según el alcance real', 'instalación en 10 minutos'],
  [/24\/7\s+atenci[oó]n/gi, 'atención directa', '24/7 atención'],
  [/reparaciones?\s+urgentes?/gi, 'ajustes y reparaciones de carpintería', 'reparaciones urgentes'],
  [/la\s+mejor\s+opci[oó]n\s+para\s+tu\s+hogar/gi, 'una opción técnica para tu hogar', 'la mejor opción para tu hogar'],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacementForClaim(claim: string): string {
  const normalized = claim.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('garantia')) return 'garantía por escrito';
  if (normalized.includes('precio') || normalized.includes('presupuesto')) return 'presupuesto detallado tras visita';
  if (normalized.includes('barat')) return 'tarifas competitivas con alcance detallado';
  if (normalized.includes('madera') || normalized.includes('mueble')) return 'materiales adecuados al uso previsto';
  if (normalized.includes('instalacion')) return 'instalación planificada según el alcance real';
  return 'afirmación verificable y ajustada al caso real';
}

function dynamicReplacementsForNiche(niche?: string): Replacement[] {
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
  ] as Replacement);
}

export function sanitizeLegalRiskClaims(html: string, niche?: string): LegalClaimSanitizerReport {
  let out = String(html || '');
  const replacements: string[] = [];
  for (const [pattern, replacement, label] of [...BASE_REPLACEMENTS, ...dynamicReplacementsForNiche(niche)]) {
    if (pattern.test(out)) {
      replacements.push(label);
      out = out.replace(pattern, replacement);
    }
  }
  return { html: out, replacements: Array.from(new Set(replacements)) };
}

export function hasUnsafeLegalClaims(html: string, niche?: string): boolean {
  return sanitizeLegalRiskClaims(html, niche).replacements.length > 0;
}
