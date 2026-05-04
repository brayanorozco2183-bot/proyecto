import { DesignTokens, ProceduralVariant } from '../types.js';

export function generateGlobalStyles(tokens: DesignTokens): string {
    const { colors, scales, typography } = tokens;

    return `
:root {
    /* Colors */
    --primary: ${colors.primary};
    --secondary: ${colors.secondary};
    --accent: ${colors.accent};
    --color-bg: ${colors.background};
    --color-text: ${colors.text};
    --heading-color: ${colors.heading};
    --heading-accent: ${colors.headingAccent};
    --card-bg: ${colors.surface};
    --card-text: ${colors.surfaceText};
    --muted: ${colors.muted};
    --border: ${colors.border};

    /* Reading Width */
    --content-max-width: ${tokens.layout.readingWidth === 'NARROW' ? '70ch' : tokens.layout.readingWidth === 'WIDE' ? '1200px' : '90ch'};

    /* Spacing (Fluid) */
    --gap: ${tokens.responsiveRules.baseGutter};
    --spacing-section: ${tokens.scales.spacing === 'EDITORIAL' ? '10vw' : tokens.scales.spacing === 'AIRY' ? '8vw' : '5vw'};
    --section-padding: var(--spacing-section);
    --container-max-width: ${tokens.responsiveRules.containerMaxWidth};
    
    /* Token-based Scales */
    --radius-card: ${tokens.scales.radiusCard === 'PILL' ? '100px' : tokens.scales.radiusCard === 'SOFT' ? '32px' : tokens.scales.radiusCard === 'MODERN' ? '12px' : '0px'};
    --radius-button: ${tokens.scales.radiusButton === 'PILL' ? '100px' : tokens.scales.radiusButton === 'SOFT' ? '12px' : '4px'};
    --radius-surface: ${tokens.scales.radiusSurface === 'SOFT' ? '48px' : '16px'};
    
    /* Typography (Fluid) */
    --font-headings: ${typography.fontDisplay};
    --font-body: ${typography.fontBody};
    --base-size: ${typography.body};
    --lh-body: 1.75;
    --lh-headings: 1.1;
}

/* Modern Reset & Base Styles */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--base-size);
    line-height: var(--lh-body);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
}

.container, .section-inner {
    width: min(92%, var(--container-max-width));
    margin-inline: auto;
    padding-inline: clamp(1rem, 5vw, 2rem);
    overflow: hidden;
}

.content-block {
    width: min(100%, var(--content-max-width));
    margin-inline: auto;
}

h1, h2, h3 {
    font-family: var(--font-headings);
    line-height: var(--lh-headings);
    margin-bottom: 0.5em;
    color: var(--heading-color);
    font-weight: 800;
    text-wrap: balance;
    overflow-wrap: break-word;
}

strong, b {
    color: var(--heading-accent);
}

/* --- Responsive Grid Engine --- */
.grid-auto {
    display: grid;
    gap: var(--gap);
    grid-template-columns: repeat(auto-fit, minmax(clamp(280px, 100%, 350px), 1fr));
}

/* --- Section Layouts --- */
section, .el-section {
    padding: var(--section-padding) 0;
    position: relative;
    overflow: hidden;
}

.el-variation-odd {
    background-color: color-mix(in srgb, var(--primary) 2%, var(--color-bg));
}

.el-variation-even {
    background-color: var(--color-bg);
}

.el-grid {
    display: grid;
    gap: var(--gap);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.el-prose-width {
    max-width: var(--content-max-width);
    margin-inline: auto;
}

.el-split-grid {
    display: grid;
    gap: var(--gap);
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    align-items: start;
}

.el-panel, .el-benefit-local, .el-benefit-card {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: var(--radius-card);
    border: 1px solid var(--border);
}

.el-card-grid {
    display: grid;
    gap: var(--gap);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.el-faq-group, .el-faq-local {
    margin-top: 2rem;
}

.el-auth-block {
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--primary) 1%, var(--color-bg));
}

/* --- Elite Component Contract --- */
.el-navbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: color-mix(in srgb, var(--color-bg) 95%, transparent);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 0;
}

/* Art Direction Hero Variants */
.el-hero-editorial, .el-hero-premium, .el-hero-technical, 
.el-hero-local, .el-hero-urgent, .el-hero-minimal, .el-hero-glass {
    display: block; /* Ensure they are defined for the validator */
}

.el-footer {
    padding: 4rem 0;
    background: var(--secondary);
    color: #fff;
    border-top: 1px solid var(--border);
}

.el-footer-grid {
    display: grid;
    gap: 3rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.el-footer-links {
    list-style: none;
    padding: 0;
}

.el-footer-links a {
    color: inherit;
    text-decoration: none;
    opacity: 0.8;
}

.el-nav-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.el-nav-logo {
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--primary);
    text-decoration: none;
}

.el-nav-links {
    display: flex;
    gap: clamp(1rem, 3vw, 2rem);
    list-style: none;
    align-items: center;
}

.el-nav-links a {
    text-decoration: none;
    color: var(--color-text);
    font-weight: 600;
}

.el-hero {
    padding: clamp(4rem, 10vw, 8rem) 0;
    position: relative;
}

.el-hero-h1 {
    font-size: clamp(2.5rem, 7vw, 4.5rem);
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    max-width: 20ch;
}

.el-hero-p {
    font-size: clamp(1.1rem, 2vw, 1.35rem);
    color: var(--muted);
    max-width: 65ch;
    margin-bottom: 3rem;
}

.el-card {
    background: var(--card-bg);
    color: var(--card-text);
    padding: 2.5rem;
    border-radius: var(--radius-card);
    border: 1px solid var(--border);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.el-nav-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.85rem 1.75rem;
    background: var(--primary);
    color: #fff !important;
    font-weight: 800;
    text-decoration: none;
    border-radius: var(--radius-button);
    transition: all 0.3s ease;
}

/* --- Hero Strategies --- */
.el-hero-editorial { text-align: center; padding: 12vh 0; }
.el-hero-editorial .el-hero-h1 { margin-inline: auto; font-family: var(--font-headings); font-weight: 300; font-style: italic; }
.el-hero-editorial .el-hero-p { margin-inline: auto; opacity: 0.7; }

.el-hero-premium { background: linear-gradient(to bottom right, var(--color-bg), var(--card-bg)); border-bottom: 1px solid var(--border); padding: 15vh 0; }
.el-hero-premium .container { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 4rem; align-items: center; }

.el-hero-urgent { background: var(--primary); color: #fff; padding: 6vh 0; }
.el-hero-urgent h1, .el-hero-urgent p { color: #fff; }
.el-hero-urgent .el-nav-cta { background: #fff; color: var(--primary) !important; }

.el-hero-technical { background: var(--color-bg); border-left: 8px solid var(--primary); }

.el-hero-local { background-image: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--primary) 10%, transparent), transparent); }

/* --- Footer Rhythm --- */
.el-footer-directory { columns: 2; gap: 4rem; }
.el-footer-ultra_light { text-align: center; border-top: 1px solid var(--border); padding: 4rem 0; opacity: 0.6; }

@media (max-width: 900px) {
    .el-hero-PREMIUM .container { grid-template-columns: 1fr; text-align: center; }
}

@media (max-width: 600px) {
    .el-cta-row { flex-direction: column; }
    .el-nav-cta { width: 100%; text-align: center; }
}
    `.trim();
}

