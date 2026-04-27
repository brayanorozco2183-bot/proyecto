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


function normalizePhoneValue(value: any): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/(?:consultar|pendiente|no\s+disponible|n\/d|sin\s+telefono)/i.test(raw)) return '';
    const hasPlus = raw.startsWith('+');
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) return '';
    if (/^(\d)\1+$/.test(digits)) return '';
    return hasPlus ? `+${digits}` : digits;
}

function buildPhoneHref(value: any, fallback = '#contacto'): string {
    const normalized = normalizePhoneValue(value);
    return normalized ? `tel:${normalized}` : fallback;
}

function buildPhoneLabel(value: any, fallback = 'Contactar'): string {
    return normalizePhoneValue(value) || fallback;
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
    const alt = `${data.niche || 'Servicio profesional'} en ${data.city || 'tu zona'} · imagen editorial del servicio`;
    const caption = data.caption || 'Imagen editorial del servicio generada como respaldo visual automático.';

    return `
    <figure class="hero-visual" data-image-slot="${escapeHtml(data.slot || 'hero-default')}" data-image-kind="hero" data-image-status="provisional">
        <div class="hero-visual__frame">
            <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" fetchpriority="low" width="1600" height="1100" sizes="(max-width: 768px) 100vw, 720px" data-image-origin="fallback-svg">
        </div>
    </figure>`;
}

