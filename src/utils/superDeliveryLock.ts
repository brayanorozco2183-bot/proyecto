import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export interface SuperDeliveryLockContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
  canonical?: string;
}

const RELEASE_ID = 'super-delivery-lock-v2026-05-05';
const MARKER = 'GRAVITY_SUPER_DELIVERY_LOCK_APPLIED';

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(value: string): string {
  return clean(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cityLabel(context: SuperDeliveryLockContext): string {
  return clean(context.city || 'tu zona');
}

function nicheLabel(context: SuperDeliveryLockContext): string {
  const raw = clean(context.niche || 'servicio profesional');
  return raw ? titleCase(raw) : 'Servicio profesional';
}

function lowerNicheLabel(context: SuperDeliveryLockContext): string {
  return nicheLabel(context).toLowerCase();
}

function extractThemeTokens($: CheerioAPI): string {
  const firstStyle = $('style').first().text() || '';
  const match = firstStyle.match(/:root\s*\{[\s\S]*?\}/);
  if (!match) {
    return `:root{--bg:#f6f8fb;--surface:#ffffff;--text:#0f172a;--muted:#64748b;--primary:#0a192f;--primary-rgb:10,25,47;--accent:#0f766e;--border:rgba(148,163,184,.18);--font-display:Inter,system-ui,sans-serif;--font-body:Inter,system-ui,sans-serif;}`;
  }
  return match[0];
}

function removeStyleDebt($: CheerioAPI): void {
  // La entrega debe salir con una cascada única. Conservamos solo tokens de tema y CSS final.
  $('style').remove();
  $('link[rel="stylesheet"][data-gravity-legacy="true"]').remove();
}

function normalizeHtmlShell($: CheerioAPI): void {
  if (!$('html').length) {
    const html = $.root().html() || '';
    $.root().empty().append(`<html lang="es-ES"><head></head><body>${html}</body></html>`);
  }
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
  $('html').attr('lang', 'es-ES');
  $('meta[name="viewport"]').remove();
  $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  if (!$('meta[charset]').length) $('head').prepend('<meta charset="UTF-8">');
  if (!$('meta[name="format-detection"]').length) $('head').append('<meta name="format-detection" content="telephone=yes">');
  $('meta[name="gravity-release"]').remove();
  $('head').append(`<meta name="gravity-release" content="${RELEASE_ID}">`);
}

function ensureBodyState($: CheerioAPI): void {
  const body = $('body').first();
  if (!body.length) return;
  const keep = clean(body.attr('class') || '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((cls) => !/^gravity-(?:release|delivery|global|functional|premium|deterministic)/i.test(cls));
  keep.push('gravity-super-delivery-lock');
  body.attr('class', Array.from(new Set(keep)).join(' '));
  body.attr('data-gravity-release', RELEASE_ID);
}

function clientText(value: string, context: SuperDeliveryLockContext): string {
  const city = cityLabel(context);
  let out = String(value || '')
    .replace(/\{\{[^}]+\}\}|\[\[[^\]]+\]\]|__[^_]+__|\$\{[^}]+\}/g, ' ')
    .replace(/\[object Object\]/gi, ' ')
    .replace(/\bundefined\b|\bnull\b/gi, ' ')
    .replace(/:\s*este\s+bloque[^.?!]*(?:[.?!]|$)/gi, ' ')
    .replace(/\bvisible\s+para\s*:?/gi, ' ')
    .replace(/\bcoherente\s+con\s*\./gi, '.')
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\bSeñal\s*0?\d+\b/gi, 'Señal')
    .replace(/\bCriterio\s*0?\d+\b/gi, 'Criterio')
    .replace(/\bFactor\s*0?\d+\b/gi, 'Factor')
    .replace(/\bbombina\b/gi, 'bombín')
    .replace(/\bbombinas\b/gi, 'bombines')
    .replace(/Contactar\s*Cerrajer[ií]a\s+en\s+/gi, 'Contactar cerrajería en ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ');
  return out;
}

function normalizeTextNodes($: CheerioAPI, context: SuperDeliveryLockContext): void {
  $('body *').contents().each((_i, node: any) => {
    if (node.type !== 'text') return;
    const original = String(node.data || '');
    const next = clientText(original, context);
    if (next !== original) node.data = next;
  });
  $('[alt], [title], [aria-label], [placeholder], [content]').each((_i, el) => {
    const node = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const value = node.attr(attr);
      if (value) node.attr(attr, clientText(value, context).trim());
    }
  });
}