export function getProceduralNavbar(variant: ProceduralVariant): string {
    return `
    <header class="el-navbar" id="top">
        <div class="container el-nav-inner">
            <a href="#top" class="el-nav-logo"><strong>{{BUSINESS_NAME}}</strong></a>
            <nav class="el-nav-links">
                <a href="#servicios">Servicios</a>
                <a href="#experiencia">Garantía</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">LLAMAR</a>
            </nav>
        </div>
    </header>`;
}

export function getProceduralHero(variant: ProceduralVariant): string {
    const type = variant.tokens.layout.heroType.toLowerCase();

    if (type === 'editorial') {
        return `
        <header class="el-hero el-hero-editorial">
            <div class="container" style="max-width: var(--content-max-width);">
                <h1 class="el-hero-h1">{{H1_TITLE}}</h1>
                <p class="el-hero-p">{{HERO_SUBTITLE}}</p>
                <div class="el-cta-row" style="justify-content: center; margin-top: 3rem;">
                    <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="background: transparent; color: var(--primary)!important; border: 1px solid var(--primary);">Solicitar Información</a>
                </div>
            </div>
        </header>`;
    }

    if (type === 'premium') {
        return `
        <header class="el-hero el-hero-premium">
            <div class="container">
                <div class="hero-left">
                    <span class="badge" style="background: var(--primary); color: #fff; padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.8rem; font-weight: 800; margin-bottom: 1rem; display: inline-block;">SERVICIO EXCLUSIVO</span>
                    <h1 class="el-hero-h1">{{H1_TITLE}}</h1>
                    <p class="el-hero-p">{{HERO_SUBTITLE}}</p>
                    <div class="el-cta-row">
                        <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="padding: 1.25rem 3rem; font-size: 1.2rem;">Presupuesto Gratuito</a>
                    </div>
                </div>
                <div class="hero-right el-card" style="padding: 2rem; border-radius: var(--radius-surface);">
                    <h3 style="margin-bottom: 1rem;">Garantía de Calidad</h3>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Cerrajería de precisión con materiales certificados y atención técnica organizada.</p>
                </div>
            </div>
        </header>`;
    }

    if (type === 'urgent') {
        return `
        <div style="background: #000; color: #fff; padding: 0.5rem 0; text-align: center; font-size: 0.85rem; font-weight: 800; letter-spacing: 1px;">
            🚨 {{URGENT_TOPBAR}}
        </div>
        <header class="el-hero el-hero-urgent">
            <div class="container">
                <h1 class="el-hero-h1">{{H1_TITLE}}</h1>
                <p class="el-hero-p">{{HERO_SUBTITLE}}</p>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="padding: 1.5rem 4rem; font-size: 1.5rem; width: 100%; max-width: 500px;">LLAMAR AHORA</a>
            </div>
        </header>`;
    }

    // Default local variant
    return `
    <header class="el-hero el-hero-local">
        <div class="container">
            <h1 class="el-hero-h1">{{H1_TITLE}}</h1>
            <p class="el-hero-p">{{HERO_SUBTITLE}}</p>
            <div class="el-cta-row">
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">Hablar con un técnico</a>
                <a href="#servicios" class="el-nav-cta" style="background: transparent; border: 1px solid var(--primary); color: var(--primary) !important;">Nuestros Servicios</a>
            </div>
        </div>
    </header>`;
}

