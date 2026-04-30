import type { NicheContentBank } from './types.js';

export const DEFAULT_BANK: NicheContentBank = {
  label: 'servicios locales',
  singular: 'servicio local',
  services: ['diagnóstico inicial', 'presupuesto claro', 'planificación del trabajo', 'materiales adecuados', 'ejecución ordenada', 'revisión final'],
  technicalTerms: ['alcance del trabajo', 'estado previo', 'materiales', 'tiempos', 'acceso', 'acabado'],
  objections: ['evitar presupuestos genéricos', 'aclarar el alcance antes de empezar', 'separar materiales y mano de obra'],
  trustSignals: ['comunicación directa', 'presupuesto entendible', 'revisión final', 'criterio técnico', 'orden en la intervención'],
  process: ['revisión del caso', 'explicación de opciones', 'presupuesto orientado al alcance', 'ejecución controlada', 'comprobación final'],
  priceFactors: ['alcance real', 'materiales necesarios', 'dificultad de acceso', 'urgencia', 'remates finales'],
  faq: [
    { q: '¿Cómo se valora el trabajo?', a: 'Se revisa el alcance, el estado previo, los materiales y el tiempo necesario antes de orientar el presupuesto.' },
    { q: '¿Conviene enviar fotos?', a: 'Sí. Las fotos ayudan a entender el caso y evitan presupuestos demasiado genéricos.' },
    { q: '¿Qué debería quedar claro antes de empezar?', a: 'El trabajo incluido, posibles materiales, tiempos aproximados y comprobación final.' },
  ],
  urgency: ['priorizar riesgos visibles', 'confirmar acceso y horario', 'explicar el problema con precisión'],
  proofAngles: ['proceso claro', 'criterio técnico', 'atención adaptada a la zona'],
};

