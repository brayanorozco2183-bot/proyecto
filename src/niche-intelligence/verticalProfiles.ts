import type { NicheVertical, VerticalProfile } from './types.js';

export const VERTICAL_PROFILES: Record<NicheVertical, VerticalProfile> = {
  home_services: {
    vertical: 'home_services',
    label: 'servicios del hogar y asistencia técnica',
    defaultIntent: 'diagnostic_service',
    legalSensitivity: 'medium',
    tone: 'práctico, técnico y orientado a diagnóstico previo',
    minimumTechnicalDepth: 'deep',
    vocabulary: ['diagnóstico de avería', 'punto de entrada', 'compatibilidad de herrajes', 'presión nominal', 'aislamiento térmico', 'puente térmico', 'estanqueidad', 'mantenimiento preventivo', 'reparación técnica', 'sustitución de componentes', 'verificación de funcionamiento', 'normativa de seguridad'],
    decisionCriteria: ['gravedad de la avería', 'viabilidad de reparación vs sustitución', 'compatibilidad técnica de piezas', 'riesgo de daños colaterales', 'materiales certificados', 'alcance real de la intervención', 'comprobación técnica final'],
    trustAssets: ['diagnóstico técnico previo', 'presupuesto desglosado por partidas', 'garantía de materiales y mano de obra', 'explicación del procedimiento técnico', 'verificación de seguridad post-intervención'],
    buyerObjections: ['miedo a reparaciones innecesarias', 'incertidumbre sobre el coste final', 'temor a fallos recurrentes', 'necesidad de tiempos de intervención reales', 'desconfianza ante repuestos genéricos'],
    preferredCtas: {
      urgent_service: ['Solicitar intervención urgente', 'Pedir diagnóstico de emergencia'],
      diagnostic_service: ['Solicitar valoración técnica', 'Consultar el caso con un especialista'],
      quote_project: ['Pedir presupuesto detallado', 'Solicitar valoración de proyecto'],
      comparison_research: ['Evaluar opciones técnicas', 'Resolver dudas sobre el servicio']
    },
    forbiddenClaims: ['sin daños garantizado', 'precio cerrado siempre', 'solución definitiva 100%', 'urgencia sin coste'],
    safeClaimAlternatives: ['se prioriza la técnica menos invasiva', 'presupuesto basado en diagnóstico previo', 'solución recomendada según estado técnico', 'condiciones técnicas explicadas antes de actuar'],
    localModifiers: ['cobertura operativa en la zona', 'desplazamiento técnico', 'franja de atención local', 'logística de intervención', 'acceso y montaje'],
    serviceTemplates: ['Diagnóstico y valoración', 'Intervención técnica especializada', 'Instalación y puesta en marcha', 'Mantenimiento y revisión', 'Comprobación de seguridad'],
    faqSeeds: ['¿Cómo se evalúa el estado previo antes de intervenir?', '¿Qué factores determinan si conviene reparar o sustituir?', '¿Qué información técnica ayuda a ajustar el presupuesto?'],
    enrichment: {
      authorityMarkers: ['uso de herramienta profesional certificada', 'conocimiento de normativa técnica vigente', 'capacidad de diagnóstico multimarca', 'protocolos de limpieza y protección'],
      trustSignals: ['garantía por escrito', 'transparencia en el coste de materiales', 'explicación de la avería con lenguaje claro']
    }
  },
  healthcare: {
    vertical: 'healthcare',
    label: 'salud y bienestar clínico',
    defaultIntent: 'appointment_consulting',
    legalSensitivity: 'high',
    tone: 'prudente, informativo y centrado en valoración profesional',
    minimumTechnicalDepth: 'standard',
    vocabulary: ['valoración clínica', 'diagnóstico diferencial', 'historial médico', 'plan de tratamiento', 'seguimiento terapéutico', 'sintomatología', 'exploración física', 'consentimiento informado', 'prevención primaria', 'revisión periódica'],
    decisionCriteria: ['antecedentes clínicos', 'estado actual de salud', 'resultados de pruebas', 'riesgos y beneficios del tratamiento', 'seguimiento necesario', 'necesidades individuales del paciente'],
    trustAssets: ['primera consulta de valoración profesional', 'plan de tratamiento individualizado', 'información clara y honesta', 'equipo profesional colegiado', 'entorno clínico higiénico y seguro'],
    buyerObjections: ['miedo al dolor o molestias técnicas', 'incertidumbre sobre la duración', 'preocupación por la viabilidad económica', 'dudas sobre la efectividad del tratamiento', 'necesidad de un trato profesional cercano'],
    preferredCtas: {
      appointment_consulting: ['Solicitar valoración profesional', 'Pedir cita de diagnóstico inicial'],
      comparison_research: ['Consultar opciones de tratamiento', 'Resolver dudas clínicas iniciales'],
      local_discovery: ['Ver horarios de atención médica', 'Consultar disponibilidad de consulta']
    },
    forbiddenClaims: ['cura total garantizada', 'sin ningún riesgo', 'resultado permanente asegurado', 'éxito del 100%', 'tratamiento revolucionario sin base'],
    safeClaimAlternatives: ['valoración individualizada obligatoria', 'resultados según diagnóstico previo', 'procedimientos con riesgos explicados', 'seguimiento profesional continuo', 'plan adaptado a la situación clínica'],
    localModifiers: ['consulta clínica', 'cita previa obligatoria', 'accesibilidad del centro', 'horarios de atención', 'seguimiento presencial'],
    serviceTemplates: ['Consulta de valoración', 'Diagnóstico y plan terapéutico', 'Intervención supervisada', 'Seguimiento y control', 'Prevención y salud'],
    faqSeeds: ['¿En qué consiste la primera valoración clínica?', '¿Cuándo se determina el tratamiento definitivo?', '¿Qué historial previo conviene aportar?'],
    enrichment: {
      authorityMarkers: ['uso de tecnología diagnóstica avanzada', 'cumplimiento estricto de protocolos sanitarios', 'formación clínica especializada', 'gestión ética del historial'],
      trustSignals: ['consentimiento informado detallado', 'presupuesto clínico transparente', 'seguimiento post-tratamiento']
    }
  },
  legal: {
    vertical: 'legal',
    label: 'servicios legales',
    defaultIntent: 'appointment_consulting',
    legalSensitivity: 'high',
    tone: 'preciso, prudente y basado en viabilidad documental',
    minimumTechnicalDepth: 'deep',
    vocabulary: ['consulta jurídica', 'análisis documental', 'procedimiento administrativo', 'plazos de prescripción', 'reclamación de cantidad', 'viabilidad jurídica', 'expediente judicial', 'notificación fehaciente', 'asesoramiento preventivo', 'estrategia procesal'],
    decisionCriteria: ['documentación de prueba', 'plazos legales aplicables', 'jurisdicción competente', 'costes y tasas judiciales', 'jurisprudencia relevante', 'viabilidad real del procedimiento'],
    trustAssets: ['valoración inicial de viabilidad', 'estudio pormenorizado de documentación', 'presupuesto de honorarios cerrado', 'comunicación directa con el abogado', 'transparencia en los riesgos procesales'],
    buyerObjections: ['temor a costes judiciales elevados', 'dudas sobre la probabilidad de éxito', 'incertidumbre por los tiempos de la justicia', 'miedo a tecnicismos incomprensibles', 'necesidad de confianza absoluta'],
    preferredCtas: {
      appointment_consulting: ['Solicitar estudio de viabilidad', 'Pedir revisión de documentación legal'],
      comparison_research: ['Consultar viabilidad del caso', 'Resolver dudas legales previas']
    },
    forbiddenClaims: ['caso ganado siempre', 'resultado asegurado', 'sin ningún coste si pierdes', 'indemnización millonaria garantizada'],
    safeClaimAlternatives: ['viabilidad sujeta a estudio documental', 'riesgos procesales explicados', 'estrategia basada en pruebas disponibles', 'opciones legales evaluadas objetivamente'],
    localModifiers: ['partido judicial de la zona', 'registros locales', 'despacho profesional', 'tramitación administrativa local', 'plazos judiciales'],
    serviceTemplates: ['Consulta y asesoramiento', 'Revisión técnica de documentos', 'Análisis de viabilidad y estrategia', 'Gestión del procedimiento', 'Seguimiento y defensa'],
    faqSeeds: ['¿Qué documentos son críticos para el caso?', '¿Cómo se evalúa la viabilidad jurídica real?', '¿Qué plazos legales no se deben ignorar?'],
    enrichment: {
      authorityMarkers: ['especialización en la materia jurídica', 'conocimiento de jurisprudencia actual', 'capacidad de negociación extrajudicial', 'rigor en el cumplimiento de plazos'],
      trustSignals: ['hoja de encargo profesional', 'transparencia en honorarios y costas', 'actualización periódica del estado del caso']
    }
  },
  education: {
    vertical: 'education',
    label: 'educación y formación',
    defaultIntent: 'local_discovery',
    legalSensitivity: 'low',
    tone: 'claro, pedagógico y orientado a nivel inicial',
    minimumTechnicalDepth: 'standard',
    vocabulary: ['nivel inicial', 'metodología', 'objetivos', 'evaluación', 'seguimiento', 'temario', 'clases', 'profesorado', 'grupos reducidos', 'horarios', 'materiales'],
    decisionCriteria: ['nivel del alumno', 'objetivos de aprendizaje', 'horarios disponibles', 'metodología', 'seguimiento', 'tamaño del grupo'],
    trustAssets: ['prueba de nivel cuando procede', 'seguimiento del progreso', 'metodología explicada', 'horarios claros', 'profesorado especializado'],
    buyerObjections: ['duda sobre nivel adecuado', 'miedo a perder tiempo', 'compatibilidad de horarios', 'necesidad de resultados medibles', 'precio mensual'],
    preferredCtas: {
      local_discovery: ['Consultar nivel y disponibilidad', 'Pedir información de horarios'],
      appointment_consulting: ['Solicitar orientación formativa', 'Reservar prueba de nivel'],
      comparison_research: ['Comparar metodología y horarios', 'Resolver dudas del curso']
    },
    forbiddenClaims: ['aprueba garantizado', 'resultado asegurado', 'nivel nativo garantizado'],
    safeClaimAlternatives: ['objetivos medibles', 'progreso según dedicación', 'seguimiento del alumno', 'metodología adaptada'],
    localModifiers: ['aula', 'horarios', 'grupos', 'modalidad presencial', 'modalidad online'],
    serviceTemplates: ['Orientación inicial', 'Prueba de nivel', 'Plan de aprendizaje', 'Clases y seguimiento', 'Evaluación de progreso'],
    faqSeeds: ['¿Cómo se decide el nivel adecuado?', '¿Qué modalidad encaja mejor?', '¿Cómo se mide el progreso?']
  },
  automotive: {
    vertical: 'automotive',
    label: 'automoción y talleres',
    defaultIntent: 'diagnostic_service',
    legalSensitivity: 'medium',
    tone: 'técnico, verificable y orientado a diagnóstico',
    minimumTechnicalDepth: 'deep',
    vocabulary: ['diagnóstico computarizado', 'mecánica preventiva', 'revisión de seguridad', 'sistema de frenado', 'kit de embrague', 'lubricación técnica', 'geometría de neumáticos', 'sistema de carga', 'gestión de motor', 'gestión de averías', 'pre-ITV técnica', 'componentes certificados', 'tiempos de reparación'],
    decisionCriteria: ['síntomas y códigos de error', 'kilometraje y uso', 'plan de mantenimiento oficial', 'seguridad operativa', 'especificaciones del fabricante', 'urgencia técnica de la reparación'],
    trustAssets: ['diagnóstico técnico previo', 'presupuesto detallado de piezas y mano de obra', 'explicación de la prioridad de cada intervención', 'revisión de puntos críticos de seguridad', 'garantía de reparación según normativa'],
    buyerObjections: ['miedo a sustituciones preventivas innecesarias', 'incertidumbre sobre el coste final de la reparación', 'necesidad de operatividad rápida del vehículo', 'preocupación por la seguridad en carretera', 'falta de claridad en el diagnóstico técnico'],
    preferredCtas: {
      diagnostic_service: ['Pedir diagnóstico técnico del vehículo', 'Consultar síntoma con un especialista'],
      quote_project: ['Solicitar presupuesto de reparación técnica', 'Pedir valoración de mantenimiento oficial'],
      urgent_service: ['Consultar disponibilidad de intervención', 'Revisar avería crítica de seguridad']
    },
    forbiddenClaims: ['reparación garantizada al 100% siempre', 'ITV aprobada sin falta', 'elimina cualquier avería futura', 'el coche quedará como nuevo'],
    safeClaimAlternatives: ['reparación basada en diagnóstico técnico', 'revisión orientada a estándares de ITV', 'prioridades de seguridad explicadas con rigor', 'mantenimiento según especificaciones del fabricante'],
    localModifiers: ['recepción en taller', 'cita previa de revisión', 'logística de reparación', 'tiempo estimado de taller', 'gestión de recambios'],
    serviceTemplates: ['Diagnóstico técnico de avería', 'Mantenimiento preventivo oficial', 'Reparación de sistemas mecánicos', 'Revisión de seguridad activa', 'Prueba y verificación final'],
    faqSeeds: ['¿Qué síntomas ayudan a un diagnóstico preciso?', '¿Cuándo se confirma el presupuesto tras el diagnóstico?', '¿Qué intervenciones son prioritarias por seguridad activa?'],
    enrichment: {
      authorityMarkers: ['uso de diagnosis de última generación', 'certificación técnica de los mecánicos', 'acceso a recambios de calidad original', 'rigor en el cumplimiento de tiempos de taller'],
      trustSignals: ['presupuesto previo obligatorio', 'explicación de piezas sustituidas', 'garantía legal de reparación']
    }
  },
  hospitality: {
    vertical: 'hospitality',
    label: 'restauración y hostelería',
    defaultIntent: 'local_discovery',
    legalSensitivity: 'low',
    tone: 'cercano, descriptivo y orientado a experiencia real',
    minimumTechnicalDepth: 'light',
    vocabulary: ['carta', 'menú', 'reserva', 'cocina', 'producto', 'temporada', 'alérgenos', 'bodega', 'terraza', 'servicio', 'ambiente'],
    decisionCriteria: ['tipo de cocina', 'ocasión', 'precio medio', 'ubicación', 'reservas', 'alérgenos', 'ambiente'],
    trustAssets: ['carta clara', 'información de alérgenos', 'opciones de reserva', 'producto de temporada', 'horarios actualizados'],
    buyerObjections: ['duda sobre precio medio', 'necesidad de reservar', 'opciones para grupos', 'alérgenos o dietas', 'ambiente adecuado'],
    preferredCtas: {
      local_discovery: ['Consultar carta y horarios', 'Reservar mesa'],
      comparison_research: ['Ver opciones de menú', 'Consultar disponibilidad para grupos']
    },
    forbiddenClaims: ['el mejor garantizado', 'sin alérgenos garantizado'],
    safeClaimAlternatives: ['información de alérgenos disponible', 'carta sujeta a temporada', 'reservas según disponibilidad'],
    localModifiers: ['zona', 'terraza', 'parking', 'transporte cercano', 'horarios'],
    serviceTemplates: ['Carta y especialidades', 'Menús y reservas', 'Opciones para grupos', 'Información de alérgenos', 'Experiencia y ambiente'],
    faqSeeds: ['¿Hace falta reservar?', '¿Hay opciones para grupos?', '¿Cómo consultar alérgenos?']
  },
  beauty: {
    vertical: 'beauty',
    label: 'estética, belleza y cuidado personal',
    defaultIntent: 'appointment_consulting',
    legalSensitivity: 'medium',
    tone: 'asesor, prudente y centrado en valoración previa',
    minimumTechnicalDepth: 'standard',
    vocabulary: ['valoración', 'tratamiento', 'piel', 'cabello', 'sesión', 'mantenimiento', 'higiene', 'producto', 'protocolo', 'seguimiento'],
    decisionCriteria: ['estado inicial', 'tipo de piel o cabello', 'objetivo estético', 'número de sesiones', 'mantenimiento', 'contraindicaciones'],
    trustAssets: ['valoración previa', 'protocolo explicado', 'higiene y material adecuado', 'seguimiento cuando procede', 'expectativas realistas'],
    buyerObjections: ['miedo a resultados artificiales', 'dudas sobre duración', 'sensibilidad de piel', 'precio por sesión', 'mantenimiento posterior'],
    preferredCtas: {
      appointment_consulting: ['Pedir valoración previa', 'Consultar tratamiento adecuado'],
      local_discovery: ['Ver disponibilidad de cita', 'Consultar horarios']
    },
    forbiddenClaims: ['resultado perfecto garantizado', 'sin riesgos', 'efecto permanente garantizado'],
    safeClaimAlternatives: ['resultado según valoración', 'expectativas realistas', 'cuidados posteriores explicados'],
    localModifiers: ['cita', 'cabina', 'centro', 'horarios', 'seguimiento'],
    serviceTemplates: ['Valoración previa', 'Tratamiento personalizado', 'Sesiones y seguimiento', 'Mantenimiento', 'Cuidados posteriores'],
    faqSeeds: ['¿Cuántas sesiones pueden hacer falta?', '¿Qué cuidados posteriores conviene seguir?', '¿Cómo se decide el tratamiento adecuado?']
  },
  real_estate: {
    vertical: 'real_estate',
    label: 'inmobiliario',
    defaultIntent: 'appointment_consulting',
    legalSensitivity: 'medium',
    tone: 'claro, local y orientado a valoración documental',
    minimumTechnicalDepth: 'standard',
    vocabulary: ['valoración inmobiliaria', 'tasación de mercado', 'nota simple informativa', 'certificado de eficiencia energética', 'gestión de activos', 'contrato de arras', 'estudio de viabilidad comercial', 'cartera de inversores', 'homestaging técnico', 'intermediación profesional'],
    decisionCriteria: ['estado de conservación del inmueble', 'testigos de venta recientes', 'situación urbanística y legal', 'demanda latente en el barrio', 'rentabilidad bruta/neta estimada', 'plazos medios de absorción'],
    trustAssets: ['valoración basada en datos reales de mercado', 'revisión pormenorizada de documentación legal', 'plan de comercialización personalizada', 'transparencia en el proceso de negociación', 'informe de actividad y visitas periódico'],
    buyerObjections: ['temor a una valoración por debajo de mercado', 'incertidumbre sobre gastos y plusvalías', 'dudas sobre la solvencia de los interesados', 'miedo a gestiones burocráticas complejas', 'necesidad de discreción y profesionalidad'],
    preferredCtas: {
      appointment_consulting: ['Solicitar valoración profesional del inmueble', 'Pedir revisión de situación legal'],
      comparison_research: ['Consultar precio real de mercado', 'Resolver dudas antes de la venta/alquiler']
    },
    forbiddenClaims: ['venta garantizada en X días', 'precio máximo asegurado sin duda', 'alquiler sin ningún riesgo', 'mejor inmobiliaria del mundo'],
    safeClaimAlternatives: ['estimación basada en mercado actual', 'plan de comercialización según perfil de demanda', 'filtros de solvencia para interesados', 'gestión integral de trámites documentales'],
    localModifiers: ['zona de influencia', 'barrio y distrito', 'mercado local específico', 'gestión de visitas presenciales', 'conocimiento del entorno'],
    serviceTemplates: ['Valoración técnica de mercado', 'Revisión y gestión documental', 'Estrategia de comercialización local', 'Gestión de visitas y negociación', 'Cierre y acompañamiento'],
    faqSeeds: ['¿Qué documentos legales son imprescindibles?', '¿Cómo se determina el precio competitivo real?', '¿Qué factores aceleran la comercialización segura?'],
    enrichment: {
      authorityMarkers: ['conocimiento profundo del mercado de barrio', 'dominio de la normativa urbanística local', 'red de contactos y demandantes activos', 'capacidad de gestión de herencias y proindivisos'],
      trustSignals: ['transparencia en honorarios', 'contratos sin letra pequeña', 'referencias de operaciones cerradas']
    }
  },
  finance: {
    vertical: 'finance',
    label: 'asesoría financiera y seguros',
    defaultIntent: 'appointment_consulting',
    legalSensitivity: 'high',
    tone: 'prudente, transparente y orientado a riesgos',
    minimumTechnicalDepth: 'deep',
    vocabulary: ['perfilado de riesgo', 'planificación financiera', 'estudio de costes y comisiones', 'cobertura técnica de riesgos', 'optimización fiscal', 'simulación de escenarios', 'análisis de solvencia', 'cumplimiento normativo', 'estrategia patrimonial', 'transparencia de costes'],
    decisionCriteria: ['tolerancia al riesgo del cliente', 'horizonte temporal del proyecto', 'necesidades de liquidez', 'eficiencia fiscal de la opción', 'solvencia de las entidades', 'claridad en el desglose de costes'],
    trustAssets: ['análisis objetivo de perfil de riesgo', 'transparencia total en comisiones y gastos', 'explicación detallada de riesgos y garantías', 'revisión documental previa', 'comparativa de mercado independiente'],
    buyerObjections: ['temor a la letra pequeña de los contratos', 'incertidumbre sobre costes reales ocultos', 'miedo a la volatilidad o pérdida', 'falta de claridad en el impacto fiscal', 'desconfianza en productos empaquetados'],
    preferredCtas: {
      appointment_consulting: ['Solicitar análisis financiero inicial', 'Revisar opciones con un asesor experto'],
      comparison_research: ['Comparar condiciones y coberturas', 'Resolver dudas técnicas antes de decidir']
    },
    forbiddenClaims: ['rentabilidad garantizada sin riesgo', 'ahorro asegurado al 100%', 'beneficio garantizado por escrito', 'mejor producto del mercado'],
    safeClaimAlternatives: ['riesgos detallados y explicados', 'simulaciones basadas en datos históricos', 'opciones adaptadas al perfil de riesgo', 'desglose completo de costes y condiciones'],
    localModifiers: ['atención personalizada presencial', 'oficina de servicio local', 'gestión documental cercana', 'seguimiento directo del caso', 'conocimiento de fiscalidad local'],
    serviceTemplates: ['Análisis de situación y perfil', 'Estudio comparativo de opciones', 'Revisión de riesgos y eficiencia', 'Propuesta de plan estratégico', 'Seguimiento y ajuste periódico'],
    faqSeeds: ['¿Qué documentación técnica es necesaria para el análisis?', '¿Cómo se desglosan los costes y comisiones?', '¿Qué información es vinculante y cuál es orientativa?'],
    enrichment: {
      authorityMarkers: ['dominio de la normativa financiera vigente', 'capacidad de análisis de mercados complejos', 'enfoque en la preservación de capital', 'rigor en el perfilado de idoneidad'],
      trustSignals: ['transparencia en el modelo de remuneración', 'claridad en la comunicación de riesgos', 'enfoque consultivo no comercial']
    }
  },
  b2b_services: {
    vertical: 'b2b_services',
    label: 'servicios profesionales B2B',
    defaultIntent: 'appointment_consulting',
    legalSensitivity: 'medium',
    tone: 'consultivo, claro y orientado a proceso',
    minimumTechnicalDepth: 'standard',
    vocabulary: ['auditoría de procesos', 'implantación de sistemas', 'soporte técnico nivel 2', 'análisis de requisitos', 'indicadores clave (KPIs)', 'optimización operativa', 'gestión del cambio', 'integración de servicios', 'acuerdo de nivel de servicio (SLA)', 'escalabilidad del proyecto'],
    decisionCriteria: ['objetivos estratégicos del proyecto', 'diagnóstico de la situación actual', 'disponibilidad de recursos internos', 'plazos de ejecución y despliegue', 'impacto en la operatividad diaria', 'retorno técnico de la inversión'],
    trustAssets: ['auditoría técnica inicial', 'definición clara del alcance y hitos', 'plan de trabajo estructurado', 'seguimiento periódico de indicadores', 'soporte técnico post-implantación'],
    buyerObjections: ['incertidumbre sobre el retorno real', 'miedo a interrupciones en el negocio', 'coste de implantación y recursos', 'falta de tiempo para supervisión', 'necesidad de soporte continuo fiable'],
    preferredCtas: {
      appointment_consulting: ['Solicitar auditoría técnica inicial', 'Revisar necesidades estratégicas'],
      quote_project: ['Pedir propuesta técnica detallada', 'Definir alcance del proyecto'],
      comparison_research: ['Evaluar opciones de implantación', 'Resolver dudas sobre el proceso técnico']
    },
    forbiddenClaims: ['resultados garantizados sin esfuerzo', 'éxito empresarial asegurado', 'crecimiento exponencial garantizado'],
    safeClaimAlternatives: ['objetivos medibles y cuantificables', 'alcance por fases operativas', 'resultados basados en la implantación', 'identificación previa de riesgos operativos'],
    localModifiers: ['reunión de coordinación', 'equipo local de soporte', 'visita técnica presencial', 'implementación por centros', 'atención directa'],
    serviceTemplates: ['Auditoría y diagnóstico inicial', 'Definición técnica del alcance', 'Implantación y despliegue por fases', 'Seguimiento de KPIs y objetivos', 'Soporte y optimización continua'],
    faqSeeds: ['¿Cómo se define el alcance técnico real?', '¿Qué datos críticos se requieren para el inicio?', '¿Cómo se monitoriza el progreso del proyecto?'],
    enrichment: {
      authorityMarkers: ['metodología de trabajo certificada', 'experiencia en entornos complejos', 'enfoque en la eficiencia operativa', 'capacidad de integración tecnológica'],
      trustSignals: ['acuerdos de nivel de servicio (SLA) claros', 'transparencia en la gestión de hitos', 'referencias de proyectos similares']
    }
  },
  local_retail: {
    vertical: 'local_retail',
    label: 'comercio local',
    defaultIntent: 'local_discovery',
    legalSensitivity: 'low',
    tone: 'cercano, claro y centrado en disponibilidad real',
    minimumTechnicalDepth: 'light',
    vocabulary: ['catálogo', 'stock', 'producto', 'asesoramiento', 'talla', 'modelo', 'garantía', 'recogida', 'horarios', 'devolución'],
    decisionCriteria: ['disponibilidad', 'modelo adecuado', 'precio', 'garantía', 'asesoramiento', 'recogida o envío'],
    trustAssets: ['stock consultable', 'asesoramiento en tienda', 'garantía del producto', 'horarios actualizados', 'opciones de recogida'],
    buyerObjections: ['duda de stock', 'compatibilidad del producto', 'precio final', 'plazos de entrega', 'cambios o devoluciones'],
    preferredCtas: {
      local_discovery: ['Consultar disponibilidad', 'Pedir asesoramiento en tienda'],
      comparison_research: ['Comparar modelos disponibles', 'Resolver dudas antes de comprar']
    },
    forbiddenClaims: ['stock garantizado siempre', 'mejor precio garantizado'],
    safeClaimAlternatives: ['stock según disponibilidad', 'precio confirmado en tienda', 'asesoramiento según necesidad'],
    localModifiers: ['tienda', 'horarios', 'recogida', 'zona', 'atención local'],
    serviceTemplates: ['Asesoramiento inicial', 'Comparación de opciones', 'Disponibilidad y reserva', 'Compra o recogida', 'Soporte posterior'],
    faqSeeds: ['¿Cómo confirmar disponibilidad?', '¿Puedo reservar un producto?', '¿Qué garantía aplica?']
  },
  generic_services: {
    vertical: 'generic_services',
    label: 'servicios locales especializados',
    defaultIntent: 'diagnostic_service',
    legalSensitivity: 'medium',
    tone: 'claro, específico y orientado a decisión informada',
    minimumTechnicalDepth: 'standard',
    vocabulary: ['diagnóstico', 'valoración', 'proceso', 'alcance', 'presupuesto', 'seguimiento', 'garantía', 'materiales', 'plazos', 'comprobación'],
    decisionCriteria: ['necesidad real', 'estado actual', 'alcance', 'presupuesto', 'plazos', 'riesgos', 'siguientes pasos'],
    trustAssets: ['valoración inicial', 'alcance explicado', 'presupuesto transparente', 'seguimiento del servicio', 'comprobación final'],
    buyerObjections: ['miedo a información genérica', 'duda sobre precio', 'necesidad de entender opciones', 'plazos poco claros', 'garantías vagas'],
    preferredCtas: {
      diagnostic_service: ['Solicitar orientación técnica', 'Pedir valoración inicial'],
      appointment_consulting: ['Reservar consulta inicial', 'Resolver dudas del servicio'],
      quote_project: ['Solicitar presupuesto orientado', 'Definir alcance del proyecto'],
      local_discovery: ['Consultar disponibilidad local', 'Ver opciones de atención']
    },
    forbiddenClaims: ['resultado garantizado', 'sin riesgos', 'precio cerrado siempre', 'el mejor garantizado'],
    safeClaimAlternatives: ['resultado según valoración', 'condiciones explicadas', 'presupuesto según alcance', 'alternativas revisadas'],
    localModifiers: ['zona', 'cobertura', 'cita', 'disponibilidad', 'atención local'],
    serviceTemplates: ['Valoración inicial', 'Definición de alcance', 'Ejecución del servicio', 'Seguimiento', 'Comprobación final'],
    faqSeeds: ['¿Cómo se valora el servicio?', '¿Qué información conviene aportar?', '¿Qué queda claro antes de contratar?']
  }
};
