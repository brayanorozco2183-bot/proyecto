/**
 * Production stable visual system for massive Gravity launches.
 *
 * This layer is intentionally conservative: it turns every official block into
 * a closed, responsive, premium-looking layout even when upstream design
 * families or experimental variants emit incomplete class combinations.
 */
export const PRODUCTION_STABLE_VISUAL_CSS = `
/* === Gravity Production Stable Visual System v1 === */
:root{
  --prod-bg:var(--bg,#f8fafc);
  --prod-surface:var(--surface,#ffffff);
  --prod-surface-strong:#ffffff;
  --prod-text:var(--text,#0f172a);
  --prod-muted:var(--muted,#64748b);
  --prod-primary:var(--primary,#0f172a);
  --prod-primary-rgb:var(--primary-rgb,15,23,42);
  --prod-border:rgba(148,163,184,.18);
  --prod-border-strong:rgba(148,163,184,.28);
  --prod-radius:clamp(1.15rem,2vw,1.75rem);
  --prod-card-radius:1.25rem;
  --prod-shadow:0 14px 38px rgba(15,23,42,.07);
  --prod-shadow-soft:0 8px 24px rgba(15,23,42,.045);
  --prod-section-y:clamp(3rem,5.5vw,5.5rem);
}
body.gravity-production-stable{background:linear-gradient(180deg,#fff 0%,var(--prod-bg) 48%,#fff 100%)!important;color:var(--prod-text)!important;font-size:16px;line-height:1.68;}
body.gravity-production-stable main,body.gravity-production-stable .page-main{isolation:isolate;}
body.gravity-production-stable .el-container{max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem);}
body.gravity-production-stable .el-section-wrapper{padding-block:0;background:transparent;}
body.gravity-production-stable .block-section,body.gravity-production-stable .semantic-section,body.gravity-production-stable .el-section{padding:var(--prod-section-y) 0!important;}
body.gravity-production-stable .block-section + .block-section,body.gravity-production-stable .el-section-wrapper + .el-section-wrapper{margin-top:0;}
body.gravity-production-stable h1,body.gravity-production-stable h2,body.gravity-production-stable h3{color:var(--prod-text)!important;text-wrap:balance;letter-spacing:-.035em;line-height:1.08;margin:0 0 .75rem!important;}
body.gravity-production-stable h1{font-size:clamp(2.35rem,5.2vw,4.8rem)!important;max-width:13.8ch;}
body.gravity-production-stable h2{font-size:clamp(1.7rem,3.2vw,2.75rem)!important;max-width:15ch;}
body.gravity-production-stable h3{font-size:clamp(1.08rem,1.55vw,1.35rem)!important;letter-spacing:-.02em;}
body.gravity-production-stable p{margin:0;color:var(--prod-muted);}
body.gravity-production-stable a{text-decoration:none;}
body.gravity-production-stable .site-header{position:sticky;top:0;z-index:90;padding:.75rem 0;background:rgba(255,255,255,.92)!important;border-bottom:1px solid rgba(148,163,184,.12);box-shadow:0 8px 28px rgba(15,23,42,.045);}
body.gravity-production-stable .site-header__inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:3.7rem;padding:.55rem .85rem;border:1px solid rgba(148,163,184,.16);border-radius:999px;background:#fff;box-shadow:var(--prod-shadow-soft);}
body.gravity-production-stable .brand__name,body.gravity-production-stable .site-header__brand-name{font-weight:950;color:var(--prod-text);font-size:clamp(.98rem,1.5vw,1.12rem);letter-spacing:-.025em;}
body.gravity-production-stable .nav__links-group{display:flex;gap:.2rem;align-items:center;}
body.gravity-production-stable .nav__link{min-height:2.55rem;padding:.58rem .82rem;border-radius:999px;color:var(--prod-muted)!important;font-weight:850;font-size:.91rem;}
body.gravity-production-stable .nav__link:hover,body.gravity-production-stable .nav__link.is-active{background:rgba(var(--prod-primary-rgb),.07);color:var(--prod-primary)!important;}
body.gravity-production-stable .cta-primary,body.gravity-production-stable .nav__cta,body.gravity-production-stable .card__btn,body.gravity-production-stable .mobile-sticky-cta__button{display:inline-flex!important;align-items:center;justify-content:center;gap:.48rem;min-height:3.05rem;padding:.78rem 1.08rem;border-radius:999px;background:linear-gradient(135deg,var(--prod-primary),color-mix(in srgb,var(--prod-primary),#000 20%))!important;color:#fff!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:0 10px 24px rgba(var(--prod-primary-rgb),.18)!important;font-weight:900;line-height:1.1;text-align:center;white-space:normal;}
body.gravity-production-stable .cta-primary:hover{transform:translateY(-1px);box-shadow:0 15px 32px rgba(var(--prod-primary-rgb),.22)!important;}
body.gravity-production-stable .el-breadcrumbs{padding:1rem 0 .35rem!important;background:transparent!important;}
body.gravity-production-stable .el-breadcrumbs__list{width:max-content;max-width:100%;padding:.72rem .95rem;border-radius:999px;background:rgba(255,255,255,.86)!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--prod-shadow-soft)!important;font-size:.82rem;}
body.gravity-production-stable .hero{padding:clamp(1.5rem,3.5vw,3rem) 0 clamp(2.5rem,5vw,4.5rem)!important;}
body.gravity-production-stable .hero__minimal,body.gravity-production-stable .hero__shell,body.gravity-production-stable .hero__centered--with-media{position:relative;display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(320px,.72fr)!important;gap:clamp(1.3rem,4vw,3.2rem)!important;align-items:center;max-width:1180px;margin-inline:auto;padding:clamp(1.25rem,3vw,2.15rem)!important;border-radius:clamp(1.5rem,4vw,2.7rem)!important;background:radial-gradient(circle at 85% 6%,rgba(var(--prod-primary-rgb),.12),transparent 28%),linear-gradient(135deg,#fff,rgba(248,250,252,.96))!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:0 22px 64px rgba(15,23,42,.09)!important;overflow:hidden;}
body.gravity-production-stable .hero__minimal:before,body.gravity-production-stable .hero__shell:before{content:"";position:absolute;inset:auto -8% -18% 42%;height:48%;background:radial-gradient(circle,rgba(var(--prod-primary-rgb),.09),transparent 65%);pointer-events:none;}
body.gravity-production-stable .hero__eyebrow,body.gravity-production-stable .block__eyebrow,body.gravity-production-stable .service-card__kicker{display:inline-flex;align-items:center;width:max-content;max-width:100%;min-height:2rem;padding:.42rem .7rem;border-radius:999px;background:rgba(var(--prod-primary-rgb),.075)!important;border:1px solid rgba(var(--prod-primary-rgb),.14)!important;color:var(--prod-primary)!important;font-weight:950;text-transform:uppercase;letter-spacing:.09em;font-size:.74rem;line-height:1.15;margin:0 0 .9rem!important;}
body.gravity-production-stable .hero__subtitle,body.gravity-production-stable .editorial-lead{max-width:64ch;color:var(--prod-muted)!important;font-size:clamp(1.02rem,1.35vw,1.2rem);line-height:1.72;margin:.3rem 0 1.25rem!important;}
body.gravity-production-stable .hero-visual{margin:0!important;grid-column:2!important;grid-row:1 / span 4!important;min-width:0;}
body.gravity-production-stable .hero-visual__frame,body.gravity-production-stable .hero-visual__fallback{position:relative;display:grid;place-items:center;min-height:clamp(320px,34vw,460px);aspect-ratio:1.12/1;border-radius:clamp(1.25rem,3vw,2rem);overflow:hidden;background:radial-gradient(circle at 18% 16%,rgba(255,255,255,.55),transparent 24%),linear-gradient(135deg,color-mix(in srgb,var(--prod-primary),#fff 16%),color-mix(in srgb,var(--prod-primary),#fff 72%));border:1px solid rgba(255,255,255,.72);box-shadow:0 18px 44px rgba(15,23,42,.12);}
body.gravity-production-stable .hero-visual__frame img{width:100%;height:100%;object-fit:cover;display:block;}
body.gravity-production-stable .hero-visual--fallback .hero-visual__frame img,body.gravity-production-stable .hero-visual--low-confidence .hero-visual__frame img{display:none!important;}
body.gravity-production-stable .hero-visual__fallback-inner{position:relative;z-index:2;display:grid;gap:.75rem;place-items:start;width:min(82%,28rem);padding:1.35rem;border-radius:1.3rem;background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.75);box-shadow:0 16px 36px rgba(15,23,42,.12);}
body.gravity-production-stable .hero-visual__fallback-kicker{font-size:.72rem;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:var(--prod-primary);}
body.gravity-production-stable .hero-visual__fallback-title{font-size:clamp(1.25rem,2vw,1.85rem);font-weight:950;line-height:1.08;color:var(--prod-text);}
body.gravity-production-stable .hero-visual__fallback-text{color:var(--prod-muted);font-weight:650;}
body.gravity-production-stable .conversion-proof-strip{padding:clamp(1.2rem,2.5vw,2.2rem) 0!important;}
body.gravity-production-stable .conversion-proof-strip__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(.75rem,1.5vw,1rem);}
body.gravity-production-stable .conversion-proof-item{min-height:6rem;padding:1rem;border-radius:1.25rem;background:#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--prod-shadow-soft)!important;}
body.gravity-production-stable .block-section__inner,body.gravity-production-stable .section-shell{position:relative;width:100%;min-width:0;}
body.gravity-production-stable .shell-panel,body.gravity-production-stable .shell-band,body.gravity-production-stable .shell-comparison,body.gravity-production-stable .shell-plain{padding:clamp(1.15rem,2.5vw,1.75rem);border-radius:var(--prod-radius);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.88))!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--prod-shadow-soft);}
body.gravity-production-stable .block__header{display:grid;gap:.35rem;max-width:860px;margin:0 0 clamp(1.35rem,2.6vw,2rem)!important;}
body.gravity-production-stable .block__header p,body.gravity-production-stable .block__subtitle{max-width:68ch;color:var(--prod-muted);}
body.gravity-production-stable .service-card,body.gravity-production-stable .proof-card,body.gravity-production-stable .step-card,body.gravity-production-stable .price-card,body.gravity-production-stable .faq-item,body.gravity-production-stable .faq-item-refined,body.gravity-production-stable .faq-entry,body.gravity-production-stable .testimonial-card,body.gravity-production-stable .semantic-card,body.gravity-production-stable .trust-band__pill-card,body.gravity-production-stable .trust-band__signal-card,body.gravity-production-stable .proof-row,body.gravity-production-stable .criteria-row,body.gravity-production-stable .step-tile,body.gravity-production-stable .process-step-rail__body,body.gravity-production-stable .map-block__support,body.gravity-production-stable .cta-panel__consult-card{position:relative;min-width:0;padding:clamp(1.05rem,2vw,1.45rem)!important;border-radius:var(--prod-card-radius)!important;background:#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--prod-shadow-soft)!important;overflow:hidden;}
body.gravity-production-stable .service-card:before,body.gravity-production-stable .proof-card:before,body.gravity-production-stable .price-card:before,body.gravity-production-stable .trust-band__signal-card:before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--prod-primary),transparent);opacity:.38;}
body.gravity-production-stable .service-card p,body.gravity-production-stable .proof-card p,body.gravity-production-stable .step-card p,body.gravity-production-stable .price-card p,body.gravity-production-stable .faq-entry p,body.gravity-production-stable .semantic-card p,body.gravity-production-stable .trust-band__signal-card p{color:var(--prod-muted)!important;line-height:1.64;}
body.gravity-production-stable .service-card__icon{width:2.65rem;height:2.65rem;border-radius:.9rem;background:rgba(var(--prod-primary-rgb),.08);border:1px solid rgba(var(--prod-primary-rgb),.14);display:grid;place-items:center;margin-bottom:.65rem;}
body.gravity-production-stable .services-grid__magazine,body.gravity-production-stable .local-proof__coverage,body.gravity-production-stable .process-steps__rail-layout,body.gravity-production-stable .price-guidance__insight,body.gravity-production-stable .cta-panel__consult,body.gravity-production-stable .map-block__context,body.gravity-production-stable .local-proof__list-layout,body.gravity-production-stable .local-proof__evidence-layout{display:grid!important;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr)!important;gap:clamp(1.1rem,2.8vw,2rem)!important;align-items:start;}
body.gravity-production-stable .services-grid__magazine-lead,body.gravity-production-stable .services-grid__magazine-stack,body.gravity-production-stable .local-proof__coverage-copy,body.gravity-production-stable .local-proof__coverage-cards,body.gravity-production-stable .process-steps__rail-copy,body.gravity-production-stable .price-guidance__insight-copy,body.gravity-production-stable .price-guidance__insight-panels,body.gravity-production-stable .cta-panel__consult-copy,body.gravity-production-stable .map-block__context-copy{display:grid!important;gap:1rem;min-width:0;}
body.gravity-production-stable .services-grid__cards,body.gravity-production-stable .local-proof__grid,body.gravity-production-stable .local-proof__minimal-grid,body.gravity-production-stable .process-steps__timeline,body.gravity-production-stable .process-steps__grid,body.gravity-production-stable .price-guidance__cards,body.gravity-production-stable .trust-band__signal-grid,body.gravity-production-stable .trust-band__pills--cards,body.gravity-production-stable .testimonials-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))!important;gap:1rem!important;align-items:stretch;}
body.gravity-production-stable .trust-band__signal-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))!important;}
body.gravity-production-stable .local-proof__signal-list{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:.85rem;}
body.gravity-production-stable .local-proof__signal,body.gravity-production-stable .trust-band__signal-card,body.gravity-production-stable .proof-row--stacked,body.gravity-production-stable .process-step-rail{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.85rem;align-items:start;}
body.gravity-production-stable .process-steps__rail{position:relative;display:grid!important;gap:.9rem;padding-left:0!important;}
body.gravity-production-stable .process-steps__rail:before{content:"";position:absolute;left:1.37rem;top:1rem;bottom:1rem;width:2px;background:linear-gradient(180deg,rgba(var(--prod-primary-rgb),.25),rgba(var(--prod-primary-rgb),.05));}
body.gravity-production-stable .process-step-rail{position:relative;z-index:1;padding:0!important;}
body.gravity-production-stable .process-step-rail__index,body.gravity-production-stable .step-card__index,body.gravity-production-stable .local-proof__signal-index,body.gravity-production-stable .trust-band__signal-index,body.gravity-production-stable .proof-row__ordinal{display:grid;place-items:center;width:2.75rem;height:2.75rem;border-radius:999px;background:linear-gradient(135deg,var(--prod-primary),color-mix(in srgb,var(--prod-primary),#000 22%))!important;color:#fff!important;font-weight:950;box-shadow:0 10px 22px rgba(var(--prod-primary-rgb),.17);}
body.gravity-production-stable .service-card__meta,body.gravity-production-stable .step-card__meta,body.gravity-production-stable .step-row__meta,body.gravity-production-stable .proof-row__meta,body.gravity-production-stable .price-card__facts,body.gravity-production-stable .block__pills,body.gravity-production-stable .services-grid__trust,body.gravity-production-stable .urgency-banner__pills,body.gravity-production-stable .map-block__pills,body.gravity-production-stable .price-guidance__bullets,body.gravity-production-stable .process-steps__bullets,body.gravity-production-stable .cta-panel__bullets{display:flex;flex-wrap:wrap;gap:.48rem;list-style:none;margin:.9rem 0 0!important;padding:0!important;}
body.gravity-production-stable .service-card__meta li,body.gravity-production-stable .step-card__meta li,body.gravity-production-stable .step-row__meta li,body.gravity-production-stable .proof-row__meta li,body.gravity-production-stable .price-card__facts li,body.gravity-production-stable .block__pill,body.gravity-production-stable .price-guidance__bullets li,body.gravity-production-stable .process-steps__bullets li,body.gravity-production-stable .cta-panel__bullets li{display:inline-flex;align-items:center;min-height:2rem;padding:.42rem .62rem;border-radius:999px;background:rgba(var(--prod-primary-rgb),.055);border:1px solid rgba(var(--prod-primary-rgb),.11);color:var(--prod-primary);font-size:.82rem;font-weight:800;line-height:1.2;}
body.gravity-production-stable ul:empty,body.gravity-production-stable ol:empty,body.gravity-production-stable .service-card__meta:empty,body.gravity-production-stable .step-row__meta:empty,body.gravity-production-stable .proof-row__meta:empty{display:none!important;}
body.gravity-production-stable .urgency-banner{position:relative;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(150px,.28fr) minmax(210px,.45fr)!important;gap:1rem;align-items:center;padding:clamp(1.15rem,2.6vw,1.85rem)!important;border-radius:var(--prod-radius)!important;background:radial-gradient(circle at 100% 0,rgba(var(--prod-primary-rgb),.10),transparent 32%),#fff!important;border:1px solid rgba(var(--prod-primary-rgb),.16)!important;box-shadow:var(--prod-shadow)!important;}
body.gravity-production-stable .urgency-banner__rail{position:absolute;inset:0 auto 0 0;width:.38rem;background:var(--prod-primary);}
body.gravity-production-stable .urgency-banner__statbox{display:grid;justify-items:center;align-content:center;min-height:8rem;padding:1rem;border-radius:1.15rem;background:linear-gradient(180deg,#fff,rgba(248,250,252,.9));border:1px solid rgba(148,163,184,.16);box-shadow:var(--prod-shadow-soft);}
body.gravity-production-stable .urgency-banner__statvalue{font-size:1.55rem;color:var(--prod-primary);font-weight:950;line-height:1;}
body.gravity-production-stable .urgency-banner__cta{justify-self:end;width:100%;max-width:260px;}
body.gravity-production-stable .urgency-banner__cta .block__cta-group{margin:0!important;}
body.gravity-production-stable .faq-block__accordion,body.gravity-production-stable .faq-block__accordion--refined{display:grid;gap:.85rem;max-width:940px;}
body.gravity-production-stable .faq-summary-refined{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.75rem;padding:1rem 1.1rem!important;cursor:pointer;list-style:none;color:var(--prod-text);font-weight:900;}
body.gravity-production-stable .faq-summary-refined::-webkit-details-marker{display:none;}
body.gravity-production-stable .faq-summary-refined:after{content:"+";font-weight:950;color:var(--prod-primary);}
body.gravity-production-stable details[open]>.faq-summary-refined:after{content:"–";}
body.gravity-production-stable .faq-content-refined{padding:0 1.1rem 1.15rem 4.1rem!important;color:var(--prod-muted);}
body.gravity-production-stable .map-block__frame,body.gravity-production-stable .map-wrapper,body.gravity-production-stable .map-boxed-wrapper,body.gravity-production-stable .map-directory__visual{position:relative;min-height:clamp(320px,42vw,460px)!important;border-radius:var(--prod-radius)!important;background:linear-gradient(135deg,#dbe4ee,#f8fafc)!important;border:1px solid rgba(148,163,184,.18)!important;box-shadow:var(--prod-shadow)!important;overflow:hidden;}
body.gravity-production-stable .map-block__iframe,body.gravity-production-stable .map-iframe,body.gravity-production-stable iframe.map-iframe{display:block;width:100%;height:100%;min-height:inherit;border:0;filter:saturate(.88) contrast(.96);}
body.gravity-production-stable .map-block__overlay{position:absolute;left:1rem;right:1rem;bottom:1rem;display:flex;justify-content:space-between;gap:.7rem;pointer-events:none;}
body.gravity-production-stable .map-block__overlay-badge,body.gravity-production-stable .map-block__overlay-city{display:inline-flex;align-items:center;min-height:2.3rem;padding:.52rem .78rem;border-radius:999px;background:rgba(255,255,255,.94)!important;border:1px solid rgba(255,255,255,.75)!important;color:var(--prod-text)!important;font-weight:950;box-shadow:0 8px 20px rgba(15,23,42,.12);}
body.gravity-production-stable .map-block__support h3{margin-bottom:.45rem!important;}
body.gravity-production-stable .block__cta-group{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;margin-top:1.1rem!important;}
body.gravity-production-stable .block__cta-note,body.gravity-production-stable .block__cta-phone{display:inline-flex;align-items:center;min-height:2.7rem;max-width:34rem;padding:.68rem .85rem;border-radius:999px;background:rgba(15,23,42,.035);border:1px solid rgba(148,163,184,.14);color:var(--prod-muted);font-size:.88rem;font-weight:650;line-height:1.25;}
body.gravity-production-stable .cta-panel__consult-card,body.gravity-production-stable .section-cta--terminal,body.gravity-production-stable .cta-panel__banner{background:radial-gradient(circle at 100% 0,rgba(var(--prod-primary-rgb),.11),transparent 34%),linear-gradient(135deg,#fff,rgba(248,250,252,.94))!important;border:1px solid rgba(var(--prod-primary-rgb),.16)!important;box-shadow:var(--prod-shadow)!important;}
body.gravity-production-stable .internal-links-hub{padding:clamp(2.5rem,5vw,4.5rem) 0!important;margin:0!important;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(var(--prod-primary-rgb),.035),rgba(255,255,255,0));}
body.gravity-production-stable .internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))!important;gap:1rem!important;}
body.gravity-production-stable .internal-links-item{padding:1.25rem!important;border-radius:1.25rem!important;background:#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--prod-shadow-soft)!important;}
body.gravity-production-stable .footer-editorial{padding:clamp(2.5rem,5vw,4.5rem) 0!important;background:radial-gradient(circle at 0 0,rgba(var(--prod-primary-rgb),.35),transparent 34%),linear-gradient(135deg,#0f172a,#020617)!important;color:#fff!important;}
body.gravity-production-stable .footer__grid-refined,body.gravity-production-stable .footer__links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))!important;gap:1.5rem!important;}
@media(max-width:980px){
  body.gravity-production-stable .hero__minimal,body.gravity-production-stable .hero__shell,body.gravity-production-stable .hero__centered--with-media,body.gravity-production-stable .services-grid__magazine,body.gravity-production-stable .local-proof__coverage,body.gravity-production-stable .process-steps__rail-layout,body.gravity-production-stable .price-guidance__insight,body.gravity-production-stable .cta-panel__consult,body.gravity-production-stable .map-block__context,body.gravity-production-stable .local-proof__list-layout,body.gravity-production-stable .local-proof__evidence-layout,body.gravity-production-stable .urgency-banner{grid-template-columns:minmax(0,1fr)!important;}
  body.gravity-production-stable .hero-visual{grid-column:auto!important;grid-row:auto!important;}
  body.gravity-production-stable h1{max-width:100%;}
  body.gravity-production-stable .conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  body.gravity-production-stable .urgency-banner__cta{justify-self:stretch;max-width:none;}
}
@media(max-width:680px){
  body.gravity-production-stable{font-size:15px;}
  body.gravity-production-stable .el-container{padding-inline:1rem;}
  body.gravity-production-stable .site-header{padding:.55rem .55rem;}
  body.gravity-production-stable .site-header__inner{border-radius:1.1rem;}
  body.gravity-production-stable .nav--desktop{display:none!important;}
  body.gravity-production-stable .nav-mobile{display:block!important;margin-left:auto;}
  body.gravity-production-stable .hero__minimal,body.gravity-production-stable .hero__shell{padding:1rem!important;border-radius:1.35rem!important;}
  body.gravity-production-stable .hero-visual__frame,body.gravity-production-stable .hero-visual__fallback{min-height:260px;}
  body.gravity-production-stable .conversion-proof-strip__grid{grid-template-columns:1fr;}
  body.gravity-production-stable .local-proof__signal,body.gravity-production-stable .trust-band__signal-card,body.gravity-production-stable .proof-row--stacked,body.gravity-production-stable .process-step-rail{grid-template-columns:minmax(0,1fr)!important;}
  body.gravity-production-stable .process-steps__rail:before{display:none;}
  body.gravity-production-stable .block__cta-group,body.gravity-production-stable .map-block__overlay{flex-direction:column;align-items:stretch;}
  body.gravity-production-stable .cta-primary,body.gravity-production-stable .block__cta-note,body.gravity-production-stable .block__cta-phone{width:100%;max-width:100%;}
  body.gravity-production-stable .faq-content-refined{padding-left:1.1rem!important;}
}
`;
