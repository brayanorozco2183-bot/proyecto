/**
 * Template Premium Template (V2 - 2026 Authority Edition)
 * Ultra-high fidelity design for local SEO domination.
 * Features: Sticky Corporate Header, Dynamic Hero, Service Grids, FAQ Accordion.
 * Zero-Branding.
 */
export const template_premium = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&display=swap" rel="stylesheet">
    {{SCHEMA_JSON}}
    {{GLOBAL_STYLES}}
</head>
<body>

    {{NAVBAR_BLOCK}}

    {{HERO_BLOCK}}

    {{SECTIONS_HOLDER}}

    {{FOOTER_BLOCK}}

</body>
</html>
`;

export const template_sections = {
    servicios: `
    <section id="servicios" class="el-section el-variation-even">
        <div class="container">
            <h2 class="section-title">Especialistas en {{NICHE}} Técnica</h2>
            <div class="el-grid">
                {{KEY_BENEFITS}}
            </div>
            <div class="el-cta-row" style="margin-top: 4rem;">
                 <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">SOLICITAR ASISTENCIA INMEDIATA</a>
            </div>
        </div>
    </section>
    `,
    experiencia: `
    <div id="experiencia" class="el-main-wrapper">
        {{MAIN_DESCRIPTION}}
        
        <section class="el-section el-variation-odd">
            <div class="container">
                <div class="el-table-w">
                    <table class="el-table">
                        <thead>
                            <tr>
                                <th class="el-th">Especificación Técnica</th>
                                <th class="el-th">Detalle del Servicio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{TABLE_ROWS}}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
    `,
    seo: `
    <section>
        <div class="section-inner">
            <div class="content-block">
                <div class="premium-content">
                    {{SEO_SECTIONS}}
                </div>
            </div>
        </div>
    </section>
    `,
    faq: `
    <section id="faq">
        <div class="container">
            <h2 class="section-title">F.A.Q: Dudas Frecuentes</h2>
            <div class="el-faq-group">
                {{FAQ_BLOCKS}}
            </div>
        </div>
    </section>
    `,
    about: `
    <section class="el-exp-wrapper">
        <div class="container">
            <div class="el-about-section">
                <div class="el-about-info">
                    <h2>Experiencia y Confianza</h2>
                    <div class="el-premium-content">
                        {{ABOUT_US_TEXT}}
                    </div>
                    <div class="el-stat-grid">
                        <div class="el-stat-item"><span class="el-stat-num">{{YEARS_EXP}}+</span><span class="el-stat-label">Años de Servicio</span></div>
                        <div class="el-stat-item"><span class="el-stat-num">{{PROJECTS_COUNT}}+</span><span class="el-stat-label">Seguridades Técnicas</span></div>
                    </div>
                </div>
                <div class="el-about-legal">
                    <div class="el-card">
                        <h3 style="color: var(--primary);">Ficha Técnica de Empresa</h3>
                        <ul style="list-style: none; padding: 0; margin-top: 20px;">
                            <li style="margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 5px;"><strong>CIF:</strong> {{CIF_DATA}}</li>
                            <li style="margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 5px;"><strong>Sede Técnica:</strong> {{OFFICE_ADDRESS}}</li>
                            <li><strong>Nivel de Especialidad:</strong> {{SERVICE_LEVEL}}</li>
                        </ul>
                        <div class="el-about-badges">
                            {{EEAT_BLOCK}}
                        </div>
                    </div>
                    <div class="el-nap-info" style="margin-top: 30px;">
                         <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 1.1rem;">Base Operativa {{CITY}}</h3>
                         {{NAP_BLOCK}}
                    </div>
                </div>
            </div>
        </div>
    </section>
    `,
    cobertura: `
    {{COBERTURA_BLOCK}}
    `
};


export const template_benefit_item = `
    <div class="el-card">
        <div class="icon">{{ICON}}</div>
        <h3>{{TITLE}}</h3>
        <p>{{DESC}}</p>
    </div>
`;

export const template_table_row = `
    <tr>
        <td class="el-td"><strong>{{LABEL}}</strong></td>
        <td class="el-td">{{VALUE}}</td>
    </tr>
`;

export const template_seo_section = `
    <div class="premium-content" style="margin-bottom: 80px; border-bottom: 1px solid var(--border); padding-bottom: 40px;">
        {{CONTENT}}
    </div>
