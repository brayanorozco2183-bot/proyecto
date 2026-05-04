/**
 * Template Urgency 24h Template - (V4 Flash Edition)
 * Concept: Extreme Speed, Emergency Response, and High-Impact Action.
 * Structure: Action Intensive (Urgent Topbar -> Radical Hero -> Emergency Grid -> Contrast Table -> Quick FAQ).
 */
export const template_modern = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    {{SCHEMA_JSON}}
    {{GLOBAL_STYLES}}
    <style>
        :root {
            --modern-primary: #ff3e3e; /* Radical Red */
            --modern-secondary: #0a0a0b; /* Deep Void */
            --font-display: 'Archivo Black', sans-serif;
            --font-body: 'Inter', sans-serif;
        }
        body { font-family: var(--font-body); background: #ffffff; color: var(--modern-secondary); }
        .md-flash-top {
            background: var(--modern-primary);
            color: #fff;
            padding: 10px 0;
            text-align: center;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 0.8rem;
        }
        .md-hero {
            background: var(--modern-secondary);
            color: #fff;
            padding: clamp(4rem, 12vw, 10rem) 0;
            position: relative;
            z-index: 1;
        }
        .md-hero::after {
            content: 'URGENTE';
            position: absolute;
            top: 50%; right: -5%;
            transform: translateY(-50%) rotate(-90deg);
            font-size: clamp(5rem, 15vw, 15rem);
            font-family: var(--font-display);
            opacity: 0.03;
            pointer-events: none;
            z-index: -1;
        }
        .md-btn-radical {
            display: inline-flex;
            align-items: center;
            gap: 1rem;
            background: var(--modern-primary);
            color: #fff;
            padding: 1.5rem 3rem;
            font-family: var(--font-display);
            text-decoration: none;
            font-size: clamp(1.2rem, 3vw, 1.8rem);
            border: none;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .md-btn-radical:hover {
             transform: scale(1.05) skewX(-5deg);
             box-shadow: 20px 20px 0px rgba(255, 62, 62, 0.2);
        }
        .md-emergency-card {
            background: #fff;
            border: 4px solid var(--modern-secondary);
            padding: 2.5rem;
            position: relative;
            transition: 0.3s;
        }
        .md-emergency-card:hover { border-color: var(--modern-primary); }
        .md-emergency-card::before {
            content: '';
            position: absolute;
            top: 10px; left: 10px;
            width: 100%; height: 100%;
            background: var(--modern-secondary);
            z-index: -1;
            opacity: 0;
            transition: 0.3s;
        }
        .md-emergency-card:hover::before { opacity: 0.05; }
    </style>
</head>
<body>

    <div class="md-flash-top">⚠️ UNIDAD DE ASISTENCIA TÉCNICA ACTIVA EN {{CITY}} - LLEGADA ESTIMADA: 20 MIN ⚠️</div>

    <header class="el-navbar" style="border-bottom: 2px solid var(--modern-secondary);">
        <div class="container el-nav-inner" style="padding: 1.5rem 0;">
            <div class="el-nav-logo" style="font-family: var(--font-display); font-size: 1.8rem;">
                {{BUSINESS_NAME}}
            </div>
            <nav class="el-nav-links">
                <a href="#experiencia" style="font-weight: 800; text-transform: uppercase; font-size: 0.8rem;">Garantía</a>
                <a href="tel:{{PHONE_LINK}}" class="el-nav-cta" style="background: var(--modern-secondary); color: #fff; border-radius: 0;">24h ACTIVO</a>
            </nav>
        </div>
    </header>

    <header class="md-hero">
        <div class="container">
            <h1 class="el-hero-h1" style="font-family: var(--font-display); line-height: 0.95; margin-bottom: 3rem;">{{H1_TITLE}}</h1>
            <div style="margin-bottom: 4rem;">
                <p class="el-hero-p" style="max-width: 650px; border-left: 8px solid var(--modern-primary); padding-left: 2rem;">{{HERO_SUBTITLE}}</p>
            </div>
            <a href="tel:{{PHONE_LINK}}" class="md-btn-radical">
                <span style="font-size: 0.8em;">📞</span> {{PHONE_DISPLAY}}
            </a>
        </div>
    </header>

    <section id="servicios" style="padding: 8rem 0; background: #fafafa;">
        <div class="container">
            <h2 class="section-title" style="font-family: var(--font-display); text-align: left; font-size: 3rem;">RESPUESTA INMEDIATA</h2>
            <div class="el-grid" style="margin-top: 5rem;">
                {{KEY_BENEFITS}}
            </div>
        </div>
    </section>

    <section id="experiencia" style="padding: 8rem 0; background: var(--modern-secondary); color: #fff;">
        <div class="container">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 5vw; align-items: start;">
                <div>
                    <h2 style="font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.5rem); color: var(--modern-primary); line-height: 1; margin-bottom: 2rem;">SIN ESPERAS. SIN EXCUSAS.</h2>
                    <div class="el-premium-content" style="font-size: 1.2rem; opacity: 0.9; line-height: 1.6;">
                        {{MAIN_DESCRIPTION}}
                    </div>
                </div>
                <div class="el-table-w" style="background: transparent; border: 2px solid rgba(255,255,255,0.1); border-radius: 0;">
                    <table class="el-table">
                        <thead style="background: var(--modern-primary);">
                            <tr>
                                <th class="el-th" style="color: #fff; text-transform: uppercase;">Parámetro</th>
                                <th class="el-th" style="color: #fff; text-transform: uppercase;">Compromiso Real</th>
                            </tr>
                        </thead>
                        <tbody style="color: #fff;">
                            {{TABLE_ROWS}}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    {{EXTRA_CONTENT_BLOCK}}

    <section id="faq" style="padding: 8rem 0;">
        <div class="container">
            <h2 class="section-title" style="font-family: var(--font-display); text-align: right; color: var(--modern-secondary);">PROTOCOLO DE AYUDA</h2>
            <div class="el-faq-group" style="margin-top: 4rem;">
                {{FAQ_BLOCKS}}
            </div>
        </div>
    </section>

    <footer style="background: var(--modern-secondary); color: #fff; padding: 5rem 0;">
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 3rem;">
                <div style="font-family: var(--font-display); font-size: 2rem;">{{BUSINESS_NAME}}</div>
                <div style="text-align: right;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; margin-bottom: 0.5rem;">{{NICHE}} Industrial y Residencial</div>
                    <div style="font-weight: 900; color: var(--modern-primary);">{{CITY}} - SERVICIO 24 HORAS</div>
                </div>
            </div>
        </div>
    </footer>

</body>
</html>
`;

export const modern_benefit_item = `
    <div class="md-emergency-card">
        <div style="font-size: 3.5rem; margin-bottom: 1.5rem;">{{ICON}}</div>
        <h3 style="font-family: var(--font-display); font-size: 1.1rem; text-transform: uppercase; margin-bottom: 1rem;">{{TITLE}}</h3>
        <p style="font-size: 0.9rem; line-height: 1.5; opacity: 0.7; margin: 0;">{{DESC}}</p>
    </div>
`;

export const modern_faq_item = `
    <div style="margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1rem; color: var(--modern-primary); display: flex; align-items: center; gap: 1rem;">
            <span style="background: var(--modern-secondary); color: #fff; padding: 5px 10px; font-size: 0.6em;">FAQ</span>
            {{QUESTION}}
        </h3>
        <p style="font-size: 1.1rem; line-height: 1.5; color: #444; margin: 0; padding-left: 3rem;">{{ANSWER}}</p>
    </div>
`;

