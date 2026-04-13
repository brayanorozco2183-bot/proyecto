
import { RenderFn } from '../types.js';

function escapeHtml(value: string = ''): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeArray(value: any): any[] {
    return Array.isArray(value) ? value : [];
}

function svgToDataUri(svg: string): string {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildDefaultImage(kind: 'hero' | 'editorial', data: {
    niche?: string;
    city?: string;
    title?: string;
    subtitle?: string;
} = {}): string {
    const niche = (data.niche || 'Servicio premium').slice(0, 34);
    const city = (data.city || 'Cobertura local').slice(0, 28);
    const title = (data.title || niche).slice(0, 34);
    const subtitle = (data.subtitle || city).slice(0, 36);
    const palette = kind === 'hero'
        ? {
            bgA: '#0f172a',
            bgB: '#0f766e',
            glow: 'rgba(37,99,235,0.42)',
            card: 'rgba(255,255,255,0.14)',
            stroke: 'rgba(255,255,255,0.18)'
        }
        : {
            bgA: '#0b1324',
            bgB: '#2563eb',
            glow: 'rgba(16,185,129,0.32)',
            card: 'rgba(255,255,255,0.16)',
            stroke: 'rgba(255,255,255,0.2)'
        };

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100" role="img" aria-label="${escapeHtml(title)} en ${escapeHtml(city)}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bgA}"/>
          <stop offset="100%" stop-color="${palette.bgB}"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.24)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.08)"/>
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="48"/>
        </filter>
      </defs>
      <rect width="1600" height="1100" rx="48" fill="url(#bg)"/>
      <circle cx="1240" cy="180" r="210" fill="${palette.glow}" filter="url(#blur)"/>
      <circle cx="280" cy="900" r="220" fill="rgba(255,255,255,0.08)" filter="url(#blur)"/>
      <g opacity="0.95">
        <rect x="112" y="106" width="640" height="888" rx="40" fill="${palette.card}" stroke="${palette.stroke}"/>
        <rect x="168" y="166" width="528" height="328" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
        <rect x="168" y="538" width="360" height="28" rx="14" fill="rgba(255,255,255,0.82)" opacity="0.85"/>
        <rect x="168" y="590" width="468" height="18" rx="9" fill="rgba(255,255,255,0.42)"/>
        <rect x="168" y="632" width="428" height="18" rx="9" fill="rgba(255,255,255,0.28)"/>
        <rect x="168" y="742" width="222" height="64" rx="32" fill="rgba(255,255,255,0.9)"/>
        <rect x="430" y="742" width="180" height="64" rx="32" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.18)"/>
      </g>
      <g>
        <rect x="860" y="192" width="562" height="716" rx="42" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.16)"/>
        <rect x="920" y="258" width="440" height="250" rx="30" fill="rgba(255,255,255,0.08)"/>
        <rect x="920" y="558" width="324" height="22" rx="11" fill="rgba(255,255,255,0.86)"/>
        <rect x="920" y="604" width="400" height="18" rx="9" fill="rgba(255,255,255,0.36)"/>
        <rect x="920" y="642" width="374" height="18" rx="9" fill="rgba(255,255,255,0.26)"/>
      </g>
      <text x="168" y="856" fill="white" font-size="72" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeHtml(title)}</text>
      <text x="168" y="922" fill="rgba(255,255,255,0.78)" font-size="34" font-family="Arial, Helvetica, sans-serif">${escapeHtml(subtitle)}</text>
    </svg>`;

    return svgToDataUri(svg);
}

function renderHeroImageFigure(data: {
    niche?: string;
    city?: string;
    title?: string;
    subtitle?: string;
    slot?: string;
    caption?: string;
} = {}): string {
    const src = buildDefaultImage('hero', data);
    const alt = `${data.niche || 'Servicio profesional'} en ${data.city || 'tu zona'} · imagen de referencia`;
    const caption = data.caption || 'Imagen base de referencia lista para sustituirse por una fotografía real del servicio.';

    return `
    <figure class="hero-visual" data-image-slot="${escapeHtml(data.slot || 'hero-default')}">
        <div class="hero-visual__frame">
            <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">
        </div>
        <figcaption class="hero-visual__caption">${escapeHtml(caption)}</figcaption>
    </figure>`;
}

export const renderHeader: RenderFn = ({ content, visualVariant }) => {
    const { businessName, phone, navItems } = content || {};
    const phoneHref = (phone || '').replace(/\s+/g, '');
    const navStyle = visualVariant || 'solid';

    const navHtml = (navItems || [
        { label: 'Servicios', href: '#servicios' },
        { label: 'Proceso', href: '#procesos' },
        { label: 'FAQ', href: '#faq' }
    ]).map((item: any) => `<a href="${item.href}" class="nav__link">${item.label}</a>`).join('');

    return `
    <header class="site-header" id="top" data-nav-style="${navStyle}">
        <div class="el-container">
            <div class="site-header__inner">
                <a href="#top" class="brand">
                    <span class="brand__name">${businessName}</span>
                </a>
                <nav class="nav">
                    <div class="nav__links-group">
                        ${navHtml}
                    </div>
                    <a href="tel:${phoneHref}" class="cta-primary nav__cta">
                        <span class="cta-primary__icon">📞</span>
                        <span class="cta-primary__text">${phone}</span>
                    </a>
                </nav>
            </div>
        </div>
    </header>`;
};

export const renderHeroPremium: RenderFn = ({ content, heroLayout }) => {
    const {
        h1,
        subtitle,
        phone,
        city,
        niche,
        hero_eyebrow,
        hero_card_eyebrow,
        hero_card_title,
        hero_card_text,
        hero_secondary_label,
        trust_bullets
    } = content || {};
    const phoneHref = (phone || '').replace(/\s+/g, '');
    const layout = heroLayout || 'split';

    const bullets = safeArray(trust_bullets).length
        ? safeArray(trust_bullets).map((b: string) => `<li>${escapeHtml(b)}</li>`).join('')
        : [
            '<li>Atención directa</li>',
            '<li>Presupuesto transparente</li>',
            '<li>Cobertura local</li>'
        ].join('');

    const safeCardEyebrow = escapeHtml(hero_card_eyebrow || 'Atención profesional');
    const safeCardTitle = escapeHtml(hero_card_title || 'Respuesta rápida y clara');
    const safeCardText = escapeHtml(
        hero_card_text || 'Te orientamos desde el primer contacto con un enfoque práctico, local y transparente.'
    );

    let heroBody = '';

    if (layout === 'centered') {
        heroBody = `
        <div class="hero__centered hero__centered--with-media">
            <span class="hero__eyebrow">${escapeHtml(hero_eyebrow || `${niche || ''} en ${city || ''}`.trim())}</span>
            <h1>${h1}</h1>
            <p class="hero__subtitle editorial-lead">${subtitle}</p>
            <div class="cta-row cta-row--unified">
                <a href="tel:${phoneHref}" class="cta-primary">${phone}</a>
                <a href="#servicios" class="cta-secondary">${escapeHtml(hero_secondary_label || 'Ver servicios')}</a>
            </div>
            ${renderHeroImageFigure({
                niche,
                city,
                title: h1,
                subtitle: hero_card_title || 'Imagen principal',
                slot: 'hero-default'
            })}
        </div>`;
    } else if (layout === 'split') {
        heroBody = `
        <div class="hero__shell">
            <div class="hero__copy">
                <span class="hero__eyebrow">${escapeHtml(hero_eyebrow || `${niche || ''} en ${city || ''}`.trim())}</span>
                <h1 class="hero__title">${h1}</h1>
                <p class="hero__subtitle editorial-lead">${subtitle}</p>
                <ul class="hero__bullets hero__bullets--editorial">
                    ${bullets}
                </ul>
                <div class="cta-row cta-row--unified">
                    <a href="tel:${phoneHref}" class="cta-primary">${phone}</a>
                    <a href="#servicios" class="cta-secondary">${escapeHtml(hero_secondary_label || 'Ver servicios')}</a>
                </div>
            </div>
            <div class="hero__aside hero__aside--visual">
                ${renderHeroImageFigure({
                    niche,
                    city,
                    title: hero_card_title || h1,
                    subtitle: hero_card_eyebrow || city,
                    slot: 'hero-default'
                })}
                <div class="hero-card hero-card--solid">
                    <span class="card__eyebrow">${safeCardEyebrow}</span>
                    <h2 class="card__title-small">${safeCardTitle}</h2>
                    <p class="card__text-compact">${safeCardText}</p>
                    <a href="tel:${phoneHref}" class="cta-primary card__btn">Llamar Ahora</a>
                </div>
            </div>
        </div>`;
    } else {
        heroBody = `
        <div class="hero__minimal hero__centered--with-media">
            <span class="hero__eyebrow">${escapeHtml(hero_eyebrow || `${niche || ''} en ${city || ''}`.trim())}</span>
            <h1>${h1}</h1>
            <p class="hero__subtitle editorial-lead">${subtitle}</p>
            <div class="cta-row">
                <a href="tel:${phoneHref}" class="cta-primary large">${phone}</a>
            </div>
            ${renderHeroImageFigure({
                niche,
                city,
                title: h1,
                subtitle: hero_card_title || 'Imagen principal',
                slot: 'hero-default'
            })}
        </div>`;
    }

    return `
    <section class="hero hero--${layout}">
        <div class="el-container">
            ${heroBody}
        </div>
    </section>`;
};

export const renderHeroCentered: RenderFn = ({ content }) => {
    const {
        h1, subtitle, city, phone,
        niche, hero_eyebrow, hero_card_eyebrow,
        hero_card_title, hero_card_text, hero_secondary_label
    } = content || {};
    const phoneHref = (phone || '').replace(/\s+/g, '');
    return `
    <section class="hero hero--centered">
        <div class="el-container">
            <div class="hero__shell hero__shell--centered">
                <div class="hero__copy hero__copy--centered">
                    <span class="hero__eyebrow">${city || ''}</span>
                    <h1>${h1 || ''}</h1>
                    <p class="hero__subtitle">${subtitle || ''}</p>
                    <div class="cta-row cta-row--centered">
                        <a href="tel:${phoneHref}" class="cta-primary">Llamar ahora</a>
                    </div>
                    ${renderHeroImageFigure({
                        niche,
                        city,
                        title: h1,
                        subtitle: hero_card_title || 'Visual principal',
                        slot: 'hero-default'
                    })}
                </div>
            </div>
        </div>
    </section>`;
};

export const renderHeroStacked: RenderFn = ({ content }) => {
    const {
        h1, subtitle, city, phone, trust_bullets,
        niche, hero_eyebrow, hero_card_eyebrow,
        hero_card_title, hero_card_text, hero_secondary_label
    } = content || {};
    const phoneHref = (phone || '').replace(/\s+/g, '');
    return `
    <section class="hero hero--stacked">
        <div class="el-container">
            <div class="hero__shell hero__shell--stacked">
                <div class="hero__copy hero__copy--stacked">
                    <span class="hero__eyebrow">${city || ''}</span>
                    <h1>${h1 || ''}</h1>
                    <p class="hero__subtitle">${subtitle || ''}</p>

                    <ul class="hero__bullets hero__bullets--premium">
    ${safeArray(trust_bullets).length
            ? safeArray(trust_bullets).map((b: string) => `<li>${escapeHtml(b)}</li>`).join('')
            : [
                '<li>Atención directa</li>',
                '<li>Presupuesto transparente</li>',
                '<li>Cobertura local</li>'
            ].join('')
        }
                    </ul>

                    ${renderHeroImageFigure({
                        niche,
                        city,
                        title: h1,
                        subtitle: hero_card_title || 'Apoyo visual',
                        slot: 'hero-default'
                    })}

                    <div class="cta-row">
                        <a href="tel:${phoneHref}" class="cta-primary">Llamar ahora</a>
                        <a href="#servicios" class="cta-secondary">${escapeHtml(hero_secondary_label || 'Ver servicios')}</a>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
};

