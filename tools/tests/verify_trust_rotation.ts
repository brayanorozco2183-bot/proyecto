
import { deriveTrustBullets } from './src/design-system/blockPayloadAdapter.js';

const mockData = {
    city: 'Zaragoza',
    niche: 'Pintores',
    intentModel: {
        mandatoryTrustElements: [
            'Telefono visible', 
            'Cobertura local', 
            'Faq útil', 
            'Acabado fino',
            'Limpieza profesional',
            'Garantía por escrito',
            'Puntualidad'
        ]
    }
};

const sections = [
    { section_id: 'urgencia', block_type: 'urgency_panel' },
    { section_id: 'zonas', block_type: 'local_proof' },
    { section_id: 'contacto', block_type: 'cta_panel' },
    { section_id: 'confianza', block_type: 'trust_band' }
];

console.log('--- Trust Signal Rotation Test ---');
sections.forEach(s => {
    const bullets = deriveTrustBullets(s, mockData);
    console.log(`Section: ${s.section_id} (${s.block_type})`);
    console.log(`Bullets: ${bullets.join(', ')}`);
    console.log('-------------------');
});
