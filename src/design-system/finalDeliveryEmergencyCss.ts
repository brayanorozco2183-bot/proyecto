export const FINAL_DELIVERY_EMERGENCY_CSS = `
/* === Gravity Final Delivery Emergency Lock v1 ===
   Last-mile layout hardening for delivery: nav, lists, cards, hero media and block grids.
   This stylesheet is intentionally appended last and scoped by body.gravity-final-delivery-lock. */
body.gravity-final-delivery-lock {
  --fd-bg: var(--bg, #f8fafc);
  --fd-surface: #ffffff;
  --fd-text: var(--text, #0f172a);
  --fd-muted: var(--muted, #64748b);
  --fd-primary: var(--primary, #0f766e);
  --fd-primary-rgb: var(--primary-rgb, 15,118,110);
  --fd-border: rgba(148,163,184,.18);
  --fd-shadow: 0 10px 28px rgba(15,23,42,.065);
  --fd-shadow-soft: 0 4px 16px rgba(15,23,42,.045);
  --fd-radius: clamp(1rem, 1.7vw, 1.35rem);
  --fd-radius-lg: clamp(1.25rem, 2.4vw, 2rem);
  background: linear-gradient(180deg, #fff 0%, var(--fd-bg) 48%, #fff 100%) !important;
  color: var(--fd-text) !important;
  overflow-x: clip !important;
}
body.gravity-final-delivery-lock *,
body.gravity-final-delivery-lock *::before,
body.gravity-final-delivery-lock *::after { box-sizing: border-box; }
body.gravity-final-delivery-lock img,
body.gravity-final-delivery-lock iframe,
body.gravity-final-delivery-lock svg,
body.gravity-final-delivery-lock video { max-width: 100%; }
body.gravity-final-delivery-lock .el-container { width: 100%; max-width: 1180px; margin-inline: auto; padding-inline: clamp(1rem, 3vw, 2rem); }

/* Header: never show desktop and mobile navigation at the same time. */
body.gravity-final-delivery-lock .site-header { position: sticky !important; top: 0 !important; z-index: 100 !important; padding: .65rem 0 !important; background: rgba(255,255,255,.96) !important; border-bottom: 1px solid rgba(148,163,184,.12) !important; box-shadow: 0 6px 22px rgba(15,23,42,.045) !important; }
body.gravity-final-delivery-lock .site-header__inner { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 1rem !important; min-height: 3.7rem !important; padding: .55rem .75rem !important; border-radius: 999px !important; background: #fff !important; border: 1px solid var(--fd-border) !important; box-shadow: var(--fd-shadow-soft) !important; }
body.gravity-final-delivery-lock .brand { display: inline-flex !important; align-items: center !important; min-width: 0 !important; max-width: 45% !important; color: var(--fd-text) !important; text-decoration: none !important; font-weight: 950 !important; letter-spacing: -.025em !important; }
body.gravity-final-delivery-lock .brand__name,
body.gravity-final-delivery-lock .site-header__brand-name { display: block !important; overflow: hidden !important; white-space: nowrap !important; text-overflow: ellipsis !important; }
body.gravity-final-delivery-lock .nav--desktop { display: flex !important; align-items: center !important; gap: .55rem !important; margin-left: auto !important; }
body.gravity-final-delivery-lock .nav-mobile { display: none !important; }
body.gravity-final-delivery-lock .nav__links-group { display: flex !important; align-items: center !important; gap: .25rem !important; flex-wrap: nowrap !important; }
body.gravity-final-delivery-lock .nav__link,
body.gravity-final-delivery-lock .nav-mobile__link { display: inline-flex !important; align-items: center !important; justify-content: center !important; min-height: 2.4rem !important; padding: .55rem .72rem !important; border-radius: 999px !important; color: var(--fd-text) !important; text-decoration: none !important; font-size: .9rem !important; font-weight: 850 !important; line-height: 1 !important; }
body.gravity-final-delivery-lock .nav__link:hover,
body.gravity-final-delivery-lock .nav__link.is-active { background: rgba(15,23,42,.055) !important; }
body.gravity-final-delivery-lock .nav__cta { white-space: nowrap !important; min-width: max-content !important; }
body.gravity-final-delivery-lock .nav-mobile__summary { cursor: pointer !important; list-style: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; min-height: 2.55rem !important; padding: 0 .95rem !important; border-radius: 999px !important; background: #fff !important; border: 1px solid var(--fd-border) !important; color: var(--fd-text) !important; font-weight: 950 !important; }
body.gravity-final-delivery-lock .nav-mobile__summary::-webkit-details-marker { display: none !important; }
body.gravity-final-delivery-lock .nav-mobile__panel { position: absolute !important; right: 1rem !important; top: calc(100% + .35rem) !important; width: min(22rem, calc(100vw - 2rem)) !important; padding: .9rem !important; border-radius: 1rem !important; background: #fff !important; border: 1px solid var(--fd-border) !important; box-shadow: var(--fd-shadow) !important; z-index: 120 !important; }
body.gravity-final-delivery-lock .nav-mobile__links { display: grid !important; gap: .25rem !important; }

/* Hero: fixed two-column desktop, clean one-column mobile, image fallback always present. */
body.gravity-final-delivery-lock .hero { padding-top: clamp(1.2rem, 2.8vw, 2.2rem) !important; }
body.gravity-final-delivery-lock .hero__minimal,
body.gravity-final-delivery-lock .hero__shell,
body.gravity-final-delivery-lock .hero__centered--with-media { display: grid !important; grid-template-columns: minmax(0, .98fr) minmax(300px, .72fr) !important; align-items: center !important; gap: clamp(1.25rem, 3.4vw, 3rem) !important; max-width: 1180px !important; margin-inline: auto !important; padding: clamp(1.25rem, 3vw, 2.6rem) !important; border-radius: var(--fd-radius-lg) !important; background: radial-gradient(circle at 100% 0, rgba(var(--fd-primary-rgb), .10), transparent 34%), #fff !important; border: 1px solid var(--fd-border) !important; box-shadow: var(--fd-shadow) !important; color: var(--fd-text) !important; overflow: hidden !important; }
body.gravity-final-delivery-lock .hero h1 { color: var(--fd-text) !important; max-width: 15ch !important; margin: 0 0 1rem !important; font-size: clamp(2.15rem, 4.9vw, 4.45rem) !important; line-height: .98 !important; letter-spacing: -.055em !important; }
body.gravity-final-delivery-lock .hero__subtitle { max-width: 62ch !important; color: var(--fd-muted) !important; font-size: clamp(1.03rem, 1.45vw, 1.2rem) !important; }
body.gravity-final-delivery-lock .hero__eyebrow,
body.gravity-final-delivery-lock .block__eyebrow { display: inline-flex !important; align-items: center !important; width: max-content !important; max-width: 100% !important; min-height: 2rem !important; margin: 0 0 .85rem !important; padding: .38rem .72rem !important; border-radius: 999px !important; background: rgba(var(--fd-primary-rgb), .08) !important; border: 1px solid rgba(var(--fd-primary-rgb), .14) !important; color: var(--fd-primary) !important; font-size: .74rem !important; font-weight: 950 !important; letter-spacing: .08em !important; text-transform: uppercase !important; }
body.gravity-final-delivery-lock .hero-visual { margin: 0 !important; min-width: 0 !important; }
body.gravity-final-delivery-lock .hero-visual__frame { position: relative !important; display: block !important; min-height: clamp(280px, 34vw, 430px) !important; border-radius: var(--fd-radius-lg) !important; overflow: hidden !important; background: radial-gradient(circle at 72% 22%, rgba(255,255,255,.28), transparent 28%), linear-gradient(135deg, #0f172a, var(--fd-primary)) !important; border: 1px solid rgba(255,255,255,.78) !important; box-shadow: var(--fd-shadow) !important; }
body.gravity-final-delivery-lock .hero-visual__frame::after { content: ""; position: absolute; inset: 12%; border-radius: inherit; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.16), transparent 58%); pointer-events: none; }
body.gravity-final-delivery-lock .hero-visual__frame img { position: relative !important; z-index: 1 !important; display: block !important; width: 100% !important; height: 100% !important; min-height: inherit !important; object-fit: cover !important; }
body.gravity-final-delivery-lock .hero-visual__frame[data-image-missing="true"] img,
body.gravity-final-delivery-lock .hero-visual__frame img[src=""],
body.gravity-final-delivery-lock .hero-visual__frame img:not([src]) { display: none !important; }

/* Sections and blocks: flatten broken wrappers and enforce stable grids. */
body.gravity-final-delivery-lock .el-section-wrapper:empty { display: none !important; }
body.gravity-final-delivery-lock .el-section-wrapper { padding-block: 0 !important; background: transparent !important; }
body.gravity-final-delivery-lock .block-section,
body.gravity-final-delivery-lock .semantic-section,
body.gravity-final-delivery-lock .el-section { padding: clamp(2.6rem, 4.8vw, 4.8rem) 0 !important; }
body.gravity-final-delivery-lock .block-section__inner,
body.gravity-final-delivery-lock .section-shell,
body.gravity-final-delivery-lock .semantic-section__container { min-width: 0 !important; }
body.gravity-final-delivery-lock .shell-panel,
body.gravity-final-delivery-lock .shell-comparison,
body.gravity-final-delivery-lock .cta-panel__bar,
body.gravity-final-delivery-lock .urgency-banner,
body.gravity-final-delivery-lock .section-cta--terminal { background: #fff !important; border: 1px solid var(--fd-border) !important; border-radius: var(--fd-radius-lg) !important; box-shadow: var(--fd-shadow-soft) !important; }
body.gravity-final-delivery-lock .block__header { display: flex !important; flex-direction: column !important; align-items: flex-start !important; text-align: left !important; gap: .35rem !important; max-width: 820px !important; margin-bottom: clamp(1.15rem, 2.4vw, 1.9rem) !important; }
body.gravity-final-delivery-lock .block__title { max-width: 18ch !important; margin: 0 !important; color: var(--fd-text) !important; font-size: clamp(1.65rem, 3vw, 2.55rem) !important; line-height: 1.08 !important; letter-spacing: -.04em !important; }
body.gravity-final-delivery-lock .block__subtitle,
body.gravity-final-delivery-lock .block__header p { max-width: 68ch !important; color: var(--fd-muted) !important; }
body.gravity-final-delivery-lock .services-grid__cards,
body.gravity-final-delivery-lock .semantic-items,
body.gravity-final-delivery-lock .trust-grid,
body.gravity-final-delivery-lock .local-proof__grid,
body.gravity-final-delivery-lock .local-proof__signal-list,
body.gravity-final-delivery-lock .trust-band__signal-grid,
body.gravity-final-delivery-lock .trust-band__pills,
body.gravity-final-delivery-lock .trust-band__pills--cards,
body.gravity-final-delivery-lock .process-steps__grid,
body.gravity-final-delivery-lock .process-steps__timeline,
body.gravity-final-delivery-lock .price-guidance__cards,
body.gravity-final-delivery-lock .testimonials-grid,
body.gravity-final-delivery-lock .internal-links-grid,
body.gravity-final-delivery-lock .conversion-proof-strip__grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)) !important; gap: clamp(.85rem, 1.7vw, 1.25rem) !important; align-items: stretch !important; }
body.gravity-final-delivery-lock .services-grid__magazine,
body.gravity-final-delivery-lock .local-proof__coverage,
body.gravity-final-delivery-lock .process-steps__rail-layout,
body.gravity-final-delivery-lock .price-guidance__insight,
body.gravity-final-delivery-lock .cta-panel__consult,
body.gravity-final-delivery-lock .map-block__context { display: grid !important; grid-template-columns: minmax(0, .94fr) minmax(0, 1.06fr) !important; gap: clamp(1rem, 2.7vw, 2.2rem) !important; align-items: start !important; }
body.gravity-final-delivery-lock .service-card,
body.gravity-final-delivery-lock .proof-card,
body.gravity-final-delivery-lock .step-card,
body.gravity-final-delivery-lock .price-card,
body.gravity-final-delivery-lock .faq-item,
body.gravity-final-delivery-lock .faq-entry,
body.gravity-final-delivery-lock .faq-item-refined,
body.gravity-final-delivery-lock .testimonial-card,
body.gravity-final-delivery-lock .semantic-card,
body.gravity-final-delivery-lock .trust-band__signal-card,
body.gravity-final-delivery-lock .trust-band__pill-card,
body.gravity-final-delivery-lock .conversion-proof-item,
body.gravity-final-delivery-lock .internal-links-item,
body.gravity-final-delivery-lock .services-grid__magazine-feature,
body.gravity-final-delivery-lock .process-step-rail__body,
body.gravity-final-delivery-lock .map-block__support { min-width: 0 !important; background: #fff !important; border: 1px solid var(--fd-border) !important; border-radius: var(--fd-radius) !important; box-shadow: var(--fd-shadow-soft) !important; padding: clamp(1.05rem, 1.9vw, 1.45rem) !important; }
body.gravity-final-delivery-lock .process-step-rail,
body.gravity-final-delivery-lock .local-proof__signal,
body.gravity-final-delivery-lock .trust-band__signal-card,
body.gravity-final-delivery-lock .proof-row--stacked { display: grid !important; grid-template-columns: auto minmax(0, 1fr) !important; gap: .85rem !important; align-items: start !important; }
body.gravity-final-delivery-lock .process-steps__rail { display: grid !important; gap: .9rem !important; padding-left: 0 !important; }
body.gravity-final-delivery-lock .process-steps__rail::before { display: none !important; }

/* Lists and chips: no browser bullets, no naked lists. */
body.gravity-final-delivery-lock ul,
body.gravity-final-delivery-lock ol { max-width: 100%; }
body.gravity-final-delivery-lock .service-card__meta,
body.gravity-final-delivery-lock .step-card__meta,
body.gravity-final-delivery-lock .step-row__meta,
body.gravity-final-delivery-lock .proof-row__meta,
body.gravity-final-delivery-lock .price-card__facts,
body.gravity-final-delivery-lock .services-grid__trust,
body.gravity-final-delivery-lock .urgency-banner__pills,
body.gravity-final-delivery-lock .block__pills,
body.gravity-final-delivery-lock .price-guidance__bullets,
body.gravity-final-delivery-lock .process-steps__bullets,
body.gravity-final-delivery-lock .cta-panel__bullets { display: flex !important; flex-wrap: wrap !important; gap: .45rem !important; list-style: none !important; margin: .85rem 0 0 !important; padding: 0 !important; }
body.gravity-final-delivery-lock .service-card__meta li,
body.gravity-final-delivery-lock .step-card__meta li,
body.gravity-final-delivery-lock .step-row__meta li,
body.gravity-final-delivery-lock .proof-row__meta li,
body.gravity-final-delivery-lock .price-card__facts li,
body.gravity-final-delivery-lock .services-grid__trust li,
body.gravity-final-delivery-lock .price-guidance__bullets li,
body.gravity-final-delivery-lock .process-steps__bullets li,
body.gravity-final-delivery-lock .cta-panel__bullets li,
body.gravity-final-delivery-lock .block__pill { display: inline-flex !important; align-items: center !important; min-height: 1.95rem !important; padding: .38rem .6rem !important; border-radius: 999px !important; background: rgba(var(--fd-primary-rgb), .06) !important; border: 1px solid rgba(var(--fd-primary-rgb), .12) !important; color: var(--fd-primary) !important; font-size: .81rem !important; font-weight: 850 !important; line-height: 1.15 !important; }
body.gravity-final-delivery-lock .footer__nav-list { list-style: none !important; padding: 0 !important; margin: 0 !important; display: grid !important; gap: .45rem !important; }
body.gravity-final-delivery-lock .block-section ul:not([class]),
body.gravity-final-delivery-lock .semantic-section ul:not([class]),
body.gravity-final-delivery-lock .el-section ul:not([class]) { list-style: none !important; padding: 0 !important; margin: 1rem 0 0 !important; display: grid !important; gap: .55rem !important; }
body.gravity-final-delivery-lock .block-section ul:not([class]) > li,
body.gravity-final-delivery-lock .semantic-section ul:not([class]) > li,
body.gravity-final-delivery-lock .el-section ul:not([class]) > li { padding: .75rem .85rem !important; border-radius: .9rem !important; background: rgba(15,23,42,.035) !important; border: 1px solid rgba(148,163,184,.13) !important; color: var(--fd-muted) !important; }
body.gravity-final-delivery-lock ul:empty,
body.gravity-final-delivery-lock ol:empty,
body.gravity-final-delivery-lock p:empty,
body.gravity-final-delivery-lock h2:empty,
body.gravity-final-delivery-lock h3:empty,
body.gravity-final-delivery-lock .el-section-wrapper:empty { display: none !important; }

/* CTA and special blocks. */
body.gravity-final-delivery-lock .cta-primary,
body.gravity-final-delivery-lock .nav__cta,
body.gravity-final-delivery-lock .nav-mobile__cta,
body.gravity-final-delivery-lock .card__btn,
body.gravity-final-delivery-lock .internal-links-item__anchor { display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: .45rem !important; min-height: 3rem !important; padding: .75rem 1.05rem !important; border-radius: 999px !important; background: linear-gradient(135deg, var(--fd-primary), color-mix(in srgb, var(--fd-primary), #000 18%)) !important; color: #fff !important; border: 1px solid rgba(255,255,255,.16) !important; text-decoration: none !important; font-weight: 950 !important; box-shadow: 0 10px 22px rgba(var(--fd-primary-rgb), .17) !important; }
body.gravity-final-delivery-lock .block__cta-group { display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: .7rem !important; margin-top: 1rem !important; }
body.gravity-final-delivery-lock .block__cta-note,
body.gravity-final-delivery-lock .block__cta-phone { display: inline-flex !important; align-items: center !important; min-height: 2.55rem !important; max-width: 36rem !important; padding: .65rem .85rem !important; border-radius: 999px !important; background: rgba(15,23,42,.035) !important; border: 1px solid var(--fd-border) !important; color: var(--fd-muted) !important; font-size: .88rem !important; font-weight: 650 !important; line-height: 1.25 !important; }
body.gravity-final-delivery-lock .cta-panel__bar { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; gap: 1rem !important; align-items: center !important; padding: clamp(1.15rem, 2.4vw, 1.8rem) !important; }
body.gravity-final-delivery-lock .urgency-banner { display: grid !important; grid-template-columns: minmax(0,1fr) minmax(120px,.24fr) minmax(190px,.36fr) !important; gap: 1rem !important; align-items: center !important; padding: clamp(1.15rem, 2.4vw, 1.8rem) !important; }
body.gravity-final-delivery-lock .urgency-banner__cta { justify-self: end !important; width: 100% !important; max-width: 250px !important; }
body.gravity-final-delivery-lock .urgency-banner__statbox { min-width: 8rem !important; min-height: 6.8rem !important; }
body.gravity-final-delivery-lock .faq-block__accordion,
body.gravity-final-delivery-lock .faq-block__accordion--refined { display: grid !important; gap: .75rem !important; max-width: 940px !important; }
body.gravity-final-delivery-lock .faq-summary-refined { display: grid !important; grid-template-columns: auto minmax(0,1fr) auto !important; align-items: center !important; gap: .75rem !important; padding: 1rem 1.05rem !important; cursor: pointer !important; list-style: none !important; }
body.gravity-final-delivery-lock .faq-summary-refined::-webkit-details-marker { display: none !important; }
body.gravity-final-delivery-lock .faq-summary-refined::after { content: "+"; color: var(--fd-primary); font-weight: 950; }
body.gravity-final-delivery-lock details[open] > .faq-summary-refined::after { content: "–"; }
body.gravity-final-delivery-lock .faq-content-refined { padding: 0 1.05rem 1.05rem 4rem !important; color: var(--fd-muted) !important; }
body.gravity-final-delivery-lock .map-block__frame,
body.gravity-final-delivery-lock .map-wrapper,
body.gravity-final-delivery-lock .map-boxed-wrapper,
body.gravity-final-delivery-lock .map-directory__visual { position: relative !important; min-height: clamp(300px, 40vw, 430px) !important; border-radius: var(--fd-radius) !important; background: linear-gradient(135deg, #dbe4ee, #f8fafc) !important; border: 1px solid var(--fd-border) !important; box-shadow: var(--fd-shadow-soft) !important; overflow: hidden !important; }
body.gravity-final-delivery-lock .map-block__iframe,
body.gravity-final-delivery-lock .map-iframe,
body.gravity-final-delivery-lock iframe.map-iframe { display: block !important; width: 100% !important; height: 100% !important; min-height: inherit !important; border: 0 !important; }
body.gravity-final-delivery-lock .footer-editorial { padding: clamp(2rem, 4vw, 3.4rem) 0 !important; }
body.gravity-final-delivery-lock .footer__grid-refined,
body.gravity-final-delivery-lock .footer__links-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)) !important; gap: 1.25rem !important; }

@media (max-width: 920px) {
  body.gravity-final-delivery-lock .nav__links-group { display: none !important; }
  body.gravity-final-delivery-lock .brand { max-width: 58% !important; }
  body.gravity-final-delivery-lock .hero__minimal,
  body.gravity-final-delivery-lock .hero__shell,
  body.gravity-final-delivery-lock .hero__centered--with-media,
  body.gravity-final-delivery-lock .services-grid__magazine,
  body.gravity-final-delivery-lock .local-proof__coverage,
  body.gravity-final-delivery-lock .process-steps__rail-layout,
  body.gravity-final-delivery-lock .price-guidance__insight,
  body.gravity-final-delivery-lock .cta-panel__consult,
  body.gravity-final-delivery-lock .map-block__context,
  body.gravity-final-delivery-lock .urgency-banner,
  body.gravity-final-delivery-lock .cta-panel__bar { grid-template-columns: minmax(0,1fr) !important; }
  body.gravity-final-delivery-lock .urgency-banner__cta { justify-self: stretch !important; max-width: none !important; }
}
@media (max-width: 760px) {
  body.gravity-final-delivery-lock .nav--desktop { display: none !important; }
  body.gravity-final-delivery-lock .nav-mobile { display: block !important; margin-left: auto !important; }
  body.gravity-final-delivery-lock .brand { max-width: calc(100% - 6.5rem) !important; }
}
@media (max-width: 640px) {
  body.gravity-final-delivery-lock .el-container { padding-inline: 1rem !important; }
  body.gravity-final-delivery-lock .site-header { padding: .5rem 0 !important; }
  body.gravity-final-delivery-lock .site-header__inner { border-radius: 1rem !important; }
  body.gravity-final-delivery-lock .hero__minimal,
  body.gravity-final-delivery-lock .hero__shell { padding: 1.1rem !important; border-radius: 1.15rem !important; }
  body.gravity-final-delivery-lock .hero-visual__frame { min-height: 240px !important; }
  body.gravity-final-delivery-lock .process-step-rail,
  body.gravity-final-delivery-lock .local-proof__signal,
  body.gravity-final-delivery-lock .trust-band__signal-card,
  body.gravity-final-delivery-lock .proof-row--stacked { grid-template-columns: minmax(0,1fr) !important; }
  body.gravity-final-delivery-lock .block__cta-group,
  body.gravity-final-delivery-lock .map-block__overlay { align-items: stretch !important; flex-direction: column !important; }
  body.gravity-final-delivery-lock .cta-primary,
  body.gravity-final-delivery-lock .card__btn,
  body.gravity-final-delivery-lock .internal-links-item__anchor,
  body.gravity-final-delivery-lock .block__cta-note,
  body.gravity-final-delivery-lock .block__cta-phone { width: 100% !important; max-width: 100% !important; }
  body.gravity-final-delivery-lock .faq-content-refined { padding-left: 1.05rem !important; }
}
`;
