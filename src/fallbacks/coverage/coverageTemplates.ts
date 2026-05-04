import type { CoverageTemplate } from './coverageTemplateTypes.js';

export const COVERAGE_TEMPLATES: CoverageTemplate[] = [
  {
    id: 'vecinos_proximidad',
    tone: 'proximity',
    density: 'compact',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'red_provincial',
    tone: 'provincial',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'barrios_cercanos',
    tone: 'neighborhood',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'cobertura_metropolitana',
    tone: 'technical',
    density: 'compact',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'zonas_limitrofes',
    tone: 'premium',
    density: 'balanced',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'radio_tecnico',
    tone: 'urgent',
    density: 'expanded',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'municipios_conectados',
    tone: 'trust',
    density: 'compact',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'rutas_de_servicio',
    tone: 'service',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'areas_prioritarias',
    tone: 'commercial',
    density: 'expanded',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'cercania_real',
    tone: 'residential',
    density: 'compact',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'equipo_en_zona',
    tone: 'proximity',
    density: 'balanced',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}'
    ]
  },
  {
    id: 'soporte_comarcal',
    tone: 'provincial',
    density: 'expanded',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'red_barrial',
    tone: 'neighborhood',
    density: 'compact',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'presencia_local',
    tone: 'technical',
    density: 'balanced',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}'
    ]
  },
  {
    id: 'enlaces_de_cobertura',
    tone: 'premium',
    density: 'expanded',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'servicio_periferia',
    tone: 'urgent',
    density: 'compact',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'municipios_satellite',
    tone: 'trust',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}'
    ]
  },
  {
    id: 'corredor_urbano',
    tone: 'service',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'zona_centro_expandida',
    tone: 'commercial',
    density: 'compact',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'nucleos_residenciales',
    tone: 'residential',
    density: 'balanced',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}'
    ]
  },
  {
    id: 'eje_comercial',
    tone: 'proximity',
    density: 'expanded',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}'
    ]
  },
  {
    id: 'red_de_urgencias',
    tone: 'provincial',
    density: 'compact',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'mapa_de_servicio',
    tone: 'neighborhood',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'alcance_operativo',
    tone: 'technical',
    density: 'expanded',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}'
    ]
  },
  {
    id: 'zonas_de_confianza',
    tone: 'premium',
    density: 'compact',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'cobertura_por_distritos',
    tone: 'urgent',
    density: 'balanced',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'servicio_a_domicilio',
    tone: 'trust',
    density: 'expanded',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}'
    ]
  },
  {
    id: 'red_de_tecnicos',
    tone: 'service',
    density: 'compact',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'atencion_de_barrio',
    tone: 'commercial',
    density: 'balanced',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'cobertura_sin_fronteras',
    tone: 'residential',
    density: 'expanded',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}'
    ]
  },
  {
    id: 'nodos_locales',
    tone: 'proximity',
    density: 'compact',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'proximidad_tecnica',
    tone: 'provincial',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'rutas_rapidas',
    tone: 'neighborhood',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'barrios_y_municipios',
    tone: 'technical',
    density: 'compact',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'servicio_de_cercania',
    tone: 'premium',
    density: 'balanced',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'zonas_con_demanda',
    tone: 'urgent',
    density: 'expanded',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'red_capilar',
    tone: 'trust',
    density: 'compact',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'cobertura_urbana',
    tone: 'service',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'alcance_de_equipo',
    tone: 'commercial',
    density: 'expanded',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'servicio_local_extendido',
    tone: 'residential',
    density: 'compact',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'distritos_prioritarios',
    tone: 'proximity',
    density: 'balanced',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}'
    ]
  },
  {
    id: 'municipios_principales',
    tone: 'provincial',
    density: 'expanded',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'red_regional',
    tone: 'neighborhood',
    density: 'compact',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'zonas_de_actuacion',
    tone: 'technical',
    density: 'balanced',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}'
    ]
  },
  {
    id: 'presencia_en_area',
    tone: 'premium',
    density: 'expanded',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'entorno_de_city',
    tone: 'urgent',
    density: 'compact',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'anillo_metropolitano',
    tone: 'trust',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}'
    ]
  },
  {
    id: 'servicio_por_zonas',
    tone: 'service',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'cobertura_por_area',
    tone: 'commercial',
    density: 'compact',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'red_de_intervencion',
    tone: 'residential',
    density: 'balanced',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}'
    ]
  },
  {
    id: 'localidades_asociadas',
    tone: 'proximity',
    density: 'expanded',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}'
    ]
  },
  {
    id: 'barrios_conectados',
    tone: 'provincial',
    density: 'compact',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'asistencia_en_ruta',
    tone: 'neighborhood',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'equipo_movil',
    tone: 'technical',
    density: 'expanded',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}'
    ]
  },
  {
    id: 'soporte_de_proximidad',
    tone: 'premium',
    density: 'compact',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'red_de_respuesta',
    tone: 'urgent',
    density: 'balanced',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'cobertura_cercana',
    tone: 'trust',
    density: 'expanded',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}'
    ]
  },
  {
    id: 'areas_residenciales',
    tone: 'service',
    density: 'compact',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'zonas_profesionales',
    tone: 'commercial',
    density: 'balanced',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'mapa_local',
    tone: 'residential',
    density: 'expanded',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}'
    ]
  },
  {
    id: 'extension_de_servicio',
    tone: 'proximity',
    density: 'compact',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'presencia_tecnica',
    tone: 'provincial',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'municipios_del_entorno',
    tone: 'neighborhood',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'servicio_en_radio',
    tone: 'technical',
    density: 'compact',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'cobertura_realista',
    tone: 'premium',
    density: 'balanced',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'red_multizona',
    tone: 'urgent',
    density: 'expanded',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'zonas_colindantes',
    tone: 'trust',
    density: 'compact',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'barrios_de_referencia',
    tone: 'service',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'municipios_de_apoyo',
    tone: 'commercial',
    density: 'expanded',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'equipo_proximo',
    tone: 'residential',
    density: 'compact',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'cobertura_especializada',
    tone: 'proximity',
    density: 'balanced',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}'
    ]
  },
  {
    id: 'servicio_en_distritos',
    tone: 'provincial',
    density: 'expanded',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'red_de_barrio',
    tone: 'neighborhood',
    density: 'compact',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'localidades_cercanas',
    tone: 'technical',
    density: 'balanced',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}'
    ]
  },
  {
    id: 'servicio_por_municipio',
    tone: 'premium',
    density: 'expanded',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'cobertura_de_confianza',
    tone: 'urgent',
    density: 'compact',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'atencion_localizada',
    tone: 'trust',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}'
    ]
  },
  {
    id: 'zonas_de_respuesta',
    tone: 'service',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'red_operativa',
    tone: 'commercial',
    density: 'compact',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'radio_de_cobertura',
    tone: 'residential',
    density: 'balanced',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}'
    ]
  },
  {
    id: 'cobertura_por_proximidad',
    tone: 'proximity',
    density: 'expanded',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}'
    ]
  },
  {
    id: 'area_de_servicio',
    tone: 'provincial',
    density: 'compact',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'zonas_de_atencion',
    tone: 'neighborhood',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'red_de_profesionales',
    tone: 'technical',
    density: 'expanded',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}'
    ]
  },
  {
    id: 'cobertura_en_region',
    tone: 'premium',
    density: 'compact',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'servicio_cercano',
    tone: 'urgent',
    density: 'balanced',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'barrios_clave',
    tone: 'trust',
    density: 'expanded',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}'
    ]
  },
  {
    id: 'municipios_clave',
    tone: 'service',
    density: 'compact',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'zonas_de_trabajo',
    tone: 'commercial',
    density: 'balanced',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'servicio_distribuido',
    tone: 'residential',
    density: 'expanded',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}'
    ]
  },
  {
    id: 'cobertura_pro',
    tone: 'proximity',
    density: 'compact',
    h2Patterns: [
      'Nuestra red de {niche} en {region}',
      'Servicio local de {niche} en el entorno de {city}',
      '{niche} cerca de tu ubicación'
    ],
    introPatterns: [
      'Además de {city}, nuestro equipo de {niche} ofrece cobertura técnica en:',
      'Para mantener una atención cercana, trabajamos también en zonas próximas como:',
      'Si estás fuera del centro de {city}, podemos ayudarte en:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      '{niche} en {loc_name}',
      'Técnicos en {loc_name}',
      'Servicio de {niche} {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'red_local_premium',
    tone: 'provincial',
    density: 'balanced',
    h2Patterns: [
      'Cobertura de {niche} por barrios y municipios',
      'Zonas donde prestamos servicio de {niche}',
      'Red local de {niche} en {region}'
    ],
    introPatterns: [
      'La red provincial permite atender solicitudes de {niche} en localidades cercanas como:',
      'Organizamos la cobertura por municipios para dar una respuesta más ordenada en:',
      'También prestamos servicio de {niche} en el entorno de {region}:'
    ],
    anchorPatterns: [
      '{niche} cerca de {loc_name}',
      'Atención local en {loc_name}',
      'Servicio técnico en {loc_name}'
    ]
  },
  {
    id: 'servicio_de_area',
    tone: 'neighborhood',
    density: 'expanded',
    h2Patterns: [
      'Servicio de {niche} en barrios próximos',
      '{niche} para {city} y alrededores',
      'Áreas cercanas con atención de {niche}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'En barrios cercanos a {city}, adaptamos el servicio de {niche} al tipo de vivienda y zona:',
      'La atención local se extiende a barrios y áreas próximas como:',
      'Para consultas de proximidad, cubrimos zonas como:'
    ],
    anchorPatterns: [
      'Especialistas en {loc_name}',
      '{niche} para {loc_name}',
      'Cobertura en {loc_name}'
    ]
  },
  {
    id: 'cercania_operativa',
    tone: 'technical',
    density: 'compact',
    h2Patterns: [
      'Alcance técnico de {niche} en {region}',
      'Zonas operativas para servicios de {niche}',
      'Cobertura profesional de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Nuestro radio técnico se organiza por rutas para cubrir mejor estas ubicaciones:',
      'Según disponibilidad y tipo de trabajo, atendemos intervenciones de {niche} en:',
      'La cobertura operativa incluye puntos cercanos como:'
    ],
    anchorPatterns: [
      'Servicio profesional {loc_name}',
      'Equipo técnico en {loc_name}',
      '{niche} con cobertura en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'zonas_y_barrios',
    tone: 'premium',
    density: 'balanced',
    h2Patterns: [
      'Red premium de {niche} en {region}',
      'Atención especializada de {niche} por zonas',
      'Servicio cuidado de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Para trabajos que requieren más detalle, ofrecemos atención especializada en:',
      'El servicio premium de {niche} se adapta a zonas con distintas necesidades:',
      'Podemos valorar tu caso en zonas seleccionadas como:'
    ],
    anchorPatterns: [
      'Soluciones de {niche} en {loc_name}',
      'Asistencia en {loc_name}',
      'Profesionales en {loc_name}'
    ]
  },
  {
    id: 'municipios_en_red',
    tone: 'urgent',
    density: 'expanded',
    h2Patterns: [
      '{niche} con respuesta local en {region}',
      'Zonas próximas con atención rápida',
      'Servicio urgente de {niche} cerca de {city}'
    ],
    introPatterns: [
      'Cuando surge una incidencia, conviene contactar con un equipo que conozca la zona. Cubrimos:',
      'Para incidencias de {niche}, revisamos disponibilidad en áreas próximas como:',
      'La respuesta local se organiza alrededor de zonas como:',
      'Agrupamos estas páginas para que encuentres rápido el servicio de {niche} más cercano:'
    ],
    anchorPatterns: [
      'Urgencias de {niche} en {loc_name}',
      'Respuesta local en {loc_name}',
      'Atención próxima en {loc_name}'
    ]
  },
  {
    id: 'asistencia_local',
    tone: 'trust',
    density: 'compact',
    h2Patterns: [
      'Cobertura de confianza para {niche}',
      'Zonas donde trabajamos con {niche}',
      'Servicio local verificado en {region}',
      '{niche} en {city}, {region} y zonas cercanas'
    ],
    introPatterns: [
      'Trabajamos con una cobertura clara para evitar confusiones sobre desplazamientos y alcance:',
      'Estas son algunas zonas donde podemos orientar o prestar servicio de {niche}:',
      'La atención se estructura por áreas cercanas para mantener un trato directo:'
    ],
    anchorPatterns: [
      'Servicio fiable en {loc_name}',
      '{niche} de confianza en {loc_name}',
      'Cobertura clara en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
  {
    id: 'red_de_servicio_local',
    tone: 'service',
    density: 'balanced',
    h2Patterns: [
      'Servicio de {niche} en tu zona',
      'Dónde prestamos servicio de {niche}',
      'Cobertura local para {niche}'
    ],
    introPatterns: [
      'Puedes solicitar servicio de {niche} en {city} y en ubicaciones próximas como:',
      'Nuestra cobertura habitual incluye zonas del entorno como:',
      'También puedes encontrarnos en:'
    ],
    anchorPatterns: [
      'Pedir {niche} en {loc_name}',
      'Servicio local {loc_name}',
      '{niche} disponible en {loc_name}'
    ]
  },
  {
    id: 'cobertura_contextual',
    tone: 'commercial',
    density: 'expanded',
    h2Patterns: [
      '{niche} para negocios y zonas comerciales',
      'Cobertura profesional en áreas de actividad',
      'Servicio local de {niche} para empresas'
    ],
    introPatterns: [
      'Para locales, oficinas y negocios, atendemos zonas comerciales próximas como:',
      'La cobertura para empresas se concentra en áreas de actividad y municipios cercanos:',
      'Si tu negocio está en el entorno de {city}, revisa estas zonas de atención:'
    ],
    anchorPatterns: [
      '{niche} para negocios en {loc_name}',
      'Servicio para empresas en {loc_name}',
      'Técnicos para locales en {loc_name}'
    ]
  },
  {
    id: 'entorno_operativo',
    tone: 'residential',
    density: 'compact',
    h2Patterns: [
      '{niche} para viviendas y comunidades',
      'Cobertura residencial en {region}',
      'Servicio cercano de {niche} para hogares'
    ],
    introPatterns: [
      'En viviendas particulares y comunidades, prestamos servicio en áreas residenciales como:',
      'La cobertura residencial permite atender hogares, fincas y comunidades en:',
      'Para trabajos en casa o comunidad, cubrimos zonas próximas como:'
    ],
    anchorPatterns: [
      '{niche} para viviendas en {loc_name}',
      'Servicio residencial en {loc_name}',
      'Atención a comunidades en {loc_name}',
      'Ver {niche} en {loc_name}'
    ]
  },
];