export const NICHE_BANKS: Record<string, NicheContentBank> = {
  cerrajeros: {
    label: 'cerrajería',
    singular: 'cerrajero',
    services: ['apertura de puertas', 'cambio de cerraduras', 'bombines de seguridad', 'escudos protectores', 'amaestramiento de llaves', 'cierres metálicos'],
    technicalTerms: ['bombín', 'cilindro', 'cerradura', 'escudo', 'resbalón', 'anti-bumping', 'anti-taladro', 'llave partida'],
    objections: ['evitar daños innecesarios en la puerta', 'confirmar el tipo de cerradura', 'diferenciar apertura, sustitución y mejora de seguridad'],
    trustSignals: ['explicación del método de apertura', 'piezas identificadas', 'presupuesto antes de sustituir', 'comprobación del cierre'],
    process: ['identificación de la cerradura', 'valoración del acceso', 'apertura o sustitución controlada', 'ajuste del bombín o escudo', 'prueba final con llave'],
    priceFactors: ['tipo de cerradura', 'horario', 'necesidad de piezas', 'estado de puerta y marco', 'nivel de seguridad elegido'],
    faq: [
      { q: '¿Siempre hay que cambiar la cerradura?', a: 'No. Depende del problema: a veces basta con apertura, ajuste del resbalón o sustitución del bombín.' },
      { q: '¿Qué datos ayudan antes de ir?', a: 'Tipo de puerta, si la llave está dentro o partida, fotos de la cerradura y nivel de urgencia.' },
      { q: '¿Puedo mejorar seguridad sin cambiar toda la puerta?', a: 'Sí, en muchos casos se puede reforzar con bombín de seguridad, escudo protector o ajuste de herrajes.' },
    ],
    urgency: ['puerta cerrada con llaves dentro', 'llave partida', 'cerradura forzada', 'vivienda sin cierre seguro'],
    proofAngles: ['diagnóstico de la cerradura', 'apertura no destructiva cuando es viable', 'piezas acordes al nivel de seguridad'],
  },
  fontaneros: {
    label: 'fontanería',
    singular: 'fontanero',
    services: ['fugas de agua', 'atascos', 'grifería', 'llaves de paso', 'desagües', 'termos y calderas'],
    technicalTerms: ['fuga', 'tubería', 'llave de paso', 'desagüe', 'sifón', 'presión', 'humedad', 'termo'],
    objections: ['localizar el origen antes de romper', 'diferenciar atasco puntual de problema recurrente', 'comprobar presión y llaves de corte'],
    trustSignals: ['diagnóstico del origen', 'prueba de estanqueidad', 'explicación de piezas', 'zona de trabajo protegida'],
    process: ['revisión visual', 'corte seguro del agua si procede', 'localización del origen', 'reparación o sustitución', 'prueba de funcionamiento'],
    priceFactors: ['origen de la fuga', 'accesibilidad de la tubería', 'piezas necesarias', 'urgencia', 'trabajos de albañilería asociados'],
    faq: [
      { q: '¿Qué hago si hay una fuga activa?', a: 'Cierra la llave de paso si es posible y describe dónde aparece el agua para priorizar la revisión.' },
      { q: '¿Un atasco puede volver a aparecer?', a: 'Sí, si hay pendiente incorrecta, acumulación en bajante o uso recurrente. Conviene revisar el patrón.' },
      { q: '¿El presupuesto incluye materiales?', a: 'Debe quedar separado o explicado según piezas, mano de obra y posible desplazamiento.' },
    ],
    urgency: ['fuga activa', 'humedad creciente', 'desagüe bloqueado', 'llave de paso que no cierra'],
    proofAngles: ['prueba de estanqueidad', 'revisión del origen real', 'criterio para evitar roturas innecesarias'],
  },
  electricistas: {
    label: 'electricidad',
    singular: 'electricista',
    services: ['cuadro eléctrico', 'averías eléctricas', 'enchufes e iluminación', 'boletín eléctrico', 'sobrecargas', 'mantenimiento eléctrico'],
    technicalTerms: ['cuadro eléctrico', 'diferencial', 'magnetotérmico', 'derivación', 'sobrecarga', 'boletín eléctrico', 'enchufe', 'LED'],
    objections: ['evitar manipulaciones sin seguridad', 'separar avería puntual de instalación antigua', 'comprobar protecciones del cuadro'],
    trustSignals: ['revisión con seguridad', 'identificación del circuito', 'explicación de protecciones', 'prueba posterior'],
    process: ['descripción de la avería', 'revisión del cuadro', 'aislamiento del circuito', 'reparación o sustitución', 'comprobación segura'],
    priceFactors: ['tipo de avería', 'circuitos afectados', 'material eléctrico', 'acceso a canalizaciones', 'boletín o documentación si aplica'],
    faq: [
      { q: '¿Por qué salta el diferencial?', a: 'Puede deberse a humedad, derivación, aparato defectuoso o circuito con aislamiento deteriorado.' },
      { q: '¿Cuándo hace falta boletín eléctrico?', a: 'Depende del trámite, potencia o estado de instalación. Conviene revisar el caso antes de prometerlo.' },
      { q: '¿Es seguro cambiar un enchufe sin revisar el circuito?', a: 'No siempre. Si hay calentamiento, chispazos o cortes, conviene revisar la línea.' },
    ],
    urgency: ['olor a quemado', 'chispazos', 'diferencial que salta', 'zona sin luz', 'cuadro antiguo con sobrecarga'],
    proofAngles: ['revisión de protecciones', 'diagnóstico por circuito', 'pruebas antes de cerrar la intervención'],
  },
  carpinteros: {
    label: 'carpintería',
    singular: 'carpintero',
    services: ['puertas de madera', 'armarios a medida', 'muebles a medida', 'ajustes de herrajes', 'tarima y parquet', 'reparaciones de madera'],
    technicalTerms: ['herraje', 'bisagra', 'canto', 'tablero', 'barniz', 'lacado', 'parquet', 'escuadrado'],
    objections: ['medir antes de fabricar', 'diferenciar reparación y sustitución', 'elegir acabado según uso real'],
    trustSignals: ['medición precisa', 'propuesta de materiales', 'acabados explicados', 'ajuste final'],
    process: ['medición', 'elección de material', 'preparación o fabricación', 'montaje', 'ajuste y revisión'],
    priceFactors: ['medidas', 'tipo de madera o tablero', 'acabado', 'herrajes', 'dificultad de montaje'],
    faq: [
      { q: '¿Es mejor reparar o sustituir?', a: 'Depende del estado de la pieza, uso previsto, coste de herrajes y acabado necesario.' },
      { q: '¿Qué condiciona un mueble a medida?', a: 'Medidas, material, sistema de apertura, acabado y adaptación a paredes o suelos existentes.' },
      { q: '¿Se puede igualar un acabado existente?', a: 'A veces se aproxima, pero conviene revisar color, veta, barniz o lacado antes de prometer coincidencia exacta.' },
    ],
    urgency: ['puerta que no cierra', 'bisagra suelta', 'tarima levantada', 'mueble inestable'],
    proofAngles: ['medición seria', 'acabados coherentes', 'ajuste posterior al montaje'],
  },
  reformas: {
    label: 'reformas',
    singular: 'reforma',
    services: ['medición previa', 'alicatados y solados', 'pladur', 'acabados', 'licencias', 'coordinación de gremios'],
    technicalTerms: ['alicatado', 'solado', 'pladur', 'tabiquería', 'licencia', 'medición', 'acabados', 'aislamiento'],
    objections: ['cerrar alcance por partidas', 'evitar cambios sin presupuesto', 'coordinar gremios y tiempos'],
    trustSignals: ['medición previa', 'partidas explicadas', 'plan de obra', 'remates revisados'],
    process: ['visita y medición', 'definición de partidas', 'planificación', 'ejecución por fases', 'repaso de acabados'],
    priceFactors: ['metros', 'estado previo', 'demoliciones', 'materiales', 'instalaciones', 'licencias y remates'],
    faq: [
      { q: '¿Por qué varía tanto un presupuesto de reforma?', a: 'Porque influyen metros, estado previo, instalaciones ocultas, calidades y coordinación de gremios.' },
      { q: '¿Conviene definir calidades antes?', a: 'Sí. Alicatado, solado, sanitarios, pintura y carpintería cambian mucho el alcance.' },
      { q: '¿Se pueden evitar desviaciones?', a: 'Se reducen con medición, partidas claras y margen para imprevistos visibles o técnicos.' },
    ],
    urgency: ['humedad estructural visible', 'instalación obsoleta', 'obra parada por indefinición', 'remates pendientes'],
    proofAngles: ['presupuesto por partidas', 'coordinación de gremios', 'revisión de acabados'],
  },
  pintores: {
    label: 'pintura',
    singular: 'pintor',
    services: ['pintura interior', 'alisado de paredes', 'humedades', 'esmaltado', 'papel pintado', 'acabados decorativos'],
    technicalTerms: ['imprimación', 'plaste', 'lijado', 'esmalte', 'gotelé', 'alisado', 'humedad', 'acabado mate'],
    objections: ['preparar soporte antes de pintar', 'no tapar humedades sin tratar origen', 'elegir pintura según estancia'],
    trustSignals: ['protección de zonas', 'preparación del soporte', 'capas explicadas', 'limpieza final'],
    process: ['protección', 'preparación de pared', 'imprimación si procede', 'aplicación de capas', 'repaso final'],
    priceFactors: ['metros', 'estado de paredes', 'tipo de pintura', 'altura', 'muebles a proteger', 'acabado elegido'],
    faq: [
      { q: '¿Hay que preparar la pared?', a: 'Sí. Lijado, plaste, imprimación o tratamiento de humedad cambian mucho el resultado.' },
      { q: '¿Cuántas capas hacen falta?', a: 'Depende del color anterior, absorción de la pared y pintura elegida.' },
      { q: '¿Se puede pintar sobre humedad?', a: 'No conviene sin revisar origen y secado; si no, la mancha suele volver.' },
    ],
    urgency: ['humedad visible', 'desconchones', 'pared dañada antes de entrega', 'repaso final de vivienda'],
    proofAngles: ['preparación de soporte', 'protección de mobiliario', 'acabado revisado con luz natural'],
  },
};

function normalizeKey(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveNicheBank(niche?: string): NicheContentBank {
  const key = normalizeKey(niche);
  const exact = Object.entries(NICHE_BANKS).find(([candidate]) => key.includes(candidate) || candidate.includes(key));
  return exact?.[1] || DEFAULT_BANK;
}
