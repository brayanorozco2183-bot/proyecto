/**
 * Template Professional Classic Template - (V4 Corporate Edition)
 * Concept: Established Authority, Trust, and Technical Reliability.
 * Structure: Authority first (Hero -> Experience Table -> Services -> FAQ -> Contact).
 */
export const template_classic = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    {{SCHEMA_JSON}}
    {{GLOBAL_STYLES}}
    <style>
        :root {
            --classic-primary: var(--primary);
            --classic-secondary: var(--secondary);
            --classic-font: 'Inter', sans-serif;
        }
        .cl-authority-banner {
            background: var(--bg-alt);
            padding: 1.5rem 0;
            border-bottom: 2px solid var(--border);
            font-size: 0.9rem;
            color: var(--text);
            opacity: 0.8;
        }
        .cl-hero {
            padding: clamp(4rem, 10vw, 8rem) 0;
            background: var(--classic-secondary);
            color: #ffffff;
            position: relative;
            overflow: hidden;
        }
        .cl-hero::before {
            content: '';
            position: absolute;
            top: 0; right: 0;
            width: 300px; height: 300px;
            background: var(--classic-primary);
            filter: blur(150px);
            opacity: 0.15;
            pointer-events: none;
        }
        .cl-feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 4rem;
        }
        .cl-table-section {
            padding: 6rem 0;
            background: #ffffff;
        }
    </style>
</head>
<body>

    <div class="cl-authority-banner">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
            <span>🛡️ Servicio Especializado en {{NICHE}} Técnica</span>
            <span>Disponibilidad Inmediata en {{CITY}}</span>
        </div>
    </div>

    <header class="el-navbar" style="border-bottom: 1px solid var(--border);">
        <div class="container el-nav-inner">
            <div class="el-nav-logo"><strong>{{BUSINESS_NAME}}</strong></div>
            <nav class="el-nav-links">
                <a href="#experiencia">Trayectoria</a>
                <a href="#servicios">Servicios</a>
                <a href="#faq">Garantía</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta">📞 {{PHONE_DISPLAY}}</a>
            </nav>
        </div>
    </header>

    <header class="cl-hero">
        <div class="container">
            <div style="max-width: 800px;">
                <h1 class="el-hero-h1" style="color: #fff; line-height: 1.1; margin-bottom: 2rem;">{{H1_TITLE}}</h1>
                <p class="el-hero-p" style="color: rgba(255,255,255,0.8); font-size: 1.25rem; border-left: 4px solid var(--primary); padding-left: 2rem;">{{HERO_SUBTITLE}}</p>
                <div style="margin-top: 3.5rem; display: flex; gap: 1.5rem; flex-wrap: wrap;">
                    <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="padding: 1.2rem 2.5rem; font-size: 1.1rem;">SOLICITAR TÉCNICO AHORA</a>
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #fff; font-weight: 600;">
                        <span style="color: var(--primary);">●</span> Respuesta en < 20 min
                    </div>
                </div>
            </div>
        </div>
    </header>

    <section id="experiencia" class="cl-table-section">
        <div class="container">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 4rem; align-items: center;">
                <div>
                    <h2 class="section-title" style="text-align: left; margin-bottom: 2rem;">Excelencia y Rigor Técnico</h2>
                    <div class="el-premium-content" style="font-size: 1.1rem; line-height: 1.8;">
                        {{MAIN_DESCRIPTION}}
                    </div>
                </div>
                <div class="el-table-w" style="margin: 0;">
                    <table class="el-table">
                        <thead>
                            <tr>
                                <th class="el-th">Certificación Técnica</th>
                                <th class="el-th">Nivel de Cobertura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{TABLE_ROWS}}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    <section id="servicios" style="background: var(--bg-alt); padding: 7rem 0;">
        <div class="container">
            <h2 class="section-title">Especialidades en Seguridad</h2>
            <div class="cl-feature-grid">
                {{KEY_BENEFITS}}
            </div>
        </div>
    </section>

    {{EXTRA_CONTENT_BLOCK}}

    <section id="faq" style="padding: 7rem 0;">
        <div class="container">
            <h2 class="section-title">Consultas y Garantía de Servicio</h2>
            <div class="el-faq-group" style="max-width: 900px; margin: 0 auto;">
                {{FAQ_BLOCKS}}
            </div>
        </div>
    </section>

    <footer style="background: var(--secondary); color: #fff; padding: 6rem 0; border-top: 5px solid var(--primary);">
        <div class="container">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 4rem; text-align: left;">
                <div>
                    <div class="el-nav-logo" style="margin-bottom: 2rem; color: #fff;">{{BUSINESS_NAME}}</div>
                    <p style="opacity: 0.7; line-height: 1.8;">Servicios profesionales de {{NICHE}} de alta seguridad para residencias y empresas en {{CITY}}. Disponibilidad garantizada los 365 días.</p>
                </div>
                <div>
                    <h3 style="color: var(--primary); margin-bottom: 1.5rem;">Contacto Directo</h3>
                    <a href="tel:{{PHONE_LINK}}" style="color: #fff; font-size: 1.5rem; text-decoration: none; font-weight: 800;">{{PHONE_DISPLAY}}</a>
                    <p style="margin-top: 1rem; opacity: 0.6;">Atención inmediata {{CITY}} y Provincia.</p>
                </div>
            </div>
            <div style="margin-top: 5rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); opacity: 0.5; font-size: 0.9rem;">
                &copy; 2026 {{BUSINESS_NAME}}. Especialistas en Seguridad Certificada.
            </div>
        </div>
    </footer>

</body>
</html>
`;

export const classic_benefit_item = `
    <div class="el-card" style="padding: 2.5rem; border-radius: var(--radius-m); display: flex; flex-direction: column; gap: 1rem; background: #fff; transition: transform 0.3s ease;">
        <div style="font-size: 2.5rem; color: var(--primary);">{{ICON}}</div>
        <h3 style="font-size: 1.25rem; color: var(--secondary); margin: 0;">{{TITLE}}</h3>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text); opacity: 0.8; margin: 0;">{{DESC}}</p>
    </div>
`;

export const classic_faq_item = `
    <div class="el-faq-classic" style="margin-bottom: 1.5rem; padding: 2rem; background: var(--bg-alt); border-radius: var(--radius-m);">
        <h3 style="font-size: 1.15rem; margin-bottom: 1rem; color: var(--secondary); font-weight: 700;">{{QUESTION}}</h3>
        <p style="font-size: 1rem; line-height: 1.7; color: var(--text); margin: 0;">{{ANSWER}}</p>
    </div>
`;

