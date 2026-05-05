import * as cheerio from 'cheerio';

export interface ReleaseVisualFreezeContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

type CheerioAPI = cheerio.CheerioAPI;

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeLocalAssetSrc(src: string): string {
  let value = clean(src).replace(/\\/g, '/');
  if (!value || /^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(value)) return value;
  value = value.replace(/^\.\//, '').replace(/^\/+(?!(?:assets|images|img|media|static)\/)/i, '');
  if (/^(?:assets|images|img|media|static)\//i.test(value)) return `./${value}`;
  if (/^[\w.-]+\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(value)) return `./${value}`;
  if (/^(?:\.\.\/)+/.test(value)) return value;
  if (/^\//.test(value)) return value;
  return value;
}

function normalizeClientText(value: string, context: ReleaseVisualFreezeContext): string {
  const city = clean(context.city || 'tu zona');
  const service = clean(context.niche || 'servicio').toLowerCase();
  let out = String(value || '');

  out = out
    .replace(/\{\{.*?\}\}|\[\[.*?\]\]|__[^_]+__|\$\{.*?\}|\[object Object\]|\bundefined\b|\bnull\b/gi, ' ')
    .replace(/^\s*:\s*(?:este\s+bloque|bloque)\b[^.?!]*(?:[.?!]|$)/i, '')
    .replace(/\b(?:visible\s+para|debug|fallback|placeholder|mock|lorem ipsum)\s*:?[\w\s,.-]*/gi, ' ')
    .replace(/\bcriterio\s+\d+\b\s*:*/gi, 'Aspecto clave')
    .replace(/\bfactor\s+\d+\b\s*:*/gi, 'Factor que influye')
    .replace(/\btestimonios\s+locales\b/gi, 'Señales de confianza locales')
    .replace(/\blo\s+que\s+dicen\s+nuestros\s+clientes\b/gi, 'Qué conviene comprobar antes de contratar')
    .replace(/\bnuestros\s+clientes\s+opinan\b/gi, 'Criterios para valorar el servicio')
    .replace(/\breseñas?\s+verificadas?\b/gi, 'referencias comprobables')
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\ben\s+conviene\b/gi, `en ${city} conviene`)
    .replace(/\bcoherente\s+con\s*\./gi, `coherente con la cobertura indicada en ${city}.`)
    .replace(/\baverías\s+comunes\s+en\s+y\b/gi, `averías comunes en ${city} y`)
    .replace(/\bservicios\s+de\s+en\b/gi, `servicios de ${service} en`)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (/^(?:aspecto clave|factor que influye)\s*$/i.test(out)) {
    out = `Aspecto clave del servicio de ${service} en ${city}`;
  }
  return out;
}

function ensureContactAnchor($: CheerioAPI): void {
  if ($('#contacto').length) return;
  const footer = $('footer').first();
  if (footer.length) {
    footer.attr('id', 'contacto');
    return;
  }
  $('body').append('<section id="contacto" class="release-contact-anchor" aria-label="Contacto"></section>');
}

function normalizeNavigation($: CheerioAPI): void {
  $('.nav-mobile').each((_i, el) => {
    const $el = $(el);
    $el.removeAttr('open');
    $el.attr('data-release-mobile-nav', 'closed');
    $el.find('.nav-mobile__summary').attr('aria-label', 'Abrir menú');
  });
  $('.nav--desktop').attr('data-release-desktop-nav', 'true');
  $('.site-header').attr('data-release-nav-lock', 'true');
}

function normalizeImages($: CheerioAPI, context: ReleaseVisualFreezeContext): void {
  $('img').each((_i, el) => {
    const $el = $(el);
    const src = clean($el.attr('src'));
    if (src) $el.attr('src', normalizeLocalAssetSrc(src));
    if (!$el.attr('alt')) {
      $el.attr('alt', `${clean(context.niche || 'Servicio profesional')} en ${clean(context.city || 'tu zona')}`);
    }
    if (!$el.attr('decoding')) $el.attr('decoding', 'async');
  });

  $('.hero-visual__frame, .hero-visual').each((_i, el) => {
    const $el = $(el);
    $el.attr('data-release-hero-safe', 'true');
    if ($el.find('img').length === 0 && !$el.find('.release-hero-fallback').length) {
      $el.append('<div class="release-hero-fallback" aria-hidden="true"><span></span><span></span><span></span></div>');
    }
  });
}

function cleanupEmptyAndBrokenNodes($: CheerioAPI): void {
  $('ul, ol').each((_i, el) => {
    const $el = $(el);
    if ($el.children('li').length === 0 && clean($el.text()).length === 0) $el.remove();
  });
  $('article, .service-card, .proof-card, .step-card, .price-card, .semantic-card, .faq-item, .faq-entry, .trust-band__signal-card, .internal-links-item').each((_i, el) => {
    const $el = $(el);
    const text = clean($el.text());
    const hasMedia = $el.find('img, iframe, svg').length > 0;
    if (!text && !hasMedia) $el.remove();
  });
  $('p, li, h2, h3, span, small').each((_i, el) => {
    const $el = $(el);
    if (!clean($el.text()) && $el.children().length === 0) $el.remove();
  });
}

function designLooseLists($: CheerioAPI): void {
  $('main section ul, main section ol, .block-section ul, .block-section ol, .semantic-section ul, .semantic-section ol').each((_i, el) => {
    const $el = $(el);
    if ($el.closest('nav, header, footer, .nav-mobile, .nav__links-group, .footer__nav-list').length) return;
    const existing = clean($el.attr('class'));
    if (!existing) $el.addClass('release-designed-list');
    else if (!/(?:meta|pills|nav|links|breadcrumb|faq|footer)/i.test(existing)) $el.addClass('release-designed-list');
  });
}

function repairAnchors($: CheerioAPI): void {
  ensureContactAnchor($);
  const ids = new Set<string>();
  $('[id]').each((_i, el) => {
    const id = clean($(el).attr('id'));
    if (id) ids.add(id);
  });
  $('a[href^="#"]').each((_i, el) => {
    const $el = $(el);
    const href = clean($el.attr('href'));
    const target = href.slice(1);
    if (!target || !ids.has(target)) $el.attr('href', '#contacto');
  });
}

function cleanVisibleText($: CheerioAPI, context: ReleaseVisualFreezeContext): void {
  $('body').find('*').contents().each((_i, node: any) => {
    if (node.type !== 'text') return;
    const before = String(node.data || '');
    const after = normalizeClientText(before, context);
    node.data = after ? (before.startsWith(' ') ? ` ${after}` : after) : ' ';
  });

  $('[alt], [title], [aria-label], [placeholder], [content]').each((_i, el) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const raw = $el.attr(attr);
      if (!raw) continue;
      $el.attr(attr, normalizeClientText(raw, context));
    }
  });
}

