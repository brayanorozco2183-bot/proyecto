import { requireNichePlaybook } from './playbookLoader.js';

export interface TechnicalPlaybookValidationResult {
  ok: boolean;
  issues: string[];
}

export function validateContentAgainstNichePlaybook(params: {
  niche: string;
  html: string;
  schemaTypes?: string[];
  textFragments?: string[];
}): TechnicalPlaybookValidationResult {
  const playbook = requireNichePlaybook(params.niche);
  const haystack = `${params.html || ''}\n${(params.textFragments || []).join('\n')}`.toLowerCase();
  const issues: string[] = [];

  const normalizedNiche = String(params.niche || '').toLowerCase();

  const foreignSecurityTerms = [
    'cerradura',
    'cerraduras',
    'bombin',
    'bombín',
    'cilindro',
    'cilindros',
    'antibumping',
    'escudo magnético',
    'escudos magnéticos',
    'ganzúa',
    'ganzúas',
    'caja fuerte',
    'cajas fuertes',
    'llave maestra',
    'llaves maestras',
    'control de acceso',
    'intrusión',
    'intrusiones',
    'cierrapuertas',
    'muelle cierrapuertas',
    'muelles cierrapuertas',
    'blindaje',
    'blindajes',
    'puerta de trastero',
    'puertas de trastero',
    'puerta automática',
    'puertas automáticas',
    'cancela',
    'cancelas',
    'pomo',
    'pomos',
    'manilla',
    'manillas',
    'repuestos originales',
    'mecanismo de seguridad',
    'mecanismos de seguridad',
    'auditoría de seguridad',
    'auditorías de seguridad'
  ];

  for (const forbidden of playbook.forbiddenVocabulary) {
    if (haystack.includes(String(forbidden).toLowerCase())) {
      issues.push(`Vocabulario cruzado o impropio detectado: "${forbidden}"`);
    }
  }

  if (!/cerraj|cerradur|bomb[ií]n|cilindr|cerroj|ganzu|antibumping|llave|candado|cierrapuertas|control\s+de\s+acceso/.test(normalizedNiche)) {
    for (const foreign of foreignSecurityTerms) {
      if (haystack.includes(foreign)) {
        issues.push(`Vocabulario cruzado de cerrajería detectado: "${foreign}"`);
      }
    }
  }

  if (/\b(?:tr|tk|aq)-[a-z0-9]+\b/i.test(haystack)) {
    issues.push('Trazas internas del generador detectadas (TR/TK/AQ).');
  }

  for (const claim of playbook.legalRiskPolicy.prohibitedClaims) {
    if (haystack.includes(claim.toLowerCase())) {
      issues.push(`Claim prohibido detectado: "${claim}"`);
    }
  }

  const requiredSchemas = new Set(playbook.schemaTypes);
  const provided = new Set((params.schemaTypes || []).map(s => String(s)));
  for (const required of requiredSchemas) {
    if (!provided.has(required)) {
      issues.push(`Schema recomendado ausente para el nicho: ${required}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