export const renderHeroCtaHeavy: RenderFn = ({ content }) => {
    const {
        h1, subtitle, phone, city, trust_bullets,
        niche, hero_eyebrow, hero_card_eyebrow,
        hero_card_title, hero_card_text, hero_secondary_label
    } = content || {};
    const phoneHref = (phone || '').replace(/\s+/g, '');
    return `
    <section class="hero hero--cta-heavy">
        <div class="el-container">
            <div class="hero__shell hero__shell--cta">
                <div class="hero__copy">
                    <span class="hero__eyebrow">${escapeHtml(hero_eyebrow || `${niche || ''} en ${city || ''}`.trim())}</span>
                    <h1>${h1}</h1>
                    <p class="hero__subtitle">${subtitle}</p>
                    <ul class="hero__bullets hero__bullets--premium">
                        ${(trust_bullets || []).map((b: string) => `<li>${b}</li>`).join('')}
                    </ul>
                    <div class="cta-row">
                        <a href="tel:${phoneHref}" class="cta-primary">${phone}</a>
                    </div>
                </div>
                <div class="hero__aside hero__aside--visual">
                    ${renderHeroImageFigure({
                        niche,
                        city,
                        title: h1,
                        subtitle: 'Imagen de portada',
                        slot: 'hero-default'
                    })}
                    <div class="hero-card hero-card--cta">
                        <span class="card__eyebrow">Atención Directa</span>
                        <div class="card__title">Respuesta inmediata</div>
                        <p class="card__text">Servicio orientado a urgencia y disponibilidad inmediata.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
};

export const renderTrustStrip: RenderFn = () => {
    return `
    <section class="section-trust-strip">
        <div class="el-container">
            <div class="trust-strip-editorial">
                <span class="trust-strip__label">Confianza Editorial</span>
                <div class="trust-strip__pills">
                    <span class="trust-pill-refined">Atención Técnica Directa</span>
                    <span class="trust-pill-refined">Presupuestos Sin Sorpresas</span>
                    <span class="trust-pill-refined">Componentes Homologados</span>
                </div>
            </div>
        </div>
    </section>`;
};

export const renderServicesGrid: RenderFn = (input) => {
    const { content, visualVariant } = input;
    const { h2, services } = content;
    const variant = visualVariant || 'clean_cards';
    const sectionId = input.id || 'servicios';

    if (variant === 'icon_tiles') {
        return `
        <section class="el-section" id="${sectionId}">
            <div class="el-container">
                <h2 class="section-title">${h2}</h2>
                <div class="services-tiles">
                    ${(services || []).map((s: any) => `
                        <div class="service-tile">
                            <div class="tile-icon">🛠</div>
                            <h3 class="tile-title">${s.title}</h3>
                            <p class="tile-desc">${s.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>`;
    }

    if (variant === 'editorial_columns') {
        return `
        <section class="el-section" id="${sectionId}">
            <div class="el-container">
                <div class="editorial-grid">
                    <div class="editorial-header">
                        <h2 class="editorial-title">${h2}</h2>
                        <p class="editorial-lead">Excelencia técnica en cada intervención.</p>
                    </div>
                    <div class="editorial-columns">
                        ${(services || []).map((s: any) => `
                            <div class="editorial-item">
                                <h3 class="item-title">${s.title}</h3>
                                <p class="item-text">${s.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>`;
    }

    if (variant === 'proof_cards') {
        return `
        <section class="el-section" id="${sectionId}">
            <div class="el-container">
                <h2 class="section-title">${h2}</h2>
                <div class="proof-cards-container">
                    ${(services || []).map((s: any) => `
                        <div class="proof-card">
                            <div class="proof-card__badge">GARANTIZADO</div>
                            <h3 class="proof-card__title">${s.title}</h3>
                            <p class="proof-card__desc">${s.description}</p>
                            <div class="proof-card__footer">✓ Técnico disponible</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>`;
    }

    return `
    <section class="el-section" id="${sectionId}">
        <div class="el-container">
            <h2 class="section-title">${h2}</h2>
            <div class="services-grid">
                ${(services || []).map((s: any) => `
                    <div class="service-card">
                        <h3 class="card-title">${s.title}</h3>
                        <p class="card-description">${s.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>`;
};

export const renderFaq: RenderFn = (input) => {
    const { content, visualVariant } = input;
    const { h2, faqs } = content;
    const variant = visualVariant || 'accordion_clean';
    const sectionId = input.id || 'faq';

    if (variant === 'editorial_list') {
        return `
        <section class="el-section" id="${sectionId}">
            <div class="el-container">
                <div class="faq-editorial">
                    <h2 class="faq-editorial__title">${h2}</h2>
                    <div class="faq-editorial__grid">
                        ${(faqs || []).map((f: any) => `
                            <div class="faq-editorial__item">
                                <h3 class="faq-editorial__q">${f.question}</h3>
                                <div class="faq-editorial__a">${f.answer}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>`;
    }

    return `
    <section class="el-section" id="${sectionId}">
        <div class="el-container">
            <h2 class="section-title">${h2}</h2>
            <div class="faq-list-clean">
                ${(faqs || []).map((f: any) => `
                    <details class="faq-item-refined">
                        <summary class="faq-summary-refined">
                            <span class="faq-question-text">${f.question}</span>
                            <span class="faq-icon-arrow"></span>
                        </summary>
                        <div class="faq-content-refined">
                            <p>${f.answer}</p>
                        </div>
                    </details>
                `).join('')}
            </div>
        </div>
    </section>`;
};

export const renderUrgencyCounter: RenderFn = ({ content, vibe, visualVariant }) => {
    const { h2, phone } = content || {};
    const variant = visualVariant || 'luxury_banner';
    const phoneHref = (phone || '').replace(/\s+/g, '');

    if (variant === 'minimal_phone_bar') {
        return `
        <section class="el-section section--compact">
            <div class="el-container">
                <div class="minimal-phone-bar">
                    <span class="bar-text">${h2 || 'Asistencia Directa 24h'}</span>
                    <a href="tel:${phoneHref}" class="bar-link">${phone}</a>
                </div>
            </div>
        </section>`;
    }

    return `
    <section class="el-section vibe-${vibe || 'premium'}">
        <div class="el-container">
            <div class="urgency-banner card--strong-border">
                <div class="urgency-banner__sidebar"></div>
                <div class="urgency-banner__content">
                    <div class="status-badge">
                        <span class="status-badge__dot"></span>
                        Técnicos de Guardia: Activos
                    </div>
                    <h2 class="urgency-banner__title">${h2 || '¿Necesitas asistencia inmediata?'}</h2>
                    <p class="urgency-banner__subtitle">Equipos móviles estratégicamente ubicados para una respuesta inmediata y materiales adecuados al tipo de intervención.</p>
                </div>
                <div class="counter-box">
                    <div class="counter-box__label">Estado del Servicio</div>
                    <div class="counter-box__value">Alta<span class="counter-box__unit">Disponibilidad</span></div>
                </div>
            </div>
        </div>
    </section>`;
};

export const renderCtaBand: RenderFn = ({ content }) => {
    const { title, text, phone } = content || {};
    const phoneHref = (phone || '').replace(/\s+/g, '');
    return `
    <section class="section--compact">
        <div class="el-container">
            <div class="cta-band">
                <div class="cta-content">
                    <h2 class="cta-title">${title}</h2>
                    <p class="cta-text">${text}</p>
                </div>
                <a href="tel:${phoneHref}" class="cta-primary cta-large">Llamar al ${phone}</a>
            </div>
        </div>
    </section>`;
};

export const renderFooter: RenderFn = ({ content, visualVariant }) => {
    const { businessName, city, phone, footer_tagline, footer_availability } = content || {};
    const style = visualVariant || 'directory';
    return `
    <footer class="footer-editorial" data-style="${style}">
        <div class="el-container">
            <div class="footer__grid-refined">
                <div class="footer__brand-block">
                    <h3 class="footer__brand-name">${businessName}</h3>
                    <p class="footer__tagline">${escapeHtml(footer_tagline || `${city || ''} · Servicio local con atención técnica y seguimiento claro`)}</p>
                </div>
                <div class="footer__links-grid">
                    <div class="footer__block">
                        <h4 class="footer__group-title">Contacto</h4>
                        <div class="footer__contact-details">
                            <a href="tel:${(phone || '').replace(/\s+/g, '')}" class="footer__phone-link">${phone}</a>
                            <p class="footer__availability">${escapeHtml(footer_availability || 'Atención directa · Coordinación local')}</p>
                        </div>
                    </div>
                    <div class="footer__block">
                        <h4 class="footer__group-title">Navegación</h4>
                        <nav class="footer__nav-list">
                            <a href="/aviso-legal/" class="footer__nav-link">Aviso Legal</a>
                            <a href="/privacidad/" class="footer__nav-link">Privacidad</a>
                            <a href="/cookies/" class="footer__nav-link">Cookies</a>
                        </nav>
                    </div>
                </div>
            </div>
            <div class="footer__bottom">
                <p>&copy; ${new Date().getFullYear()} ${businessName}. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>`;
};

export const renderTestimonials: RenderFn = ({ content, vibe }) => {
    const { h2 } = content;
    const testimonials = [
        { name: "Marta R.", text: "Llegaron muy rápido. Muy profesionales y el precio fue el acordado por teléfono.", stars: 5, date: "Hace 2 días" },
        { name: "Juan P.", text: "Me quedé fuera de casa a las 3 AM. Servicio impecable y trato muy humano.", stars: 5, date: "Hace 1 semana" },
        { name: "Carlos T.", text: "Explicaron el trabajo con claridad y dejaron la intervención rematada y revisada.", stars: 5, date: "Hace 1 mes" }
    ];

    return `
    <section class="el-section vibe-${vibe || 'premium'}">
        <div class="el-container">
            <div class="section-title">
                <h2>${h2 || 'Opiniones de nuestros vecinos'}</h2>
            </div>
            <div class="testimonials-grid">
                ${testimonials.map(t => `
                    <div class="testimonial-card">
                        <div class="quote-icon">"</div>
                        <div class="stars">${'★'.repeat(t.stars)}</div>
                        <p class="testimonial-text">"${t.text}"</p>
                        <div class="testimonial-meta">
                            <div class="avatar">${t.name[0]}</div>
                            <div>
                                <div class="testimonial-name">${t.name}</div>
                                <div class="testimonial-date">${t.date}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>`;
};

export const renderMap: RenderFn = (input) => {
    const { content, vibe, visualVariant, id } = input;
    const { h2, city, description, address } = content;
    const variant = visualVariant || 'full_width';
    const mapQuery = encodeURIComponent(address || city || 'España');

    const iframeHtml = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed" class="map-iframe"></iframe>`;

    const mapId = id || 'map';

    if (variant === 'boxed_with_text') {
        return `
        <section class="el-section vibe-${vibe || 'premium'}" id="${mapId}">
            <div class="el-container">
                <div class="map-grid">
                    <div class="map-info">
                        <h2>${h2 || `Presencia en ${city}`}</h2>
                        <div class="map-description">${description || ''}</div>
                        <a href="https://maps.google.com/maps?q=${mapQuery}" target="_blank" class="cta-secondary">Ver en Google Maps</a>
                    </div>
                    <div class="map-boxed-wrapper">
                        ${iframeHtml}
                    </div>
                </div>
            </div>
        </section>`;
    }

    return `
    <section class="el-section vibe-${vibe || 'premium'} section--map" id="${mapId}">
        <div class="el-container">
            <div class="section-title">
                <h2>${h2 || `Nuestra Ubicación en ${city}`}</h2>
                ${description ? `<div class="map-description">${description}</div>` : ''}
            </div>
            <div class="map-wrapper card--shadow">
                ${iframeHtml}
            </div>
            <div class="map-footer">
                <p class="map-status"><span class="status-dot">●</span> Área de servicio activa.</p>
                <a href="https://maps.google.com/maps?q=${mapQuery}" target="_blank" class="cta-secondary">Ver en Google Maps</a>
            </div>
        </div>
    </section>`;
};

export const renderTimeline: RenderFn = (input) => {
    const { content, visualVariant } = input;
    const { h2, items } = content || {};
    const variant = visualVariant || 'timeline_vertical';
    const sectionId = input.id || 'proceso';
    const steps = safeArray(items);

    if (!steps.length) return '';

    return `
    <section class="el-section" id="${sectionId}">
        <div class="el-container">
            <h2 class="section-title">${escapeHtml(h2 || 'Proceso')}</h2>
            <div class="timeline-wrapper variant-${escapeHtml(variant)}">
                ${steps.map((step: any, index: number) => `
                    <div class="timeline-step">
                        <div class="step-num">${index + 1}</div>
                        <div class="step-content">
                            <h3>${escapeHtml(step?.title || '')}</h3>
                            <p>${escapeHtml(step?.text || '')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>`;
};

export const renderCertificates: RenderFn = ({ content, vibe }) => {
    const certs = safeArray(content?.items);

    if (!certs.length) return '';

    return `
    <section class="el-section vibe-${escapeHtml(vibe || 'premium')} section--certificates">
        <div class="el-container">
            <div class="certificates-grid">
                ${certs.map((c: any) => `
                    <div class="cert-item">
                        <div class="cert-icon">✓</div>
                        <div class="cert-name">${escapeHtml(c?.name || '')}</div>
                        <div class="cert-org">${escapeHtml(c?.org || '')}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>`;
};

export const renderImageFeature: RenderFn = ({ content, vibe, variant }) => {
    const { h2, text, phone } = content || {};
    const isReversed = variant === 'b';
    const imageUrl = content?.imageUrl || '';
    if (!imageUrl) return '';
    return `
    <section class="el-section vibe-${vibe || 'premium'} section--feature">
        <div class="el-container">
            <div class="image-feature ${isReversed ? 'image-feature--reversed' : ''}">
                <div class="feature-copy">
                    <span class="eyebrow">Excelencia Profesional</span>
                    <h2 class="feature-title">${h2 || 'Compromiso con el trabajo bien hecho'}</h2>
                    <div class="el-premium-content">
                        ${text || '<p>Utilizamos materiales de máxima resistencia certificados.</p>'}
                    </div>
                    <div class="feature-cta">
                        <a href="tel:${(phone || '').replace(/\s+/g, '') || '600000000'}" class="cta-primary">Contactar con un Especialista</a>
                    </div>
                </div>
                <div class="feature-media">
                    <div class="feature-img-wrapper">
                        <img src="${imageUrl}" alt="Servicio profesional" class="feature-img">
                        <div class="feature-img-overlay">
                            <div class="feature-img-label">CALIDAD CERTIFICADA</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
};