function normalizeBodyClasses($: CheerioAPI): void {
  const body = $('body').first();
  if (!body.length) return;
  const classes = new Set(clean(body.attr('class')).split(/\s+/).filter(Boolean));
  classes.add('gravity-release-visual-freeze');
  classes.add('gravity-delivery-stable');
  classes.delete('paradigm-bento_grid_system');
  classes.delete('paradigm-experimental');
  body.attr('class', Array.from(classes).join(' '));
}

function ensureReleaseCss($: CheerioAPI): void {
  $('#gravity-release-visual-freeze-css').remove();
  $('head').append(`<style id="gravity-release-visual-freeze-css">${RELEASE_VISUAL_FREEZE_CSS}</style>`);
}

export function applyReleaseVisualFreeze(html: string, context: ReleaseVisualFreezeContext = {}): string {
  const source = String(html || '').normalize('NFC');
  const $ = cheerio.load(source, { decodeEntities: false });
  if (!$('html').length) $.root().wrap('<html></html>');
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');

  normalizeBodyClasses($);
  ensureContactAnchor($);
  normalizeNavigation($);
  normalizeImages($, context);
  cleanVisibleText($, context);
  designLooseLists($);
  cleanupEmptyAndBrokenNodes($);
  repairAnchors($);
  ensureReleaseCss($);

  return $.html({ decodeEntities: false })
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const RELEASE_VISUAL_FREEZE_CSS = `
/* === Gravity Release Visual Freeze v1 === */
:root{--rvf-bg:var(--bg,#f8fafc);--rvf-surface:#fff;--rvf-text:var(--text,#0f172a);--rvf-muted:var(--muted,#475569);--rvf-primary:var(--primary,#0f766e);--rvf-primary-rgb:var(--primary-rgb,15,118,110);--rvf-border:rgba(148,163,184,.18);--rvf-shadow:0 10px 30px rgba(15,23,42,.07);--rvf-shadow-soft:0 5px 16px rgba(15,23,42,.045);--rvf-radius:clamp(1rem,2vw,1.55rem);--rvf-section-y:clamp(3rem,5vw,5.2rem)}
html,body{max-width:100%;overflow-x:clip}body.gravity-release-visual-freeze{background:linear-gradient(180deg,#fff 0%,var(--rvf-bg) 46%,#fff 100%)!important;color:var(--rvf-text)!important;line-height:1.68}body.gravity-release-visual-freeze *{box-sizing:border-box}body.gravity-release-visual-freeze img,body.gravity-release-visual-freeze iframe,body.gravity-release-visual-freeze svg,body.gravity-release-visual-freeze video{max-width:100%}body.gravity-release-visual-freeze .el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem)}
body.gravity-release-visual-freeze .site-header{position:sticky!important;top:0;z-index:100;padding:.65rem 0;background:rgba(255,255,255,.96)!important;border-bottom:1px solid rgba(148,163,184,.12);box-shadow:0 8px 22px rgba(15,23,42,.045)}body.gravity-release-visual-freeze .site-header__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem;min-height:3.7rem;padding:.55rem .75rem;border-radius:999px;background:#fff;border:1px solid rgba(148,163,184,.14);box-shadow:var(--rvf-shadow-soft)}body.gravity-release-visual-freeze .brand,body.gravity-release-visual-freeze .brand__name{font-weight:950;letter-spacing:-.025em;color:var(--rvf-text)!important;text-decoration:none;white-space:nowrap}
@media (min-width:761px){body.gravity-release-visual-freeze .nav--desktop{display:flex!important;align-items:center!important;gap:.55rem!important}body.gravity-release-visual-freeze .nav-mobile{display:none!important}body.gravity-release-visual-freeze .nav-mobile__panel{display:none!important}}@media (max-width:760px){body.gravity-release-visual-freeze .nav--desktop{display:none!important}body.gravity-release-visual-freeze .nav-mobile{display:block!important;margin-left:auto}body.gravity-release-visual-freeze .nav-mobile:not([open]) .nav-mobile__panel{display:none!important}body.gravity-release-visual-freeze .nav-mobile[open] .nav-mobile__panel{display:grid!important}}
body.gravity-release-visual-freeze .nav__links-group,body.gravity-release-visual-freeze .nav-mobile__links{display:flex;align-items:center;gap:.25rem;flex-wrap:wrap}body.gravity-release-visual-freeze .nav__link,body.gravity-release-visual-freeze .nav-mobile__link{display:inline-flex;align-items:center;min-height:2.45rem;padding:.56rem .78rem;border-radius:999px;color:var(--rvf-text)!important;font-weight:850;font-size:.92rem;text-decoration:none}body.gravity-release-visual-freeze .nav__link:hover,body.gravity-release-visual-freeze .nav__link.is-active{background:rgba(15,23,42,.055)}body.gravity-release-visual-freeze .nav-mobile__summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;min-height:2.55rem;padding:0 .9rem;border-radius:999px;background:#fff;border:1px solid var(--rvf-border);font-weight:900}body.gravity-release-visual-freeze .nav-mobile__summary::-webkit-details-marker{display:none}body.gravity-release-visual-freeze .nav-mobile__panel{position:absolute;right:1rem;margin-top:.75rem;width:min(22rem,calc(100vw - 2rem));padding:.9rem;border-radius:1.15rem;background:#fff;border:1px solid var(--rvf-border);box-shadow:var(--rvf-shadow);z-index:100}
body.gravity-release-visual-freeze .el-section-wrapper{padding-block:0!important;background:transparent!important}body.gravity-release-visual-freeze .block-section,body.gravity-release-visual-freeze .semantic-section,body.gravity-release-visual-freeze .el-section{padding:var(--rvf-section-y) 0!important}body.gravity-release-visual-freeze h1,body.gravity-release-visual-freeze h2,body.gravity-release-visual-freeze h3{color:var(--rvf-text)!important;letter-spacing:-.035em;line-height:1.08;text-wrap:balance;margin-top:0}body.gravity-release-visual-freeze h1{font-size:clamp(2.15rem,4.8vw,4.45rem)!important;max-width:15ch;margin-bottom:1rem!important}body.gravity-release-visual-freeze h2{font-size:clamp(1.65rem,3vw,2.55rem)!important;max-width:18ch;margin-bottom:.85rem!important}body.gravity-release-visual-freeze h3{font-size:clamp(1.08rem,1.55vw,1.35rem)!important;margin-bottom:.55rem!important}body.gravity-release-visual-freeze p{color:var(--rvf-muted);margin:0}
body.gravity-release-visual-freeze .hero{padding-top:clamp(1.4rem,3vw,2.3rem)!important}body.gravity-release-visual-freeze .hero__minimal,body.gravity-release-visual-freeze .hero__shell,body.gravity-release-visual-freeze .hero__centered--with-media{display:grid!important;grid-template-columns:minmax(0,.98fr) minmax(300px,.74fr)!important;align-items:center!important;gap:clamp(1.25rem,3.5vw,3rem)!important;max-width:1180px!important;margin-inline:auto!important;padding:clamp(1.35rem,3vw,2.65rem)!important;border-radius:clamp(1.3rem,2.4vw,2rem)!important;background:radial-gradient(circle at 100% 0,rgba(var(--rvf-primary-rgb),.10),transparent 34%),#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--rvf-shadow)!important;color:var(--rvf-text)!important;overflow:hidden}body.gravity-release-visual-freeze .hero__minimal>.hero__eyebrow,body.gravity-release-visual-freeze .hero__minimal>h1,body.gravity-release-visual-freeze .hero__minimal>.hero__subtitle,body.gravity-release-visual-freeze .hero__minimal>.cta-row,body.gravity-release-visual-freeze .hero__minimal>.hero__bullets{grid-column:1}body.gravity-release-visual-freeze .hero__minimal>.hero-visual{grid-column:2;grid-row:1/span 7;margin:0!important}body.gravity-release-visual-freeze .hero h1{max-width:15ch!important}body.gravity-release-visual-freeze .hero__subtitle{font-size:clamp(1.03rem,1.45vw,1.22rem)!important;max-width:62ch;color:var(--rvf-muted)!important}
body.gravity-release-visual-freeze .hero__eyebrow,body.gravity-release-visual-freeze .block__eyebrow,body.gravity-release-visual-freeze .card__eyebrow{display:inline-flex;width:max-content;max-width:100%;align-items:center;min-height:2rem;padding:.38rem .68rem;border-radius:999px;background:rgba(var(--rvf-primary-rgb),.075);border:1px solid rgba(var(--rvf-primary-rgb),.13);color:var(--rvf-primary)!important;font-size:.76rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.85rem}body.gravity-release-visual-freeze .hero-visual,body.gravity-release-visual-freeze .hero-visual__frame{min-width:0}body.gravity-release-visual-freeze .hero-visual__frame{position:relative;min-height:clamp(280px,34vw,440px)!important;border-radius:clamp(1.15rem,2vw,1.65rem)!important;overflow:hidden;background:radial-gradient(circle at 70% 18%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,var(--rvf-primary),color-mix(in srgb,var(--rvf-primary),#fff 26%))!important;box-shadow:var(--rvf-shadow)!important;border:1px solid rgba(255,255,255,.75)!important}body.gravity-release-visual-freeze .hero-visual__frame img{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover}body.gravity-release-visual-freeze .release-hero-fallback{position:absolute;inset:0;display:grid;place-items:center;opacity:.16;pointer-events:none}body.gravity-release-visual-freeze .release-hero-fallback span{position:absolute;border-radius:999px;background:#fff}body.gravity-release-visual-freeze .release-hero-fallback span:nth-child(1){width:42%;height:42%;right:8%;top:8%}body.gravity-release-visual-freeze .release-hero-fallback span:nth-child(2){width:28%;height:28%;left:15%;bottom:18%}body.gravity-release-visual-freeze .release-hero-fallback span:nth-child(3){width:14%;height:14%;left:48%;top:42%}
body.gravity-release-visual-freeze .block__header,body.gravity-release-visual-freeze .section-title{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.35rem;margin-bottom:clamp(1.15rem,2.5vw,2rem)!important;max-width:780px}body.gravity-release-visual-freeze .block__header p,body.gravity-release-visual-freeze .block__subtitle{max-width:68ch;color:var(--rvf-muted);font-size:clamp(1rem,1.3vw,1.12rem)}body.gravity-release-visual-freeze .services-grid__cards,body.gravity-release-visual-freeze .semantic-items,body.gravity-release-visual-freeze .trust-grid,body.gravity-release-visual-freeze .local-proof__grid,body.gravity-release-visual-freeze .local-proof__signal-list,body.gravity-release-visual-freeze .process-steps__timeline,body.gravity-release-visual-freeze .price-guidance__cards,body.gravity-release-visual-freeze .testimonials-grid,body.gravity-release-visual-freeze .internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr))!important;gap:clamp(.9rem,1.8vw,1.25rem)!important;align-items:stretch}body.gravity-release-visual-freeze .services-grid__magazine,body.gravity-release-visual-freeze .local-proof__coverage,body.gravity-release-visual-freeze .process-steps__rail-layout,body.gravity-release-visual-freeze .price-guidance__insight,body.gravity-release-visual-freeze .cta-panel__consult,body.gravity-release-visual-freeze .map-block__context{display:grid!important;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important;gap:clamp(1.1rem,2.8vw,2.25rem)!important;align-items:start}
body.gravity-release-visual-freeze .service-card,body.gravity-release-visual-freeze .proof-card,body.gravity-release-visual-freeze .step-card,body.gravity-release-visual-freeze .price-card,body.gravity-release-visual-freeze .faq-item,body.gravity-release-visual-freeze .faq-entry,body.gravity-release-visual-freeze .faq-item-refined,body.gravity-release-visual-freeze .testimonial-card,body.gravity-release-visual-freeze .semantic-card,body.gravity-release-visual-freeze .trust-band__signal-card,body.gravity-release-visual-freeze .conversion-proof-item,body.gravity-release-visual-freeze .internal-links-item,body.gravity-release-visual-freeze .services-grid__magazine-feature,body.gravity-release-visual-freeze .process-step-rail__body,body.gravity-release-visual-freeze .map-block__support{min-width:0;border-radius:var(--rvf-radius)!important;background:#fff!important;border:1px solid var(--rvf-border)!important;box-shadow:var(--rvf-shadow-soft)!important;padding:clamp(1.05rem,2vw,1.45rem)!important}body.gravity-release-visual-freeze .process-step-rail,body.gravity-release-visual-freeze .local-proof__signal,body.gravity-release-visual-freeze .trust-band__signal-card,body.gravity-release-visual-freeze .proof-row--stacked{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.85rem;align-items:start}body.gravity-release-visual-freeze .service-card__icon,body.gravity-release-visual-freeze .process-step-rail__index,body.gravity-release-visual-freeze .step-card__index,body.gravity-release-visual-freeze .local-proof__signal-index,body.gravity-release-visual-freeze .trust-band__signal-index,body.gravity-release-visual-freeze .proof-row__ordinal{display:inline-grid;place-items:center;width:2.6rem;height:2.6rem;border-radius:999px;background:linear-gradient(135deg,var(--rvf-primary),color-mix(in srgb,var(--rvf-primary),#000 20%))!important;color:#fff!important;font-weight:950;box-shadow:0 9px 20px rgba(var(--rvf-primary-rgb),.17)}
body.gravity-release-visual-freeze .release-designed-list{display:grid!important;gap:.65rem!important;list-style:none!important;margin:.9rem 0 0!important;padding:0!important}body.gravity-release-visual-freeze .release-designed-list>li{position:relative;padding:.78rem .9rem .78rem 2.2rem!important;border-radius:.9rem;background:#fff;border:1px solid var(--rvf-border);box-shadow:var(--rvf-shadow-soft);color:var(--rvf-muted)}body.gravity-release-visual-freeze .release-designed-list>li:before{content:'✓';position:absolute;left:.75rem;top:.78rem;display:grid;place-items:center;width:1.05rem;height:1.05rem;border-radius:999px;background:rgba(var(--rvf-primary-rgb),.09);color:var(--rvf-primary);font-weight:950;font-size:.7rem}
body.gravity-release-visual-freeze .service-card__meta,body.gravity-release-visual-freeze .step-card__meta,body.gravity-release-visual-freeze .step-row__meta,body.gravity-release-visual-freeze .proof-row__meta,body.gravity-release-visual-freeze .price-card__facts,body.gravity-release-visual-freeze .services-grid__trust,body.gravity-release-visual-freeze .urgency-banner__pills,body.gravity-release-visual-freeze .block__pills{display:flex;flex-wrap:wrap;gap:.45rem;list-style:none;margin:.85rem 0 0!important;padding:0!important}body.gravity-release-visual-freeze .service-card__meta li,body.gravity-release-visual-freeze .step-card__meta li,body.gravity-release-visual-freeze .step-row__meta li,body.gravity-release-visual-freeze .proof-row__meta li,body.gravity-release-visual-freeze .price-card__facts li,body.gravity-release-visual-freeze .block__pill{display:inline-flex;align-items:center;min-height:1.95rem;padding:.38rem .6rem;border-radius:999px;background:rgba(var(--rvf-primary-rgb),.06);border:1px solid rgba(var(--rvf-primary-rgb),.11);color:var(--rvf-primary);font-size:.81rem;font-weight:850;line-height:1.15}
body.gravity-release-visual-freeze .urgency-banner,body.gravity-release-visual-freeze .cta-panel__banner,body.gravity-release-visual-freeze .section-cta--terminal{border-radius:var(--rvf-radius)!important;background:radial-gradient(circle at 100% 0,rgba(var(--rvf-primary-rgb),.09),transparent 32%),#fff!important;border:1px solid rgba(var(--rvf-primary-rgb),.15)!important;box-shadow:var(--rvf-shadow)!important}body.gravity-release-visual-freeze .urgency-banner{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(140px,.26fr) minmax(200px,.38fr)!important;gap:1rem;align-items:center;padding:clamp(1.15rem,2.4vw,1.75rem)!important;position:relative;overflow:hidden}body.gravity-release-visual-freeze .cta-primary,body.gravity-release-visual-freeze .nav__cta,body.gravity-release-visual-freeze .nav-mobile__cta,body.gravity-release-visual-freeze .card__btn,body.gravity-release-visual-freeze .internal-links-item__anchor{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:3rem;padding:.75rem 1.05rem;border-radius:999px;background:linear-gradient(135deg,var(--rvf-primary),color-mix(in srgb,var(--rvf-primary),#000 18%))!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)!important;font-weight:950;text-decoration:none;box-shadow:0 10px 22px rgba(var(--rvf-primary-rgb),.17)!important}
body.gravity-release-visual-freeze .faq-block__accordion,body.gravity-release-visual-freeze .faq-block__accordion--refined{display:grid;gap:.78rem;max-width:940px}body.gravity-release-visual-freeze .faq-summary-refined{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.75rem;cursor:pointer;list-style:none;color:var(--rvf-text);font-weight:900;padding:1rem 1.05rem!important}body.gravity-release-visual-freeze .faq-summary-refined::-webkit-details-marker{display:none}body.gravity-release-visual-freeze .faq-summary-refined:after{content:'+';font-weight:950;color:var(--rvf-primary)}body.gravity-release-visual-freeze details[open]>.faq-summary-refined:after{content:'–'}body.gravity-release-visual-freeze .faq-content-refined{padding:0 1.05rem 1.05rem 4rem!important;color:var(--rvf-muted)}body.gravity-release-visual-freeze .map-block__frame,body.gravity-release-visual-freeze .map-wrapper,body.gravity-release-visual-freeze .map-boxed-wrapper,body.gravity-release-visual-freeze .map-directory__visual{position:relative;min-height:clamp(300px,40vw,440px)!important;border-radius:var(--rvf-radius)!important;background:linear-gradient(135deg,#dbe4ee,#f8fafc)!important;border:1px solid var(--rvf-border)!important;box-shadow:var(--rvf-shadow)!important;overflow:hidden}body.gravity-release-visual-freeze .map-block__iframe,body.gravity-release-visual-freeze .map-iframe,body.gravity-release-visual-freeze iframe.map-iframe{display:block;width:100%;height:100%;min-height:inherit;border:0}
body.gravity-release-visual-freeze footer,body.gravity-release-visual-freeze .footer-editorial{padding:clamp(2.4rem,5vw,4.2rem) 0!important;background:linear-gradient(135deg,#0f172a,color-mix(in srgb,#0f172a,var(--rvf-primary) 18%))!important;color:#fff!important}body.gravity-release-visual-freeze footer p,body.gravity-release-visual-freeze footer a,body.gravity-release-visual-freeze .footer-editorial p,body.gravity-release-visual-freeze .footer-editorial a{color:rgba(255,255,255,.78)!important}body.gravity-release-visual-freeze footer h2,body.gravity-release-visual-freeze footer h3,body.gravity-release-visual-freeze footer strong,body.gravity-release-visual-freeze .footer-editorial h2,body.gravity-release-visual-freeze .footer-editorial h3,body.gravity-release-visual-freeze .footer-editorial strong{color:#fff!important}
body.gravity-release-visual-freeze ul:empty,body.gravity-release-visual-freeze ol:empty,body.gravity-release-visual-freeze p:empty,body.gravity-release-visual-freeze h2:empty,body.gravity-release-visual-freeze h3:empty,body.gravity-release-visual-freeze .service-card:empty,body.gravity-release-visual-freeze .step-card:empty,body.gravity-release-visual-freeze .semantic-card:empty{display:none!important}
@media (max-width:900px){body.gravity-release-visual-freeze .hero__minimal,body.gravity-release-visual-freeze .hero__shell,body.gravity-release-visual-freeze .hero__centered--with-media,body.gravity-release-visual-freeze .services-grid__magazine,body.gravity-release-visual-freeze .local-proof__coverage,body.gravity-release-visual-freeze .process-steps__rail-layout,body.gravity-release-visual-freeze .price-guidance__insight,body.gravity-release-visual-freeze .cta-panel__consult,body.gravity-release-visual-freeze .map-block__context,body.gravity-release-visual-freeze .urgency-banner{grid-template-columns:minmax(0,1fr)!important}body.gravity-release-visual-freeze .hero__minimal>.hero-visual{grid-column:auto!important;grid-row:auto!important}body.gravity-release-visual-freeze h1{max-width:100%!important}body.gravity-release-visual-freeze .urgency-banner__cta{justify-self:stretch!important;max-width:none!important}}@media (max-width:640px){body.gravity-release-visual-freeze .el-container{padding-inline:1rem!important}body.gravity-release-visual-freeze .site-header{padding:.5rem .65rem}body.gravity-release-visual-freeze .site-header__inner{border-radius:1.05rem}body.gravity-release-visual-freeze .hero__minimal,body.gravity-release-visual-freeze .hero__shell{padding:1.1rem!important;border-radius:1.25rem!important}body.gravity-release-visual-freeze .hero-visual__frame{min-height:245px!important}body.gravity-release-visual-freeze .cta-primary,body.gravity-release-visual-freeze .card__btn,body.gravity-release-visual-freeze .internal-links-item__anchor{width:100%!important}body.gravity-release-visual-freeze .process-step-rail,body.gravity-release-visual-freeze .local-proof__signal,body.gravity-release-visual-freeze .trust-band__signal-card,body.gravity-release-visual-freeze .proof-row--stacked{grid-template-columns:minmax(0,1fr)!important}body.gravity-release-visual-freeze .faq-content-refined{padding-left:1.05rem!important}}
`;
