import { normalizeMissionNiche, resolveNicheId } from '../niches/playbookLoader.js';

const cases: Array<[string, string]> = [
  ['crea una página de cerrajeros en Getafe', 'cerrajeros'],
  ['crea una página de cerrajeros antibumping en Getafe', 'cerrajeros'],
  ['crea una página de apertura urgente de puertas en Getafe', 'cerrajeros'],
  ['crea una página de cambio de bombín en Getafe', 'cerrajeros'],
  ['crea una página de reparación de cierres metálicos en Getafe', 'cerrajeros'],
];

for (const [input, expected] of cases) {
  const normalized = normalizeMissionNiche(input);
  const resolved = resolveNicheId(normalized);
  if (resolved !== expected) {
    throw new Error(`Expected ${expected} for "${input}", got ${resolved}`);
  }
}

console.log('OK test_playbook_resolution_long_tail');