function normalizeHeadings($: CheerioAPI, context: SuperDeliveryLockContext): void {
  const city = cityLabel(context);
  const niche = lowerNicheLabel(context);
  const replacements: Array<[RegExp, string]> = [
    [/^Nuestros\s+Servicios$/i, `Servicios de ${niche} en ${city}`],
    [/^Servicios\s+Ofrecidos$/i, `Servicios de ${niche} en ${city}`],
    [/^Testimonios\s+Locales$/i, `Señales de confianza en ${city}`],
    [/^Lo\s+que\s+dicen\s+nuestros\s+clientes$/i, `Señales de confianza en ${city}`],
    [/^Precios\s+Condicionados$/i, 'Qué condiciona el presupuesto'],
    [/^Precios\s+y\s+Tarifas$/i, 'Qué condiciona el presupuesto'],
    [/^Contáctanos\s+Ahora(?:\s+mismo)?$/i, `Solicitar orientación en ${city}`],
    [/^Navegación\s+relacionada\s+del\s+proyecto$/i, `Más servicios relacionados en ${city}`],
    [/^Cómo\s+funciona\s+nuestro\s+servicio\??$/i, 'Proceso de trabajo'],
    [/^Proceso\s+de\s+Servicio$/i, 'Proceso de trabajo']
  ];
  $('h1,h2,h3,summary,.block__title,.section-title').each((_i, el) => {
    const node = $(el);
    const text = clean(node.text());
    if (!text) return;
    for (const [rx, repl] of replacements) {
      if (rx.test(text)) {
        node.text(repl);
        return;
      }
    }
  });
}

function normalizeBreadcrumbs($: CheerioAPI, context: SuperDeliveryLockContext): void {
  const candidates = $('.el-breadcrumbs, .breadcrumbs, [aria-label*="breadcrumb" i], [class*="breadcrumb" i]').filter((_i, el) => $(el).closest('script, style').length === 0);
  candidates.each((_i, el) => {
    const box = $(el);
    box.addClass('gsdl-breadcrumbs').attr('aria-label', box.attr('aria-label') || 'Breadcrumb');
    let list = box.find('ol,ul').first();
    if (!list.length) {
      const text = clean(box.text());
      const parts = text.split(/\s+›\s+|\s+\/\s+|\s{2,}/).filter(Boolean).slice(0, 4);
      if (parts.length) {
        box.empty().append(`<ol>${parts.map((part, idx) => `<li${idx === parts.length - 1 ? ' class="is-current"' : ''}>${escapeHtml(part)}</li>`).join('')}</ol>`);
        list = box.find('ol').first();
      }
    }
    list.addClass('gsdl-breadcrumbs__list');
    list.find('li').addClass('gsdl-breadcrumbs__item');
    list.find('a').addClass('gsdl-breadcrumbs__link');
  });

  $('main > p, body > p').each((_i, el) => {
    const node = $(el);
    const text = clean(node.text());
    if (/^Inicio\s+/.test(text) && new RegExp(cityLabel(context), 'i').test(text)) {
      const parts = text.split(/\s{2,}|\s+›\s+|\s+\/\s+/).filter(Boolean).slice(0, 3);
      if (parts.length >= 2) {
        node.replaceWith(`<nav class="gsdl-breadcrumbs" aria-label="Breadcrumb"><ol class="gsdl-breadcrumbs__list">${parts.map((part, idx) => `<li class="gsdl-breadcrumbs__item ${idx === parts.length - 1 ? 'is-current' : ''}">${escapeHtml(part)}</li>`).join('')}</ol></nav>`);
      }
    }
  });
}

function normalizeNavigation($: CheerioAPI): void {
  $('.nav-mobile').removeAttr('open').attr('data-gravity-mobile-nav', 'closed');
  $('.nav-mobile__panel').attr('data-gravity-menu-panel', 'true');
  $('.nav--desktop').attr('data-gravity-desktop-nav', 'true');
  $('.nav__cta,.nav-mobile__cta,.cta-primary,.card__btn,.internal-links-item__anchor').addClass('gsdl-button');
}

