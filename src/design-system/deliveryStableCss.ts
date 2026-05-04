/**
 * Gravity Delivery Stable CSS v1.
 *
 * Última capa CSS compacta para entrega: no intenta rediseñar el sistema,
 * solo normaliza jerarquía, grids, cards, CTAs, hero, mapa y móvil para que
 * las páginas existentes salgan publicables y consistentes.
 */
export const DELIVERY_STABLE_CSS = `
/* === Gravity Delivery Stable CSS v1 === */
:root{
  --delivery-bg:var(--bg,#f8fafc);
  --delivery-surface:var(--surface,#ffffff);
  --delivery-surface-strong:#ffffff;
  --delivery-text:var(--text,#0f172a);
  --delivery-muted:var(--muted,#64748b);
  --delivery-primary:var(--primary,#0f172a);
  --delivery-primary-rgb:var(--primary-rgb,15,23,42);
  --delivery-border:rgba(148,163,184,.18);
  --delivery-border-strong:rgba(148,163,184,.28);
  --delivery-radius:clamp(1rem,1.8vw,1.45rem);
  --delivery-section-y:clamp(3rem,5vw,5rem);
  --delivery-shadow:0 10px 30px rgba(15,23,42,.065);
  --delivery-shadow-soft:0 5px 18px rgba(15,23,42,.045);
}
html,body{max-width:100%;overflow-x:clip;}
body.gravity-delivery-stable{background:linear-gradient(180deg,#fff 0%,var(--delivery-bg) 46%,#fff 100%)!important;color:var(--delivery-text)!important;line-height:1.68;}
body.gravity-delivery-stable *,body.gravity-delivery-stable *::before,body.gravity-delivery-stable *::after{box-sizing:border-box;}
body.gravity-delivery-stable .el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem);}
body.gravity-delivery-stable .el-section-wrapper{padding-block:0!important;background:transparent!important;}
body.gravity-delivery-stable .block-section,body.gravity-delivery-stable .semantic-section,body.gravity-delivery-stable .el-section{padding:var(--delivery-section-y) 0!important;}
body.gravity-delivery-stable .block-section__inner,body.gravity-delivery-stable .section-shell,body.gravity-delivery-stable .semantic-section__container{min-width:0;}
body.gravity-delivery-stable h1,body.gravity-delivery-stable h2,body.gravity-delivery-stable h3{color:var(--delivery-text)!important;letter-spacing:-.035em;line-height:1.08;text-wrap:balance;margin-top:0;}
body.gravity-delivery-stable h1{font-size:clamp(2.2rem,5vw,4.65rem)!important;max-width:14ch;margin-bottom:1rem!important;}
body.gravity-delivery-stable h2{font-size:clamp(1.7rem,3.1vw,2.65rem)!important;max-width:16ch;margin-bottom:.85rem!important;}
body.gravity-delivery-stable h3{font-size:clamp(1.08rem,1.55vw,1.35rem)!important;margin-bottom:.55rem!important;}
body.gravity-delivery-stable p{color:var(--delivery-muted);margin:0;}
body.gravity-delivery-stable a{text-decoration:none;}
body.gravity-delivery-stable img,body.gravity-delivery-stable iframe,body.gravity-delivery-stable svg,body.gravity-delivery-stable video{max-width:100%;}
body.gravity-delivery-stable ul:empty,body.gravity-delivery-stable ol:empty,body.gravity-delivery-stable p:empty,body.gravity-delivery-stable h2:empty,body.gravity-delivery-stable h3:empty{display:none!important;}

body.gravity-delivery-stable .site-header{position:sticky;top:0;z-index:90;padding:.7rem 0;background:rgba(255,255,255,.94)!important;border-bottom:1px solid rgba(148,163,184,.12);box-shadow:0 8px 24px rgba(15,23,42,.045);}
body.gravity-delivery-stable .site-header__inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:3.7rem;padding:.55rem .75rem;border-radius:999px;background:#fff;border:1px solid rgba(148,163,184,.14);box-shadow:var(--delivery-shadow-soft);}
body.gravity-delivery-stable .brand{color:var(--delivery-text)!important;font-weight:950;letter-spacing:-.025em;}
body.gravity-delivery-stable .nav__links-group,body.gravity-delivery-stable .nav-mobile__links{display:flex;align-items:center;gap:.25rem;flex-wrap:wrap;}
body.gravity-delivery-stable .nav__link,body.gravity-delivery-stable .nav-mobile__link{display:inline-flex;align-items:center;min-height:2.45rem;padding:.56rem .78rem;border-radius:999px;color:var(--delivery-text)!important;font-weight:800;font-size:.92rem;}
body.gravity-delivery-stable .nav__link:hover,body.gravity-delivery-stable .nav__link.is-active{background:rgba(15,23,42,.055);}
body.gravity-delivery-stable .nav-mobile__summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;min-height:2.55rem;padding:0 .9rem;border-radius:999px;background:#fff;border:1px solid var(--delivery-border);font-weight:900;}
body.gravity-delivery-stable .nav-mobile__summary::-webkit-details-marker{display:none;}
body.gravity-delivery-stable .nav-mobile__panel{position:absolute;right:1rem;margin-top:.75rem;width:min(22rem,calc(100vw - 2rem));padding:.9rem;border-radius:1.15rem;background:#fff;border:1px solid var(--delivery-border);box-shadow:var(--delivery-shadow);z-index:100;}

body.gravity-delivery-stable .hero{padding-top:clamp(1.5rem,3vw,2.4rem)!important;}
body.gravity-delivery-stable .hero__minimal,body.gravity-delivery-stable .hero__shell,body.gravity-delivery-stable .hero__centered--with-media{display:grid;grid-template-columns:minmax(0,.95fr) minmax(300px,.72fr);align-items:center;gap:clamp(1.3rem,3.5vw,3rem);max-width:1180px;margin-inline:auto;padding:clamp(1.35rem,3vw,2.6rem)!important;border-radius:clamp(1.3rem,2.4vw,2rem)!important;background:radial-gradient(circle at 100% 0,rgba(var(--delivery-primary-rgb),.09),transparent 34%),#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--delivery-shadow)!important;color:var(--delivery-text)!important;}
body.gravity-delivery-stable .hero h1,body.gravity-delivery-stable .hero p,body.gravity-delivery-stable .hero li{color:inherit!important;}
body.gravity-delivery-stable .hero__eyebrow,body.gravity-delivery-stable .block__eyebrow,body.gravity-delivery-stable .card__eyebrow{display:inline-flex;width:max-content;max-width:100%;align-items:center;min-height:2rem;padding:.38rem .68rem;border-radius:999px;background:rgba(var(--delivery-primary-rgb),.075);border:1px solid rgba(var(--delivery-primary-rgb),.13);color:var(--delivery-primary)!important;font-size:.76rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.85rem;}
body.gravity-delivery-stable .hero__subtitle,body.gravity-delivery-stable .editorial-lead{font-size:clamp(1.03rem,1.5vw,1.22rem);max-width:62ch;color:var(--delivery-muted)!important;}
body.gravity-delivery-stable .hero-visual{margin:0!important;min-width:0;}
body.gravity-delivery-stable .hero-visual__frame,body.gravity-delivery-stable .hero-visual__fallback{min-height:clamp(280px,34vw,440px);border-radius:clamp(1.15rem,2vw,1.65rem);overflow:hidden;background:radial-gradient(circle at 70% 18%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,var(--delivery-primary),color-mix(in srgb,var(--delivery-primary),#fff 26%));box-shadow:var(--delivery-shadow);border:1px solid rgba(255,255,255,.75);}
body.gravity-delivery-stable .hero-visual__frame img{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover;}

body.gravity-delivery-stable .block__header,body.gravity-delivery-stable .section-title,body.gravity-delivery-stable .testimonials-section__header{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.35rem;margin-bottom:clamp(1.15rem,2.5vw,2rem)!important;max-width:780px;}
body.gravity-delivery-stable .block__header p,body.gravity-delivery-stable .block__subtitle{max-width:68ch;color:var(--delivery-muted);font-size:clamp(1rem,1.3vw,1.12rem);}
body.gravity-delivery-stable .services-grid__cards,body.gravity-delivery-stable .semantic-items,body.gravity-delivery-stable .trust-grid,body.gravity-delivery-stable .local-proof__grid,body.gravity-delivery-stable .local-proof__signal-list,body.gravity-delivery-stable .process-steps__timeline,body.gravity-delivery-stable .price-guidance__cards,body.gravity-delivery-stable .testimonials-grid,body.gravity-delivery-stable .internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))!important;gap:clamp(.9rem,1.8vw,1.25rem)!important;align-items:stretch;}
body.gravity-delivery-stable .services-grid__magazine,body.gravity-delivery-stable .local-proof__coverage,body.gravity-delivery-stable .process-steps__rail-layout,body.gravity-delivery-stable .price-guidance__insight,body.gravity-delivery-stable .cta-panel__consult,body.gravity-delivery-stable .map-block__context{display:grid!important;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important;gap:clamp(1.1rem,2.8vw,2.25rem)!important;align-items:start;}
body.gravity-delivery-stable .services-grid__magazine-lead,body.gravity-delivery-stable .services-grid__magazine-stack,body.gravity-delivery-stable .local-proof__coverage-copy,body.gravity-delivery-stable .local-proof__coverage-cards,body.gravity-delivery-stable .process-steps__rail-copy,body.gravity-delivery-stable .price-guidance__insight-copy,body.gravity-delivery-stable .price-guidance__insight-panels,body.gravity-delivery-stable .cta-panel__consult-copy,body.gravity-delivery-stable .map-block__context-copy{display:grid;gap:1rem;min-width:0;}
body.gravity-delivery-stable .service-card,body.gravity-delivery-stable .proof-card,body.gravity-delivery-stable .step-card,body.gravity-delivery-stable .price-card,body.gravity-delivery-stable .faq-item,body.gravity-delivery-stable .faq-entry,body.gravity-delivery-stable .faq-item-refined,body.gravity-delivery-stable .testimonial-card,body.gravity-delivery-stable .semantic-card,body.gravity-delivery-stable .trust-band__signal-card,body.gravity-delivery-stable .conversion-proof-item,body.gravity-delivery-stable .internal-links-item,body.gravity-delivery-stable .services-grid__magazine-feature,body.gravity-delivery-stable .map-block__support{min-width:0;border-radius:var(--delivery-radius)!important;background:#fff!important;border:1px solid var(--delivery-border)!important;box-shadow:var(--delivery-shadow-soft)!important;padding:clamp(1.05rem,2vw,1.45rem)!important;}
body.gravity-delivery-stable .service-card p,body.gravity-delivery-stable .proof-card p,body.gravity-delivery-stable .step-card p,body.gravity-delivery-stable .price-card p,body.gravity-delivery-stable .semantic-card p{color:var(--delivery-muted)!important;}
body.gravity-delivery-stable .service-card__icon,body.gravity-delivery-stable .process-step-rail__index,body.gravity-delivery-stable .step-card__index,body.gravity-delivery-stable .local-proof__signal-index,body.gravity-delivery-stable .trust-band__signal-index,body.gravity-delivery-stable .proof-row__ordinal{display:inline-grid;place-items:center;width:2.65rem;height:2.65rem;border-radius:999px;background:linear-gradient(135deg,var(--delivery-primary),color-mix(in srgb,var(--delivery-primary),#000 20%))!important;color:#fff!important;font-weight:950;box-shadow:0 9px 20px rgba(var(--delivery-primary-rgb),.17);}
body.gravity-delivery-stable .service-card__meta,body.gravity-delivery-stable .step-card__meta,body.gravity-delivery-stable .step-row__meta,body.gravity-delivery-stable .proof-row__meta,body.gravity-delivery-stable .price-card__facts,body.gravity-delivery-stable .services-grid__trust,body.gravity-delivery-stable .urgency-banner__pills,body.gravity-delivery-stable .block__pills{display:flex;flex-wrap:wrap;gap:.45rem;list-style:none;margin:.85rem 0 0!important;padding:0!important;}
body.gravity-delivery-stable .service-card__meta li,body.gravity-delivery-stable .step-card__meta li,body.gravity-delivery-stable .step-row__meta li,body.gravity-delivery-stable .proof-row__meta li,body.gravity-delivery-stable .price-card__facts li,body.gravity-delivery-stable .block__pill{display:inline-flex;align-items:center;min-height:1.95rem;padding:.38rem .6rem;border-radius:999px;background:rgba(var(--delivery-primary-rgb),.06);border:1px solid rgba(var(--delivery-primary-rgb),.11);color:var(--delivery-primary);font-size:.81rem;font-weight:850;line-height:1.15;}

body.gravity-delivery-stable .process-step-rail,body.gravity-delivery-stable .local-proof__signal,body.gravity-delivery-stable .trust-band__signal-card,body.gravity-delivery-stable .proof-row--stacked{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.85rem;align-items:start;}
body.gravity-delivery-stable .process-steps__rail{display:grid!important;gap:.85rem;position:relative;}
body.gravity-delivery-stable .process-step-rail__body{min-width:0;}
body.gravity-delivery-stable .urgency-banner{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(140px,.26fr) minmax(200px,.38fr)!important;gap:1rem;align-items:center;border-radius:var(--delivery-radius)!important;background:radial-gradient(circle at 100% 0,rgba(var(--delivery-primary-rgb),.09),transparent 32%),#fff!important;border:1px solid rgba(var(--delivery-primary-rgb),.15)!important;box-shadow:var(--delivery-shadow)!important;padding:clamp(1.15rem,2.4vw,1.75rem)!important;position:relative;overflow:hidden;}
body.gravity-delivery-stable .urgency-banner__rail{position:absolute;inset:0 auto 0 0;width:.34rem;background:var(--delivery-primary);}
body.gravity-delivery-stable .urgency-banner__statbox{display:grid;place-items:center;min-height:7.3rem;padding:.9rem;border-radius:1.05rem;background:linear-gradient(180deg,#fff,rgba(248,250,252,.92));border:1px solid var(--delivery-border);box-shadow:var(--delivery-shadow-soft);}
body.gravity-delivery-stable .urgency-banner__cta{justify-self:end;width:100%;max-width:250px;}
body.gravity-delivery-stable .cta-primary,body.gravity-delivery-stable .nav__cta,body.gravity-delivery-stable .nav-mobile__cta,body.gravity-delivery-stable .card__btn,body.gravity-delivery-stable .internal-links-item__anchor{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:3rem;padding:.75rem 1.05rem;border-radius:999px;background:linear-gradient(135deg,var(--delivery-primary),color-mix(in srgb,var(--delivery-primary),#000 18%))!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)!important;font-weight:950;box-shadow:0 10px 22px rgba(var(--delivery-primary-rgb),.17)!important;}
body.gravity-delivery-stable .block__cta-group{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;margin-top:1.05rem!important;}
body.gravity-delivery-stable .block__cta-note,body.gravity-delivery-stable .block__cta-phone{display:inline-flex;align-items:center;min-height:2.65rem;max-width:34rem;padding:.65rem .85rem;border-radius:999px;background:rgba(15,23,42,.035);border:1px solid var(--delivery-border);color:var(--delivery-muted);font-size:.88rem;font-weight:650;line-height:1.25;}
body.gravity-delivery-stable .faq-block__accordion,body.gravity-delivery-stable .faq-block__accordion--refined{display:grid;gap:.78rem;max-width:940px;}
body.gravity-delivery-stable .faq-summary-refined{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.75rem;cursor:pointer;list-style:none;color:var(--delivery-text);font-weight:900;padding:1rem 1.05rem!important;}
body.gravity-delivery-stable .faq-summary-refined::-webkit-details-marker{display:none;}
body.gravity-delivery-stable .faq-summary-refined:after{content:'+';font-weight:950;color:var(--delivery-primary);}
body.gravity-delivery-stable details[open]>.faq-summary-refined:after{content:'–';}
body.gravity-delivery-stable .faq-content-refined{padding:0 1.05rem 1.05rem 4rem!important;color:var(--delivery-muted);}
body.gravity-delivery-stable .map-block__frame,body.gravity-delivery-stable .map-wrapper,body.gravity-delivery-stable .map-boxed-wrapper,body.gravity-delivery-stable .map-directory__visual{position:relative;min-height:clamp(300px,40vw,440px)!important;border-radius:var(--delivery-radius)!important;background:linear-gradient(135deg,#dbe4ee,#f8fafc)!important;border:1px solid var(--delivery-border)!important;box-shadow:var(--delivery-shadow)!important;overflow:hidden;}
body.gravity-delivery-stable .map-block__iframe,body.gravity-delivery-stable .map-iframe,body.gravity-delivery-stable iframe.map-iframe{display:block;width:100%;height:100%;min-height:inherit;border:0;}
body.gravity-delivery-stable .map-block__overlay{position:absolute;left:1rem;right:1rem;bottom:1rem;display:flex;justify-content:space-between;gap:.7rem;pointer-events:none;}
body.gravity-delivery-stable .map-block__overlay-badge,body.gravity-delivery-stable .map-block__overlay-city{display:inline-flex;align-items:center;min-height:2.25rem;padding:.5rem .75rem;border-radius:999px;background:rgba(255,255,255,.94)!important;border:1px solid rgba(255,255,255,.78)!important;color:var(--delivery-text)!important;font-weight:950;box-shadow:0 8px 20px rgba(15,23,42,.12);}
body.gravity-delivery-stable .footer-editorial{padding:clamp(2.5rem,5vw,4.5rem) 0!important;background:radial-gradient(circle at 0 0,rgba(var(--delivery-primary-rgb),.34),transparent 34%),linear-gradient(135deg,#0f172a,#020617)!important;color:#fff!important;}
body.gravity-delivery-stable .footer-editorial h2,body.gravity-delivery-stable .footer-editorial h3,body.gravity-delivery-stable .footer-editorial h4,body.gravity-delivery-stable .footer__brand-name{color:#fff!important;}
body.gravity-delivery-stable .footer-editorial p,body.gravity-delivery-stable .footer-editorial a,body.gravity-delivery-stable .footer__text,body.gravity-delivery-stable .footer__subtitle{color:#cbd5e1!important;}
body.gravity-delivery-stable .footer__grid-refined,body.gravity-delivery-stable .footer__links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))!important;gap:1.4rem!important;}

@media(max-width:980px){
  body.gravity-delivery-stable .hero__minimal,body.gravity-delivery-stable .hero__shell,body.gravity-delivery-stable .hero__centered--with-media,body.gravity-delivery-stable .services-grid__magazine,body.gravity-delivery-stable .local-proof__coverage,body.gravity-delivery-stable .process-steps__rail-layout,body.gravity-delivery-stable .price-guidance__insight,body.gravity-delivery-stable .cta-panel__consult,body.gravity-delivery-stable .map-block__context,body.gravity-delivery-stable .urgency-banner{grid-template-columns:minmax(0,1fr)!important;}
  body.gravity-delivery-stable .hero-visual{grid-column:auto!important;grid-row:auto!important;}
  body.gravity-delivery-stable h1,body.gravity-delivery-stable h2{max-width:100%;}
  body.gravity-delivery-stable .conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  body.gravity-delivery-stable .urgency-banner__cta{justify-self:stretch;max-width:none;}
}
@media(max-width:680px){
  body.gravity-delivery-stable{font-size:15px;}
  body.gravity-delivery-stable .el-container{padding-inline:1rem;}
  body.gravity-delivery-stable .site-header{padding:.55rem;}
  body.gravity-delivery-stable .site-header__inner{border-radius:1.05rem;}
  body.gravity-delivery-stable .nav--desktop{display:none!important;}
  body.gravity-delivery-stable .nav-mobile{display:block!important;margin-left:auto;}
  body.gravity-delivery-stable .hero__minimal,body.gravity-delivery-stable .hero__shell{padding:1rem!important;border-radius:1.25rem!important;}
  body.gravity-delivery-stable .hero-visual__frame,body.gravity-delivery-stable .hero-visual__fallback{min-height:250px;}
  body.gravity-delivery-stable .conversion-proof-strip__grid{grid-template-columns:1fr!important;}
  body.gravity-delivery-stable .process-step-rail,body.gravity-delivery-stable .local-proof__signal,body.gravity-delivery-stable .trust-band__signal-card,body.gravity-delivery-stable .proof-row--stacked{grid-template-columns:minmax(0,1fr)!important;}
  body.gravity-delivery-stable .block__cta-group,body.gravity-delivery-stable .map-block__overlay{flex-direction:column;align-items:stretch;}
  body.gravity-delivery-stable .cta-primary,body.gravity-delivery-stable .block__cta-note,body.gravity-delivery-stable .block__cta-phone{width:100%;max-width:100%;}
  body.gravity-delivery-stable .faq-content-refined{padding-left:1.05rem!important;}
}
`;
