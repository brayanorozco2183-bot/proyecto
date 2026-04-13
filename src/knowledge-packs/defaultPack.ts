import { VerticalPack } from './base.js';

export const defaultPack: VerticalPack = {
    nicheMatchers: [],
    allowedEntities: [],
    forbiddenTerms: [
        'lorem ipsum',
        'example.com',
        'rellenar con',
        'haz clic aquí'
    ],
    technicalConcepts: [],
    trustSignals: [
        'telefono visible', 
        'cobertura local', 
        'faq útil', 
        'presupuesto sin compromiso', 
        'atención directa',
        'transparencia total',
        'técnicos cualificados',
        'garantía por escrito',
        'respuesta ágil',
        'trato profesional'
    ],
    localProofPatterns: ['barrios de cobertura', 'casos habituales de la zona']
};