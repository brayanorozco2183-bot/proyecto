import { readFileSync } from 'node:fs';

let cachedProceduralGlobalStyles: string | null = null;

const PROCEDURAL_GLOBAL_STYLES_FALLBACK = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
    font-family: var(--font-body, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    background: var(--bg, #ffffff);
    color: var(--text, #0f172a);
    line-height: 1.68;
    overflow-x: hidden;
}
.el-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; width: 100%; }
.el-section, .block-section, .semantic-section { padding: var(--section-y, clamp(4rem, 8vw, 7rem)) 0; }
.service-card, .proof-card, .step-card, .faq-item, .trust-strip, .semantic-card {
    background: var(--surface, #ffffff);
    border: 1px solid var(--border, rgba(148, 163, 184, 0.16));
    border-radius: var(--radius-card, 1rem);
    box-shadow: var(--shadow-soft, 0 4px 20px rgba(15, 23, 42, 0.04));
    padding: var(--shell-padding, clamp(1.5rem, 3vw, 2.5rem));
}
.services-grid, .semantic-items, .trust-grid, .local-proof__grid, .process-steps__timeline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: clamp(1.1rem, 2vw, 1.7rem);
}
`;


const PROCEDURAL_CONVERSION_UX_PATCH = `
/* === Gravity Conversion UX Super Patch === */
:root {
  --cta-bg: linear-gradient(135deg, #0f766e, #064e49);
  --cta-shadow: 0 14px 34px rgba(var(--primary-rgb, 15, 118, 110), 0.22);
  --section-tight-y: clamp(2.7rem, 5vw, 4.5rem);
}

body { padding-bottom: 0; }

.site-header { position: sticky; top: 0; z-index: 50; }
.site-header__inner { min-height: 4rem; }
.nav__cta, .nav-mobile__cta { white-space: nowrap; }

.hero { padding-top: clamp(1.2rem, 3vw, 2.25rem); }
.hero--split .hero__shell,
.hero__shell {
  gap: clamp(1.5rem, 4vw, 4rem);
}
.hero__title,
.hero h1 {
  text-wrap: balance;
  max-width: 13.5ch;
}
.hero__subtitle {
  max-width: 62ch;
  font-size: clamp(1.02rem, 1.45vw, 1.22rem);
}
.hero__bullets {
  margin: 1.15rem 0 0;
  display: grid;
  gap: .7rem;
}
.hero__bullets li {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  color: var(--text);
  font-weight: 750;
  line-height: 1.35;
}
.hero__bullets li::before {
  content: "✓";
  display: inline-grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: rgba(var(--primary-rgb), .10);
  color: var(--primary);
  flex: 0 0 auto;
  margin-top: .05rem;
}
.hero-visual__frame {
  background: radial-gradient(circle at 80% 10%, rgba(var(--primary-rgb), .18), transparent 26%), linear-gradient(135deg, rgba(var(--primary-rgb), .95), var(--bg));
}
.hero-card--solid,
.hero-card--floating,
.hero-card--cta {
  border: 1px solid rgba(var(--primary-rgb), .14) !important;
  box-shadow: 0 18px 44px rgba(15,23,42,.10) !important;
}
.card__eyebrow,
.service-card__kicker,
.block__eyebrow {
  letter-spacing: .09em;
}

.cta-primary {
  min-height: 3.15rem;
  background: var(--cta-bg) !important;
  box-shadow: var(--cta-shadow) !important;
  letter-spacing: .01em;
}
.cta-primary:hover { transform: translateY(-2px); filter: saturate(1.08); }
.cta-secondary { font-weight: 850; }

.conversion-proof-strip {
  padding: clamp(1rem, 2.4vw, 1.65rem) 0 clamp(1.35rem, 3vw, 2.25rem);
}
.conversion-proof-strip__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap: .85rem;
}
.conversion-proof-item {
  display: grid;
  grid-template-columns: auto minmax(0,1fr);
  gap: .15rem .75rem;
  align-items: center;
  min-height: 5.7rem;
  padding: 1rem;
  border-radius: 1.15rem;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}
.conversion-proof-item__value {
  grid-row: span 2;
  display: inline-grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: .9rem;
  background: rgba(var(--primary-rgb), .09);
  color: var(--primary);
  font-weight: 950;
}
.services-kicker__tag {
  display: inline-flex;
  padding: .35rem .75rem;
  border-radius: .65rem;
  background: var(--surface-alt);
  color: var(--primary);
  font-weight: 900;
  border: 1px solid var(--border);
}
.conversion-proof-item__label {
  color: var(--text);
  font-weight: 900;
  line-height: 1.15;
}
.conversion-proof-item__text {
  color: var(--muted);
  font-size: .9rem;
  line-height: 1.35;
}

.el-section-wrapper { padding-block: clamp(1rem, 2.2vw, 1.8rem); }
.el-section, .block-section, .semantic-section { padding: var(--section-tight-y) 0; }
.block-section > .el-container,
.semantic-section__container,
.el-section.vibe-premium > .el-container {
  border-radius: clamp(1.15rem, 2vw, 1.55rem);
}
.block__header,
.section-title,
.testimonials-section__header {
  margin-bottom: clamp(1.1rem, 2.1vw, 1.8rem);
}
.block__header h2,
.section-title h2 {
  text-wrap: balance;
}
.services-grid__cards,
.semantic-items,
.trust-grid,
.local-proof__grid,
.process-steps__timeline,
.price-guidance__cards,
.testimonials-grid {
  gap: clamp(.95rem, 1.8vw, 1.35rem);
}

.service-card,
.proof-card,
.step-card,
.testimonial-card,
.price-card,
.faq-item-refined,
.faq-entry,
.trust-band__pill-card {
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}
.service-card-premium {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}
.service-card {
  display: grid;
  align-content: start;
  gap: .65rem;
  min-height: 100%;
}
.service-card__icon {
  display: inline-grid;
  place-items: center;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: .9rem;
  background: rgba(var(--primary-rgb), .085);
  border: 1px solid rgba(var(--primary-rgb), .11);
  font-size: 1.15rem;
  margin-bottom: .25rem;
}
.service-card h3,
.price-card h3,
.proof-card h3,
.step-card h3 {
  margin: 0;
  text-wrap: balance;
}
.service-card p,
.price-card p,
.proof-card p,
.step-card p {
  margin: 0;
}

.price-guidance__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(235px,1fr));
}
.price-card {
  position: relative;
  padding: clamp(1.1rem, 2vw, 1.45rem);
  border-radius: 1rem;
}
.price-card::before {
  content: "Transparente";
  display: inline-flex;
  width: fit-content;
  margin-bottom: .8rem;
  padding: .32rem .62rem;
  border-radius: 999px;
  background: rgba(var(--primary-rgb), .08);
  color: var(--primary);
  font-size: .72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.price-card__facts {
  margin-top: .85rem !important;
  display: grid;
  gap: .45rem;
  padding: 0 !important;
  list-style: none;
}
.price-card__facts li {
  padding: .45rem .6rem !important;
  border-radius: .65rem;
  background: rgba(15,23,42,.035);
  color: var(--text);
  font-size: .9rem;
}
.price-card__facts li::before,
.price-card__facts li::after { display: none !important; content: none !important; }

.faq-block__accordion { gap: .7rem; }
.faq-summary-refined { padding: 1rem 1.15rem; }
.faq-summary-refined__count {
  opacity: .55;
  font-weight: 900;
  margin-right: .6rem;
}
.faq-content-refined { line-height: 1.65; }

.testimonials-section { padding-top: var(--section-tight-y); }
.testimonials-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
.testimonial-card__stars {
  color: var(--primary);
  font-weight: 900;
  letter-spacing: .06em;
}
.testimonial-text { font-size: .96rem; }

.urgency-banner,
.cta-panel__banner,
.section-cta--terminal {
  background: radial-gradient(circle at top right, rgba(var(--primary-rgb), .13), transparent 28%), linear-gradient(135deg, #fff, #f8fafc);
}
.urgency-banner__title,
.cta-panel h2 {
  text-wrap: balance;
}

.mobile-sticky-cta {
  display: none;
}

@media (max-width: 900px) {
  .conversion-proof-strip__grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hero--split .hero__shell,
  .hero__shell,
  .flow-split,
  .flow-asymmetric,
  .map-grid,
  .map-block__split,
  .local-proof__evidence-layout,
  .services-grid__editorial,
  .cta-panel__banner,
  .urgency-banner {
    grid-template-columns: 1fr !important;
  }
  .hero__title, .hero h1 { max-width: 100%; }
  .testimonials-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  body { padding-bottom: 5.7rem; }
  .el-container { padding-inline: 1rem; }
  .site-header { top: .5rem; padding-inline: .65rem; }
  .site-header__inner { border-radius: 1.15rem; }
  .nav--desktop { display: none !important; }
  .nav-mobile { display: block !important; }
  .hero { padding-top: 1rem; }
  .hero__minimal,
  .hero__shell,
  .block-section > .el-container,
  .semantic-section__container {
    padding: 1.15rem !important;
    border-radius: 1.1rem !important;
  }
  .conversion-proof-strip__grid { grid-template-columns: 1fr; }
  .conversion-proof-item { min-height: auto; }
  .cta-row { width: 100%; }
  .cta-row .cta-primary,
  .block__cta-group .cta-primary,
  .card__btn { width: 100%; }
  .mobile-sticky-cta {
    position: fixed;
    left: .85rem;
    right: .85rem;
    bottom: .85rem;
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .85rem;
    padding: .72rem .72rem .72rem 1rem;
    border-radius: 1.2rem;
    background: rgba(15,23,42,.94);
    color: #fff;
    box-shadow: 0 18px 44px rgba(2,6,23,.32);
    backdrop-filter: blur(12px);
  }
  .mobile-sticky-cta__copy { display: grid; gap: .08rem; min-width: 0; }
  .mobile-sticky-cta__copy strong { font-size: .98rem; line-height: 1.1; }
  .mobile-sticky-cta__copy span { color: rgba(255,255,255,.72); font-size: .78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mobile-sticky-cta__button {
    display: inline-grid;
    place-items: center;
    width: 3.05rem;
    height: 3.05rem;
    border-radius: .95rem;
    text-decoration: none;
    background: #0f766e;
    color: white;
    font-size: 1.2rem;
    flex: 0 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
`;

export function getProceduralGlobalStyles(): string {
    if (cachedProceduralGlobalStyles !== null) {
        return cachedProceduralGlobalStyles;
    }

    try {
        cachedProceduralGlobalStyles = readFileSync(new URL('./procedural-global.css', import.meta.url), 'utf8');
    } catch (error) {
        console.warn('[ProceduralStyles] procedural-global.css not found; using minimal fallback CSS.', error);
        cachedProceduralGlobalStyles = PROCEDURAL_GLOBAL_STYLES_FALLBACK;
    }

    if (!cachedProceduralGlobalStyles.includes('Gravity Conversion UX Super Patch')) {
        cachedProceduralGlobalStyles = `${cachedProceduralGlobalStyles}\n${PROCEDURAL_CONVERSION_UX_PATCH}`;
    }

    return cachedProceduralGlobalStyles;
}
