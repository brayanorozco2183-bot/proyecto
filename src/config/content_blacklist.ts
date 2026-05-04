/**
 * Centralized blacklist for SEO content generation.
 * Contains banned phrases, IA patterns, and quality-related restrictions.
 */
export const CONTENT_BLACKLIST = {
    // Phrases that make the content look generic or AI-generated
    BANNED_PHRASES: [
        "más de una década",
        "equipo altamente cualificado",
        "soluciones innovadoras",
        "compromiso con la calidad",
        "líderes en el sector",
        "líder del sector",
        "empresa líder",
        "tecnología de vanguardia",
        "amplia experiencia",
        "satisfacción garantizada",
        "equipo técnico especializado",
        "soluciones profesionales",
        "servicio rápido y eficaz",
        "calidad y eficiencia",
        "cambio climático",
        "inestabilidad social",
        "roedores",
        "invasión de ratas",
        "anticorrupción",
        "RAL 1201",
        "unidades móviles estratificadas"
    ],

    // Common IA patterns or residues that should never appear in final HTML
    IA_PATTERNS: [
        /\[\s*(?:Nota|Comentario|Explicación|Note|Comment|Explanation)\s*:.*?\]/gi,
        /^\s*["']?este contenido cumple["']?\s*$/gi,
        /servicio\s+en\s+\[?ciudad\]?/gi,
        /Contactar\s+ahora\s+para\s+más\s+información/gi
    ],

    // Prohibited CTA styles or specific wordings
    BANNED_CTAS: [
        "Haga clic aquí",
        "Más información",
        "Leer más",
        "Contrata ya"
    ],

    // Regex for textual corruption detection
    CORRUPTION: {
        MERGED_WORDS: /[a-z]{3,}[A-Z][a-z]{3,}/g, // e.g. compromPersonal
        SPECIFIC_MERGED: /\b(comprompersonal|ppersonal|precpersonal|formadode|conacredit|cerrajert[ée]cnico)\b/gi,
        LONG_WORDS: /\b\w{22,}\b/, // Words over 22 characters
        PHONE_CORRUPTION: [
            /\d\(\d/,
            /\b(\d{3,})\1\b/ // Matches 943943 but NOT separated by spaces/text
        ]
    }
};