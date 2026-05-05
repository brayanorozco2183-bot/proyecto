export const GLOBAL_PROJECT_POLISH_CSS = `
/* === Gravity Global Project Polish v1 ===
   Final visible-quality layer. It is intentionally broad and late in the cascade:
   it makes every generated page look coherent even when upstream blocks vary. */
:root{
  --ggp-bg: var(--bg,#f6f8fb);
  --ggp-surface: #ffffff;
  --ggp-text: var(--text,#0f172a);
  --ggp-muted: var(--muted,#64748b);
  --ggp-primary: var(--primary,#0f766e);
  --ggp-primary-rgb: var(--primary-rgb,15,118,110);
  --ggp-border: rgba(148,163,184,.18);
  --ggp-border-strong: rgba(148,163,184,.28);
  --ggp-shadow: 0 16px 44px rgba(15,23,42,.075);
  --ggp-shadow-soft: 0 7px 22px rgba(15,23,42,.052);
  --ggp-radius: clamp(1.05rem,2vw,1.55rem);
  --ggp-radius-lg: clamp(1.35rem,2.6vw,2.15rem);
  --ggp-section-y: clamp(3.1rem,5.4vw,5.6rem);
  --ggp-card-pad: clamp(1.12rem,2vw,1.55rem);
}

html,body{max-width:100%;overflow-x:clip;}
body.gravity-global-polish{
  background:
    radial-gradient(circle at 12% 0%,rgba(var(--ggp-primary-rgb),.055),transparent 28%),
    linear-gradient(180deg,#fff 0%,var(--ggp-bg) 44%,#fff 100%) !important;
  color:var(--ggp-text)!important;
  line-height:1.68;
  text-rendering:optimizeLegibility;
}
body.gravity-global-polish *,body.gravity-global-polish *::before,body.gravity-global-polish *::after{box-sizing:border-box;}
body.gravity-global-polish img,body.gravity-global-polish iframe,body.gravity-global-polish svg,body.gravity-global-polish video{max-width:100%;}
body.gravity-global-polish .el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem);}
body.gravity-global-polish a{text-decoration:none;}

/* Header / nav */
body.gravity-global-polish .site-header{position:sticky!important;top:0;z-index:100;padding:.62rem 0;background:rgba(255,255,255,.965)!important;border-bottom:1px solid rgba(148,163,184,.12);box-shadow:0 8px 22px rgba(15,23,42,.045);}
body.gravity-global-polish .site-header__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem;min-height:3.65rem;padding:.5rem .72rem;border-radius:999px;background:#fff;border:1px solid rgba(148,163,184,.15);box-shadow:var(--ggp-shadow-soft);}
body.gravity-global-polish .brand,body.gravity-global-polish .brand__name,body.gravity-global-polish .site-header__brand-name{font-weight:950;letter-spacing:-.025em;color:var(--ggp-text)!important;white-space:nowrap;}
body.gravity-global-polish .nav__links-group,body.gravity-global-polish .nav-mobile__links{display:flex;align-items:center;gap:.25rem;flex-wrap:wrap;}
body.gravity-global-polish .nav__link,body.gravity-global-polish .nav-mobile__link{display:inline-flex;align-items:center;min-height:2.42rem;padding:.54rem .78rem;border-radius:999px;color:var(--ggp-text)!important;font-weight:850;font-size:.91rem;}
body.gravity-global-polish .nav__link:hover,body.gravity-global-polish .nav__link.is-active{background:rgba(15,23,42,.055);}
body.gravity-global-polish .nav-mobile__summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;min-height:2.54rem;padding:0 .9rem;border-radius:999px;background:#fff;border:1px solid var(--ggp-border);font-weight:900;}
body.gravity-global-polish .nav-mobile__summary::-webkit-details-marker{display:none;}
body.gravity-global-polish .nav-mobile__panel{position:absolute;right:1rem;margin-top:.75rem;width:min(22rem,calc(100vw - 2rem));padding:.9rem;border-radius:1.15rem;background:#fff;border:1px solid var(--ggp-border);box-shadow:var(--ggp-shadow);z-index:120;}
@media(min-width:761px){body.gravity-global-polish .nav--desktop{display:flex!important;align-items:center!important;gap:.55rem!important;}body.gravity-global-polish .nav-mobile{display:none!important;}body.gravity-global-polish .nav-mobile__panel{display:none!important;}}
@media(max-width:760px){body.gravity-global-polish .nav--desktop{display:none!important;}body.gravity-global-polish .nav-mobile{display:block!important;margin-left:auto;}body.gravity-global-polish .nav-mobile:not([open]) .nav-mobile__panel{display:none!important;}body.gravity-global-polish .nav-mobile[open] .nav-mobile__panel{display:grid!important;}}

/* Breadcrumbs */
body.gravity-global-polish .el-breadcrumbs{padding:clamp(.75rem,2vw,1.05rem) 0 .2rem!important;background:transparent!important;border:0!important;font-size:.86rem;}
body.gravity-global-polish .el-breadcrumbs__list{display:flex!important;align-items:center;gap:.45rem;flex-wrap:wrap;width:max-content;max-width:100%;list-style:none;margin:0;padding:.68rem .9rem;border-radius:999px;background:rgba(255,255,255,.92)!important;border:1px solid var(--ggp-border)!important;box-shadow:0 8px 20px rgba(15,23,42,.045);color:var(--ggp-muted)!important;}
body.gravity-global-polish .el-breadcrumbs__item{display:inline-flex;align-items:center;gap:.45rem;min-width:0;}
body.gravity-global-polish .el-breadcrumbs__item:not(:last-child)::after{content:'›';color:rgba(100,116,139,.75);font-weight:900;}
body.gravity-global-polish .el-breadcrumbs__text{color:var(--ggp-text)!important;font-weight:800;white-space:nowrap;}
body.gravity-global-polish .el-breadcrumbs__item:last-child .el-breadcrumbs__text{max-width:min(46vw,32rem);overflow:hidden;text-overflow:ellipsis;color:var(--ggp-muted)!important;font-weight:750;}

/* Sections / type */
body.gravity-global-polish .el-section-wrapper{padding-block:0!important;background:transparent!important;}
body.gravity-global-polish .block-section,body.gravity-global-polish .semantic-section,body.gravity-global-polish .el-section{padding:var(--ggp-section-y) 0!important;}
body.gravity-global-polish h1,body.gravity-global-polish h2,body.gravity-global-polish h3{color:var(--ggp-text)!important;letter-spacing:-.038em;line-height:1.07;text-wrap:balance;margin-top:0;}
body.gravity-global-polish h1{font-size:clamp(2.16rem,4.8vw,4.55rem)!important;max-width:15ch;margin-bottom:1rem!important;}
body.gravity-global-polish h2{font-size:clamp(1.65rem,3vw,2.58rem)!important;max-width:18ch;margin-bottom:.85rem!important;}
body.gravity-global-polish h3{font-size:clamp(1.08rem,1.55vw,1.36rem)!important;margin-bottom:.55rem!important;}
body.gravity-global-polish p{color:var(--ggp-muted);margin:0;}
body.gravity-global-polish .block__header,body.gravity-global-polish .section-title{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.35rem;max-width:780px;margin-bottom:clamp(1.15rem,2.5vw,2rem)!important;}
body.gravity-global-polish .block__header p,body.gravity-global-polish .block__subtitle{max-width:68ch;color:var(--ggp-muted);font-size:clamp(1rem,1.3vw,1.12rem);}
body.gravity-global-polish .block__eyebrow,body.gravity-global-polish .hero__eyebrow,body.gravity-global-polish .card__eyebrow,body.gravity-global-polish .service-card__kicker{display:inline-flex;width:max-content;max-width:100%;align-items:center;min-height:2rem;padding:.38rem .68rem;border-radius:999px;background:rgba(var(--ggp-primary-rgb),.075);border:1px solid rgba(var(--ggp-primary-rgb),.13);color:var(--ggp-primary)!important;font-size:.74rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.72rem;}

/* Hero */
body.gravity-global-polish .hero{padding-top:clamp(1.3rem,3vw,2.35rem)!important;}
body.gravity-global-polish .hero__minimal,body.gravity-global-polish .hero__shell,body.gravity-global-polish .hero__centered--with-media{display:grid!important;grid-template-columns:minmax(0,.98fr) minmax(300px,.76fr)!important;align-items:center!important;gap:clamp(1.25rem,3.5vw,3rem)!important;max-width:1180px!important;margin-inline:auto!important;padding:clamp(1.35rem,3vw,2.65rem)!important;border-radius:var(--ggp-radius-lg)!important;background:radial-gradient(circle at 100% 0,rgba(var(--ggp-primary-rgb),.10),transparent 34%),#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--ggp-shadow)!important;color:var(--ggp-text)!important;overflow:hidden;}
body.gravity-global-polish .hero__minimal>.hero__eyebrow,body.gravity-global-polish .hero__minimal>h1,body.gravity-global-polish .hero__minimal>.hero__subtitle,body.gravity-global-polish .hero__minimal>.cta-row,body.gravity-global-polish .hero__minimal>.hero__bullets{grid-column:1;}
body.gravity-global-polish .hero__minimal>.hero-visual{grid-column:2;grid-row:1/span 7;margin:0!important;}
body.gravity-global-polish .hero__subtitle{font-size:clamp(1.03rem,1.45vw,1.22rem)!important;max-width:62ch;color:var(--ggp-muted)!important;}
body.gravity-global-polish .hero-visual,body.gravity-global-polish .hero-visual__frame{min-width:0;}
body.gravity-global-polish .hero-visual__frame{position:relative;min-height:clamp(280px,34vw,440px)!important;border-radius:clamp(1.15rem,2vw,1.65rem)!important;overflow:hidden;background:radial-gradient(circle at 70% 18%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,var(--ggp-primary),color-mix(in srgb,var(--ggp-primary),#fff 26%))!important;box-shadow:var(--ggp-shadow)!important;border:1px solid rgba(255,255,255,.75)!important;}
body.gravity-global-polish .hero-visual__frame img{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover;}
body.gravity-global-polish .hero-visual__frame::after{content:'Servicio local';position:absolute;left:1rem;bottom:1rem;padding:.48rem .7rem;border-radius:999px;background:rgba(255,255,255,.92);color:var(--ggp-text);font-weight:900;font-size:.78rem;box-shadow:0 8px 20px rgba(15,23,42,.12);}

/* Proof strip and generic cards */
body.gravity-global-polish .conversion-proof-strip{padding:clamp(1rem,2vw,1.4rem) 0 clamp(1.45rem,3vw,2.2rem)!important;}
body.gravity-global-polish .conversion-proof-strip__grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:.8rem!important;}
body.gravity-global-polish .conversion-proof-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.18rem .72rem!important;align-items:center!important;min-height:5.35rem!important;padding:1rem!important;border-radius:1.05rem!important;background:#fff!important;border:1px solid var(--ggp-border)!important;box-shadow:var(--ggp-shadow-soft)!important;}
body.gravity-global-polish .conversion-proof-item__value{grid-row:span 2;display:inline-grid!important;place-items:center;width:2.55rem;height:2.55rem;border-radius:.88rem;background:linear-gradient(135deg,rgba(var(--ggp-primary-rgb),.12),rgba(var(--ggp-primary-rgb),.045));color:var(--ggp-primary)!important;font-weight:950;}
body.gravity-global-polish .conversion-proof-item__label{font-weight:950;color:var(--ggp-text)!important;line-height:1.12;}
body.gravity-global-polish .conversion-proof-item__text{font-size:.88rem;line-height:1.32;color:var(--ggp-muted)!important;}
body.gravity-global-polish .service-card,body.gravity-global-polish .proof-card,body.gravity-global-polish .step-card,body.gravity-global-polish .price-card,body.gravity-global-polish .faq-item,body.gravity-global-polish .faq-entry,body.gravity-global-polish .faq-item-refined,body.gravity-global-polish .testimonial-card,body.gravity-global-polish .semantic-card,body.gravity-global-polish .trust-band__signal-card,body.gravity-global-polish .internal-links-item,body.gravity-global-polish .services-grid__magazine-feature,body.gravity-global-polish .process-step-rail__body,body.gravity-global-polish .map-block__support{min-width:0;border-radius:var(--ggp-radius)!important;background:#fff!important;border:1px solid var(--ggp-border)!important;box-shadow:var(--ggp-shadow-soft)!important;padding:var(--ggp-card-pad)!important;}
body.gravity-global-polish .service-card p,body.gravity-global-polish .proof-card p,body.gravity-global-polish .step-card p,body.gravity-global-polish .price-card p,body.gravity-global-polish .semantic-card p{color:var(--ggp-muted)!important;}

/* Safe grids */
body.gravity-global-polish .services-grid__cards,body.gravity-global-polish .semantic-items,body.gravity-global-polish .trust-grid,body.gravity-global-polish .local-proof__grid,body.gravity-global-polish .local-proof__signal-list,body.gravity-global-polish .trust-band__signal-grid,body.gravity-global-polish .process-steps__timeline,body.gravity-global-polish .price-guidance__cards,body.gravity-global-polish .testimonials-grid,body.gravity-global-polish .internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr))!important;gap:clamp(.9rem,1.8vw,1.25rem)!important;align-items:stretch!important;}
body.gravity-global-polish .services-grid__magazine,body.gravity-global-polish .local-proof__coverage,body.gravity-global-polish .process-steps__rail-layout,body.gravity-global-polish .price-guidance__insight,body.gravity-global-polish .cta-panel__consult,body.gravity-global-polish .map-block__context{display:grid!important;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important;gap:clamp(1.1rem,2.8vw,2.25rem)!important;align-items:start!important;}

/* Lists */
body.gravity-global-polish main section ul:not([class]),body.gravity-global-polish .block-section ul:not([class]),body.gravity-global-polish .global-polish-list{display:grid!important;gap:.62rem!important;list-style:none!important;margin:.95rem 0 0!important;padding:0!important;}
body.gravity-global-polish main section ul:not([class])>li,body.gravity-global-polish .block-section ul:not([class])>li,body.gravity-global-polish .global-polish-list>li{position:relative;padding:.66rem .78rem .66rem 2.25rem!important;border-radius:.92rem;background:rgba(15,23,42,.028);border:1px solid rgba(148,163,184,.14);color:var(--ggp-text);font-weight:680;line-height:1.35;}
body.gravity-global-polish main section ul:not([class])>li::before,body.gravity-global-polish .block-section ul:not([class])>li::before,body.gravity-global-polish .global-polish-list>li::before{content:'✓';position:absolute;left:.7rem;top:.68rem;display:inline-grid;place-items:center;width:1.05rem;height:1.05rem;border-radius:999px;background:rgba(var(--ggp-primary-rgb),.10);color:var(--ggp-primary);font-size:.72rem;font-weight:950;}
body.gravity-global-polish .service-card__meta,body.gravity-global-polish .step-card__meta,body.gravity-global-polish .step-row__meta,body.gravity-global-polish .proof-row__meta,body.gravity-global-polish .price-card__facts,body.gravity-global-polish .services-grid__trust,body.gravity-global-polish .urgency-banner__pills,body.gravity-global-polish .block__pills,body.gravity-global-polish .cta-panel__bullets,body.gravity-global-polish .price-guidance__bullets,body.gravity-global-polish .process-steps__bullets{display:flex!important;flex-wrap:wrap;gap:.45rem;list-style:none!important;margin:.85rem 0 0!important;padding:0!important;}
body.gravity-global-polish .service-card__meta li,body.gravity-global-polish .step-card__meta li,body.gravity-global-polish .step-row__meta li,body.gravity-global-polish .proof-row__meta li,body.gravity-global-polish .price-card__facts li,body.gravity-global-polish .block__pill,body.gravity-global-polish .cta-panel__bullets li,body.gravity-global-polish .price-guidance__bullets li,body.gravity-global-polish .process-steps__bullets li{display:inline-flex!important;align-items:center;min-height:1.95rem;padding:.38rem .6rem!important;border-radius:999px;background:rgba(var(--ggp-primary-rgb),.06)!important;border:1px solid rgba(var(--ggp-primary-rgb),.11)!important;color:var(--ggp-primary)!important;font-size:.81rem;font-weight:850;line-height:1.15;}

/* Process is the only strong-number block */
body.gravity-global-polish .process-step-rail{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.9rem!important;align-items:start!important;padding:0!important;}
body.gravity-global-polish .process-steps__rail{display:grid!important;gap:.88rem!important;padding-left:0!important;}
body.gravity-global-polish .process-steps__rail::before{display:none!important;}
body.gravity-global-polish .process-step-rail__index,body.gravity-global-polish .step-card__index{display:inline-grid!important;place-items:center;width:2.55rem!important;height:2.55rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--ggp-primary),color-mix(in srgb,var(--ggp-primary),#000 18%))!important;color:#fff!important;font-weight:950!important;box-shadow:0 9px 20px rgba(var(--ggp-primary-rgb),.17)!important;}
body.gravity-global-polish .local-proof__signal-index,body.gravity-global-polish .trust-band__signal-index,body.gravity-global-polish .proof-row__ordinal{font-size:0!important;display:inline-grid!important;place-items:center;width:2.35rem!important;height:2.35rem!important;border-radius:999px!important;background:rgba(var(--ggp-primary-rgb),.095)!important;color:var(--ggp-primary)!important;box-shadow:none!important;}
body.gravity-global-polish .local-proof__signal-index::before,body.gravity-global-polish .trust-band__signal-index::before,body.gravity-global-polish .proof-row__ordinal::before{content:'✓';font-size:.92rem;font-weight:950;}
body.gravity-global-polish .local-proof__signal,body.gravity-global-polish .trust-band__signal-card,body.gravity-global-polish .proof-row--stacked{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.82rem!important;align-items:start!important;}

/* Urgency / CTA */
body.gravity-global-polish .urgency-banner,body.gravity-global-polish .cta-panel__banner,body.gravity-global-polish .section-cta--terminal,body.gravity-global-polish .cta-panel__consult-card{border-radius:var(--ggp-radius-lg)!important;border:1px solid rgba(var(--ggp-primary-rgb),.15)!important;background:radial-gradient(circle at 100% 0,rgba(var(--ggp-primary-rgb),.09),transparent 32%),#fff!important;box-shadow:var(--ggp-shadow)!important;}
body.gravity-global-polish .urgency-banner{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(132px,.25fr) minmax(190px,.36fr)!important;gap:1rem;align-items:center;padding:clamp(1.12rem,2.3vw,1.72rem)!important;position:relative;overflow:hidden;}
body.gravity-global-polish .urgency-banner__rail{position:absolute;inset:0 auto 0 0;width:.34rem;background:var(--ggp-primary);}
body.gravity-global-polish .urgency-banner__statbox{display:grid;place-items:center;min-height:6.8rem;padding:.85rem;border-radius:1.05rem;background:linear-gradient(180deg,#fff,rgba(248,250,252,.92));border:1px solid var(--ggp-border);box-shadow:var(--ggp-shadow-soft);}
body.gravity-global-polish .cta-primary,body.gravity-global-polish .nav__cta,body.gravity-global-polish .nav-mobile__cta,body.gravity-global-polish .card__btn,body.gravity-global-polish .internal-links-item__anchor,body.gravity-global-polish .mobile-sticky-cta__button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.45rem;min-height:3rem;padding:.75rem 1.05rem;border-radius:999px!important;background:linear-gradient(135deg,var(--ggp-primary),color-mix(in srgb,var(--ggp-primary),#000 18%))!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)!important;font-weight:950!important;box-shadow:0 10px 22px rgba(var(--ggp-primary-rgb),.17)!important;white-space:nowrap;}
body.gravity-global-polish .block__cta-group{display:flex!important;align-items:center!important;gap:.7rem!important;flex-wrap:wrap!important;margin-top:1.05rem!important;}
body.gravity-global-polish .block__cta-note,body.gravity-global-polish .block__cta-phone{display:inline-flex;align-items:center;min-height:2.55rem;max-width:34rem;padding:.62rem .84rem;border-radius:999px;background:rgba(15,23,42,.035);border:1px solid var(--ggp-border);color:var(--ggp-muted)!important;font-size:.86rem;font-weight:650;line-height:1.25;}

/* FAQ / map / internal links */
body.gravity-global-polish .faq-block__accordion,body.gravity-global-polish .faq-block__accordion--refined{display:grid!important;gap:.78rem!important;max-width:940px;}
body.gravity-global-polish .faq-summary-refined{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center;gap:.75rem;cursor:pointer;list-style:none;color:var(--ggp-text);font-weight:900;padding:1rem 1.05rem!important;}
body.gravity-global-polish .faq-summary-refined::-webkit-details-marker{display:none;}
body.gravity-global-polish .faq-summary-refined::after{content:'+';font-weight:950;color:var(--ggp-primary);}
body.gravity-global-polish details[open]>.faq-summary-refined::after{content:'–';}
body.gravity-global-polish .faq-content-refined{padding:0 1.05rem 1.05rem 4rem!important;color:var(--ggp-muted);}
body.gravity-global-polish .map-block__frame,body.gravity-global-polish .map-wrapper,body.gravity-global-polish .map-boxed-wrapper,body.gravity-global-polish .map-directory__visual{position:relative;min-height:clamp(245px,30vw,340px)!important;border-radius:var(--ggp-radius)!important;background:linear-gradient(135deg,#dbe4ee,#f8fafc)!important;border:1px solid var(--ggp-border)!important;box-shadow:var(--ggp-shadow-soft)!important;overflow:hidden;}
body.gravity-global-polish .map-block__iframe,body.gravity-global-polish .map-iframe,body.gravity-global-polish iframe.map-iframe{display:block;width:100%;height:100%;min-height:inherit;border:0;}
body.gravity-global-polish .internal-links-hub__header{align-items:flex-start!important;text-align:left!important;margin-inline:0!important;}
body.gravity-global-polish .internal-links-grid{max-width:100%!important;}
body.gravity-global-polish .internal-links-item__anchor{width:100%;margin-top:.9rem;}

/* Mobile sticky contact */
body.gravity-global-polish .mobile-sticky-cta{display:none!important;}
@media(max-width:640px){body.gravity-global-polish{padding-bottom:5.6rem;}body.gravity-global-polish .mobile-sticky-cta{position:fixed;left:.85rem;right:.85rem;bottom:.85rem;z-index:120;display:flex!important;align-items:center;justify-content:space-between;gap:.78rem;padding:.72rem .72rem .72rem .95rem;border-radius:1.15rem;background:rgba(15,23,42,.94);color:#fff;box-shadow:0 18px 44px rgba(2,6,23,.32);}body.gravity-global-polish .mobile-sticky-cta__copy{display:grid;gap:.06rem;min-width:0;}body.gravity-global-polish .mobile-sticky-cta__copy strong{font-size:.96rem;line-height:1.1;color:#fff;}body.gravity-global-polish .mobile-sticky-cta__copy span{color:rgba(255,255,255,.72);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}body.gravity-global-polish .mobile-sticky-cta__button{width:3rem;height:3rem;padding:0!important;flex:0 0 auto;}}

/* Defensive cleanup */
body.gravity-global-polish ul:empty,body.gravity-global-polish ol:empty,body.gravity-global-polish p:empty,body.gravity-global-polish li:empty,body.gravity-global-polish h2:empty,body.gravity-global-polish h3:empty,body.gravity-global-polish .service-card:empty,body.gravity-global-polish .step-card:empty,body.gravity-global-polish .faq-entry:empty{display:none!important;}
body.gravity-global-polish .el-section-wrapper:empty{display:none!important;}
body.gravity-global-polish [class*='paradigm-bento'],body.gravity-global-polish [class*='paradigm-cinematic']{display:revert!important;grid-template-columns:initial!important;grid-template-rows:initial!important;height:auto!important;}

@media(max-width:900px){body.gravity-global-polish .hero__minimal,body.gravity-global-polish .hero__shell,body.gravity-global-polish .hero__centered--with-media,body.gravity-global-polish .services-grid__magazine,body.gravity-global-polish .local-proof__coverage,body.gravity-global-polish .process-steps__rail-layout,body.gravity-global-polish .price-guidance__insight,body.gravity-global-polish .cta-panel__consult,body.gravity-global-polish .map-block__context,body.gravity-global-polish .urgency-banner{grid-template-columns:minmax(0,1fr)!important;}body.gravity-global-polish .hero__minimal>.hero-visual{grid-column:auto!important;grid-row:auto!important;}body.gravity-global-polish h1,body.gravity-global-polish .hero h1{max-width:100%!important;}body.gravity-global-polish .conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}
@media(max-width:640px){body.gravity-global-polish .el-container{padding-inline:1rem!important;}body.gravity-global-polish .site-header{padding:.5rem 0;}body.gravity-global-polish .site-header__inner{border-radius:1.1rem;}body.gravity-global-polish .hero__minimal,body.gravity-global-polish .hero__shell{padding:1.12rem!important;border-radius:1.22rem!important;}body.gravity-global-polish .hero-visual__frame{min-height:245px!important;}body.gravity-global-polish .conversion-proof-strip__grid,body.gravity-global-polish .services-grid__cards,body.gravity-global-polish .semantic-items,body.gravity-global-polish .trust-grid,body.gravity-global-polish .local-proof__grid,body.gravity-global-polish .local-proof__signal-list,body.gravity-global-polish .trust-band__signal-grid,body.gravity-global-polish .process-steps__timeline,body.gravity-global-polish .price-guidance__cards,body.gravity-global-polish .testimonials-grid,body.gravity-global-polish .internal-links-grid{grid-template-columns:1fr!important;}body.gravity-global-polish .cta-primary,body.gravity-global-polish .card__btn,body.gravity-global-polish .internal-links-item__anchor{width:100%!important;}body.gravity-global-polish .process-step-rail,body.gravity-global-polish .local-proof__signal,body.gravity-global-polish .trust-band__signal-card,body.gravity-global-polish .proof-row--stacked{grid-template-columns:minmax(0,1fr)!important;}body.gravity-global-polish .block__cta-note,body.gravity-global-polish .block__cta-phone{width:100%;max-width:100%;border-radius:1rem;}}
`;
