
import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.join(process.cwd(), 'src/config/design-masterclasses');
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const niches = [
    { key: "cerrajeros", patterns: ["cerraj", "apertura", "cerradur", "seguridad"] },
    { key: "fontaneros", patterns: ["fontan", "fuga", "atasco", "tuber"] },
    { key: "electricistas", patterns: ["electric", "averia electrica", "cuadro electrico", "instalacion electrica"] },
    { key: "climatizacion", patterns: ["climat", "aire acondicionado", "caldera", "frio", "calefaccion"] },
    { key: "reformas", patterns: ["reforma", "obra", "rehabilit", "alicat"] },
    { key: "pintores", patterns: ["pintor", "pintura", "alisar paredes", "lacado"] },
    { key: "carpinteros", patterns: ["carpinter", "mueble", "armario", "puerta interior"] },
    { key: "jardineria", patterns: ["jardin", "poda", "cesped", "riego"] },
    { key: "limpieza", patterns: ["limpieza", "desinfeccion", "cristales", "oficina"] },
    { key: "mudanzas", patterns: ["mudanza", "transporte", "guardamuebles", "embalaje"] },
    { key: "persianistas", patterns: ["persian", "toldo", "motor persiana", "estores"] },
    { key: "cristaleros", patterns: ["cristal", "vidrio", "mampara", "ventana"] },
    { key: "tejados", patterns: ["tejado", "cubierta", "gotera", "impermeabil"] },
    { key: "plagas", patterns: ["plaga", "cucaracha", "roedor", "desinsect"] },
    { key: "ceramistas", patterns: ["ceramica", "azulejo", "alicatado", "suelo"] },
    { key: "decoradores", patterns: ["decorador", "interiorismo", "home staging", "diseño interior"] },
    { key: "domotica", patterns: ["domotica", "smart home", "automatizacion", "alarma"] },
    { key: "albañiles", patterns: ["albañil", "tabique", "yeso", "reparacion obra"] },
    { key: "aislamientos", patterns: ["aislamiento", "humedad", "termico", "acustico"] },
    { key: "mantenimiento", patterns: ["mantenimiento", "comunidad", "empresa", "reparacion"] }
];

const styles = [
    { slug: "luxury_minimalist", title: "Luxury Minimalist", intro: "Estética limpia, mucho aire y detalles premium discretos." },
    { slug: "urban_glass", title: "Urban Glass", intro: "Paneles translúcidos, sombras suaves y sensación urbana moderna." },
    { slug: "warm_local", title: "Warm Local", intro: "Cercanía local, fondos cálidos y señales humanas de confianza." },
    { slug: "technical_blueprint", title: "Technical Blueprint", intro: "Autoridad técnica, orden visual y lectura muy clara." },
    { slug: "editorial_prestige", title: "Editorial Prestige", intro: "Composición editorial, titulares fuertes y ritmo de revista premium." },
    { slug: "emergency_hightrust", title: "Emergency High Trust", intro: "Conversión rápida, teléfono visible y urgencia controlada." },
    { slug: "soft_residential", title: "Soft Residential", intro: "Hogar, calma, claridad y tarjetas amables." },
    { slug: "bold_contrast", title: "Bold Contrast", intro: "Contraste fuerte, CTAs dominantes y titulares con mucha presencia." },
    { slug: "artisan_craft", title: "Artisan Craft", intro: "Sensación artesanal, materiales, detalle y trabajo a medida." },
    { slug: "clean_directory", title: "Clean Directory", intro: "Estructura local clara para páginas de ciudad y barrios." }
];

const families = ["asymmetric_premium", "editorial", "local_trust", "conversion_heavy", "asymmetric_premium", "minimal_authority", "technical_grid", "local_trust", "conversion_heavy", "local_trust"];
const personalities = ["luxury", "luxury", "modern_tech", "organic", "editorial", "modern_tech", "organic", "luxury"];
const contrastModels = ["dramatic", "balanced", "soft", "dramatic", "balanced"];
const surfaceStyles = ["glass", "tinted", "paper", "glass", "tinted", "tinted"];
const cardTreatments = ["elevated", "flat", "outlined", "elevated", "editorial", "flat"];
const navbarTreatments = ["glass", "solid", "glass", "minimal", "glass"];
const footerTreatments = ["editorial", "minimal", "minimal", "directory", "conversion_heavy"]; // mapped footer
const ornamentPolicies = ["hero_and_cta", "subtle", "none", "subtle", "hero_only"];
const spacingScales = ["compact", "balanced", "luxury", "luxury"];
const heroTreatments = ["split", "centered", "split", "centered", "proof_first", "cta_heavy"];
const pageSkeletons = ["premium-showcase", "conversion-funnel", "editorial-longform", "local-directory", "technical-diagnosis"];
const cadencePatterns = ["cinematic", "alternating", "calm", "contrast", "cinematic", "alternating"];
const visualSystems = ["mixed", "editorial", "panelled", "minimal", "mixed", "grid"];