function normalizeHero($: CheerioAPI, context: SuperDeliveryLockContext): void {
  const hero = $('.hero').first();
  if (!hero.length) return;
  hero.addClass('gsdl-hero');
  const panel = hero.find('.hero__minimal,.hero__shell,.hero__centered--with-media').first();
  panel.addClass('gsdl-hero__panel');
  hero.find('h1').first().addClass('gsdl-hero__title');
  hero.find('.hero__subtitle,p').first().addClass('gsdl-hero__lead');
  hero.find('.cta-row').first().addClass('gsdl-hero__actions');
  const frame = hero.find('.hero-visual__frame,.hero__media,.hero-visual').first();
  if (frame.length) {
    frame.addClass('gsdl-hero__visual');
    if (!frame.find('.gsdl-hero__fallback').length) frame.append('<span class="gsdl-hero__fallback" aria-hidden="true"><i></i><i></i><i></i></span>');
  }
  hero.find('img').each((_i, el) => {
    const img = $(el);
    const src = clean(img.attr('src') || img.attr('data-src') || '');
    if (src && !/^(?:https?:|data:|\/)/i.test(src) && !src.startsWith('./')) img.attr('src', `./${src.replace(/^\.\//, '')}`);
    if (!img.attr('alt')) img.attr('alt', `${nicheLabel(context)} en ${cityLabel(context)}`);
    img.attr('loading', img.attr('loading') || 'eager');
    img.attr('decoding', img.attr('decoding') || 'async');
  });
}

function normalizeLists($: CheerioAPI): void {
  $('main section ul, main section ol, .block-section ul, .semantic-section ul').each((_i, el) => {
    const list = $(el);
    if (!list.children('li').length) return;
    const className = clean(list.attr('class') || '');
    if (!className || /(?:meta|facts|pills|trust|bullets|unstyled|coverage|signal|checks)/i.test(className)) {
      list.addClass('gsdl-list');
      list.children('li').addClass('gsdl-list__item');
    }
  });
}

function normalizeCardsAndBlocks($: CheerioAPI, context: SuperDeliveryLockContext): void {
  $('.conversion-proof-strip').addClass('gsdl-proof-strip');
  $('.conversion-proof-strip__grid').addClass('gsdl-proof-strip__grid');
  $('.conversion-proof-item').addClass('gsdl-proof-card');
  $('.conversion-proof-item__value').addClass('gsdl-proof-card__icon');
  $('.conversion-proof-item__label').addClass('gsdl-proof-card__title');
  $('.conversion-proof-item__text').addClass('gsdl-proof-card__text');

  $('.service-card,.proof-card,.step-card,.price-card,.semantic-card,.trust-band__signal-card,.internal-links-item,.faq-item,.faq-entry,.faq-item-refined,.map-block__support').addClass('gsdl-card');
  $('.services-grid__cards,.semantic-items,.trust-grid,.local-proof__grid,.local-proof__signal-list,.price-guidance__cards,.internal-links-grid').addClass('gsdl-grid');

  $('.local-proof__signal,.trust-band__signal-card,.proof-row--stacked').addClass('gsdl-signal-card');
  $('.local-proof__signal-index,.trust-band__signal-index,.proof-row__ordinal').each((_i, el) => {
    const node = $(el);
    node.addClass('gsdl-signal-check');
    if (/^\s*(?:\d+|0\d+|Señal)\s*$/i.test(node.text())) node.text('✓');
  });
  $('.process-step-rail,.step-card').addClass('gsdl-process-step');

  $('.map-block__frame,.map-wrapper,.map-boxed-wrapper,.map-directory__visual').addClass('gsdl-map-frame').each((_i, el) => {
    const frame = $(el);
    if (!frame.find('iframe,img').length && !frame.find('.gsdl-map-fallback').length) {
      frame.append(`<div class="gsdl-map-fallback"><strong>${escapeHtml(cityLabel(context))}</strong><span>Cobertura local organizada por zona</span></div>`);
    }
  });
}

function normalizeCtas($: CheerioAPI, context: SuperDeliveryLockContext): void {
  const city = cityLabel(context);
  $('.mobile-sticky-cta').remove();
  if (!$('.gsdl-mobile-cta').length) {
    $('body').append(`<aside class="gsdl-mobile-cta" aria-label="Contacto rápido"><span><strong>Contactar</strong><small>${escapeHtml(nicheLabel(context))} en ${escapeHtml(city)}</small></span><a class="gsdl-mobile-cta__button" href="#contacto" aria-label="Contactar">↗</a></aside>`);
  }
  $('a,button').each((_i, el) => {
    const node = $(el);
    const text = clean(node.text());
    if (/^Contactar\s*Cerrajer/i.test(text)) node.html('<span>Contactar</span>');
    if (/^(Llamar ahora|Contactar ahora mismo)$/i.test(text) && !String(node.attr('href') || '').startsWith('tel:')) node.text('Solicitar orientación');
  });
}