`;

export const template_faq_item = `
    <div class="el-faq-item el-card">
        <h3>{{QUESTION}}</h3>
        <p>{{ANSWER}}</p>
    </div>
`;

export const template_network_item = `
    <div class="el-card network-item-card">
        <span class="icon">📍</span>
        <div class="location-link">{{LOCATION_NAME}}</div>
    </div>
`;

/**
 * 5 Variaciones de Hero para el motor de diseño
 */
export const HERO_TEMPLATES = [
    // 0: Dark Background (Classic Authoritative)
    `
    <header class="el-hero {{HERO_ALIGN_CLASS}}" style="background: var(--secondary); color: #fff;">
        <div class="container">
            <h1 class="el-hero-h1" style="color: #fff;">{{H1_TITLE}}</h1>
            <p class="el-hero-p" style="color: rgba(255,255,255,0.9);">{{HERO_SUBTITLE}}</p>
            <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">
                <span>⚡</span> {{PHONE_DISPLAY}}
            </a>
        </div>
    </header>
    `,
    // 1: Gradient (Modern Dynamic)
    `
    <header class="el-hero {{HERO_ALIGN_CLASS}}" style="background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%); color: #fff;">
        <div class="container">
            <h1 class="el-hero-h1" style="color: #fff;">{{H1_TITLE}}</h1>
            <p class="el-hero-p" style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius-m); color: #fff;">{{HERO_SUBTITLE}}</p>
            <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="margin-top: 1rem; border: 2px solid rgba(255,255,255,0.3);">
                <span>🚀</span> LLAMAR AHORA
            </a>
        </div>
    </header>
    `,
    // 2: Minimalist (Clean Professional)
    `
    <header class="el-hero {{HERO_ALIGN_CLASS}}" style="background: var(--color-bg); color: var(--color-text); border-bottom: 8px solid var(--primary);">
        <div class="container">
            <h1 class="el-hero-h1" style="color: var(--secondary); letter-spacing: -2px;">{{H1_TITLE}}</h1>
            <div style="border-left: 5px solid var(--primary); padding-left: 2rem; margin-bottom: 3rem;">
                <p class="el-hero-p" style="font-style: italic; margin-bottom: 0;">{{HERO_SUBTITLE}}</p>
            </div>
            <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="background: var(--secondary);">
                📞 CONTACTO DIRECTO: {{PHONE_DISPLAY}}
            </a>
        </div>
    </header>
    `,
    // 3: Card Focus (High Conversion)
    `
    <header class="el-hero el-hero-center" style="background: color-mix(in srgb, var(--primary) 5%, transparent);">
        <div class="container">
            <div class="el-card" style="max-width: 1000px; padding: clamp(2rem, 5vw, 4rem); margin-inline: auto;">
                <h1 class="el-hero-h1" style="color: var(--secondary);">{{H1_TITLE}}</h1>
                <p class="el-hero-p">{{HERO_SUBTITLE}}</p>
                <div style="background: var(--primary); padding: 2rem; border-radius: var(--radius-m); color: #fff; display: inline-block; width: 100%; max-width: 600px; margin-inline: auto;">
                    <div style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem; opacity: 0.9;">Técnico Especialista</div>
                    <a href="tel:{{PHONE_LINK}}" style="display: block; font-size: 2.2rem; text-decoration: none; color: inherit; font-weight: 900;">{{PHONE_DISPLAY}}</a>
                </div>
            </div>
        </div>
    </header>
    `,
    // 4: Action Intensive (Mobile First)
    `
    <header class="el-hero {{HERO_ALIGN_CLASS}}" style="background: var(--secondary); color: #fff;">
        <div class="container">
            <div style="font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 1.5rem; letter-spacing: 2px;">Servicio Oficial 24h</div>
            <h1 class="el-hero-h1" style="color: #fff;">{{H1_TITLE}}</h1>
            <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="padding: 2.5rem 4rem; font-size: 2.2rem; width: 100%; max-width: 600px; background: var(--primary); border: 4px solid rgba(255,255,255,0.2);">
                {{PHONE_DISPLAY}}
            </a>
            <p class="el-hero-p" style="margin-top: 3rem; color: rgba(255,255,255,0.8); font-size: 1.1rem;">{{HERO_SUBTITLE}}</p>
        </div>
    </header>
    `
];

export const NAVBAR_TEMPLATES = [
    // 0: Corporate Standard
    `
    <header class="el-navbar" id="top">
        <div class="container el-nav-inner">
            <a href="#top" class="el-nav-logo"><strong>{{BUSINESS_NAME}}</strong></a>
            <nav class="el-nav-links">
                <a href="#servicios">Servicios</a>
                <a href="#experiencia">Garantía</a>
                <a href="#cobertura">Zonas</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">📞 {{PHONE_DISPLAY}}</a>
            </nav>
        </div>
    </header>`,

    // 1: Center Logo
    `
    <header class="el-navbar" id="top">
        <div class="container el-nav-inner">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="background: var(--primary); width: 10px; height: 10px; border-radius: 50%;"></span>
                <a href="#top" class="el-nav-logo"><strong>{{BUSINESS_NAME}}</strong></a>
            </div>
            <nav class="el-nav-links">
                <a href="#servicios">Servicios</a>
                <a href="#cobertura">Cobertura</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">PRESUPUESTO 🔥</a>
            </nav>
        </div>
    </header>
