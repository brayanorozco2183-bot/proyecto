import { defaultPack } from './defaultPack.js';
const inheritedDefault = (defaultPack || {});
const unique = (values = []) => [...new Set(values.filter(Boolean))];
const normalizeKey = (value) => (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
const pack = (overrides) => ({
    nicheMatchers: [...(inheritedDefault.nicheMatchers ?? []), ...(overrides.nicheMatchers ?? [])],
    allowedEntities: unique([...(inheritedDefault.allowedEntities ?? []), ...(overrides.allowedEntities ?? [])]),
    forbiddenTerms: unique([
        'altamente relevante',
        'excelencia profesional',
        'soluciones prestadas',
        'cronograma de servicios',
        ...(inheritedDefault.forbiddenTerms ?? []),
        ...(overrides.forbiddenTerms ?? [])
    ]),
    technicalConcepts: unique([...(inheritedDefault.technicalConcepts ?? []), ...(overrides.technicalConcepts ?? [])]),
    trustSignals: unique([
        'telefono visible',
        'cobertura local',
        'faq útil',
        ...(inheritedDefault.trustSignals ?? []),
        ...(overrides.trustSignals ?? [])
    ]),
    localProofPatterns: unique([
        'referencias geográficas locales',
        'puntos de servicio técnico',
        'logística específica del área',
        ...(inheritedDefault.localProofPatterns ?? []),
        ...(overrides.localProofPatterns ?? [])
    ])
});
const SECURITY_TERMS = [
    'cerradura',
    'cerraduras',
    'bombin',
    'bombín',
    'cilindro',
    'cilindros',
    'antibumping',
    'escudo magnético',
    'escudos magnéticos',
    'apertura sin daños',
    'apertura de puertas',
    'aperturas de puertas',
    'ganzúa',
    'ganzúas',
    'cerrojo',
    'cerrojos',
    'blindaje',
    'blindajes',
    'llave maestra',
    'llaves maestras',
    'caja fuerte',
    'cajas fuertes',
    'control de acceso',
    'control de accesos',
    'sistemas de acceso',
    'sistema de acceso',
    'cierrapuertas',
    'muelle cierrapuertas',
    'muelles cierrapuertas',
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
    'auditorías de seguridad',
    'cierre de seguridad',
    'cierres de seguridad',
    'robo',
    'robos',
    'robos nocturnos',
    'vandálico',
    'vandálicos',
    'actos vandálicos',
    'intrusión',
    'intrusiones',
    'emergencia de seguridad'
];
const PLUMBING_TERMS = [
    'fontanería',
    'fontaneria',
    'tubería',
    'tuberias',
    'tuberías',
    'grifería',
    'griferia',
    'desatasco',
    'desatascos',
    'fugas',
    'humedades'
];
const WOOD_TERMS = [
    'carpintería',
    'carpinteria',
    'ebanista',
    'ebanistería',
    'madera',
    'lacado',
    'barnizado',
    'armarios a medida'
];
const ELECTRIC_TERMS = [
    'electricidad',
    'electricista',
    'cuadro eléctrico',
    'cuadro electrico',
    'enchufe',
    'enchufes',
    'cortocircuito',
    'diferencial'
];
const HVAC_TERMS = [
    'aire acondicionado',
    'climatización',
    'climatizacion',
    'calefacción',
    'calefaccion',
    'caldera',
    'radiadores',
    'conductos'
];
const PAINT_TERMS = [
    'pintura',
    'pintor',
    'alisado',
    'gotele',
    'gotelé',
    'esmalte',
    'barnizado decorativo'
];
const GLASS_TERMS = [
    'cristal',
    'cristales',
    'vidrio',
    'vidrios',
    'doble acristalamiento',
    'mampara'
];
const BLINDS_TERMS = [
    'persiana',
    'persianas',
    'cinta',
    'recogedor',
    'lama',
    'lamas',
    'motor de persiana'
];
const PEST_TERMS = [
    'plagas',
    'cucarachas',
    'chinches',
    'termitas',
    'roedores',
    'desinsectación',
    'desratización'
];
const MOVING_TERMS = [
    'mudanza',
    'mudanzas',
    'embalaje',
    'guardamuebles',
    'portes',
    'elevador'
];
const ROOFING_TERMS = [
    'tejado',
    'tejados',
    'cubierta',
    'cubiertas',
    'teja',
    'tejas',
    'canalón',
    'canalones'
];
const REFORM_TERMS = [
    'reformas',
    'reforma integral',
    'obra',
    'obras',
    'albañilería',
    'albanilería',
    'alicatado',
    'solado'
];
const APPLIANCE_TERMS = [
    'electrodoméstico',
    'electrodomestico',
    'lavadora',
    'lavavajillas',
    'frigorífico',
    'frigorifico',
    'horno',
    'secadora'
];
const ANTENNA_TERMS = [
    'antena',
    'antenas',
    'tdt',
    'parabólica',
    'parabolica',
    'portero automático',
    'videoportero'
];
const SOLAR_TERMS = [
    'placas solares',
    'paneles solares',
    'inversor',
    'autoconsumo',
    'baterías solares',
    'fotovoltaica',
    'fotovoltaico'
];
const PACKS = {
    default: pack({}),
    carpinteria: pack({
        nicheMatchers: [/carpinter/i, /ebanist/i, /madera/i, /armarios?/i, /puertas?\s+de\s+madera/i],
        allowedEntities: ['madera maciza', 'melamina', 'MDF', 'roble', 'haya', 'lacado', 'barnizado', 'frentes de armario', 'puertas de paso'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...BLINDS_TERMS],
        technicalConcepts: [
            'ajuste de puertas',
            'fabricación a medida',
            'instalación de armarios',
            'frentes lacados',
            'reparación de madera',
            'barnizado y acabados',
            'cambio de bisagras',
            'nivelación de frentes'
        ],
        trustSignals: [
            'presupuesto claro',
            'acabados profesionales',
            'servicio local',
            'materiales duraderos',
            'ebanistas con experiencia',
            'muebles a medida',
            'ajustes precisos',
            'lijado y barnizado cuidado'
        ],
        localProofPatterns: ['barrios de cobertura', 'tipos de vivienda', 'necesidades habituales de la zona']
    }),
    fontaneria: pack({
        nicheMatchers: [/fontaner/i, /plomer/i, /grifer/i, /tuber/i, /humedades/i, /fugas?\s+de\s+agua/i],
        allowedEntities: ['tuberías', 'grifos', 'cisternas', 'calentadores', 'fugas', 'humedades', 'PVC', 'cobre', 'multicapa', 'bajantes'],
        forbiddenTerms: [...SECURITY_TERMS, ...WOOD_TERMS, ...BLINDS_TERMS],
        technicalConcepts: [
            'detección de fugas',
            'reparación de bajantes',
            'instalación de sanitarios',
            'cambio de grifería',
            'humedades y filtraciones',
            'sustitución de sifones',
            'reparación de cisternas',
            'fontanería urgente 24h'
        ],
        trustSignals: [
            'limpieza en el trabajo',
            'materiales homologados',
            'presupuesto previo',
            'garantía de reparación',
            'detección técnica de fugas',
            'soluciones de fontanería',
            'atención inmediata',
            'componentes de calidad'
        ],
        localProofPatterns: ['barrios de servicio', 'problemas comunes en ${city}', 'atención inmediata en la zona']
    }),
    desatascos: pack({
        nicheMatchers: [/desatas/i, /atasco/i, /desague/i, /desagüe/i, /alcantarillado/i, /tuberia\s+atascada/i],
        allowedEntities: ['desagües', 'arquetas', 'bajantes', 'fregaderos', 'wc', 'máquina de desatasco', 'cámara de inspección'],
        forbiddenTerms: [...SECURITY_TERMS, ...WOOD_TERMS, ...ELECTRIC_TERMS],
        technicalConcepts: [
            'desatascos con máquina',
            'inspección con cámara',
            'limpieza de arquetas',
            'desatasco de fregaderos',
            'desatasco de bajantes',
            'mantenimiento preventivo',
            'localización de obstrucciones'
        ],
        trustSignals: ['respuesta rápida', 'equipo profesional', 'intervención limpia', 'diagnóstico claro'],
        localProofPatterns: ['calles con redes antiguas', 'atascos habituales en ${city}', 'intervenciones frecuentes en la zona']
    }),
    cerrajeria: pack({
        nicheMatchers: [/cerraj/i, /apertura/i, /cerradur/i, /bombin/i, /llave/i, /blindada/i, /acorazada/i],
        allowedEntities: ['cerraduras de seguridad', 'bombines antibumping', 'escudos protectores', 'puertas blindadas', 'cerrojos', 'muelles cierrapuertas', 'igualamiento de llaves'],
        forbiddenTerms: [...PLUMBING_TERMS, ...WOOD_TERMS, 'persianas de PVC', 'humedades'],
        technicalConcepts: [
            'apertura de puertas sin romper',
            'cambio de bombín de seguridad',
            'instalación de cerrojos suplementarios',
            'reparación de cierres metálicos',
            'extracción de llaves partidas',
            'conversión de cerradura a perfil europeo',
            'amaestramiento de cilindros',
            'cerrajería técnica de alta seguridad'
        ],
        trustSignals: [
            'técnicos acreditados',
            'presupuesto sin sorpresas',
            'materiales de marcas líderes',
            'garantía por escrito',
            'cerrajería técnica 24h',
            'aperturas cuidadosas',
            'bombines antibumping',
            'asesoramiento en seguridad'
        ],
        localProofPatterns: ['asistencia en todos los barrios', 'expertos en seguridad local', 'respuesta ante emergencias en ${city}']
    }),
    electricidad: pack({
        nicheMatchers: [/electric/i, /enchufe/i, /cuadro\s+electr/i, /cortocircuit/i, /iluminacion/i, /iluminación/i],
        allowedEntities: ['cuadro eléctrico', 'magnetotérmicos', 'diferencial', 'tomas de corriente', 'iluminación LED', 'boletín eléctrico', 'cableado'],
        forbiddenTerms: [...PLUMBING_TERMS, ...WOOD_TERMS, ...GLASS_TERMS],
        technicalConcepts: [
            'reparación de averías eléctricas',
            'cambio de diferencial',
            'renovación de cuadro eléctrico',
            'instalación de puntos de luz',
            'boletines e inspecciones',
            'detección de sobrecargas',
            'cableado de vivienda'
        ],
        trustSignals: [
            'cumplimiento normativo',
            'material homologado',
            'diagnóstico seguro',
            'explicación clara de la avería',
            'electricistas autorizados',
            'revisiones de boletín',
            'cuadros eléctricos protegidos',
            'seguridad eléctrica total'
        ],
        localProofPatterns: ['edificios antiguos de ${city}', 'barrios con instalaciones antiguas', 'atención rápida en la zona']
    }),
    pintura: pack({
        nicheMatchers: [/pintur/i, /pintor/i, /gotele/i, /gotelé/i, /alisado/i, /esmalte/i],
        allowedEntities: ['pintura plástica', 'esmalte al agua', 'alisado', 'gotelé', 'fachadas', 'techos', 'imprimación'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...APPLIANCE_TERMS],
        technicalConcepts: [
            'alisado de paredes',
            'pintura de techos',
            'reparación de grietas',
            'aplicación de imprimación',
            'pintura de fachadas',
            'esmaltado de carpintería',
            'protección de superficies'
        ],
        trustSignals: [
            'acabado fino',
            'protección del mobiliario',
            'presupuesto desglosado',
            'plazos realistas',
            'limpieza post-trabajo',
            'asesoramiento de color',
            'alisado de paredes',
            'pintores con criterio'
        ],
        localProofPatterns: ['fachadas expuestas al clima local', 'pisos habituales de la zona', 'mantenimiento interior en ${city}']
    }),
    albanileria: pack({
        nicheMatchers: [/albanil/i, /albañil/i, /albaniler/i, /albañiler/i, /alicat/i, /solad/i, /tabique/i],
        allowedEntities: ['tabiques', 'alicatados', 'solados', 'mortero', 'yeso', 'revestimientos', 'pequeñas obras'],
        forbiddenTerms: [...SECURITY_TERMS, ...APPLIANCE_TERMS, ...ANTENNA_TERMS],
        technicalConcepts: [
            'levantado de tabiques',
            'reparación de grietas',
            'alicatado de baños',
            'solado interior',
            'recrecidos y nivelación',
            'enlucidos',
            'aperturas de rozas'
        ],
        trustSignals: ['acabados limpios', 'planificación clara', 'material adecuado', 'coordinación de trabajos'],
        localProofPatterns: ['obras frecuentes en viviendas de la zona', 'soluciones para edificios de ${city}', 'intervenciones habituales por barrio']
    }),
    reformas: pack({
        nicheMatchers: [/reformas?/i, /reforma\s+integral/i, /obra\s+integral/i, /rehabilit/i, /renovacion/i, /renovación/i],
        allowedEntities: ['reforma integral', 'baños', 'cocinas', 'redistribución', 'alicatados', 'solados', 'coordinación de gremios'],
        forbiddenTerms: [...SECURITY_TERMS, ...PEST_TERMS, ...MOVING_TERMS],
        technicalConcepts: [
            'reforma de baño',
            'reforma de cocina',
            'redistribución de espacios',
            'coordinación de gremios',
            'demoliciones controladas',
            'acabados interiores',
            'planificación por fases'
        ],
        trustSignals: ['presupuesto por partidas', 'seguimiento de obra', 'plazos definidos', 'acabados supervisados'],
        localProofPatterns: ['viviendas antiguas de ${city}', 'pisos para actualizar en la zona', 'necesidades de reforma por barrio']
    }),
    pladur: pack({
        nicheMatchers: [/pladur/i, /yeso\s+laminado/i, /falso\s+techo/i, /tabique\s+seco/i],
        allowedEntities: ['placas de yeso laminado', 'falsos techos', 'trasdosados', 'aislamiento', 'tabiques de pladur'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...MOVING_TERMS],
        technicalConcepts: [
            'montaje de tabiques de pladur',
            'falsos techos registrables',
            'aislamiento interior',
            'trasdosados',
            'integración de iluminación',
            'reparación de placas'
        ],
        trustSignals: ['acabado uniforme', 'montaje preciso', 'limpieza de obra', 'solución rápida y ordenada'],
        localProofPatterns: ['reformas interiores en ${city}', 'soluciones de división de espacios', 'obras limpias en viviendas de la zona']
    }),
    impermeabilizacion: pack({
        nicheMatchers: [/impermeabil/i, /filtracion/i, /filtración/i, /humedad/i, /terraza/i, /cubierta/i],
        allowedEntities: ['membranas', 'sellados', 'cubiertas', 'terrazas', 'juntas', 'filtraciones', 'humedades'],
        forbiddenTerms: [...SECURITY_TERMS, ...APPLIANCE_TERMS, ...ANTENNA_TERMS],
        technicalConcepts: [
            'impermeabilización de terrazas',
            'sellado de juntas',
            'reparación de filtraciones',
            'tratamiento de humedades',
            'protección de cubiertas',
            'detección del punto de entrada'
        ],
        trustSignals: ['diagnóstico del origen', 'materiales específicos', 'intervención duradera', 'explicación del tratamiento'],
        localProofPatterns: ['edificios expuestos a lluvia y viento', 'filtraciones comunes en ${city}', 'terrazas habituales de la zona']
    }),
    climatizacion: pack({
        nicheMatchers: [/climatiz/i, /aire\s+acondicionado/i, /split/i, /conductos/i, /bomba\s+de\s+calor/i],
        allowedEntities: ['split', 'multisplit', 'conductos', 'bomba de calor', 'gas refrigerante', 'unidad exterior', 'termostato'],
        forbiddenTerms: [...PLUMBING_TERMS, ...WOOD_TERMS, ...SECURITY_TERMS],
        technicalConcepts: [
            'instalación de aire acondicionado',
            'carga de gas refrigerante',
            'limpieza de filtros',
            'revisión de conductos',
            'mantenimiento preventivo',
            'sustitución de equipos',
            'puesta en marcha'
        ],
        trustSignals: ['instalación cuidada', 'asesoramiento de potencia', 'equipo certificado', 'presupuesto transparente'],
        localProofPatterns: ['olas de calor en ${city}', 'viviendas con conductos o split', 'necesidad de climatización en la zona']
    }),
    calefaccion: pack({
        nicheMatchers: [/calefacc/i, /caldera/i, /radiador/i, /termostato/i, /suelo\s+radiante/i],
        allowedEntities: ['calderas', 'radiadores', 'termostatos', 'suelo radiante', 'circuito de calefacción', 'purgado', 'válvulas'],
        forbiddenTerms: [...SECURITY_TERMS, ...WOOD_TERMS, ...ANTENNA_TERMS],
        technicalConcepts: [
            'revisión de calderas',
            'purga de radiadores',
            'cambio de termostato',
            'equilibrado del circuito',
            'mantenimiento de calefacción',
            'sustitución de radiadores'
        ],
        trustSignals: ['revisión detallada', 'intervención segura', 'explicación del fallo', 'mantenimiento recomendado'],
        localProofPatterns: ['invierno en ${city}', 'averías habituales en radiadores', 'sistemas de calefacción comunes en la zona']
    }),
    persianas: pack({
        nicheMatchers: [/persian/i, /lama/i, /cinta\s+de\s+persiana/i, /motor\s+de\s+persiana/i, /estor/i],
        allowedEntities: ['lamas', 'recogedores', 'cintas', 'ejes', 'motores de persiana', 'persianas enrollables', 'topes'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...PAINT_TERMS],
        technicalConcepts: [
            'cambio de cinta',
            'sustitución de lamas',
            'reparación de eje',
            'motorización de persianas',
            'ajuste de topes',
            'reparación de persianas atascadas'
        ],
        trustSignals: ['reparación rápida', 'piezas compatibles', 'presupuesto simple', 'solución duradera'],
        localProofPatterns: ['persianas comunes en pisos de ${city}', 'averías por uso diario', 'atención en todos los barrios']
    }),
    toldos: pack({
        nicheMatchers: [/toldo/i, /capota/i, /brazo\s+articulado/i, /cofre\s+de\s+toldo/i],
        allowedEntities: ['toldos extensibles', 'capotas', 'cofre', 'lona acrílica', 'brazos articulados', 'motorización de toldos'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...GLASS_TERMS],
        technicalConcepts: [
            'instalación de toldos',
            'cambio de lona',
            'ajuste de brazos',
            'motorización de toldos',
            'anclajes seguros',
            'revisión de mecanismos'
        ],
        trustSignals: ['medición precisa', 'instalación segura', 'acabado limpio', 'asesoramiento sobre uso y mantenimiento'],
        localProofPatterns: ['fachadas y terrazas de ${city}', 'exposición solar de la zona', 'sombras necesarias en viviendas locales']
    }),
    cristaleria: pack({
        nicheMatchers: [/cristal/i, /cristaler/i, /vidrio/i, /mampara/i, /espejo/i],
        allowedEntities: ['vidrio templado', 'doble acristalamiento', 'mamparas', 'espejos', 'escaparates', 'cerramientos de cristal'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...MOVING_TERMS],
        technicalConcepts: [
            'sustitución de cristales',
            'instalación de mamparas',
            'colocación de espejos',
            'doble acristalamiento',
            'sellado perimetral',
            'ajuste de cerramientos'
        ],
        trustSignals: ['medición exacta', 'manipulación segura', 'acabado cuidado', 'material adaptado al uso'],
        localProofPatterns: ['escaparates y viviendas de la zona', 'roturas habituales en ${city}', 'soluciones a medida por barrio']
    }),
    mudanzas: pack({
        nicheMatchers: [/mudanz/i, /portes?/i, /guardamuebles/i, /embalaje/i, /traslado/i],
        allowedEntities: ['embalaje', 'protección de muebles', 'guardamuebles', 'portes', 'elevador', 'desmontaje y montaje'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...HVAC_TERMS],
        technicalConcepts: [
            'embalaje profesional',
            'desmontaje de mobiliario',
            'traslado local',
            'uso de elevador',
            'guardamuebles',
            'planificación de rutas'
        ],
        trustSignals: ['puntualidad', 'protección del mobiliario', 'presupuesto cerrado', 'equipo organizado'],
        localProofPatterns: ['mudanzas entre barrios de ${city}', 'edificios sin ascensor', 'traslados frecuentes en la zona']
    }),
    limpieza: pack({
        nicheMatchers: [/limpiez/i, /limpiar/i, /fin\s+de\s+obra/i, /cristales?\s+domicilio/i, /desinfecc/i],
        allowedEntities: ['limpieza general', 'fin de obra', 'cristales', 'desinfección', 'comunidades', 'oficinas', 'moquetas'],
        forbiddenTerms: [...SECURITY_TERMS, ...WOOD_TERMS, ...ANTENNA_TERMS],
        technicalConcepts: [
            'limpieza de fin de obra',
            'limpieza profunda',
            'limpieza de cristales',
            'desinfección de superficies',
            'mantenimiento de comunidades',
            'tratamiento de suelos'
        ],
        trustSignals: ['productos adecuados', 'trabajo detallado', 'plan de limpieza claro', 'equipo puntual'],
        localProofPatterns: ['comunidades y viviendas de ${city}', 'limpiezas habituales por zona', 'servicio recurrente en barrios cercanos']
    }),
    jardineria: pack({
        nicheMatchers: [/jardiner/i, /cesped/i, /césped/i, /poda/i, /riego/i, /setos?/i],
        allowedEntities: ['césped', 'riego automático', 'setos', 'poda', 'plantación', 'abono', 'mantenimiento de jardines'],
        forbiddenTerms: [...SECURITY_TERMS, ...PLUMBING_TERMS, ...GLASS_TERMS],
        technicalConcepts: [
            'poda de mantenimiento',
            'instalación de riego',
            'cuidado de césped',
            'desbroce',
            'plantación ornamental',
            'mantenimiento estacional'
        ],
        trustSignals: ['mantenimiento regular', 'asesoramiento estacional', 'trabajo cuidadoso', 'plan de conservación'],
        localProofPatterns: ['jardines y patios de ${city}', 'clima local y especies adecuadas', 'mantenimiento frecuente en la zona']
    }),
    control_plagas: pack({
        nicheMatchers: [/plagas?/i, /cucarachas?/i, /chinches?/i, /termitas?/i, /ratas?/i, /ratones?/i, /desinsect/i, /desratiz/i],
        allowedEntities: ['cucarachas', 'chinches', 'termitas', 'roedores', 'cebos', 'trampas', 'tratamientos específicos'],
        forbiddenTerms: [...SECURITY_TERMS, ...WOOD_TERMS, ...MOVING_TERMS],
        technicalConcepts: [
            'inspección de plagas',
            'tratamiento contra cucarachas',
            'tratamiento contra chinches',
            'control de termitas',
            'desratización',
            'seguimiento post tratamiento'
        ],
        trustSignals: ['diagnóstico preciso', 'tratamiento adaptado', 'seguimiento posterior', 'explicación de medidas preventivas'],
        localProofPatterns: ['plagas habituales en ${city}', 'zonas con mayor incidencia', 'actuaciones comunes en viviendas y locales']
    }),
    electrodomesticos: pack({
        nicheMatchers: [/electrodomest/i, /lavadora/i, /lavavajillas/i, /frigor/i, /nevera/i, /horno/i, /secadora/i],
        allowedEntities: ['lavadoras', 'lavavajillas', 'frigoríficos', 'hornos', 'secadoras', 'placas de cocina', 'repuestos'],
        forbiddenTerms: [...SECURITY_TERMS, ...REFORM_TERMS, ...MOVING_TERMS],
        technicalConcepts: [
            'diagnóstico de averías',
            'cambio de repuestos',
            'reparación de lavadora',
            'reparación de frigorífico',
            'reparación de horno',
            'mantenimiento preventivo'
        ],
        trustSignals: ['diagnóstico honesto', 'repuesto compatible', 'explicación de la avería', 'presupuesto antes de reparar'],
        localProofPatterns: ['averías habituales en hogares de ${city}', 'desplazamiento por barrios', 'asistencia local rápida']
    }),
    antenas: pack({
        nicheMatchers: [/anten/i, /tdt/i, /parabol/i, /paraból/i, /videoportero/i, /portero\s+automatico/i, /portero\s+automático/i],
        allowedEntities: ['antenas TDT', 'parabólicas', 'videoporteros', 'porteros automáticos', 'amplificadores', 'cableado coaxial'],
        forbiddenTerms: [...PLUMBING_TERMS, ...WOOD_TERMS, ...PEST_TERMS],
        technicalConcepts: [
            'orientación de antena',
            'reparación de señal TDT',
            'instalación de parabólicas',
            'cambio de amplificador',
            'reparación de videoportero',
            'revisión de cableado'
        ],
        trustSignals: ['diagnóstico de señal', 'equipos compatibles', 'ajuste preciso', 'servicio local rápido'],
        localProofPatterns: ['problemas de señal en ${city}', 'edificios con instalaciones comunes', 'atención en comunidades y viviendas']
    }),
    tejados: pack({
        nicheMatchers: [/tejad/i, /cubierta/i, /tejas?/i, /canalon/i, /canalón/i, /gotera/i],
        allowedEntities: ['tejados', 'cubiertas', 'tejas', 'canalones', 'bajantes pluviales', 'sellados', 'limpieza de cubierta'],
        forbiddenTerms: [...SECURITY_TERMS, ...APPLIANCE_TERMS, ...MOVING_TERMS],
        technicalConcepts: [
            'reparación de tejados',
            'sustitución de tejas',
            'limpieza de canalones',
            'sellado de cubiertas',
            'reparación de goteras',
            'revisión preventiva'
        ],
        trustSignals: ['inspección visual detallada', 'trabajo seguro', 'material apropiado', 'explicación del estado de la cubierta'],
        localProofPatterns: ['cubiertas expuestas al clima de ${city}', 'goteras frecuentes en la zona', 'mantenimiento habitual de tejados por barrio']
    }),
    placas_solares: pack({
        nicheMatchers: [/placas?\s+solares?/i, /paneles?\s+solares?/i, /fotovoltaic/i, /autoconsumo/i, /inversor/i],
        allowedEntities: ['paneles solares', 'inversores', 'autoconsumo', 'baterías', 'estructura de soporte', 'monitorización', 'producción solar'],
        forbiddenTerms: [...SECURITY_TERMS, ...MOVING_TERMS, ...PEST_TERMS],
        technicalConcepts: [
            'instalación fotovoltaica',
            'cálculo de potencia',
            'orientación de paneles',
            'mantenimiento de placas solares',
            'revisión de inversores',
            'monitorización del sistema'
        ],
        trustSignals: ['estudio previo', 'instalación ordenada', 'explicación de rendimiento', 'seguimiento técnico'],
        localProofPatterns: ['horas de sol en ${city}', 'cubiertas aptas en la zona', 'autoconsumo residencial local']
    })
};
const ALIAS_TO_PACK = {
    aire_acondicionado: 'climatizacion',
    climatizacion: 'climatizacion',
    calefaccion: 'calefaccion',
    fontaneria: 'fontaneria',
    plomeria: 'fontaneria',
    desatascos: 'desatascos',
    cerrajeria: 'cerrajeria',
    electricidad: 'electricidad',
    electricista: 'electricidad',
    carpinteria: 'carpinteria',
    carpintero: 'carpinteria',
    pintura: 'pintura',
    pintor: 'pintura',
    albanileria: 'albanileria',
    albanil: 'albanileria',
    reformas: 'reformas',
    reforma_integral: 'reformas',
    pladur: 'pladur',
    impermeabilizacion: 'impermeabilizacion',
    persianas: 'persianas',
    toldos: 'toldos',
    cristaleria: 'cristaleria',
    mudanzas: 'mudanzas',
    limpieza: 'limpieza',
    jardineria: 'jardineria',
    control_de_plagas: 'control_plagas',
    plagas: 'control_plagas',
    electrodomesticos: 'electrodomesticos',
    reparacion_de_electrodomesticos: 'electrodomesticos',
    antenas: 'antenas',
    antenista: 'antenas',
    tejados: 'tejados',
    cubiertas: 'tejados',
    placas_solares: 'placas_solares',
    energia_solar: 'placas_solares'
};
export function resolveVerticalPack(niche) {
    const raw = niche || '';
    const normalized = normalizeKey(raw);
    const aliasKey = ALIAS_TO_PACK[normalized];
    if (aliasKey && PACKS[aliasKey]) {
        return PACKS[aliasKey];
    }
    if (PACKS[normalized]) {
        return PACKS[normalized];
    }
    for (const [key, candidatePack] of Object.entries(PACKS)) {
        if (key === 'default')
            continue;
        if (candidatePack.nicheMatchers?.some((rx) => rx.test(raw) || rx.test(normalized))) {
            return candidatePack;
        }
    }
    return PACKS.default;
}