function fixInternalAnchors($: CheerioAPI): void {
  if (!$('#contacto').length) $('footer').first().attr('id', 'contacto');
  const ids = new Set($('[id]').map((_i, el) => clean($(el).attr('id'))).get().filter(Boolean));
  $('a[href^="#"]').each((_i, el) => {
    const node = $(el);
    const target = clean(node.attr('href')).slice(1);
    if (!target || !ids.has(target)) node.attr('href', '#contacto');
  });
}

function removeEmptyArtifacts($: CheerioAPI): void {
  $('ul:empty,ol:empty,p:empty,h2:empty,h3:empty,li:empty').remove();
  $('.service-card,.proof-card,.step-card,.price-card,.semantic-card,.faq-entry,.faq-item,.conversion-proof-item').each((_i, el) => {
    const node = $(el);
    if (!clean(node.text()) && !node.find('img,iframe,svg').length) node.remove();
  });
}

function css(): string {
  return `
/* === Gravity Super Delivery Lock v2026-05-05 === */
:root{--gsdl-bg:#f5f7fb;--gsdl-surface:#fff;--gsdl-text:var(--text,#0f172a);--gsdl-muted:var(--muted,#64748b);--gsdl-primary:var(--primary,#0a192f);--gsdl-primary-rgb:var(--primary-rgb,10,25,47);--gsdl-accent:var(--accent,#0f766e);--gsdl-border:rgba(148,163,184,.18);--gsdl-border-strong:rgba(148,163,184,.30);--gsdl-radius:18px;--gsdl-radius-lg:30px;--gsdl-shadow:0 18px 50px rgba(15,23,42,.08);--gsdl-shadow-soft:0 8px 24px rgba(15,23,42,.055);--gsdl-section:clamp(3.1rem,5vw,5.35rem)}
html,body{max-width:100%;overflow-x:clip}body.gravity-super-delivery-lock{margin:0;background:linear-gradient(180deg,#fff 0%,var(--gsdl-bg) 42%,#fff 100%)!important;color:var(--gsdl-text)!important;font-family:var(--font-body,Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);line-height:1.65}body.gravity-super-delivery-lock *{box-sizing:border-box}body.gravity-super-delivery-lock img,body.gravity-super-delivery-lock iframe,body.gravity-super-delivery-lock svg,body.gravity-super-delivery-lock video{max-width:100%}body.gravity-super-delivery-lock .el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem)}
body.gravity-super-delivery-lock .site-header{position:sticky!important;top:0;z-index:100;background:rgba(255,255,255,.96)!important;padding:.65rem 0;border-bottom:1px solid rgba(148,163,184,.12);box-shadow:0 8px 22px rgba(15,23,42,.045)}body.gravity-super-delivery-lock .site-header__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem;min-height:3.6rem;padding:.55rem .75rem;border-radius:999px;background:#fff;border:1px solid rgba(148,163,184,.14);box-shadow:var(--gsdl-shadow-soft)}body.gravity-super-delivery-lock .brand,body.gravity-super-delivery-lock .brand__name{font-weight:950;letter-spacing:-.025em;color:var(--gsdl-text)!important;text-decoration:none;white-space:nowrap}@media(min-width:761px){body.gravity-super-delivery-lock .nav--desktop{display:flex!important;align-items:center!important;gap:.45rem!important}body.gravity-super-delivery-lock .nav-mobile{display:none!important}body.gravity-super-delivery-lock .nav-mobile__panel{display:none!important}}@media(max-width:760px){body.gravity-super-delivery-lock .nav--desktop{display:none!important}body.gravity-super-delivery-lock .nav-mobile{display:block!important;margin-left:auto}body.gravity-super-delivery-lock .nav-mobile:not([open]) .nav-mobile__panel{display:none!important}body.gravity-super-delivery-lock .nav-mobile[open] .nav-mobile__panel{display:grid!important}}body.gravity-super-delivery-lock .nav__links-group,body.gravity-super-delivery-lock .nav-mobile__links{display:flex;align-items:center;gap:.25rem;flex-wrap:wrap}body.gravity-super-delivery-lock .nav__link,body.gravity-super-delivery-lock .nav-mobile__link{display:inline-flex;align-items:center;min-height:2.4rem;padding:.55rem .75rem;border-radius:999px;color:var(--gsdl-text)!important;font-weight:850;font-size:.9rem;text-decoration:none}body.gravity-super-delivery-lock .nav__link:hover,body.gravity-super-delivery-lock .nav__link.is-active{background:rgba(15,23,42,.055)}body.gravity-super-delivery-lock .nav-mobile__summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;min-height:2.5rem;padding:0 .9rem;border-radius:999px;background:#fff;border:1px solid var(--gsdl-border);font-weight:900}body.gravity-super-delivery-lock .nav-mobile__summary::-webkit-details-marker{display:none}body.gravity-super-delivery-lock .nav-mobile__panel{position:absolute;right:1rem;margin-top:.75rem;width:min(22rem,calc(100vw - 2rem));padding:.9rem;border-radius:1.15rem;background:#fff;border:1px solid var(--gsdl-border);box-shadow:var(--gsdl-shadow);z-index:100}
.gsdl-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.5rem;min-height:2.9rem;padding:.72rem 1.05rem;border-radius:999px!important;background:linear-gradient(135deg,var(--gsdl-primary),color-mix(in srgb,var(--gsdl-primary),#000 14%))!important;color:#fff!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.18)!important;font-weight:950!important;box-shadow:0 10px 22px rgba(var(--gsdl-primary-rgb),.16)!important;white-space:nowrap}
.gsdl-breadcrumbs{max-width:1180px;margin:.85rem auto 0;padding:0 clamp(1rem,3vw,2rem);font-size:.82rem;color:var(--gsdl-muted)}.gsdl-breadcrumbs__list{display:flex!important;align-items:center;gap:.45rem;flex-wrap:wrap;list-style:none!important;margin:0!important;padding:0!important}.gsdl-breadcrumbs__item,.gsdl-breadcrumbs__link{display:inline-flex;align-items:center;gap:.4rem;color:var(--gsdl-muted)!important;text-decoration:none!important}.gsdl-breadcrumbs__item:not(:last-child)::after{content:'›';opacity:.45;font-weight:900}.gsdl-breadcrumbs__item.is-current,.gsdl-breadcrumbs__item:last-child{color:var(--gsdl-text)!important;font-weight:850}
body.gravity-super-delivery-lock .block-section,body.gravity-super-delivery-lock .semantic-section,body.gravity-super-delivery-lock .el-section{padding:var(--gsdl-section) 0!important}body.gravity-super-delivery-lock .el-section-wrapper{padding-block:0!important;background:transparent!important}.block-section>.el-container,.semantic-section__container{border-radius:var(--gsdl-radius-lg)!important}.block__header,.section-title{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.35rem;margin-bottom:clamp(1.15rem,2.5vw,2rem)!important;max-width:820px}.block__subtitle,.block__header p{max-width:70ch;color:var(--gsdl-muted)!important;font-size:clamp(1rem,1.28vw,1.12rem)}body.gravity-super-delivery-lock h1,body.gravity-super-delivery-lock h2,body.gravity-super-delivery-lock h3{font-family:var(--font-display,Sora,Inter,system-ui,sans-serif);color:var(--gsdl-text)!important;letter-spacing:-.04em;line-height:1.06;text-wrap:balance;margin-top:0}body.gravity-super-delivery-lock h1{font-size:clamp(2.25rem,5vw,4.6rem)!important;max-width:15ch;margin-bottom:1rem!important}body.gravity-super-delivery-lock h2{font-size:clamp(1.72rem,3vw,2.65rem)!important;max-width:20ch;margin-bottom:.85rem!important}body.gravity-super-delivery-lock h3{font-size:clamp(1.08rem,1.55vw,1.35rem)!important;margin-bottom:.55rem!important}body.gravity-super-delivery-lock p{color:var(--gsdl-muted);margin:0}
.gsdl-hero{padding-top:clamp(1.35rem,3vw,2.4rem)!important}.gsdl-hero__panel,.hero__minimal,.hero__shell,.hero__centered--with-media{display:grid!important;grid-template-columns:minmax(0,.98fr) minmax(300px,.74fr)!important;align-items:center!important;gap:clamp(1.25rem,3.5vw,3rem)!important;max-width:1180px!important;margin-inline:auto!important;padding:clamp(1.35rem,3vw,2.65rem)!important;border-radius:var(--gsdl-radius-lg)!important;background:radial-gradient(circle at 100% 0,rgba(var(--gsdl-primary-rgb),.10),transparent 34%),#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--gsdl-shadow)!important;color:var(--gsdl-text)!important;overflow:hidden}.hero__minimal>.hero__eyebrow,.hero__minimal>h1,.hero__minimal>.hero__subtitle,.hero__minimal>.cta-row,.hero__minimal>.hero__bullets{grid-column:1}.hero__minimal>.hero-visual{grid-column:2;grid-row:1/span 7;margin:0!important}.hero__subtitle,.gsdl-hero__lead{font-size:clamp(1.03rem,1.45vw,1.22rem)!important;max-width:62ch;color:var(--gsdl-muted)!important}.hero__eyebrow,.block__eyebrow,.card__eyebrow{display:inline-flex;width:max-content;max-width:100%;align-items:center;min-height:2rem;padding:.38rem .68rem;border-radius:999px;background:rgba(var(--gsdl-primary-rgb),.075);border:1px solid rgba(var(--gsdl-primary-rgb),.13);color:var(--gsdl-primary)!important;font-size:.76rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.85rem}.gsdl-hero__visual,.hero-visual__frame{position:relative;min-height:clamp(280px,34vw,440px)!important;border-radius:clamp(1.15rem,2vw,1.65rem)!important;overflow:hidden;background:radial-gradient(circle at 70% 18%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,var(--gsdl-primary),color-mix(in srgb,var(--gsdl-primary),#fff 26%))!important;box-shadow:var(--gsdl-shadow)!important;border:1px solid rgba(255,255,255,.75)!important}.hero-visual__frame img,.gsdl-hero__visual img{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover}.gsdl-hero__fallback{position:absolute;inset:0;display:grid;place-items:center;opacity:.16;pointer-events:none}.gsdl-hero__fallback i{position:absolute;border-radius:999px;background:#fff}.gsdl-hero__fallback i:nth-child(1){width:42%;height:42%;right:8%;top:8%}.gsdl-hero__fallback i:nth-child(2){width:28%;height:28%;left:15%;bottom:18%}.gsdl-hero__fallback i:nth-child(3){width:14%;height:14%;left:48%;top:42%}
.gsdl-grid,.services-grid__cards,.semantic-items,.trust-grid,.local-proof__grid,.local-proof__signal-list,.price-guidance__cards,.internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr))!important;gap:clamp(.9rem,1.8vw,1.25rem)!important;align-items:stretch!important}.gsdl-card,.service-card,.proof-card,.step-card,.price-card,.faq-item,.faq-entry,.faq-item-refined,.testimonial-card,.semantic-card,.trust-band__signal-card,.conversion-proof-item,.internal-links-item,.services-grid__magazine-feature,.process-step-rail__body,.map-block__support,.proof-card-minimal{min-width:0;border-radius:var(--gsdl-radius)!important;background:#fff!important;border:1px solid var(--gsdl-border)!important;box-shadow:var(--gsdl-shadow-soft)!important;padding:clamp(1.05rem,2vw,1.45rem)!important}.gsdl-card p,.service-card p,.proof-card p,.step-card p,.price-card p,.semantic-card p{color:var(--gsdl-muted)!important}.conversion-proof-strip{padding:clamp(1.3rem,2.8vw,2.4rem) 0!important}.gsdl-proof-strip__grid,.conversion-proof-strip__grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:.9rem!important}.gsdl-proof-card,.conversion-proof-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:start!important;gap:.2rem .75rem!important;min-height:auto!important}.gsdl-proof-card__icon,.conversion-proof-item__value,.service-card__icon,.process-step-rail__index,.step-card__index{display:inline-grid!important;place-items:center;width:2.55rem!important;height:2.55rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--gsdl-primary),color-mix(in srgb,var(--gsdl-primary),#000 18%))!important;color:#fff!important;font-weight:950!important;box-shadow:0 8px 18px rgba(var(--gsdl-primary-rgb),.16)!important}.gsdl-signal-check,.local-proof__signal-index,.trust-band__signal-index,.proof-row__ordinal{display:inline-grid!important;place-items:center;width:2.2rem!important;height:2.2rem!important;border-radius:999px!important;background:rgba(var(--gsdl-primary-rgb),.08)!important;color:var(--gsdl-primary)!important;border:1px solid rgba(var(--gsdl-primary-rgb),.14)!important;font-weight:950!important;box-shadow:none!important}.gsdl-signal-card,.local-proof__signal,.trust-band__signal-card,.proof-row--stacked{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.85rem!important;align-items:start!important}.gsdl-process-step,.process-step-rail{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.85rem!important;align-items:start!important}
.gsdl-list{display:grid!important;gap:.58rem!important;list-style:none!important;margin:1rem 0 0!important;padding:0!important}.gsdl-list__item{position:relative;display:grid!important;grid-template-columns:auto minmax(0,1fr);gap:.55rem;align-items:start;padding:.72rem .78rem!important;border-radius:.9rem;background:#fff;border:1px solid var(--gsdl-border);box-shadow:0 4px 14px rgba(15,23,42,.035);color:var(--gsdl-muted)}.gsdl-list__item::before{content:'✓';display:inline-grid;place-items:center;width:1.35rem;height:1.35rem;border-radius:999px;background:rgba(var(--gsdl-primary-rgb),.08);color:var(--gsdl-primary);font-weight:950;font-size:.78rem;margin-top:.05rem}.service-card__meta,.step-card__meta,.step-row__meta,.proof-row__meta,.price-card__facts,.block__pills,.services-grid__trust,.urgency-banner__pills{display:flex!important;flex-wrap:wrap!important;gap:.45rem!important;list-style:none!important;margin:.85rem 0 0!important;padding:0!important}.service-card__meta li,.step-card__meta li,.step-row__meta li,.proof-row__meta li,.price-card__facts li,.block__pill{display:inline-flex!important;align-items:center;min-height:1.9rem;padding:.36rem .6rem;border-radius:999px;background:rgba(var(--gsdl-primary-rgb),.055);border:1px solid rgba(var(--gsdl-primary-rgb),.11);color:var(--gsdl-primary);font-size:.8rem;font-weight:850;line-height:1.15}
.faq-block__accordion,.faq-block__accordion--refined{display:grid!important;gap:.75rem!important;max-width:940px}.faq-summary-refined{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:.75rem!important;align-items:center!important;cursor:pointer;list-style:none!important;padding:1rem 1.05rem!important;color:var(--gsdl-text)!important;font-weight:900}.faq-summary-refined::-webkit-details-marker{display:none}.faq-summary-refined::after{content:'+';font-weight:950;color:var(--gsdl-primary)}details[open]>.faq-summary-refined::after{content:'–'}.faq-summary-refined__count{display:none!important}.faq-content-refined{padding:0 1.05rem 1.05rem!important;color:var(--gsdl-muted)!important}.gsdl-map-frame,.map-block__frame,.map-wrapper,.map-boxed-wrapper,.map-directory__visual{position:relative;min-height:clamp(230px,30vw,340px)!important;border-radius:var(--gsdl-radius)!important;background:linear-gradient(135deg,#e6edf5,#f8fafc)!important;border:1px solid var(--gsdl-border)!important;box-shadow:var(--gsdl-shadow-soft)!important;overflow:hidden}.gsdl-map-fallback{position:absolute;inset:auto 1rem 1rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.8rem .9rem;border-radius:1rem;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.75);box-shadow:0 8px 20px rgba(15,23,42,.08)}.block__cta-group{display:flex!important;align-items:center!important;gap:.7rem!important;flex-wrap:wrap!important;margin-top:1.05rem!important}.block__cta-note,.block__cta-phone{display:inline-flex;align-items:center;min-height:2.55rem;max-width:35rem;padding:.62rem .82rem;border-radius:999px;background:rgba(15,23,42,.035);border:1px solid var(--gsdl-border);color:var(--gsdl-muted);font-size:.88rem;font-weight:650;line-height:1.25}.gsdl-mobile-cta{display:none!important}.internal-links-hub{margin-top:clamp(2rem,4vw,3.5rem)!important;padding:clamp(2rem,4vw,3.5rem) 0!important;background:transparent!important}.internal-links-item__anchor{width:100%}
.footer-editorial,footer{background:radial-gradient(circle at top left,rgba(var(--gsdl-primary-rgb),.20),transparent 34%),#0f172a!important;color:#fff!important;padding:clamp(2.4rem,5vw,4rem) 0!important}.footer-editorial p,.footer-editorial a,footer p,footer a{color:rgba(255,255,255,.72)!important}.footer__grid-refined,.footer__links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))!important;gap:1.25rem!important}ul:empty,ol:empty,p:empty,h2:empty,h3:empty,li:empty{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}@media(max-width:900px){.gsdl-proof-strip__grid,.conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.gsdl-hero__panel,.hero__minimal,.hero__shell,.hero__centered--with-media,.services-grid__magazine,.local-proof__coverage,.process-steps__rail-layout,.price-guidance__insight,.cta-panel__consult,.map-block__context,.urgency-banner{grid-template-columns:minmax(0,1fr)!important}.hero__minimal>.hero-visual{grid-column:auto!important;grid-row:auto!important}.hero h1{max-width:100%!important}}@media(max-width:640px){body.gravity-super-delivery-lock{padding-bottom:5.5rem}.el-container{padding-inline:1rem!important}.gsdl-hero__panel,.hero__minimal,.hero__shell{padding:1.12rem!important;border-radius:1.25rem!important}.gsdl-proof-strip__grid,.conversion-proof-strip__grid{grid-template-columns:1fr!important}.gsdl-button,.cta-primary,.card__btn{width:100%!important}.gsdl-signal-card,.local-proof__signal,.trust-band__signal-card,.proof-row--stacked,.gsdl-process-step,.process-step-rail{grid-template-columns:minmax(0,1fr)!important}.gsdl-mobile-cta{position:fixed;left:.85rem;right:.85rem;bottom:.85rem;z-index:120;display:flex!important;align-items:center;justify-content:space-between;gap:.85rem;padding:.75rem .8rem .75rem 1rem;border-radius:1.15rem;background:rgba(15,23,42,.94);color:#fff;box-shadow:0 18px 44px rgba(2,6,23,.32)}.gsdl-mobile-cta strong{display:block;color:#fff;font-size:.96rem;line-height:1.1}.gsdl-mobile-cta small{display:block;color:rgba(255,255,255,.72);font-size:.78rem;max-width:16rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gsdl-mobile-cta__button{display:inline-grid;place-items:center;width:3rem;height:3rem;border-radius:.95rem;background:var(--gsdl-accent);color:#fff;text-decoration:none;font-weight:950;flex:0 0 auto}}
`;
}

