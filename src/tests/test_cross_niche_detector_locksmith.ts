import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';

const report = detectCrossNicheContamination({
  niche: 'cerrajeros antibumping',
  city: 'Getafe',
  blockType: 'services_grid',
  textFragments: [
    'Cambio de bombín de seguridad y apertura de puertas con diagnóstico técnico.',
    'En Getafe conviene revisar cerraduras, cilindros y compatibilidad con escudos.',
  ],
});

if (report.severity === 'fatal') {
  throw new Error(`Unexpected fatal cross-niche detection: ${report.summary}`);
}

console.log('OK test_cross_niche_detector_locksmith');
