import type * as cheerio from 'cheerio';

export interface GlobalDeliveryPolishContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

type CheerioAPI = cheerio.CheerioAPI;

function clean(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function escapeHtml(value = ''): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeComparable(value: string): string {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function titleCase(value: string): string {
  return clean(value)
    .split(' ')
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ');
}

function serviceLabel(context: GlobalDeliveryPolishContext): string {
  const raw = clean(context.niche || 'servicios');
  if (!raw) return 'servicios';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function cityLabel(context: GlobalDeliveryPolishContext): string {
  return clean(context.city || 'tu zona');
}

function hasUsefulChildren($: CheerioAPI, el: any): boolean {
  const $el = $(el);
  const text = clean($el.text());
  if (text.length > 8) return true;
  return $el.find('img, iframe, svg, a[href], button').length > 0;
}

function removeLegacyPatchStyles($: CheerioAPI): void {
  const keep = new Set(['gravity-global-delivery-polish-v3-css', 'el-utility-fixes']);
  $('style[id]').each((_i, el) => {
    const $el = $(el);
    const id = String($el.attr('id') || '');
    if (keep.has(id)) return;
    if (/^(?:gravity-(?:release|global|premium|delivery|deterministic)|patch-|layout-hotfix)/i.test(id)) {
      $el.remove();
    }
  });
}

function ensureBodyClass($: CheerioAPI): void {
  const body = $('body').first();
  if (!body.length) return;
  const classes = new Set(String(body.attr('class') || '').split(/\s+/).filter(Boolean));
  classes.add('gravity-global-delivery-polish-v3');
  classes.delete('gravity-release-visual-freeze');
  classes.delete('gravity-delivery-stable');
  body.attr('class', Array.from(classes).join(' '));
}

function normalizeTextNodes($: CheerioAPI, context: GlobalDeliveryPolishContext): void {
  const city = cityLabel(context);
  const service = serviceLabel(context).toLowerCase();
  $('body').find('*').contents().each((_i, node: any) => {
    if (node.type !== 'text') return;
    let text = String(node.data || '');
    text = text
      .replace(/\b(?:undefined|null|\[object Object\])\b/gi, ' ')
      .replace(/\{\{.*?\}\}|\[\[.*?\]\]|__[^_]+__/g, ' ')
      .replace(/:\s*este\s+bloque\s+[^.。\n]*(?:\.|。)?/gi, ' ')
      .replace(/\bvisible\s+para\s*:?/gi, ' ')
      .replace(/\bcoherente\s+con\s*\.?/gi, `coherente con el servicio en ${city}.`)
      .replace(/\ben\s+y\b/gi, `en ${city} y`)
      .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
      .replace(/\bContactar([A-ZÁÉÍÓÚÑ])/g, 'Contactar $1')
      .replace(/\bSeñal\s*0?\d+\s*[:\-–—]?\s*/gi, '')
      .replace(/\bCriterio\s*0?\d+\s*[:\-–—]?\s*/gi, '')
      .replace(/\bFactor\s*0?\d+\s*[:\-–—]?\s*/gi, '')
      .replace(/\bbombina\b/gi, 'bombín')
      .replace(/\bbombinas\b/gi, 'bombines')
      .replace(/\bPrecios\s+Condicionados\b/gi, 'Qué condiciona el presupuesto')
      .replace(/\bNuestros\s+Servicios\b/gi, `Servicios de ${service} en ${city}`)
      .replace(/\bNavegaci[oó]n\s+relacionada\s+del\s+proyecto\b/gi, 'Servicios relacionados')
      .replace(/\s{2,}/g, ' ');
    node.data = text;
  });
}

function normalizeHeadings($: CheerioAPI, context: GlobalDeliveryPolishContext): void {
  const city = cityLabel(context);
  const service = serviceLabel(context);
  const replacements: Array<[RegExp, string]> = [
    [/^Nuestros servicios$/i, `Servicios de ${service.toLowerCase()} en ${city}`],
    [/^Servicios ofrecidos$/i, `Servicios de ${service.toLowerCase()} en ${city}`],
    [/^Proceso de servicio$/i, 'Proceso de trabajo'],
    [/^¿?C[oó]mo funciona nuestro servicio\??$/i, 'Proceso de trabajo'],
    [/^Precios condicionados$/i, 'Qué condiciona el presupuesto'],
    [/^Precios y tarifas$/i, 'Qué condiciona el presupuesto'],
    [/^Preguntas frecuentes$/i, 'Preguntas frecuentes'],
    [/^Testimonios locales$/i, 'Señales de confianza locales'],
    [/^Señales locales de confianza$/i, 'Señales de confianza locales'],
    [/^Señales de confianza que conviene exigir antes de contratar$/i, 'Qué conviene comprobar antes de contratar'],
    [/^Navegación relacionada del proyecto$/i, 'Servicios relacionados'],
    [/^Cobertura y ubicación operativa en (.+)$/i, `Cobertura operativa en ${city}`],
    [/^Urgencias y emergencias$/i, 'Respuesta prioritaria'],
    [/^Urgencias y aperturas prioritarias$/i, 'Respuesta prioritaria'],
    [/^Solicitar orientación profesional en (.+)$/i, `Solicita orientación en ${city}`]
  ];

  $('h1,h2,h3,summary,.block__title,.section-title').each((_i, el) => {
    const $el = $(el);
    const original = clean($el.text());
    if (!original) return;
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(original)) {
        $el.text(replacement);
        return;
      }
    }
  });
}

function normalizeBreadcrumbs($: CheerioAPI): void {
  const candidates = $('.el-breadcrumbs, .breadcrumbs, nav[aria-label*="breadcrumb" i], nav[aria-label*="miga" i]');
  candidates.each((_i, el) => {
    const $el = $(el);
    $el.addClass('gdp-breadcrumbs');
    $el.find('ol,ul').first().addClass('gdp-breadcrumbs__list');
    $el.find('li').addClass('gdp-breadcrumbs__item');
    $el.find('a').addClass('gdp-breadcrumbs__link');
  });

  $('.el-breadcrumbs__list').each((_i, el) => {
    const $el = $(el);
    $el.addClass('gdp-breadcrumbs__list');
    $el.closest('nav, .el-breadcrumbs, .breadcrumbs').addClass('gdp-breadcrumbs');
    $el.find('li').addClass('gdp-breadcrumbs__item');
    $el.find('a').addClass('gdp-breadcrumbs__link');
  });
}

function normalizeNavigation($: CheerioAPI): void {
  $('.nav-mobile').removeAttr('open');
  $('.nav--desktop').attr('data-nav-role', 'desktop');
  $('.nav-mobile').attr('data-nav-role', 'mobile');
}

function normalizeHero($: CheerioAPI, context: GlobalDeliveryPolishContext): void {
  const hero = $('.hero, [data-block-type="hero"]').first();
  if (!hero.length) return;
  hero.addClass('gdp-hero');
  hero.find('.hero__minimal, .hero__shell, .hero__centered--with-media').first().addClass('gdp-hero__shell');
  hero.find('.hero-visual, .hero__media').first().addClass('gdp-hero__media');
  hero.find('.hero-visual__frame').first().addClass('gdp-hero__visual-frame');
  hero.find('.cta-row').first().addClass('gdp-hero__ctas');

  hero.find('img[src]').each((_i, img) => {
    const $img = $(img);
    const src = clean($img.attr('src') || '');
    if (src && !/^(?:https?:|data:|\/)/i.test(src) && !src.startsWith('./')) {
      $img.attr('src', `./${src.replace(/^\.\//, '')}`);
    }
    if (!$img.attr('alt')) $img.attr('alt', `${serviceLabel(context)} en ${cityLabel(context)}`);
  });

  const frame = hero.find('.hero-visual__frame, .gdp-hero__visual-frame').first();
  if (frame.length && !frame.find('.gdp-hero-fallback').length) {
    frame.append('<span class="gdp-hero-fallback" aria-hidden="true"><span></span><span></span><span></span></span>');
  }
}

function normalizeProofStrip($: CheerioAPI): void {
  $('.conversion-proof-strip, .trust-strip').addClass('gdp-proof-strip');
  $('.conversion-proof-strip__grid, .trust-grid').addClass('gdp-proof-strip__grid');
  $('.conversion-proof-item').addClass('gdp-proof-card');
  $('.conversion-proof-item__value').addClass('gdp-proof-card__icon');
  $('.conversion-proof-item__label').addClass('gdp-proof-card__label');
  $('.conversion-proof-item__text').addClass('gdp-proof-card__text');
}

function normalizeLists($: CheerioAPI): void {
  $('main section ul, main section ol, .block-section ul, .block-section ol, .semantic-section ul, .semantic-section ol').each((_i, el) => {
    const $el = $(el);
    if ($el.children('li').length === 0) {
      $el.remove();
      return;
    }
    if ($el.closest('.nav-mobile, .nav--desktop, .footer__nav-list, .gdp-breadcrumbs, .el-breadcrumbs').length) return;
    const existing = clean($el.attr('class') || '');
    if (!existing || /^(?:service-card__meta|step-row__meta|proof-row__meta|price-card__facts|block__pills|services-grid__trust)$/.test(existing)) {
      $el.addClass('gdp-check-list');
      $el.children('li').addClass('gdp-check-list__item');
    }
  });
}

function normalizeCardsAndSections($: CheerioAPI): void {
  $('.block-section, .semantic-section, .el-section').addClass('gdp-section');
  $('.block-section > .el-container, .semantic-section__container, .el-section > .el-container').addClass('gdp-section__container');
  $('.service-card, .proof-card, .step-card, .price-card, .faq-item, .faq-entry, .faq-item-refined, .semantic-card, .trust-band__signal-card, .conversion-proof-item, .internal-links-item').addClass('gdp-card');
  $('.services-grid__cards, .semantic-items, .trust-grid, .local-proof__grid, .local-proof__signal-list, .process-steps__timeline, .price-guidance__cards, .internal-links-grid').addClass('gdp-card-grid');

  $('.local-proof__signal, .trust-band__signal-card, .proof-row, .proof-card-minimal').addClass('gdp-signal-card');
  $('.local-proof__signal-index, .trust-band__signal-index, .proof-row__ordinal').each((_i, el) => {
    const $el = $(el);
    $el.text('✓').addClass('gdp-signal-card__check');
  });

  $('.process-steps__rail, .process-steps__timeline, .process-steps__grid').addClass('gdp-process-list');
  $('.process-step-rail, .step-card').addClass('gdp-process-step');
  $('.process-step-rail__index, .step-card__index').addClass('gdp-process-step__index');

  $('.map-block, [data-block-type="map"]').addClass('gdp-map-block');
  $('.map-block__frame, .map-wrapper, .map-boxed-wrapper, .map-directory__visual').addClass('gdp-map-frame');
  $('.cta-panel, [data-block-type="cta_panel"], .section-cta--terminal').addClass('gdp-cta-section');
  $('.internal-links-hub, #internal-links-contextual').addClass('gdp-internal-links');
  $('footer, .footer-editorial').addClass('gdp-footer');
}

function removeEmptyAndBrokenNodes($: CheerioAPI): void {
  $('ul,ol').each((_i, el) => {
    const $el = $(el);
    if ($el.children('li').length === 0) $el.remove();
  });
  $('p,h2,h3,li,span,small').each((_i, el) => {
    const $el = $(el);
    const text = clean($el.text());
    if (!text && $el.children().length === 0) $el.remove();
    if (/^(?:Señal|Criterio|Factor)\s*0?\d+$/i.test(text)) $el.remove();
  });
  $('.service-card,.proof-card,.step-card,.price-card,.semantic-card,.trust-band__signal-card,.conversion-proof-item').each((_i, el) => {
    if (!hasUsefulChildren($, el)) $(el).remove();
  });
}

function repairCtas($: CheerioAPI): void {
  $('.mobile-sticky-cta').addClass('gdp-mobile-sticky-cta');
  $('.mobile-sticky-cta__button').addClass('gdp-mobile-sticky-cta__button');
  $('a,button').each((_i, el) => {
    const $el = $(el);
    const text = clean($el.text());
    if (/^Contactar[A-ZÁÉÍÓÚÑ]/.test(text)) {
      $el.text(text.replace(/^Contactar/, 'Contactar '));
    }
    if (/^Contáctanos ahora mismo$/i.test(text)) $el.text('Solicitar orientación');
  });
}

function repairAnchors($: CheerioAPI): void {
  if (!$('#contacto').length) {
    const footer = $('footer').first();
    if (footer.length) footer.attr('id', 'contacto');
  }
  const ids = new Set($('[id]').map((_i, el) => String($(el).attr('id') || '')).get().filter(Boolean));
  $('a[href^="#"]').each((_i, el) => {
    const $el = $(el);
    const target = String($el.attr('href') || '').slice(1);
    if (!target || !ids.has(target)) $el.attr('href', '#contacto');
  });
}

function injectFinalCss($: CheerioAPI): void {
  $('#gravity-global-delivery-polish-v3-css').remove();
  $('head').append(`<style id="gravity-global-delivery-polish-v3-css">${GLOBAL_DELIVERY_POLISH_CSS}</style>`);
}

function normalizeStructuredData($: CheerioAPI): void {
  $('script[type="application/ld+json"]').each((_i, el) => {
    const $el = $(el);
    try {
      const parsed = JSON.parse($el.text() || '{}');
      const walk = (value: any): any => {
        if (typeof value === 'string') {
          return value
            .replace(/\bbombina\b/gi, 'bombín')
            .replace(/\bbombinas\b/gi, 'bombines')
            .replace(/\bundefined|null|\[object Object\]\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        }
        if (Array.isArray(value)) return value.map(walk);
        if (value && typeof value === 'object') {
          for (const key of Object.keys(value)) value[key] = walk(value[key]);
        }
        return value;
      };
      $el.text(JSON.stringify(walk(parsed)));
    } catch {
      // keep upstream behavior
    }
  });
}

export function applyGlobalDeliveryPolish($: CheerioAPI, context: GlobalDeliveryPolishContext = {}): void {
  removeLegacyPatchStyles($);
  ensureBodyClass($);
  normalizeTextNodes($, context);
  normalizeHeadings($, context);
  normalizeStructuredData($);
  normalizeNavigation($);
  normalizeBreadcrumbs($);
  normalizeHero($, context);
  normalizeProofStrip($);
  normalizeCardsAndSections($);
  normalizeLists($);
  repairCtas($);
  repairAnchors($);
  removeEmptyAndBrokenNodes($);
  injectFinalCss($);
}

export function polishFinalDeliveryHtmlString(html: string, context: GlobalDeliveryPolishContext = {}): string {
  // Kept as a helper for future CLI use. Runtime integration uses applyGlobalDeliveryPolish
  // from existing Cheerio passes to avoid parsing the document twice.
  return html;
}

const GLOBAL_DELIVERY_POLISH_CSS = `
/* Gravity Global Delivery Polish v3: final client-facing cascade */
:root{--gdp-bg:#f5f7fb;--gdp-surface:#fff;--gdp-text:var(--text,#0f172a);--gdp-muted:var(--muted,#64748b);--gdp-primary:var(--primary,#0a192f);--gdp-primary-rgb:var(--primary-rgb,10,25,47);--gdp-accent:var(--accent,#0f766e);--gdp-border:rgba(148,163,184,.18);--gdp-border-strong:rgba(148,163,184,.28);--gdp-radius:18px;--gdp-radius-lg:26px;--gdp-shadow:0 18px 50px rgba(15,23,42,.08);--gdp-shadow-soft:0 8px 26px rgba(15,23,42,.055);--gdp-section-y:clamp(2.4rem,4.5vw,4.4rem)}
html,body{max-width:100%;overflow-x:clip}body.gravity-global-delivery-polish-v3{background:linear-gradient(180deg,#fff 0%,#f8fafc 44%,#fff 100%)!important;color:var(--gdp-text)!important;line-height:1.64;-webkit-font-smoothing:antialiased}body.gravity-global-delivery-polish-v3 *{box-sizing:border-box}body.gravity-global-delivery-polish-v3 img,body.gravity-global-delivery-polish-v3 iframe,body.gravity-global-delivery-polish-v3 svg,body.gravity-global-delivery-polish-v3 video{max-width:100%}body.gravity-global-delivery-polish-v3 .el-container{width:100%;max-width:1120px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem)}
body.gravity-global-delivery-polish-v3 .site-header{position:sticky!important;top:0;z-index:100;padding:.55rem 0;background:rgba(255,255,255,.96)!important;border-bottom:1px solid rgba(148,163,184,.10);box-shadow:0 8px 24px rgba(15,23,42,.04)}body.gravity-global-delivery-polish-v3 .site-header__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem;min-height:3.5rem;padding:.5rem .7rem;border-radius:999px;background:#fff;border:1px solid rgba(148,163,184,.14);box-shadow:var(--gdp-shadow-soft)}body.gravity-global-delivery-polish-v3 .brand,body.gravity-global-delivery-polish-v3 .brand__name{font-weight:950;letter-spacing:-.025em;color:var(--gdp-text)!important;text-decoration:none;white-space:nowrap}@media(min-width:761px){body.gravity-global-delivery-polish-v3 .nav--desktop{display:flex!important;align-items:center!important;gap:.4rem!important}body.gravity-global-delivery-polish-v3 .nav-mobile{display:none!important}body.gravity-global-delivery-polish-v3 .nav-mobile__panel{display:none!important}}@media(max-width:760px){body.gravity-global-delivery-polish-v3 .nav--desktop{display:none!important}body.gravity-global-delivery-polish-v3 .nav-mobile{display:block!important;margin-left:auto}body.gravity-global-delivery-polish-v3 .nav-mobile:not([open]) .nav-mobile__panel{display:none!important}body.gravity-global-delivery-polish-v3 .nav-mobile[open] .nav-mobile__panel{display:grid!important}}
body.gravity-global-delivery-polish-v3 .nav__link,body.gravity-global-delivery-polish-v3 .nav-mobile__link{display:inline-flex;align-items:center;min-height:2.35rem;padding:.52rem .74rem;border-radius:999px;color:var(--gdp-text)!important;font-weight:850;font-size:.9rem;text-decoration:none}body.gravity-global-delivery-polish-v3 .nav__link:hover{background:rgba(15,23,42,.055)}body.gravity-global-delivery-polish-v3 .nav__cta,body.gravity-global-delivery-polish-v3 .nav-mobile__cta{display:inline-flex!important;align-items:center;justify-content:center;min-height:2.45rem;padding:.62rem .9rem;border-radius:999px;background:var(--gdp-primary)!important;color:#fff!important;font-weight:950;text-decoration:none;white-space:nowrap}
body.gravity-global-delivery-polish-v3 .gdp-breadcrumbs{max-width:1120px;margin:.65rem auto 0;padding-inline:clamp(1rem,3vw,2rem)}body.gravity-global-delivery-polish-v3 .gdp-breadcrumbs__list,body.gravity-global-delivery-polish-v3 .el-breadcrumbs__list{display:flex!important;flex-wrap:wrap;align-items:center;gap:.35rem;list-style:none!important;margin:0!important;padding:.55rem .8rem!important;width:max-content;max-width:100%;border:1px solid rgba(148,163,184,.14);border-radius:999px;background:rgba(255,255,255,.86);box-shadow:0 6px 18px rgba(15,23,42,.035)}body.gravity-global-delivery-polish-v3 .gdp-breadcrumbs__item,body.gravity-global-delivery-polish-v3 .el-breadcrumbs__list li{display:inline-flex!important;align-items:center;gap:.35rem;font-size:.78rem;color:var(--gdp-muted);font-weight:750;min-width:0}body.gravity-global-delivery-polish-v3 .gdp-breadcrumbs__item+li:before,body.gravity-global-delivery-polish-v3 .el-breadcrumbs__list li+li:before{content:'›';opacity:.55}body.gravity-global-delivery-polish-v3 .gdp-breadcrumbs__link,body.gravity-global-delivery-polish-v3 .el-breadcrumbs__list a{color:var(--gdp-text)!important;text-decoration:none!important;font-weight:850}
body.gravity-global-delivery-polish-v3 .el-section-wrapper{padding-block:0!important;background:transparent!important}body.gravity-global-delivery-polish-v3 .block-section,body.gravity-global-delivery-polish-v3 .semantic-section,body.gravity-global-delivery-polish-v3 .el-section{padding:var(--gdp-section-y) 0!important}body.gravity-global-delivery-polish-v3 h1,body.gravity-global-delivery-polish-v3 h2,body.gravity-global-delivery-polish-v3 h3{color:var(--gdp-text)!important;letter-spacing:-.04em;line-height:1.08;text-wrap:balance;margin-top:0}body.gravity-global-delivery-polish-v3 h1{font-size:clamp(2.15rem,4.8vw,4.4rem)!important;max-width:14.5ch;margin-bottom:.9rem!important}body.gravity-global-delivery-polish-v3 h2{font-size:clamp(1.55rem,2.8vw,2.35rem)!important;max-width:18ch;margin-bottom:.75rem!important}body.gravity-global-delivery-polish-v3 h3{font-size:clamp(1.05rem,1.45vw,1.28rem)!important;margin-bottom:.45rem!important}body.gravity-global-delivery-polish-v3 p{color:var(--gdp-muted);margin:0}body.gravity-global-delivery-polish-v3 .block__header,body.gravity-global-delivery-polish-v3 .section-title{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.35rem;margin-bottom:clamp(1rem,2vw,1.6rem)!important;max-width:780px}body.gravity-global-delivery-polish-v3 .block__header p,body.gravity-global-delivery-polish-v3 .block__subtitle{max-width:70ch;color:var(--gdp-muted);font-size:clamp(.98rem,1.25vw,1.1rem)}body.gravity-global-delivery-polish-v3 .hero__eyebrow,body.gravity-global-delivery-polish-v3 .block__eyebrow,body.gravity-global-delivery-polish-v3 .card__eyebrow{display:inline-flex;width:max-content;max-width:100%;align-items:center;min-height:1.9rem;padding:.34rem .62rem;border-radius:999px;background:rgba(var(--gdp-primary-rgb),.065);border:1px solid rgba(var(--gdp-primary-rgb),.11);color:var(--gdp-primary)!important;font-size:.72rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.75rem}
body.gravity-global-delivery-polish-v3 .gdp-hero{padding-top:clamp(1.1rem,2.5vw,2rem)!important}body.gravity-global-delivery-polish-v3 .gdp-hero__shell,body.gravity-global-delivery-polish-v3 .hero__minimal,body.gravity-global-delivery-polish-v3 .hero__shell,body.gravity-global-delivery-polish-v3 .hero__centered--with-media{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(280px,.64fr)!important;align-items:center!important;gap:clamp(1.1rem,3vw,2.6rem)!important;max-width:1120px!important;margin-inline:auto!important;padding:clamp(1.25rem,3vw,2.35rem)!important;border-radius:var(--gdp-radius-lg)!important;background:radial-gradient(circle at 100% 0,rgba(var(--gdp-primary-rgb),.09),transparent 34%),#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--gdp-shadow)!important;color:var(--gdp-text)!important;overflow:hidden}body.gravity-global-delivery-polish-v3 .hero__minimal>.hero__eyebrow,body.gravity-global-delivery-polish-v3 .hero__minimal>h1,body.gravity-global-delivery-polish-v3 .hero__minimal>.hero__subtitle,body.gravity-global-delivery-polish-v3 .hero__minimal>.cta-row,body.gravity-global-delivery-polish-v3 .hero__minimal>.hero__bullets{grid-column:1}body.gravity-global-delivery-polish-v3 .hero__minimal>.hero-visual{grid-column:2;grid-row:1/span 7;margin:0!important}body.gravity-global-delivery-polish-v3 .hero__subtitle{font-size:clamp(1rem,1.38vw,1.18rem)!important;max-width:60ch;color:var(--gdp-muted)!important}body.gravity-global-delivery-polish-v3 .hero-visual__frame,body.gravity-global-delivery-polish-v3 .gdp-hero__visual-frame{position:relative;min-height:clamp(250px,31vw,390px)!important;border-radius:22px!important;overflow:hidden;background:radial-gradient(circle at 70% 18%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,var(--gdp-primary),color-mix(in srgb,var(--gdp-primary),#fff 24%))!important;box-shadow:var(--gdp-shadow)!important;border:1px solid rgba(255,255,255,.75)!important}body.gravity-global-delivery-polish-v3 .hero-visual__frame img{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover}body.gravity-global-delivery-polish-v3 .gdp-hero-fallback{position:absolute;inset:0;display:grid;place-items:center;opacity:.14;pointer-events:none}body.gravity-global-delivery-polish-v3 .gdp-hero-fallback span{position:absolute;border-radius:999px;background:#fff}body.gravity-global-delivery-polish-v3 .gdp-hero-fallback span:nth-child(1){width:42%;height:42%;right:8%;top:8%}body.gravity-global-delivery-polish-v3 .gdp-hero-fallback span:nth-child(2){width:28%;height:28%;left:14%;bottom:17%}body.gravity-global-delivery-polish-v3 .gdp-hero-fallback span:nth-child(3){width:14%;height:14%;left:48%;top:42%}
body.gravity-global-delivery-polish-v3 .gdp-proof-strip__grid,body.gravity-global-delivery-polish-v3 .conversion-proof-strip__grid,body.gravity-global-delivery-polish-v3 .trust-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:.75rem!important}body.gravity-global-delivery-polish-v3 .gdp-proof-card,body.gravity-global-delivery-polish-v3 .conversion-proof-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.12rem .7rem!important;align-items:center!important;min-height:5.4rem!important;padding:.85rem!important;border-radius:16px!important;background:#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--gdp-shadow-soft)!important}body.gravity-global-delivery-polish-v3 .gdp-proof-card__icon,body.gravity-global-delivery-polish-v3 .conversion-proof-item__value{grid-row:span 2;display:inline-grid!important;place-items:center!important;width:2.55rem!important;height:2.55rem!important;border-radius:14px!important;background:rgba(var(--gdp-primary-rgb),.08)!important;color:var(--gdp-primary)!important;font-weight:950!important}body.gravity-global-delivery-polish-v3 .conversion-proof-item__label{font-weight:950!important;color:var(--gdp-text)!important;line-height:1.1!important}body.gravity-global-delivery-polish-v3 .conversion-proof-item__text{font-size:.86rem!important;color:var(--gdp-muted)!important;line-height:1.25!important}
body.gravity-global-delivery-polish-v3 .gdp-section__container,body.gravity-global-delivery-polish-v3 .block-section>.el-container,body.gravity-global-delivery-polish-v3 .semantic-section__container{border-radius:var(--gdp-radius-lg)!important}body.gravity-global-delivery-polish-v3 .gdp-card-grid,body.gravity-global-delivery-polish-v3 .services-grid__cards,body.gravity-global-delivery-polish-v3 .semantic-items,body.gravity-global-delivery-polish-v3 .trust-grid,body.gravity-global-delivery-polish-v3 .local-proof__grid,body.gravity-global-delivery-polish-v3 .local-proof__signal-list,body.gravity-global-delivery-polish-v3 .process-steps__timeline,body.gravity-global-delivery-polish-v3 .price-guidance__cards,body.gravity-global-delivery-polish-v3 .internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,15.8rem),1fr))!important;gap:clamp(.85rem,1.6vw,1.1rem)!important;align-items:stretch!important}body.gravity-global-delivery-polish-v3 .gdp-card,body.gravity-global-delivery-polish-v3 .service-card,body.gravity-global-delivery-polish-v3 .proof-card,body.gravity-global-delivery-polish-v3 .step-card,body.gravity-global-delivery-polish-v3 .price-card,body.gravity-global-delivery-polish-v3 .faq-item,body.gravity-global-delivery-polish-v3 .faq-entry,body.gravity-global-delivery-polish-v3 .faq-item-refined,body.gravity-global-delivery-polish-v3 .semantic-card,body.gravity-global-delivery-polish-v3 .trust-band__signal-card,body.gravity-global-delivery-polish-v3 .internal-links-item{min-width:0;border-radius:18px!important;background:#fff!important;border:1px solid var(--gdp-border)!important;box-shadow:var(--gdp-shadow-soft)!important;padding:clamp(1rem,1.8vw,1.3rem)!important}body.gravity-global-delivery-polish-v3 .service-card__icon{display:inline-grid!important;place-items:center!important;width:2.45rem!important;height:2.45rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--gdp-primary),color-mix(in srgb,var(--gdp-primary),#000 18%))!important;color:#fff!important;font-weight:950!important;box-shadow:0 9px 20px rgba(var(--gdp-primary-rgb),.14)!important}body.gravity-global-delivery-polish-v3 .service-card p,body.gravity-global-delivery-polish-v3 .proof-card p,body.gravity-global-delivery-polish-v3 .step-card p,body.gravity-global-delivery-polish-v3 .price-card p,body.gravity-global-delivery-polish-v3 .semantic-card p{color:var(--gdp-muted)!important}
body.gravity-global-delivery-polish-v3 .gdp-check-list{display:grid!important;gap:.55rem!important;margin:.8rem 0 0!important;padding:0!important;list-style:none!important}body.gravity-global-delivery-polish-v3 .gdp-check-list__item{display:grid!important;grid-template-columns:1.35rem minmax(0,1fr)!important;gap:.55rem!important;align-items:start!important;padding:.62rem .7rem!important;border-radius:14px!important;background:rgba(15,23,42,.025)!important;border:1px solid rgba(148,163,184,.12)!important;color:var(--gdp-muted)!important;font-size:.92rem!important;line-height:1.35!important}body.gravity-global-delivery-polish-v3 .gdp-check-list__item:before{content:'✓';display:inline-grid;place-items:center;width:1.25rem;height:1.25rem;border-radius:999px;background:rgba(var(--gdp-primary-rgb),.08);color:var(--gdp-primary);font-weight:950;font-size:.75rem}
body.gravity-global-delivery-polish-v3 .gdp-process-list{display:grid!important;gap:.78rem!important}body.gravity-global-delivery-polish-v3 .gdp-process-step,body.gravity-global-delivery-polish-v3 .process-step-rail,body.gravity-global-delivery-polish-v3 .step-card{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.8rem!important;align-items:start!important;padding:0!important}body.gravity-global-delivery-polish-v3 .gdp-process-step__index,body.gravity-global-delivery-polish-v3 .process-step-rail__index,body.gravity-global-delivery-polish-v3 .step-card__index{display:inline-grid!important;place-items:center!important;width:2.55rem!important;height:2.55rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--gdp-primary),color-mix(in srgb,var(--gdp-primary),#000 18%))!important;color:#fff!important;font-weight:950!important;box-shadow:0 9px 20px rgba(var(--gdp-primary-rgb),.16)!important}body.gravity-global-delivery-polish-v3 .process-step-rail__body{border-radius:18px!important;background:#fff!important;border:1px solid var(--gdp-border)!important;box-shadow:var(--gdp-shadow-soft)!important;padding:1rem 1.05rem!important}
body.gravity-global-delivery-polish-v3 .gdp-signal-card,body.gravity-global-delivery-polish-v3 .local-proof__signal,body.gravity-global-delivery-polish-v3 .trust-band__signal-card,body.gravity-global-delivery-polish-v3 .proof-row{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.75rem!important;align-items:start!important;border-radius:18px!important;background:#fff!important;border:1px solid var(--gdp-border)!important;box-shadow:var(--gdp-shadow-soft)!important;padding:1rem!important}body.gravity-global-delivery-polish-v3 .gdp-signal-card__check,body.gravity-global-delivery-polish-v3 .local-proof__signal-index,body.gravity-global-delivery-polish-v3 .trust-band__signal-index,body.gravity-global-delivery-polish-v3 .proof-row__ordinal{display:inline-grid!important;place-items:center!important;width:2.1rem!important;height:2.1rem!important;border-radius:999px!important;background:rgba(var(--gdp-primary-rgb),.08)!important;color:var(--gdp-primary)!important;font-weight:950!important;box-shadow:none!important}body.gravity-global-delivery-polish-v3 .local-proof__signal-copy,body.gravity-global-delivery-polish-v3 .trust-band__signal-copy{display:grid!important;gap:.2rem!important;min-width:0!important}
body.gravity-global-delivery-polish-v3 .faq-block__accordion,body.gravity-global-delivery-polish-v3 .faq-block__accordion--refined{display:grid!important;gap:.72rem!important;max-width:920px}body.gravity-global-delivery-polish-v3 .faq-summary-refined{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;gap:.75rem!important;cursor:pointer!important;list-style:none!important;color:var(--gdp-text)!important;font-weight:900!important;padding:.9rem 1rem!important}body.gravity-global-delivery-polish-v3 .faq-summary-refined::-webkit-details-marker{display:none}body.gravity-global-delivery-polish-v3 .faq-summary-refined:after{content:'+';font-weight:950;color:var(--gdp-primary)}body.gravity-global-delivery-polish-v3 details[open]>.faq-summary-refined:after{content:'–'}body.gravity-global-delivery-polish-v3 .faq-content-refined{padding:0 1rem 1rem 3.7rem!important;color:var(--gdp-muted)}
body.gravity-global-delivery-polish-v3 .gdp-map-frame,body.gravity-global-delivery-polish-v3 .map-block__frame,body.gravity-global-delivery-polish-v3 .map-wrapper,body.gravity-global-delivery-polish-v3 .map-boxed-wrapper,body.gravity-global-delivery-polish-v3 .map-directory__visual{position:relative;min-height:clamp(220px,30vw,330px)!important;border-radius:20px!important;background:radial-gradient(circle at 78% 18%,rgba(var(--gdp-primary-rgb),.08),transparent 28%),linear-gradient(135deg,#e8eef6,#f8fafc)!important;border:1px solid var(--gdp-border)!important;box-shadow:var(--gdp-shadow-soft)!important;overflow:hidden}body.gravity-global-delivery-polish-v3 .map-block__overlay{position:absolute;left:1rem;right:1rem;bottom:1rem;display:flex;align-items:center;justify-content:space-between;gap:.65rem;pointer-events:none}body.gravity-global-delivery-polish-v3 .map-block__overlay-badge,body.gravity-global-delivery-polish-v3 .map-block__overlay-city{display:inline-flex;align-items:center;min-height:2rem;padding:.45rem .7rem;border-radius:999px;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.75);box-shadow:0 8px 18px rgba(15,23,42,.10);font-weight:900;color:var(--gdp-text)}
body.gravity-global-delivery-polish-v3 .gdp-cta-section,body.gravity-global-delivery-polish-v3 .cta-panel,body.gravity-global-delivery-polish-v3 .section-cta--terminal{border-radius:var(--gdp-radius-lg)!important;background:radial-gradient(circle at 100% 0,rgba(var(--gdp-primary-rgb),.08),transparent 32%),#fff!important;border:1px solid var(--gdp-border)!important;box-shadow:var(--gdp-shadow-soft)!important}body.gravity-global-delivery-polish-v3 .cta-primary,body.gravity-global-delivery-polish-v3 .card__btn,body.gravity-global-delivery-polish-v3 .internal-links-item__anchor{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.45rem!important;min-height:2.85rem!important;padding:.7rem 1rem!important;border-radius:999px!important;background:var(--gdp-primary)!important;color:#fff!important;border:1px solid rgba(255,255,255,.14)!important;font-weight:950!important;text-decoration:none!important;box-shadow:0 10px 22px rgba(var(--gdp-primary-rgb),.15)!important}body.gravity-global-delivery-polish-v3 .block__cta-group{display:flex!important;align-items:center!important;gap:.65rem!important;flex-wrap:wrap!important;margin-top:1rem!important}body.gravity-global-delivery-polish-v3 .block__cta-note,body.gravity-global-delivery-polish-v3 .block__cta-phone{display:inline-flex;align-items:center;min-height:2.45rem;max-width:33rem;padding:.55rem .8rem;border-radius:999px;background:rgba(15,23,42,.03);border:1px solid var(--gdp-border);color:var(--gdp-muted);font-size:.86rem;font-weight:650;line-height:1.25;overflow:hidden;text-overflow:ellipsis}
body.gravity-global-delivery-polish-v3 .gdp-mobile-sticky-cta,body.gravity-global-delivery-polish-v3 .mobile-sticky-cta{display:none!important}@media(max-width:640px){body.gravity-global-delivery-polish-v3{padding-bottom:5.5rem!important}body.gravity-global-delivery-polish-v3 .gdp-mobile-sticky-cta,body.gravity-global-delivery-polish-v3 .mobile-sticky-cta{position:fixed;left:.85rem;right:.85rem;bottom:.85rem;z-index:110;display:flex!important;align-items:center;justify-content:space-between;gap:.7rem;padding:.7rem .75rem .7rem .95rem;border-radius:18px;background:rgba(15,23,42,.94);color:#fff;box-shadow:0 18px 42px rgba(2,6,23,.26)}body.gravity-global-delivery-polish-v3 .mobile-sticky-cta__copy{display:grid;gap:.04rem;min-width:0}body.gravity-global-delivery-polish-v3 .mobile-sticky-cta__copy strong{font-size:.94rem;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.gravity-global-delivery-polish-v3 .mobile-sticky-cta__copy span{font-size:.76rem;color:rgba(255,255,255,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.gravity-global-delivery-polish-v3 .gdp-mobile-sticky-cta__button,body.gravity-global-delivery-polish-v3 .mobile-sticky-cta__button{display:inline-grid!important;place-items:center!important;width:2.8rem!important;height:2.8rem!important;border-radius:14px!important;background:var(--gdp-accent)!important;color:#fff!important;flex:0 0 auto;text-decoration:none!important}}
body.gravity-global-delivery-polish-v3 .gdp-internal-links,body.gravity-global-delivery-polish-v3 .internal-links-hub{padding:clamp(1.6rem,3.6vw,3rem) 0!important;margin-top:clamp(2rem,4vw,3rem)!important}body.gravity-global-delivery-polish-v3 .internal-links-item{display:flex!important;flex-direction:column!important;gap:.8rem!important}body.gravity-global-delivery-polish-v3 .internal-links-item__title{font-size:1.18rem!important;line-height:1.15!important;margin:0!important}body.gravity-global-delivery-polish-v3 .gdp-footer,body.gravity-global-delivery-polish-v3 .footer-editorial,body.gravity-global-delivery-polish-v3 footer{background:linear-gradient(135deg,#0f172a,color-mix(in srgb,#0f172a 82%,var(--gdp-primary) 18%))!important;color:#fff!important;padding:clamp(2rem,4vw,3.5rem) 0!important}body.gravity-global-delivery-polish-v3 .footer-editorial p,body.gravity-global-delivery-polish-v3 .footer-editorial a,body.gravity-global-delivery-polish-v3 footer p,body.gravity-global-delivery-polish-v3 footer a{color:rgba(255,255,255,.72)!important}body.gravity-global-delivery-polish-v3 .footer-editorial h2,body.gravity-global-delivery-polish-v3 .footer-editorial h3,body.gravity-global-delivery-polish-v3 .footer__brand-name{color:#fff!important}
body.gravity-global-delivery-polish-v3 ul:empty,body.gravity-global-delivery-polish-v3 ol:empty,body.gravity-global-delivery-polish-v3 p:empty,body.gravity-global-delivery-polish-v3 h2:empty,body.gravity-global-delivery-polish-v3 h3:empty,body.gravity-global-delivery-polish-v3 .service-card:empty,body.gravity-global-delivery-polish-v3 .step-card:empty{display:none!important}@media(max-width:900px){body.gravity-global-delivery-polish-v3 .gdp-hero__shell,body.gravity-global-delivery-polish-v3 .hero__minimal,body.gravity-global-delivery-polish-v3 .hero__shell,body.gravity-global-delivery-polish-v3 .hero__centered--with-media,body.gravity-global-delivery-polish-v3 .services-grid__magazine,body.gravity-global-delivery-polish-v3 .local-proof__coverage,body.gravity-global-delivery-polish-v3 .process-steps__rail-layout,body.gravity-global-delivery-polish-v3 .price-guidance__insight,body.gravity-global-delivery-polish-v3 .cta-panel__consult,body.gravity-global-delivery-polish-v3 .map-block__context{grid-template-columns:minmax(0,1fr)!important}body.gravity-global-delivery-polish-v3 .hero__minimal>.hero-visual{grid-column:auto!important;grid-row:auto!important}body.gravity-global-delivery-polish-v3 h1{max-width:100%!important}body.gravity-global-delivery-polish-v3 .gdp-proof-strip__grid,body.gravity-global-delivery-polish-v3 .conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:640px){body.gravity-global-delivery-polish-v3 .el-container{padding-inline:1rem!important}body.gravity-global-delivery-polish-v3 .gdp-hero__shell,body.gravity-global-delivery-polish-v3 .hero__minimal,body.gravity-global-delivery-polish-v3 .hero__shell{padding:1rem!important;border-radius:20px!important}body.gravity-global-delivery-polish-v3 .hero-visual__frame{min-height:230px!important}body.gravity-global-delivery-polish-v3 .gdp-proof-strip__grid,body.gravity-global-delivery-polish-v3 .conversion-proof-strip__grid,body.gravity-global-delivery-polish-v3 .gdp-card-grid{grid-template-columns:1fr!important}body.gravity-global-delivery-polish-v3 .cta-primary,body.gravity-global-delivery-polish-v3 .card__btn,body.gravity-global-delivery-polish-v3 .internal-links-item__anchor{width:100%!important}body.gravity-global-delivery-polish-v3 .gdp-signal-card,body.gravity-global-delivery-polish-v3 .local-proof__signal,body.gravity-global-delivery-polish-v3 .trust-band__signal-card,body.gravity-global-delivery-polish-v3 .gdp-process-step,body.gravity-global-delivery-polish-v3 .process-step-rail{grid-template-columns:minmax(0,1fr)!important}}
`;
