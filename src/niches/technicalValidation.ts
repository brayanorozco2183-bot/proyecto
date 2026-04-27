import { detectCrossNicheContamination } from './crossNicheDetector.js';
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

  for (const forbidden of playbook.forbiddenVocabulary) {
    if (haystack.includes(String(forbidden).toLowerCase())) {
      issues.push(`Vocabulario cruzado o impropio detectado: "${forbidden}"`);
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

  if (params.schemaTypes && params.schemaTypes.length > 0) {
    const requiredSchemas = new Set(playbook.schemaTypes);
    const provided = new Set(params.schemaTypes.map(s => String(s)));
    for (const required of requiredSchemas) {
      if (!provided.has(required)) {
        issues.push(`Schema recomendado ausente para el nicho: ${required}`);
      }
    }
  }

  const crossNiche = detectCrossNicheContamination({
    niche: params.niche,
    html: params.html,
    textFragments: params.textFragments
  });

  if (crossNiche.severity === 'major' || crossNiche.severity === 'fatal') {
    issues.push(`Contaminación cross-niche detectada: ${crossNiche.summary}`);
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