function injectFinalCss($: CheerioAPI, themeTokens: string): void {
  $('#gravity-super-delivery-lock-css,#gravity-functional-delivery-release-css,#gravity-global-delivery-polish-v3-css,#gravity-release-visual-freeze-css').remove();
  $('head').append(`<style id="gravity-theme-tokens">${themeTokens}</style>`);
  $('head').append(`<style id="gravity-super-delivery-lock-css">${css()}</style>`);
}

function addMarker($: CheerioAPI): void {
  $('body').prepend(`<!-- ${MARKER} ${RELEASE_ID} -->`);
}

export function applySuperDeliveryLock($: CheerioAPI, context: SuperDeliveryLockContext = {}): void {
  normalizeHtmlShell($);
  const themeTokens = extractThemeTokens($);
  removeStyleDebt($);
  ensureBodyState($);
  normalizeTextNodes($, context);
  normalizeHeadings($, context);
  normalizeBreadcrumbs($, context);
  normalizeNavigation($);
  normalizeHero($, context);
  normalizeLists($);
  normalizeCardsAndBlocks($, context);
  normalizeCtas($, context);
  fixInternalAnchors($);
  removeEmptyArtifacts($);
  injectFinalCss($, themeTokens);
  addMarker($);
}

export function applySuperDeliveryLockToHtml(html: string, context: SuperDeliveryLockContext = {}): string {
  const input = String(html || '');
  if (!input.trim()) return input;
  const $ = cheerio.load(input, { decodeEntities: false });
  applySuperDeliveryLock($, context);
  return $.html({ decodeEntities: false }).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

export const SUPER_DELIVERY_LOCK_MARKER = MARKER;
export const SUPER_DELIVERY_LOCK_ID = RELEASE_ID;