const servicesVariants = ["magazine_panels", "cards_balanced", "editorial_rows", "compact_grid", "feature_stack", "icon_tiles"];
const localProofVariants = ["evidence_cards", "grid_logos", "minimal_icons", "coverage_cards", "testimonial_strip", "proof_matrix"];
const trustBandVariants = ["floating_pills", "compact_badges", "editorial_signals", "metric_strip", "authority_cards"];
const faqVariants = ["accordion_clean", "editorial_cards", "compact_questions", "split_faq", "numbered_accordion"];
const processVariants = ["stepped_rail", "timeline_cards", "numbered_steps", "split_process", "compact_sequence"];
const ctaVariants = ["consultation_split", "command_center", "banner_luxury", "inline_conversion", "phone_first"];
const urgencyVariants = ["command_center", "status_banner", "split_urgent", "compact_alert", "emergency_card"];

console.log(`Generating 100 masterclasses in ${baseDir}...`);

for (let i = 0; i < 100; i++) {
    const niche = niches[i % niches.length];
    const styleIndex = (Math.floor(i / niches.length) + (i % niches.length)) % styles.length;
    const style = styles[styleIndex];
    const comboSlug = `${style.slug}_${niche.key}_v${Math.floor(i / niches.length) + 1}`;
    
    const masterclass = {
        masterclass_id: `${comboSlug}-v1`,
        title: `Masterclass ${style.title} para ${niche.key.charAt(0).toUpperCase() + niche.key.slice(1)}`,
        niche_patterns: niche.patterns,
        dna: {
            personality: personalities[(i * 5) % personalities.length],
            family: families[(i * 3) % families.length],
            contrastModel: contrastModels[(i * 7) % contrastModels.length],
            surfaceStyle: surfaceStyles[(i * 11) % surfaceStyles.length],
            cardTreatment: cardTreatments[(i * 13) % cardTreatments.length],
            navbarTreatment: navbarTreatments[(i * 17) % navbarTreatments.length],
            footerTreatment: "editorial", // standardized
            ornamentPolicy: ornamentPolicies[(i * 23) % ornamentPolicies.length],
            spacingScale: spacingScales[(i * 29) % spacingScales.length],
            heroTreatment: heroTreatments[(i * 31) % heroTreatments.length],
            pageSkeleton: pageSkeletons[(i * 37) % pageSkeletons.length],
            cadencePattern: cadencePatterns[(i * 41) % cadencePatterns.length],
            pageComposition: "conversion",
            visualSystem: visualSystems[(i * 43) % visualSystems.length],
            sectionCadence: cadencePatterns[(i * 41) % cadencePatterns.length] === 'cinematic' ? 'cinematic' : 'alternating'
        },
        block_variants: {
            services_grid: servicesVariants[(i * 2) % servicesVariants.length],
            local_proof: localProofVariants[(i * 3) % localProofVariants.length],
            trust_band: trustBandVariants[(i * 5) % trustBandVariants.length],
            faq: faqVariants[(i * 7) % faqVariants.length],
            process_steps: processVariants[(i * 11) % processVariants.length],
            cta_panel: ctaVariants[(i * 13) % ctaVariants.length],
            urgency_panel: urgencyVariants[(i * 17) % urgencyVariants.length]
        },
        art_direction_notes: `${style.intro} Diseñado para páginas locales de ${niche.key} por ciudad, manteniendo el sistema procedural. Prioriza un hero con propuesta clara, CTA telefónico visible, señales de confianza arriba, tarjetas con jerarquía real y bloques de prueba local antes del cierre. Evita la apariencia de plantilla repetida alternando densidad, ritmo, tratamientos de superficie y variantes de bloque.`,
        tension_curve: [
            ["high", "medium", "high", "low", "medium", "high"],
            ["medium", "high", "medium", "low", "high", "medium"],
            ["high", "low", "medium", "medium", "high", "high"],
            ["medium", "medium", "high", "low", "medium", "high"]
        ][i % 4],
        seed: {
            asymmetryLevel: (i % 10) + 1,
            densityProfile: ["lean", "balanced", "rich", "commercial"][i % 4]
        }
    };

    const fileName = `${(i + 1).toString().padStart(3, '0')}_${comboSlug}.json`;
    fs.writeFileSync(path.join(baseDir, fileName), JSON.stringify(masterclass, null, 2), 'utf-8');
}

console.log("Successfully generated 100 masterclasses.");
