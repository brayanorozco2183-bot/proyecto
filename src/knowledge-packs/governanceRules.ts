
export interface GovernanceRule {
    category: string;
    rule: string;
    enforcement: 'strict' | 'warning';
}

export const GOVERNANCE_RULES: GovernanceRule[] = [
    // Estratega de Mercado / General
    { category: 'Strategist', rule: 'No generes una estrategia si faltan nicho, ciudad, intención principal o palabra clave principal.', enforcement: 'strict' },
    
    // Arquitecto de Contenidos / General
    { category: 'Architect', rule: 'Usa una sola versión canónica para H1, hero, meta title y nombre principal de la página.', enforcement: 'strict' },
    
    // Arquitecto de Contenidos / Reglas técnicas SEO
    { category: 'Architect', rule: 'Reserva bloque FAQ cuando la estrategia o el nicho indiquen dudas reales del usuario.', enforcement: 'warning' },
    
    // Redactor / General
    { category: 'Writer', rule: 'Escribe cada bloque usando solo el contexto del nicho activo y la semántica real del bloque. Queda TERMINANTEMENTE PROHIBIDO usar terminología de otros nichos (ej: no uses términos de carpintería como barnizado/lijado en cerrajería).', enforcement: 'strict' },
    
    // Redactor / Términos prohibidos
    { category: 'Writer', rule: 'No uses frases de IA como “en el competitivo mercado actual”, “soluciones a medida” o “servicio integral de calidad”.', enforcement: 'strict' },
    { category: 'Writer', rule: 'Si el nicho es CERRAJERÍA, prohíbe palabras como: madera, barniz, lijar, muebles, ebanista, restauración decorativa.', enforcement: 'strict' },
    
    // Redactor / Calidad de FAQ
    { category: 'Writer', rule: 'Cada respuesta de FAQ debe ser única y específica. Prohíbe respuestas duplicadas o genéricas (ej: "consultar visita técnica") si ya se usaron en otra pregunta.', enforcement: 'strict' },

    // Redactor / Reglas técnicas SEO
    { category: 'Writer', rule: 'Respeta el objetivo de palabras de cada bloque con contenido útil y específico.', enforcement: 'strict' },
    
    // Corrector / General
    { category: 'Corrector', rule: 'No corrijas ni reescribas contenido si faltan ciudad, nicho o contexto principal de la página.', enforcement: 'strict' },
    
    // Corrector / Reglas técnicas SEO
    { category: 'Corrector', rule: 'Marca error si detectas placeholders, variables sin resolver o datos críticos en undefined.', enforcement: 'strict' },
    
    // SEO Técnico / Reglas técnicas SEO
    { category: 'TechnicalSEO', rule: 'Bloquea la salida si title, H1 y schema WebPage no coinciden en intención y entidad principal.', enforcement: 'strict' },
    { category: 'TechnicalSEO', rule: 'Bloquea la salida si se detectan placeholders de producción o clases undefined.', enforcement: 'strict' },
    
    // Enlazado Interno / General
    { category: 'Linking', rule: 'Solo enlaza páginas que existan físicamente en el proyecto generado.', enforcement: 'strict' },
    
    // Auditor de Calidad / Reglas técnicas SEO
    { category: 'Auditor', rule: 'Suspende la página si el contenido útil queda por debajo del umbral mínimo definido.', enforcement: 'strict' },
    { category: 'Writer', rule: 'Al mencionar cobertura local en ciudades grandes, ES OBLIGATORIO mencionar al menos 3 barrios o distritos reales para aumentar la relevancia geográfica.', enforcement: 'strict' },
    { category: 'Writer', rule: 'AISLAMIENTO LOCAL: Prohibido mencionar nombres de otras capitales españolas (Madrid, Barcelona, etc) si no son la ciudad de la misión.', enforcement: 'strict' }
];

export function getRulesByCategory(category: string): string[] {
    return GOVERNANCE_RULES
        .filter(r => r.category === category)
        .map(r => r.rule);
}
