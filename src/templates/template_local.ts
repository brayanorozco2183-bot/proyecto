/**
 * Template Neighborhood Trusted Template - (V4 Community Edition)
 * Concept: Proximity, Trust, and Local Familiarity.
 * Structure: Community focused (Hero -> Fixed Quick Contact -> Local Map -> Benefits -> FAQ).
 */
export const template_local = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
    {{SCHEMA_JSON}}
    {{GLOBAL_STYLES}}
    <style>
        :root {
            --local-primary: var(--primary);
            --local-secondary: var(--secondary);
            --font-main: 'Outfit', sans-serif;
            --radius-xl: 30px;
        }
        body { font-family: var(--font-main); }
        .lc-hero {
            padding: clamp(3rem, 8vw, 6rem) 0;
            background: linear-gradient(135deg, color-mix(in srgb, var(--local-primary) 10%, #fff) 0%, #fff 100%);
            border-bottom: 1px solid var(--border);
        }
        .lc-contact-float {
            background: #ffffff;
            border-radius: var(--radius-xl);
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
            margin-top: -4rem;
            position: relative;
            z-index: 10;
        }
        .lc-map-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            overflow: hidden;
            border-radius: var(--radius-xl);
            border: 1px solid var(--border);
            background: #fff;
        }
        @media (max-width: 900px) {
            .lc-map-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <header class="el-navbar" style="background: transparent; backdrop-filter: blur(10px);">
        <div class="container el-nav-inner">
            <div class="el-nav-logo" style="font-family: var(--font-main); font-weight: 800; font-size: 1.5rem; color: var(--local-secondary);">
                🏡 {{BUSINESS_NAME}}
            </div>
            <nav class="el-nav-links">
                <a href="#cobertura">Cercanía</a>
                <a href="#servicios">Ayuda</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="border-radius: 50px;">LLAMAR AHORA</a>
            </nav>
        </div>
    </header>

    <header class="lc-hero">
        <div class="container" style="text-align: center;">
            <div style="display: inline-block; padding: 0.5rem 1.5rem; background: var(--local-primary); color: #fff; border-radius: 50px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 2rem; letter-spacing: 1px;">
                {{NICHE}} Local en {{CITY}}
            </div>
            <h1 class="el-hero-h1" style="color: var(--local-secondary); max-width: 900px; margin-inline: auto;">{{H1_TITLE}}</h1>
            <p class="el-hero-p" style="color: var(--text); opacity: 0.8; max-width: 700px; margin-inline: auto;">{{HERO_SUBTITLE}}</p>
        </div>
    </header>

    <section class="container" style="margin-bottom: 6rem;">
        <div class="lc-contact-float">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 3rem; align-items: center;">
                <div>
                    <h2 style="font-size: 1.8rem; color: var(--local-secondary); margin-bottom: 1rem;">¿Necesitas ayuda urgente?</h2>
                    <p style="opacity: 0.7; margin: 0;">Estamos a la vuelta de la esquina. Habla directamente con un técnico local sin intermediarios.</p>
                </div>
                <div style="text-align: center;">
                    <a href="tel:{{PHONE_LINK}}" style="display: block; font-size: 2.5rem; font-weight: 900; color: var(--local-primary); text-decoration: none; margin-bottom: 0.5rem;">{{PHONE_DISPLAY}}</a>
                    <span style="font-weight: 600; color: #10b981;">● Disponible Ahora en {{CITY}}</span>
                </div>
            </div>
        </div>
    </section>

    <section id="cobertura" style="padding: 4rem 0;">
        <div class="container">
            <h2 class="section-title">Tu {{NICHE}} de Barrio en {{CITY}}</h2>
            <div class="lc-map-grid">
                <div style="padding: clamp(2rem, 5vw, 4.5rem);">
                    <h3 style="font-size: 1.5rem; margin-bottom: 2rem; color: var(--local-secondary);">Atención en menos de 15 minutos</h3>
                    <div class="el-premium-content" style="margin-bottom: 3rem;">
                        {{MAIN_DESCRIPTION}}
                    </div>
                    <div style="background: var(--bg-alt); padding: 1.5rem; border-radius: 15px;">
                        <h4 style="margin-bottom: 1rem; font-size: 1.1rem;">Zonas de Actuación</h4>
                        <div style="font-size: 0.9rem; opacity: 0.8; line-height: 1.6;">
                            {{LOCAL_NETWORK}}
                        </div>
                    </div>
                </div>
                <div style="min-height: 450px;">
                    <iframe 
                        width="100%" height="100%" style="border:0; filter: contrast(1.1) saturate(1.2);" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps?q={{NICHE}}+en+{{CITY_ENCODED}},+España&output=embed">
                    </iframe>
                </div>
            </div>
        </div>
    </section>

    <section id="servicios" style="padding: 7rem 0;">
        <div class="container">
            <h2 class="section-title">Soluciones de Cerca</h2>
            <div class="el-grid">
                {{KEY_BENEFITS}}
            </div>
        </div>
    </section>

    <section id="faq" style="background: var(--bg-alt); padding: 7rem 0; border-radius: 60px 60px 0 0;">
        <div class="container">
            <h2 class="section-title">Preguntas de Vecinos</h2>
            <div class="el-faq-group" style="max-width: 800px; margin: 0 auto;">
                {{FAQ_BLOCKS}}
            </div>
        </div>
    </section>

    <footer style="background: #fff; padding: 5rem 0; border-top: 1px solid var(--border);">
        <div class="container" style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 2rem;">🏡</div>
            <h3 style="font-size: 1.5rem; color: var(--local-secondary); margin-bottom: 1rem;">{{BUSINESS_NAME}}</h3>
            <p style="opacity: 0.6; max-width: 600px; margin-inline: auto; margin-bottom: 3rem;">Tu seguridad y la de tu familia es lo que nos mueve. {{NICHE}} de confianza, siempre en {{CITY}}.</p>
            <div style="opacity: 0.4; font-size: 0.85rem;">
                &copy; 2026 - Profesionalidad y Cercanía Certificada.
            </div>
        </div>
    </footer>

</body>
</html>
`;

export const local_benefit_item = `
    <div class="el-benefit-local" style="padding: 3rem 2rem; border-radius: 25px; border: 1px solid var(--border); text-align: center; transition: all 0.3s ease; background: #fff;">
        <div style="font-size: 3rem; margin-bottom: 1.5rem;">{{ICON}}</div>
        <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--local-secondary);">{{TITLE}}</h3>
        <p style="font-size: 0.95rem; opacity: 0.7; line-height: 1.6; margin: 0;">{{DESC}}</p>
    </div>
`;

export const local_faq_item = `
    <div class="el-faq-local" style="margin-bottom: 1rem; background: #ffffff; border-radius: 20px; border: 1px solid var(--border); overflow: hidden;">
        <div style="padding: 1.5rem 2rem; font-weight: 700; color: var(--local-secondary); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
            {{QUESTION}}
            <span style="color: var(--local-primary);">📍</span>
        </div>
        <div style="padding: 1.5rem 2rem; font-size: 1rem; opacity: 0.8; line-height: 1.6;">
            {{ANSWER}}
        </div>
    </div>
`;