export function getProceduralFooter(variant: ProceduralVariant): string {
    const type = variant.tokens.layout.footerType.toLowerCase();

    if (type === 'ultra_light') {
        return `
        <footer class="el-footer el-footer-ultra_light">
            <div class="container">
                <p>&copy; 2026 {{BUSINESS_NAME}} - {{CITY}}. Todos los derechos reservados.</p>
                <div style="margin-top: 1rem; display: flex; gap: 2rem; justify-content: center; font-size: 0.8rem;">
                    <a href="#" style="color: inherit; text-decoration: none;">Privacidad</a>
                    <a href="#" style="color: inherit; text-decoration: none;">Aviso Legal</a>
                </div>
            </div>
        </footer>`;
    }

    if (type === 'directory') {
        return `
        <footer class="el-footer el-footer-directory">
            <div class="container">
                <div class="el-footer-grid">
                    <div class="footer-brand">
                        <a href="#top" class="el-nav-logo" style="color: #fff;">{{BUSINESS_NAME}}</a>
                        <p style="margin-top: 1.5rem; opacity: 0.7;">Servicio de cerrajería profesional con cobertura técnica extensa en {{CITY}} y zonas colindantes.</p>
                    </div>
                    <div class="footer-links">
                        <h4 style="margin-bottom: 1.5rem;">Zonas de Servicio</h4>
                        <div class="el-footer-links" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            {{FOOTER_LOCATION_LINKS}}
                        </div>
                    </div>
                    <div class="footer-contact">
                        <h4 style="margin-bottom: 1.5rem;">Contacto</h4>
                        <p>{{OFFICE_ADDRESS}}</p>
                        <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="margin-top: 1rem; display: block; text-align: center;">LLAMAR AHORA</a>
                    </div>
                </div>
            </div>
        </footer>`;
    }

    // Default EDITORIAL / UTILITY
    return `
    <footer class="el-footer">
        <div class="container">
            <div class="el-footer-grid" style="grid-template-columns: 2fr 1fr 1fr;">
                <div>
                    <h2 style="color: #fff; margin-bottom: 1rem;">{{BUSINESS_NAME}}</h2>
                    <p style="opacity: 0.8; max-width: 40ch;">Expertos en seguridad y apertura de puertas. Respuesta rápida y compromiso profesional en {{CITY}}.</p>
                </div>
                <div>
                    <h4 style="margin-bottom: 1rem;">Secciones</h4>
                    <ul class="el-footer-links">
                        <li><a href="#servicios">Servicios</a></li>
                        <li><a href="#experiencia">Garantía</a></li>
                        <li><a href="#cobertura">Ubicación</a></li>
                    </ul>
                </div>
                <div>
                    <h4 style="margin-bottom: 1rem;">Legal</h4>
                    <ul class="el-footer-links">
                        <li><a href="#">Privacidad</a></li>
                        <li><a href="#">Aviso Legal</a></li>
                        <li><a href="#">Cookies</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </footer>`;
}

export function getProceduralShell(variant: ProceduralVariant): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${variant.tokens.typography.fontDisplay.replace(/"/g, '').replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,700;0,800;0,900;1,300&family=${variant.tokens.typography.fontBody.replace(/"/g, '').replace(/\s+/g, '+')}:wght@400;600;700&display=swap" rel="stylesheet">
    {{SCHEMA_JSON}}
    {{GLOBAL_STYLES}}
</head>
<body>
    {{NAVBAR_BLOCK}}
    {{HERO_BLOCK}}
    <main id="content">
        {{SECTIONS_HOLDER}}
    </main>
    {{FOOTER_BLOCK}}
</body>
</html>`.trim();
}

export function getLayoutTemplate(variant: ProceduralVariant): string {
    return getProceduralShell(variant);
}
