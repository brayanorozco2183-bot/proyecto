import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';

const report = detectCrossNicheContamination({
  niche: 'cerrajeros',
  blockType: 'services_grid',
  html: '<section><h2>Cambio de bombín y apertura de puertas</h2><p>Se revisa cerradura, cilindro y escudo antes de intervenir.</p></section>'
});

if (report.severity === 'major' || report.severity === 'fatal') {
  throw new Error(`Falso positivo cross-niche: ${report.summary}`);
}
console.log('OK test_cross_niche_detector_softened');
