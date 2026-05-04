export const DETERMINISTIC_PREMIUM_CSS = `
/* === Gravity Deterministic AI Kernel: Premium Stable Surface v1 === */
:root {
  --gdk-bg: var(--bg, #f8fafc);
  --gdk-surface: #ffffff;
  --gdk-ink: var(--text-on-surface, #0f172a);
  --gdk-muted: var(--muted, #475569);
  --gdk-primary: var(--primary, #0f766e);
  --gdk-primary-rgb: var(--primary-rgb, 15, 118, 110);
  --gdk-border: rgba(148, 163, 184, .18);
  --gdk-shadow: 0 14px 34px rgba(15, 23, 42, .065);
  --gdk-shadow-strong: 0 24px 60px rgba(15, 23, 42, .10);
  --gdk-radius: clamp(1.15rem, 2vw, 1.65rem);
  --gdk-radius-lg: clamp(1.4rem, 2.7vw, 2.35rem);
  --gdk-section-y: clamp(3.1rem, 5.2vw, 5.4rem);
}

body.page-surface-tinted,
body.system-panelled,
body.family-local_trust {
  background:
    radial-gradient(circle at 14% 4%, rgba(var(--gdk-primary-rgb), .075), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, var(--gdk-bg) 48%, #ffffff 100%) !important;
}

.site-header { background: rgba(255,255,255,.94) !important; border-bottom: 1px solid rgba(148,163,184,.12); }
.site-header__inner { min-height: 4.4rem; gap: 1rem; }
.brand__name, .site-header__brand-name { font-size: 1rem; font-weight: 950; letter-spacing: -.025em; color: var(--gdk-ink); }
.nav__link, .nav-mobile__link { font-size: .92rem; }

.hero__minimal,
.hero__shell,
.hero--split .hero__shell,
.hero__centered--with-media {
  display: grid !important;
  grid-template-columns: minmax(0, 1.02fr) minmax(320px, .82fr) !important;
  align-items: center !important;
  gap: clamp(1.5rem, 4vw, 3.4rem) !important;
  max-width: 1180px !important;
  margin-inline: auto !important;
  padding: clamp(1.7rem, 4vw, 3.6rem) !important;
  border-radius: var(--gdk-radius-lg) !important;
  background:
    radial-gradient(circle at 95% 8%, rgba(var(--gdk-primary-rgb), .10), transparent 30%),
    linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,250,252,.96)) !important;
  border: 1px solid rgba(148, 163, 184, .16) !important;
  box-shadow: var(--gdk-shadow-strong) !important;
  overflow: hidden;
}

.hero__minimal > .hero__eyebrow,
.hero__minimal > h1,
.hero__minimal > .hero__subtitle,
.hero__minimal > .cta-row,
.hero__minimal > .hero__bullets,
.hero__minimal > .hero-highlight,
.hero__shell > .hero__content { grid-column: 1; }
.hero__minimal > .hero-visual,
.hero__shell > .hero__media,
.hero__shell > .hero-visual { grid-column: 2; grid-row: 1 / span 7; margin: 0 !important; }

.hero h1, .hero__title {
  max-width: 14.5ch !important;
  margin-bottom: 1rem !important;
  font-size: clamp(2.35rem, 5.1vw, 4.7rem) !important;
  line-height: .98 !important;
  letter-spacing: -.055em !important;
  color: var(--gdk-ink) !important;
}
.hero__subtitle { color: var(--gdk-muted) !important; font-size: clamp(1.04rem, 1.5vw, 1.22rem) !important; max-width: 62ch !important; }
.hero__eyebrow, .block__eyebrow, .card__eyebrow {
  display: inline-flex; width: max-content; max-width: 100%; align-items:center;
  min-height: 2.1rem; padding: .42rem .78rem; border-radius: 999px;
  background: rgba(var(--gdk-primary-rgb), .08); border: 1px solid rgba(var(--gdk-primary-rgb), .14);
  color: var(--gdk-primary); font-weight: 900; font-size: .76rem; letter-spacing: .09em; text-transform: uppercase;
}

.hero-visual__frame {
  min-height: clamp(320px, 34vw, 480px) !important;
  border-radius: clamp(1.2rem, 2.4vw, 2rem) !important;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(15,23,42,.88), rgba(var(--gdk-primary-rgb),.90)),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,.22), transparent 32%) !important;
  border: 1px solid rgba(255,255,255,.75) !important;
  box-shadow: var(--gdk-shadow-strong) !important;
}
.hero-visual__frame img[data-image-warning*="resolution-low"],
.hero-visual__frame img[data-image-width-real="640"] { opacity: 0 !important; }
.hero-visual__frame:has(img[data-image-warning*="resolution-low"]),
.hero-visual__frame:has(img[data-image-width-real="640"]) {
  background:
    radial-gradient(circle at 82% 18%, rgba(255,255,255,.20), transparent 26%),
    linear-gradient(135deg, #0f172a, var(--gdk-primary)) !important;
}

.el-section-wrapper { padding-block: .45rem !important; }
.el-section, .block-section, .semantic-section { padding: var(--gdk-section-y) 0 !important; }
.block-section > .el-container, .semantic-section__container, .el-section.vibe-premium > .el-container {
  border-radius: var(--gdk-radius-lg) !important;
}
.block-section__inner, .section-shell { min-width: 0; }
.shell-panel, .shell-comparison, .block-section > .el-container > .block-section__inner.section-shell {
  background: rgba(255,255,255,.88) !important;
  border: 1px solid rgba(148, 163, 184, .13) !important;
  box-shadow: var(--gdk-shadow) !important;
}

.block__header { margin-bottom: clamp(1.25rem, 2.4vw, 2rem) !important; }
.block__title { margin-bottom: .55rem !important; max-width: 16ch; }
.block__header p, .block__subtitle { max-width: 68ch; color: var(--gdk-muted); }

.service-card, .proof-card, .step-card, .price-card, .faq-item, .faq-entry, .faq-item-refined,
.testimonial-card, .semantic-card, .trust-band__signal-card, .conversion-proof-item, .internal-links-item,
.services-grid__magazine-feature, .process-step-rail__body, .map-block__support {
  background: var(--gdk-surface) !important;
  border: 1px solid var(--gdk-border) !important;
  border-radius: var(--gdk-radius) !important;
  box-shadow: var(--gdk-shadow) !important;
  padding: clamp(1.1rem, 2.1vw, 1.55rem) !important;
  min-width: 0;
}

.services-grid__cards, .semantic-items, .local-proof__grid, .trust-band__signal-grid,
.price-guidance__cards, .testimonials-grid, .internal-links-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr)) !important;
  gap: clamp(.9rem, 1.7vw, 1.25rem) !important;
  align-items: stretch !important;
}
.services-grid__magazine, .process-steps__rail-layout, .local-proof__coverage,
.price-guidance__insight, .cta-panel__consult, .map-block__context {
  display: grid !important;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr) !important;
  gap: clamp(1.2rem, 3vw, 2.25rem) !important;
  align-items: start !important;
}

.urgency-banner, .cta-panel__banner, .section-cta--terminal {
  border-radius: var(--gdk-radius-lg) !important;
  border: 1px solid rgba(var(--gdk-primary-rgb), .16) !important;
  background:
    radial-gradient(circle at 100% 0%, rgba(var(--gdk-primary-rgb), .12), transparent 30%),
    #ffffff !important;
  box-shadow: var(--gdk-shadow) !important;
}
.urgency-banner { display: grid !important; grid-template-columns: minmax(0,1fr) auto auto !important; gap: 1rem !important; align-items: center !important; }
.urgency-banner__statbox { min-width: 8.5rem; }
.block__cta-group { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; }
.cta-primary, .card__btn, .internal-links-item__anchor, .cta-link {
  border-radius: 999px !important;
  text-decoration: none !important;
  font-weight: 900 !important;
}

.process-step-rail { display:grid !important; grid-template-columns:auto minmax(0,1fr) !important; gap:.9rem !important; padding: 0 !important; }
.process-steps__rail { display:grid !important; gap:1rem !important; padding-left:0 !important; }
.process-steps__rail::before { display:none !important; }
.process-step-rail__index, .step-card__index, .local-proof__signal-index, .trust-band__signal-index, .proof-row__ordinal {
  width: 2.65rem !important; height: 2.65rem !important; flex: 0 0 auto;
}

.faq-block__accordion, .faq-block__accordion--refined { display:grid !important; gap:.8rem !important; }
.faq-item-refined { overflow:hidden; }
.faq-summary-refined { min-height:3.25rem; }

.map-block__frame, .map-block__frame--boxed, .map-block__frame--context,
.map-wrapper, .map-boxed-wrapper, .map-directory__visual {
  min-height: clamp(320px, 42vw, 450px) !important;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc) !important;
}
.map-block__overlay { align-items: center !important; }

ul:empty, ol:empty, .service-card__meta:empty, .step-row__meta:empty, .proof-row__meta:empty, .price-card__facts:empty { display:none !important; }
p:empty, li:empty, h2:empty, h3:empty { display:none !important; }

@media (max-width: 900px) {
  .hero__minimal, .hero__shell, .hero--split .hero__shell, .hero__centered--with-media,
  .services-grid__magazine, .process-steps__rail-layout, .local-proof__coverage,
  .price-guidance__insight, .cta-panel__consult, .map-block__context, .urgency-banner {
    grid-template-columns: minmax(0,1fr) !important;
  }
  .hero__minimal > .hero-visual, .hero__shell > .hero__media, .hero__shell > .hero-visual {
    grid-column: auto !important; grid-row: auto !important;
  }
  .hero h1, .hero__title { max-width: 100% !important; }
  .urgency-banner__cta { justify-self: stretch !important; }
}
@media (max-width: 640px) {
  .el-container { padding-inline: 1rem !important; }
  .hero__minimal, .hero__shell { padding: 1.15rem !important; border-radius: 1.25rem !important; }
  .hero-visual__frame { min-height: 260px !important; }
  .cta-primary, .card__btn, .cta-link { width: 100% !important; }
  .process-step-rail, .local-proof__signal, .trust-band__signal-card, .proof-row--stacked { grid-template-columns: minmax(0,1fr) !important; }
}
`;