`,

    // 2: Minimalist Sticky
    `
    <header class="el-navbar" id="top">
        <div class="container el-nav-inner" style="justify-content: center; flex-direction: column; gap: 1rem; padding: 1.5rem 0;">
            <a href="#top" class="el-nav-logo"><strong>{{BUSINESS_NAME}}</strong></a>
            <nav class="el-nav-links" style="gap: 1.5rem;">
                <a href="#servicios">Servicios</a>
                <a href="#experiencia">Garantía</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="padding: 0.75rem 2rem;">URGENCIAS 24H</a>
            </nav>
        </div>
    </header>
`,
];

export const COBERTURA_TEMPLATES = [
    // Variant 0: Modern Side-by-Side (Map + Grid)
    `
    <section id="cobertura" class="el-section {{COBERTURA_STYLE_CLASS}}">
        <div class="container">
            <div class="el-grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 4rem; align-items: start;">
                 <div class="cobertura-info">
                    <h2 class="section-title" style="text-align: left; margin-bottom: 2rem;">Red de Cobertura {{CITY}}</h2>
                    <p class="el-premium-content" style="margin-bottom: 2rem;">Disponemos de unidades móviles estratificadas para garantizar tiempos de respuesta inferiores a 20 minutos en todo el núcleo de {{CITY}} y alrededores.</p>
                    <div class="network-container">
                        {{LOCAL_NETWORK}}
                    </div>
                 </div>
                 <div class="map-wrapper el-card" style="padding: 0; overflow: hidden; height: 500px; border: 2px solid var(--primary);">
                    <iframe 
                        title="Mapa de cobertura en {{CITY}}"
                        width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps?q={{NICHE}}+en+{{CITY_ENCODED}},+España&output=embed">
                    </iframe>
                 </div>
            </div>
        </div>
    </section>`,
    // Variant 1: Full Width Map Background (Floating Panel)
    `
    <section id="cobertura" class="el-section {{COBERTURA_STYLE_CLASS}}" style="position: relative; padding: 0; min-height: 600px;">
        <div class="map-bg" style="position: absolute; inset: 0; z-index: 1;">
            <iframe 
                title="Mapa de cobertura interactivo en {{CITY}}"
                width="100%" height="100%" style="border:0; filter: grayscale(0.5) contrast(1.1);" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q={{NICHE}}+en+{{CITY_ENCODED}},+España&output=embed">
            </iframe>
        </div>
        <div class="container" style="position: relative; z-index: 2; padding: 6rem 0;">
            <div class="el-card" style="max-width: 500px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 3rem;">
                <h2 style="color: var(--secondary); margin-bottom: 1.5rem;">Presencia en {{CITY}}</h2>
                <div class="network-container" style="max-height: 400px; overflow-y: auto;">
                    {{LOCAL_NETWORK}}
                </div>
            </div>
        </div>
    </section>`,
    // Variant 2: Clean Split Card Layout
    `
    <section id="cobertura" class="el-section el-variation-odd {{COBERTURA_STYLE_CLASS}}">
        <div class="container">
            <div class="el-card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(clamp(280px, 100%, 600px), 1fr)); gap: 0; padding: 0; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                <div style="padding: clamp(2rem, 8vw, 4rem); display: flex; flex-direction: column; justify-content: center;">
                    <h2 style="font-size: clamp(2rem, 5vw, 2.5rem); margin-bottom: 2rem; color: var(--primary);">Centro Logístico {{CITY}}</h2>
                    <div class="network-container">
                        {{LOCAL_NETWORK}}
                    </div>
                </div>
                <div class="map-zone" style="min-height: 400px; background: var(--bg-alt); position: relative;">
                    <iframe 
                        title="Localización operativa en {{CITY}}"
                        width="100%" height="100%" style="border:0; display: block;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps?q={{NICHE}}+en+{{CITY_ENCODED}},+España&output=embed">
                    </iframe>
                </div>
            </div>
        </div>
    </section>`
];

export const FOOTER_TEMPLATES = [
    // Variant 0: Premium Dark Columnar (New V4)
    `<footer class="el-footer {{FOOTER_STYLE_CLASS}}">
        <div class="container el-footer-grid">
            <div class="footer-col">
                <div class="el-nav-logo" style="justify-content: flex-start; margin-bottom: 2rem;"><span>{{BUSINESS_NAME}}</span></div>
                <p style="color: rgba(255,255,255,0.6); line-height: 1.8;">Centro de operaciones técnicas en {{CITY}}. Comprometidos con los más altos estándares de seguridad y respuesta inmediata.</p>
            </div>
            <div class="footer-col">
                <h3>Soporte Local</h3>
                <ul class="el-footer-links">
                    <li><a href="tel:{{PHONE_LINK}}">📞 Asistencia 24h</a></li>
                    <li><span style="color:rgba(255,255,255,0.6)">📍 {{OFFICE_ADDRESS}}</span></li>
                    <li><a href="#servicios" style="opacity: 0.8;">Servicios</a></li>
                    <li><a href="#experiencia" style="opacity: 0.8;">Garantía</a></li>
                </ul>
            </div>
        </div>
        <div class="container" style="margin-top: 6rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); opacity: 0.5; font-size: 0.85rem; text-align: center;">
            &copy; 2026 {{BUSINESS_NAME}} - Seguridad y {{NICHE}} Técnica (V4).
        </div>
    </footer>`,

    // Variant 1: Minimalist Line (New V4)
    `<footer class="el-footer {{FOOTER_STYLE_CLASS}}" style="background: var(--bg-alt); color: var(--text); border-top: 1px solid var(--border);">
        <div class="container" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3rem;">
            <div class="el-nav-logo" style="font-size: 2.5rem;"><span>{{BUSINESS_NAME}}</span></div>
            <nav class="el-nav-links" style="justify-content: center;">
                 <a href="#servicios">Servicios</a>
                 <a href="#cobertura">Cobertura</a>
                 <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">URGENCIAS</a>
            </nav>
            <div style="opacity: 0.6; font-size: 0.9rem;">
                &copy; Copyright 2026. {{BUSINESS_NAME}} {{CITY}}. Profesionalidad Certificada.
            </div>
        </div>
    </footer>`,

    // Variant 2: Multi-row Network Hub (New V4)
    `<footer class="el-footer {{FOOTER_STYLE_CLASS}}">
        <div class="container">
            <div class="el-footer-grid">
                <div style="grid-column: span 2;">
                     <h3 style="font-size: 1.5rem;">Red de Asistencia Integrada</h3>
                     <div style="columns: 2; column-gap: 40px; margin-top: 2rem;">
                        {{FOOTER_LOCATION_LINKS}}
                     </div>
                </div>
                <div>
                    <h3>Contacto</h3>
                    <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="width: 100%;">LLAMAR AHORA {{PHONE_DISPLAY}}</a>
                    <p style="margin-top: 2rem; font-size: 0.8rem; opacity: 0.5;">Atención ininterrumpida los 365 días del año en toda la provincia.</p>
                </div>
            </div>
            <div style="margin-top: 4rem; text-align: center; opacity: 0.4;">
                {{BUSINESS_NAME}} &copy; 2026 | CIF: {{CIF_DATA}} | {{CITY}}
            </div>
        </div>
    </footer>`
];