export const renderHeader: RenderFn = ({ content, visualVariant }) => {
    const { businessName, phone, navItems } = content || {};
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
    const navStyle = visualVariant || 'solid';
    const safeBusinessName = escapeHtml(businessName || 'Servicio local');

    const entries = (navItems || [
        { label: 'Servicios', href: '#servicios' },
        { label: 'Proceso', href: '#procesos' },
        { label: 'FAQ', href: '#faq' }
    ]).filter((item: any) => item && item.label && item.href);

    const navHtml = entries.map((item: any, index: number) => `<a href="${escapeHtml(String(item.href))}" class="nav__link${index === 0 ? ' is-active' : ''}">${escapeHtml(String(item.label))}</a>`).join('');
    const mobileNavHtml = entries.map((item: any) => `<a href="${escapeHtml(String(item.href))}" class="nav-mobile__link">${escapeHtml(String(item.label))}</a>`).join('');

    return `
    <header class="site-header" id="top" data-nav-style="${navStyle}">
        <div class="el-container">
            <div class="site-header__inner">
                <a href="#top" class="brand">
                    <span class="brand__name site-header__brand-name">${safeBusinessName}</span>
                </a>
                <nav class="nav nav--desktop" aria-label="Principal">
                    <div class="nav__links-group">
                        ${navHtml}
                    </div>
                    <a href="${phoneHref}" class="cta-primary nav__cta${navStyle === 'prestige' ? ' nav__cta--prestige' : ''}">
                        <span class="cta-primary__icon">📞</span>
                        <span class="cta-primary__text">${escapeHtml(phoneLabel)}</span>
                    </a>
                </nav>
                <details class="nav-mobile" aria-label="Navegación móvil">
                    <summary class="nav-mobile__summary" aria-label="Abrir menú">
                        <span class="nav-mobile__summary-text">Menú</span>
                        <span class="nav-mobile__summary-icon" aria-hidden="true"></span>
                    </summary>
                    <div class="nav-mobile__panel">
                        <div class="nav-mobile__links" role="list">
                            ${mobileNavHtml}
                        </div>
                        <a href="${phoneHref}" class="cta-primary nav-mobile__cta">
                            <span class="cta-primary__icon">📞</span>
                            <span class="cta-primary__text">${escapeHtml(phoneLabel)}</span>
                        </a>
                    </div>
                </details>
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
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
    const layout = heroLayout || 'split';

    const trustValues = safeArray(trust_bullets).length
        ? safeArray(trust_bullets).slice(0, 3)
        : ['Atención directa', 'Presupuesto transparente', 'Cobertura local'];

    const bullets = trustValues.map((b: string) => `<li>${escapeHtml(b)}</li>`).join('');

    const safeCardEyebrow = escapeHtml(hero_card_eyebrow || 'Atención profesional');
    const safeCardTitle = escapeHtml(hero_card_title || 'Respuesta rápida y clara');
    const safeCardText = escapeHtml(
        hero_card_text || 'Te orientamos desde el primer contacto con un enfoque práctico, local y transparente.'
    );

    let heroBody = '';

    if (layout === 'grid') {
        const heroImageSrc = buildDefaultImage('hero', {
            niche,
            city,
            title: h1,
            subtitle: hero_card_title || subtitle || city
        });

        heroBody = `
        <div class="hero-immersive">
            <figure class="hero-immersive__media" data-image-slot="hero-default" data-image-kind="hero" data-image-status="provisional">
                <img src="${heroImageSrc}" alt="${escapeHtml(`${niche || 'Servicio profesional'} en ${city || 'tu zona'}`)}" loading="eager" decoding="async" fetchpriority="high" width="1600" height="1100" sizes="100vw" data-image-origin="fallback-svg">
                <div class="hero-immersive__shade"></div>
                <div class="hero-immersive__copy">
                    <span class="hero__eyebrow hero__eyebrow--luxury">${escapeHtml(hero_eyebrow || `${niche || ''} en ${city || ''}`.trim() || 'Servicio local')}</span>
                    <h1 class="hero-immersive__title">${h1}</h1>
                    <p class="hero-immersive__subtitle">${subtitle || ''}</p>
                    <div class="cta-row cta-row--hero-overlay">
                        <a href="${phoneHref}" class="cta-primary">${escapeHtml(phoneLabel)}</a>
                        <a href="#servicios" class="cta-secondary">${escapeHtml(hero_secondary_label || 'Ver servicios')}</a>
                    </div>
                </div>
            </figure>
            <div class="hero-immersive__lower">
                <div class="hero-immersive__highlights">
                    ${trustValues.map((item: string, index: number) => `
                        <article class="hero-highlight">
                            <span class="hero-highlight__index">${String(index + 1).padStart(2, '0')}</span>
                            <div class="hero-highlight__copy">
                                <strong>${escapeHtml(item)}</strong>
                                <span>${escapeHtml(city || 'Cobertura local')}</span>
                            </div>
                        </article>
                    `).join('')}
                </div>
                <article class="hero-card hero-card--floating">
                    <span class="card__eyebrow">${safeCardEyebrow}</span>
                    <h2 class="card__title-small">${safeCardTitle}</h2>
                    <p class="card__text-compact">${safeCardText}</p>
                    <a href="${phoneHref}" class="cta-primary card__btn">Llamar ahora</a>
                </article>
            </div>
        </div>`;
    } else if (layout === 'centered') {
        heroBody = `
        <div class="hero__centered hero__centered--with-media">
            <span class="hero__eyebrow">${escapeHtml(hero_eyebrow || `${niche || ''} en ${city || ''}`.trim())}</span>
            <h1>${h1}</h1>
            <p class="hero__subtitle editorial-lead">${subtitle}</p>
            <div class="cta-row cta-row--unified">
                <a href="${phoneHref}" class="cta-primary">${escapeHtml(phoneLabel)}</a>
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
                    ${trustValues.map((b: string) => `<li><span class="bullet-inner">${escapeHtml(b)}</span></li>`).join('')}
                </ul>
                <div class="cta-row cta-row--unified">
                    <a href="${phoneHref}" class="cta-primary">${escapeHtml(phoneLabel)}</a>
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
                    <a href="${phoneHref}" class="cta-primary card__btn">Llamar ahora</a>
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
                <a href="${phoneHref}" class="cta-primary large">${escapeHtml(phoneLabel)}</a>
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
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
    return `
    <section class="hero hero--centered">
        <div class="el-container">
            <div class="hero__shell hero__shell--centered">
                <div class="hero__copy hero__copy--centered">
                    <span class="hero__eyebrow">${city || ''}</span>
                    <h1>${h1 || ''}</h1>
                    <p class="hero__subtitle">${subtitle || ''}</p>
                    <div class="cta-row cta-row--centered">
                        <a href="${phoneHref}" class="cta-primary">Llamar ahora</a>
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
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
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
                        <a href="${phoneHref}" class="cta-primary">Llamar ahora</a>
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
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
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
                        <a href="${phoneHref}" class="cta-primary">${escapeHtml(phoneLabel)}</a>
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
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);

    if (variant === 'minimal_phone_bar') {
        return `
        <section class="el-section section--compact">
            <div class="el-container">
                <div class="minimal-phone-bar">
                    <span class="bar-text">${h2 || 'Asistencia Directa 24h'}</span>
                    <a href="${phoneHref}" class="bar-link">${escapeHtml(phoneLabel)}</a>
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
                        Coordinación prioritaria activa
                    </div>
                    <h2 class="urgency-banner__title">${h2 || '¿Necesitas asistencia inmediata?'}</h2>
                    <p class="urgency-banner__subtitle">Coordinación operativa para priorizar incidencias urgentes y ordenar la respuesta según el tipo de trabajo.</p>
                </div>
                <div class="counter-box">
                    <div class="counter-box__label">Estado operativo</div>
                    <div class="counter-box__value">Alta<span class="counter-box__unit">Prioridad</span></div>
                </div>
            </div>
        </div>
    </section>`;
};

export const renderCtaBand: RenderFn = ({ content }) => {
    const { title, text, phone } = content || {};
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
    return `
    <section class="section--compact">
        <div class="el-container">
            <div class="cta-band">
                <div class="cta-content">
                    <h2 class="cta-title">${title}</h2>
                    <p class="cta-text">${text}</p>
                </div>
                <a href="${phoneHref}" class="cta-primary cta-large">${phoneLabel === "Contactar" ? "Solicitar contacto" : `Llamar al ${escapeHtml(phoneLabel)}`}</a>
            </div>
        </div>
    </section>`;
};

export const renderFooter: RenderFn = ({ content, visualVariant }) => {
    const { businessName, city, phone, footer_tagline, footer_availability } = content || {};
    const style = visualVariant || 'directory';
    const phoneHref = buildPhoneHref(phone);
    const phoneLabel = buildPhoneLabel(phone);
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
                            <a href="${phoneHref}" class="footer__phone-link">${escapeHtml(phoneLabel)}</a>
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
    const { h2, city, niche, businessName, napData, authorityLinks, testimonials } = content || {};
    const localCity = city || 'tu zona';
    const localNiche = niche || 'el servicio';
    const safeBusinessName = businessName || napData?.business_name || 'Servicio local';
    const links = Array.isArray(authorityLinks) ? authorityLinks.filter(Boolean).slice(0, 3) : [];
    const verifiedTestimonials = Array.isArray(testimonials)
        ? testimonials.filter((item: any) => item && item.isVerified && item.text && item.name)
        : [];

    if (verifiedTestimonials.length > 0) {
        return `
    <section class="el-section vibe-${vibe || 'premium'} testimonials-section" data-proof-mode="verified_reviews">
        <div class="el-container">
            <div class="section-title testimonials-section__header">
                <h2>${h2 || 'Opiniones verificadas'}</h2>
            </div>
            <div class="testimonials-grid">
                ${verifiedTestimonials.slice(0, 3).map((t: any) => `
                    <article class="testimonial-card" data-review-source="${t.sourceUrl || ''}">
                        <div class="testimonial-card__stars" aria-hidden="true">${'★'.repeat(Math.max(1, Math.min(5, Number(t.rating || 5))))}</div>
                        <p class="testimonial-text">“${t.text}”</p>
                        <div class="testimonial-meta">
                            <div class="avatar">${String(t.name || '?').trim()[0] || '?'}</div>
                            <div>
                                <div class="testimonial-name">${t.name}</div>
                                <div class="testimonial-date">${t.sourceLabel || 'Reseña verificada'}${t.date ? ` · ${t.date}` : ''}</div>
                            </div>
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
    </section>`;
    }

    const trustEvidence = Array.isArray(napData?.trust_evidence) ? napData.trust_evidence.filter(Boolean).slice(0, 4) : [];

    const evidenceCards = [
        {
            title: 'Datos visibles del servicio',
            body: napData?.phone
                ? `${safeBusinessName} muestra un teléfono de contacto visible para ${localCity}: ${napData.phone}.`
                : `${safeBusinessName} mantiene la identidad visible de ${localCity}, pero el teléfono sigue pendiente de validación antes de usarlo como prueba comercial fuerte.`,
            meta: napData?.truth_level === 'exact' ? 'NAP completo' : napData?.truth_level === 'partial' ? 'NAP parcial' : 'NAP seguro'
        },
        {
            title: 'Cobertura declarada sin fingir oficina',
            body: napData?.address_status === 'exact'
                ? `La cobertura se presenta con una dirección exacta en ${localCity}, útil para reforzar presencia física cuando ese dato es real.`
                : `La presencia se comunica a nivel de ${localCity} sin inventar oficinas ni direcciones precisas que no estén confirmadas.`,
            meta: napData?.address_status === 'exact' ? 'Dirección exacta' : 'Cobertura por ciudad'
        },
        {
            title: links.length ? 'Fuentes externas que sí puedes comprobar' : 'Qué conviene pedir antes de contratar',
            body: links.length
                ? links.map((link: any) => `${link.label}`).join(' · ')
                : trustEvidence.length
                    ? trustEvidence.join(' · ')
                    : `Factura o justificante, alcance por escrito, criterio técnico explicado y una cobertura operativa coherente con ${localCity}.`,
            meta: links.length ? 'Autoridad verificable' : 'Prueba documental'
        }
    ];

    return `
    <section class="el-section vibe-${vibe || 'premium'} testimonials-section" data-proof-mode="documentary_trust">
        <div class="el-container">
            <div class="section-title testimonials-section__header">
                <h2>${h2 || 'Qué puedes comprobar antes de contratar'}</h2>
            </div>
            <div class="testimonials-grid">
                ${evidenceCards.map((card) => `
                    <article class="testimonial-card">
                        <div class="testimonial-card__stars" aria-hidden="true">${card.meta}</div>
                        <p class="testimonial-text">${card.body}</p>
                        <div class="testimonial-meta">
                            <div class="avatar">✓</div>
                            <div>
                                <div class="testimonial-name">${card.title}</div>
                                <div class="testimonial-date">${localNiche} en ${localCity}</div>
                            </div>
                        </div>
                    </article>
                `).join('')}
            </div>
            ${links.length ? `
                <div class="block__cta-group" style="margin-top:1.25rem;flex-wrap:wrap;">
                    ${links.map((link: any) => `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="cta-secondary">${link.label}</a>`).join('')}
                </div>
            ` : ''}
        </div>
    </section>`;
};

export const renderMap: RenderFn = (input) => {
    const { content, vibe, visualVariant, id } = input;
    const { h2, city, description, address } = content;
    const variant = visualVariant || 'full_width';
    const safeAddress = String(address || '').trim();
    const safeCity = String(city || '').trim();
    const mapQuery = encodeURIComponent(safeAddress || safeCity || 'España');

    const iframeHtml = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed" class="map-iframe"></iframe>`;

    const mapId = id || 'map';

    if (variant === 'boxed_with_text') {
        return `
        <section class="el-section vibe-${vibe || 'premium'}" id="${mapId}">
            <div class="el-container">
                <div class="map-grid">
                    <div class="map-info">
                        <h2>${h2 || `Presencia en ${safeCity || city}`}</h2>
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
                <h2>${h2 || `Nuestra ubicación en ${safeCity || city}`}</h2>
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
    const phoneHref = buildPhoneHref(phone);
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
                        <a href="${phoneHref}" class="cta-primary">Contactar con un Especialista</a>
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
