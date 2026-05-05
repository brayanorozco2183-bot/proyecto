import * as cheerio from 'cheerio';

export interface FinalUxDeliveryGuardContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

const MARKER = 'GRAVITY_FINAL_UX_DELIVERY_GUARD_APPLIED';
const STYLE_ID = 'gravity-final-ux-delivery-guard-css';
const META_NAME = 'gravity-final-ux-delivery-guard';

function text(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function compactButtonLabel(label: string): string {
  const clean = text(label);
  if (!clean) return 'Contactar';
  const lower = clean.toLowerCase();
  if (/presupuesto|valoraci[oó]n|diagn[oó]stico/.test(lower)) return 'Pedir valoración';
  if (/orientaci[oó]n|asesor/.test(lower)) return 'Solicitar orientación';
  if (/contact|llamar|tel[eé]fono/.test(lower)) return 'Contactar';
  if (/servicios/.test(lower)) return 'Ver servicios';
  if (clean.length <= 28) return clean;
  return 'Pedir valoración';
}

function cleanVisibleCopy(value: string, city: string): string {
  let out = String(value || '');
  out = out
    .replace(/\b(undefined|null|\[object Object\])\b/gi, ' ')
    .replace(/\bnuestros\s+t[eé]cnicos\s+est[aá]n\s+con\s+criterio\s+t[eé]cnico\s+para\s+/gi, 'El equipo puede ')
    .replace(/\bcon\s+precisi[oó]n\s+t[eé]cnica\b/gi, 'con criterio claro')
    .replace(/\blos\s+herramientas\b/gi, 'las herramientas')
    .replace(/\bbomb[ií]nes\b/gi, 'bombines')
    .replace(/\bEscudos Protector\b/g, 'Escudos protectores')
    .replace(/\bPrueba Local\b/g, 'Comprobación final')
    .replace(/\bProporci[oó]n Activa\b/g, 'Propuesta de intervención')
    .replace(/\bServicios Ofrecidos\b/g, `Servicios de cerrajería en ${city}`)
    .replace(/\bPrueba Local de Cerrajeros\b/g, 'Criterios de confianza')
    .replace(/\bPrueba Local de\b/g, 'Criterios de confianza de')
    .replace(/\bcobertura operativa en ([^.,]+) y desplazamientos adaptados al servicio de ([^.,]+) con cobertura operativa en \1 revisada antes de confirmar\b/gi, 'cobertura operativa revisada antes de confirmar la intervención')
    .replace(/\bAporta contexto operativo y una planificación más clara del servicio\./gi, 'Facilita una decisión más clara antes de intervenir.')
    .replace(/\bcontra el taladro y el ataque\b/gi, 'frente a intentos de manipulación')
    .replace(/\btu vivienda est[eé] seguro y protegido\b/gi, 'tu vivienda quede segura y protegida')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ');
  return out;
}

function isInside($: cheerio.CheerioAPI, el: any, selector: string): boolean {
  return $(el).closest(selector).length > 0;
}

function ensureHead($: cheerio.CheerioAPI): void {
  if (!$('html').length) {
    const existing = $.root().html() || '';
    $.root().empty().append(`<html lang="es-ES"><head></head><body>${existing}</body></html>`);
  }
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
}

function removeDuplicateFinalStyles($: cheerio.CheerioAPI): void {
  $(`style#${STYLE_ID}`).remove();
  $(`meta[name="${META_NAME}"]`).remove();
  $('head').contents().each((_i: number, node: any) => {
    if (node.type !== 'comment') return;
    if (String(node.data || '').includes(MARKER)) $(node).remove();
  });
}

function normalizeBody($: cheerio.CheerioAPI): void {
  const body = $('body').first();
  const classes = new Set(text(body.attr('class')).split(/\s+/).filter(Boolean));
  classes.add('gravity-final-ux-guard');
  body.attr('class', Array.from(classes).join(' '));
  body.attr('data-gravity-ux-guard', 'final-v1');
}

function normalizeNavigation($: cheerio.CheerioAPI): void {
  $('.site-header').first().attr('data-ux-guard', 'nav');
  $('.site-header__inner').first().attr('data-ux-guard', 'nav-inner');
  $('.nav--desktop').attr('data-ux-guard', 'desktop-nav');
  $('.nav-mobile').each((_i: number, el: any) => {
    const nav = $(el);
    nav.removeAttr('open');
    nav.attr('data-ux-guard', 'mobile-nav');
    nav.find('.nav-mobile__summary').first().text(text(nav.find('.nav-mobile__summary').first().text()) || 'Menú');
  });
  $('.nav__cta, .nav-mobile__cta').each((_i: number, el: any) => {
    const link = $(el);
    const current = text(link.find('.cta-primary__text').text() || link.text());
    const label = compactButtonLabel(current);
    if (link.find('.cta-primary__text').length) link.find('.cta-primary__text').first().text(label);
    else link.text(label);
    link.attr('aria-label', link.attr('aria-label') || label);
  });
}

function normalizeBreadcrumbs($: cheerio.CheerioAPI): void {
  $('.el-breadcrumbs, .gfr-breadcrumbs, .gdp-breadcrumbs').first().addClass('gux-breadcrumbs');
  $('.el-breadcrumbs__list, .gfr-breadcrumbs__list, .gdp-breadcrumbs__list').first().addClass('gux-breadcrumbs__list');
  $('.el-breadcrumbs__item, .gfr-breadcrumbs__item, .gdp-breadcrumbs__item').addClass('gux-breadcrumbs__item');
  $('.el-breadcrumbs__text, .gfr-breadcrumbs__current').addClass('gux-breadcrumbs__text');
}

function normalizeButtons($: cheerio.CheerioAPI): void {
  const buttonSelector = 'a.cta-primary, a.card__btn, a.nav__cta, a.nav-mobile__cta, a.internal-links-item__anchor, a[class*="cta"], button';
  $(buttonSelector).each((_i: number, el: any) => {
    const btn = $(el);
    if (isInside($, el, '.faq-summary-refined')) return;
    const original = text(btn.text());
    if (!original) return;
    const label = compactButtonLabel(original);
    if (original.length > 34 || /si necesitas|obtener un presupuesto|evaluaci[oó]n gratuita|solicitudes/i.test(original)) {
      btn.attr('title', original);
      if (btn.find('.cta-primary__text').length) btn.find('.cta-primary__text').first().text(label);
      else btn.text(label);
    }
    btn.addClass('gux-button');
  });
  $('.block__cta-note, .block__cta-phone').each((_i: number, el: any) => {
    const note = $(el);
    const original = text(note.text());
    if (original.length > 115 || /24\/7|consultas y solicitudes|criterio técnico/i.test(original)) {
      note.text('Te orientamos antes de confirmar la intervención.');
    }
  });
}

function normalizeLists($: cheerio.CheerioAPI): void {
  $('ul, ol').each((_i: number, el: any) => {
    const list = $(el);
    if (isInside($, el, 'nav, header, footer, script, style, .nav-mobile, .site-header')) return;
    if (list.children('li').length === 0) {
      list.remove();
      return;
    }
    const cls = text(list.attr('class'));
    const blockType = text(list.closest('[data-block-type]').attr('data-block-type'));
    if (/meta|pills|trust|facts|tags|cta|actions/i.test(cls) || list.closest('.services-grid__trust,.urgency-banner__pills,.service-card__meta,.step-row__meta,.price-card__facts').length) {
      list.addClass('gux-pill-list');
      list.children('li').addClass('gux-pill');
      return;
    }
    if (list.is('ol') || /process/i.test(blockType + ' ' + cls)) {
      list.addClass('gux-step-list');
      list.children('li').addClass('gux-step-item');
      return;
    }
    list.addClass('gux-check-list');
    list.children('li').addClass('gux-check-item');
  });
}

function normalizeCardsAndSections($: cheerio.CheerioAPI): void {
  $('.block-section, .semantic-section, .premium-depth-section').addClass('gux-section');
  $('.block-section__inner, .section-shell, .premium-depth-panel').addClass('gux-section-shell');
  $('.service-card,.proof-card,.step-card,.price-card,.faq-item,.faq-entry,.faq-item-refined,.semantic-card,.conversion-proof-item,.premium-depth-card,.internal-links-item,.proof-card-minimal').addClass('gux-card');
  $('.conversion-proof-strip').addClass('gux-proof-strip');
  $('.conversion-proof-strip__grid').addClass('gux-proof-grid');
  $('.hero__bullets').addClass('gux-hero-list');
  $('.hero-card').addClass('gux-hero-card');
  $('.local-proof__signal-index,.trust-band__signal-index,.proof-row__ordinal').each((_i: number, el: any) => {
    const badge = $(el);
    if (!badge.closest('#process-steps,.process-steps').length) {
      badge.attr('aria-label', 'Comprobado');
      badge.text('✓');
      badge.addClass('gux-check-badge');
    }
  });
  $('.service-card__icon').each((_i: number, el: any) => {
    const icon = $(el);
    if (text(icon.text()) === '•') icon.text('✓');
  });
}

function normalizeTextNodes($: cheerio.CheerioAPI, city: string): void {
  $('body *').contents().each((_i: number, node: any) => {
    if (node.type !== 'text') return;
    const original = String((node as any).data || '');
    const next = cleanVisibleCopy(original, city);
    if (next !== original) (node as any).data = next;
  });
}

function normalizeHeadings($: cheerio.CheerioAPI, city: string, niche: string): void {
  const serviceLabel = /cerraj/i.test(niche) ? 'cerrajería' : text(niche || 'servicio');
  $('h1,h2,h3,summary').each((_i: number, el: any) => {
    const h = $(el);
    const t = text(h.text());
    if (!t) return;
    const replacements: Array<[RegExp, string]> = [
      [/^Servicios Ofrecidos$/i, `Servicios de ${serviceLabel} en ${city}`],
      [/^Escudos Protector$/i, 'Escudos protectores'],
      [/^Prueba Local$/i, 'Comprobación final'],
      [/^Prueba Local de Cerrajeros en .+$/i, `Criterios de confianza en ${city}`],
      [/^Cobertura y ubicación operativa en .+$/i, `Cobertura operativa en ${city}`],
      [/^Contáctanos Ahora mismo$/i, 'Solicita orientación profesional'],
      [/^Navegación relacionada del proyecto$/i, 'Servicios relacionados']
    ];
    for (const [rx, value] of replacements) {
      if (rx.test(t)) {
        h.text(value);
        return;
      }
    }
  });
}

function normalizeImages($: cheerio.CheerioAPI): void {
  $('img[src]').each((_i: number, el: any) => {
    const img = $(el);
    const src = text(img.attr('src'));
    if (/^(?:https?:|data:|\.\/|\/)/i.test(src)) return;
    if (/\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(src)) img.attr('src', `./${src.replace(/^\/+/, '')}`);
  });
}

function injectCss($: cheerio.CheerioAPI): void {
  const css = `
/* === Gravity Final UX Delivery Guard v1 === */
:root{--gux-bg:#f6f8fb;--gux-surface:#fff;--gux-text:var(--text,#0f172a);--gux-muted:var(--muted,#64748b);--gux-primary:var(--primary,#0a192f);--gux-primary-rgb:var(--primary-rgb,10,25,47);--gux-border:rgba(148,163,184,.18);--gux-border-strong:rgba(148,163,184,.30);--gux-radius:18px;--gux-radius-lg:28px;--gux-shadow:0 16px 45px rgba(15,23,42,.075);--gux-shadow-soft:0 7px 22px rgba(15,23,42,.052);--gux-section:clamp(3.2rem,5vw,5.3rem)}
html,body{max-width:100%;overflow-x:clip}body.gravity-final-ux-guard{background:linear-gradient(180deg,#fff 0%,var(--gux-bg) 45%,#fff 100%)!important;color:var(--gux-text)!important;line-height:1.65}body.gravity-final-ux-guard *{box-sizing:border-box;min-width:0}body.gravity-final-ux-guard img,body.gravity-final-ux-guard iframe,body.gravity-final-ux-guard svg,body.gravity-final-ux-guard video{max-width:100%}body.gravity-final-ux-guard .el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem)}
body.gravity-final-ux-guard .site-header{position:sticky!important;top:0;z-index:200;padding:.65rem 0!important;background:rgba(255,255,255,.97)!important;border-bottom:1px solid rgba(148,163,184,.13)!important;box-shadow:0 8px 22px rgba(15,23,42,.045)!important}body.gravity-final-ux-guard .site-header__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:.9rem!important;min-height:3.55rem!important;padding:.5rem .7rem!important;border-radius:999px!important;background:#fff!important;border:1px solid rgba(148,163,184,.16)!important;box-shadow:var(--gux-shadow-soft)!important}body.gravity-final-ux-guard .brand,body.gravity-final-ux-guard .brand__name{display:inline-flex!important;align-items:center!important;font-weight:950!important;letter-spacing:-.025em!important;color:var(--gux-text)!important;text-decoration:none!important;white-space:nowrap!important;max-width:min(44vw,22rem);overflow:hidden;text-overflow:ellipsis}
@media(min-width:761px){body.gravity-final-ux-guard .nav--desktop{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:.45rem!important;flex:1 1 auto!important}body.gravity-final-ux-guard .nav-mobile{display:none!important}body.gravity-final-ux-guard .nav-mobile__panel{display:none!important}}@media(max-width:760px){body.gravity-final-ux-guard .site-header__inner{border-radius:1.1rem!important}body.gravity-final-ux-guard .nav--desktop{display:none!important}body.gravity-final-ux-guard .nav-mobile{display:block!important;margin-left:auto!important;position:relative!important}body.gravity-final-ux-guard .nav-mobile:not([open]) .nav-mobile__panel{display:none!important}body.gravity-final-ux-guard .nav-mobile[open] .nav-mobile__panel{display:grid!important}}
body.gravity-final-ux-guard .nav__links-group,body.gravity-final-ux-guard .nav-mobile__links{display:flex!important;align-items:center!important;gap:.25rem!important;flex-wrap:wrap!important}body.gravity-final-ux-guard .nav__link,body.gravity-final-ux-guard .nav-mobile__link{display:inline-flex!important;align-items:center!important;min-height:2.35rem!important;padding:.52rem .72rem!important;border-radius:999px!important;color:var(--gux-text)!important;font-weight:850!important;font-size:.9rem!important;text-decoration:none!important;white-space:nowrap!important}body.gravity-final-ux-guard .nav__link:hover,body.gravity-final-ux-guard .nav__link.is-active{background:rgba(15,23,42,.055)!important}body.gravity-final-ux-guard .nav-mobile__summary{cursor:pointer!important;list-style:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:2.45rem!important;padding:0 .9rem!important;border-radius:999px!important;background:#fff!important;border:1px solid var(--gux-border)!important;font-weight:900!important}body.gravity-final-ux-guard .nav-mobile__summary::-webkit-details-marker{display:none!important}body.gravity-final-ux-guard .nav-mobile__panel{position:absolute!important;right:0!important;margin-top:.65rem!important;width:min(22rem,calc(100vw - 2rem))!important;padding:.9rem!important;border-radius:1.15rem!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow)!important;z-index:300!important}
body.gravity-final-ux-guard .gux-button,body.gravity-final-ux-guard .cta-primary,body.gravity-final-ux-guard .card__btn,body.gravity-final-ux-guard .internal-links-item__anchor{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.45rem!important;min-height:2.9rem!important;max-width:100%!important;padding:.72rem 1.05rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--gux-primary),color-mix(in srgb,var(--gux-primary),#000 14%))!important;color:#fff!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.18)!important;font-weight:950!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;box-shadow:0 10px 22px rgba(var(--gux-primary-rgb),.14)!important}body.gravity-final-ux-guard .block__cta-group{display:flex!important;align-items:center!important;gap:.7rem!important;flex-wrap:wrap!important;margin-top:1rem!important}body.gravity-final-ux-guard .block__cta-note,body.gravity-final-ux-guard .block__cta-phone{display:inline-flex!important;align-items:center!important;min-height:2.4rem!important;max-width:34rem!important;padding:.58rem .78rem!important;border-radius:999px!important;background:rgba(15,23,42,.035)!important;border:1px solid var(--gux-border)!important;color:var(--gux-muted)!important;font-size:.88rem!important;font-weight:650!important;line-height:1.22!important;white-space:normal!important}
body.gravity-final-ux-guard .gux-breadcrumbs,.gux-breadcrumbs{padding:1rem 0 .4rem!important;background:transparent!important;border:0!important}.gux-breadcrumbs__list{list-style:none!important;display:flex!important;align-items:center!important;gap:.48rem!important;flex-wrap:wrap!important;width:max-content!important;max-width:100%!important;margin:0!important;padding:.72rem .95rem!important;border-radius:999px!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow-soft)!important}.gux-breadcrumbs__item{display:inline-flex!important;align-items:center!important;gap:.48rem!important;color:var(--gux-muted)!important;font-size:.84rem!important;font-weight:750!important}.gux-breadcrumbs__item:not(:last-child)::after{content:'/'!important;color:#94a3b8!important;opacity:.72!important}.gux-breadcrumbs__text{color:inherit!important}.gux-breadcrumbs__item:last-child .gux-breadcrumbs__text{color:var(--gux-text)!important;font-weight:900!important;max-width:min(56vw,38rem);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.gravity-final-ux-guard .block-section,body.gravity-final-ux-guard .semantic-section,body.gravity-final-ux-guard .el-section,body.gravity-final-ux-guard .premium-depth-section{padding:var(--gux-section) 0!important}body.gravity-final-ux-guard .el-section-wrapper{padding-block:0!important;background:transparent!important}body.gravity-final-ux-guard .block__header,body.gravity-final-ux-guard .premium-depth-header,body.gravity-final-ux-guard .section-title{display:flex!important;flex-direction:column!important;align-items:flex-start!important;text-align:left!important;gap:.36rem!important;margin-bottom:clamp(1.15rem,2.3vw,1.9rem)!important;max-width:850px!important}body.gravity-final-ux-guard h1,body.gravity-final-ux-guard h2,body.gravity-final-ux-guard h3{color:var(--gux-text)!important;letter-spacing:-.035em!important;line-height:1.08!important;text-wrap:balance!important;margin-top:0!important}body.gravity-final-ux-guard h1{font-size:clamp(2.15rem,4.8vw,4.45rem)!important;max-width:15.5ch!important;margin-bottom:1rem!important}body.gravity-final-ux-guard h2{font-size:clamp(1.65rem,3vw,2.55rem)!important;max-width:22ch!important;margin-bottom:.82rem!important}body.gravity-final-ux-guard h3{font-size:clamp(1.05rem,1.5vw,1.32rem)!important;margin-bottom:.55rem!important}body.gravity-final-ux-guard p{color:var(--gux-muted)!important;margin:0!important;overflow-wrap:anywhere!important}body.gravity-final-ux-guard .block__header p,body.gravity-final-ux-guard .block__subtitle,body.gravity-final-ux-guard .premium-depth-header p{max-width:78ch!important;color:var(--gux-muted)!important;font-size:clamp(1rem,1.25vw,1.1rem)!important;line-height:1.7!important}
body.gravity-final-ux-guard .hero__shell,body.gravity-final-ux-guard .hero__minimal,body.gravity-final-ux-guard .gfr-hero__panel{display:grid!important;grid-template-columns:minmax(0,.98fr) minmax(300px,.76fr)!important;align-items:center!important;gap:clamp(1.25rem,3.4vw,2.8rem)!important;max-width:1180px!important;margin-inline:auto!important;padding:clamp(1.25rem,3vw,2.55rem)!important;border-radius:var(--gux-radius-lg)!important;background:radial-gradient(circle at 100% 0,rgba(var(--gux-primary-rgb),.10),transparent 34%),#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow)!important;overflow:hidden!important}.hero__minimal>.hero__eyebrow,.hero__minimal>h1,.hero__minimal>.hero__subtitle,.hero__minimal>.cta-row,.hero__minimal>.hero__bullets{grid-column:1}.hero__minimal>.hero-visual{grid-column:2;grid-row:1/span 7;margin:0!important}.hero-visual__frame{position:relative!important;min-height:clamp(280px,34vw,430px)!important;border-radius:clamp(1.1rem,2vw,1.6rem)!important;overflow:hidden!important;background:linear-gradient(135deg,var(--gux-primary),color-mix(in srgb,var(--gux-primary),#fff 26%))!important;box-shadow:var(--gux-shadow)!important;border:1px solid rgba(255,255,255,.78)!important}.hero-visual__frame img{display:block!important;width:100%!important;height:100%!important;min-height:inherit!important;object-fit:cover!important}.hero-card,.gux-hero-card{border-radius:1.25rem!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow-soft)!important;padding:1.05rem!important;margin-top:.85rem!important}.hero__bullets,.gux-hero-list{display:grid!important;gap:.55rem!important;list-style:none!important;margin:1rem 0 0!important;padding:0!important}.hero__bullets li,.gux-hero-list li{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.55rem!important;align-items:start!important;color:var(--gux-muted)!important}.hero__bullets li:before,.gux-hero-list li:before{content:'✓';display:grid;place-items:center;width:1.35rem;height:1.35rem;border-radius:999px;background:rgba(var(--gux-primary-rgb),.08);color:var(--gux-primary);font-weight:950;font-size:.78rem;margin-top:.13rem}
body.gravity-final-ux-guard .conversion-proof-strip,body.gravity-final-ux-guard .gux-proof-strip{padding:clamp(1rem,2.2vw,1.45rem) 0!important}.conversion-proof-strip__grid,.gux-proof-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:.8rem!important}.conversion-proof-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.15rem .7rem!important;align-items:center!important;min-height:5.2rem!important;padding:.95rem!important;border-radius:1.05rem!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow-soft)!important}.conversion-proof-item__value{grid-row:span 2;display:grid!important;place-items:center!important;width:2.55rem!important;height:2.55rem!important;border-radius:.85rem!important;background:rgba(var(--gux-primary-rgb),.08)!important;color:var(--gux-primary)!important;font-weight:950!important}.conversion-proof-item__label{font-weight:950!important;color:var(--gux-text)!important;line-height:1.14!important}.conversion-proof-item__text{font-size:.88rem!important;color:var(--gux-muted)!important;line-height:1.25!important}
body.gravity-final-ux-guard .gux-card,body.gravity-final-ux-guard .service-card,body.gravity-final-ux-guard .proof-card,body.gravity-final-ux-guard .step-card,body.gravity-final-ux-guard .price-card,body.gravity-final-ux-guard .faq-item,body.gravity-final-ux-guard .faq-entry,body.gravity-final-ux-guard .faq-item-refined,body.gravity-final-ux-guard .semantic-card,body.gravity-final-ux-guard .conversion-proof-item,body.gravity-final-ux-guard .premium-depth-card,body.gravity-final-ux-guard .internal-links-item,body.gravity-final-ux-guard .proof-card-minimal{min-width:0!important;border-radius:var(--gux-radius)!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow-soft)!important;padding:clamp(1.05rem,2vw,1.45rem)!important;overflow:hidden!important}.services-grid__cards,.semantic-items,.trust-grid,.local-proof__grid,.local-proof__minimal-grid,.local-proof__signal-list,.price-guidance__cards,.premium-depth-grid,.internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr))!important;gap:clamp(.9rem,1.8vw,1.25rem)!important;align-items:stretch!important}.service-card__icon,.gux-check-badge,.local-proof__signal-index,.trust-band__signal-index,.proof-row__ordinal{display:inline-grid!important;place-items:center!important;width:2.45rem!important;height:2.45rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--gux-primary),color-mix(in srgb,var(--gux-primary),#000 18%))!important;color:#fff!important;font-weight:950!important;box-shadow:0 8px 18px rgba(var(--gux-primary-rgb),.16)!important;flex:0 0 auto!important}
.gux-check-list{display:grid!important;gap:.58rem!important;list-style:none!important;margin:1rem 0 0!important;padding:0!important}.gux-check-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.55rem!important;align-items:start!important;padding:.7rem .76rem!important;border-radius:.9rem!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:0 4px 14px rgba(15,23,42,.035)!important;color:var(--gux-muted)!important;overflow-wrap:anywhere!important}.gux-check-item:before{content:'✓';display:grid;place-items:center;width:1.32rem;height:1.32rem;border-radius:999px;background:rgba(var(--gux-primary-rgb),.08);color:var(--gux-primary);font-weight:950;font-size:.78rem;margin-top:.05rem}.gux-pill-list,.service-card__meta,.step-row__meta,.price-card__facts,.services-grid__trust,.urgency-banner__pills{display:flex!important;flex-wrap:wrap!important;gap:.45rem!important;list-style:none!important;margin:.85rem 0 0!important;padding:0!important}.gux-pill,.gux-pill-list li,.service-card__meta li,.step-row__meta li,.price-card__facts li,.block__pill,.services-grid__trust span,.urgency-banner__pills span{display:inline-flex!important;align-items:center!important;min-height:1.85rem!important;padding:.34rem .58rem!important;border-radius:999px!important;background:rgba(var(--gux-primary-rgb),.055)!important;border:1px solid rgba(var(--gux-primary-rgb),.11)!important;color:var(--gux-primary)!important;font-size:.79rem!important;font-weight:850!important;line-height:1.13!important;white-space:normal!important}.gux-step-list,.process-steps__list{counter-reset:gux-step!important;display:grid!important;gap:.85rem!important;list-style:none!important;margin:0!important;padding:0!important}.gux-step-item,.process-steps__list>li{counter-increment:gux-step!important;display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.85rem!important;align-items:start!important;padding:1rem!important;border-radius:var(--gux-radius)!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow-soft)!important}.gux-step-item:before,.process-steps__list>li:before{content:counter(gux-step,decimal-leading-zero);display:grid;place-items:center;width:2.55rem;height:2.55rem;border-radius:999px;background:linear-gradient(135deg,var(--gux-primary),color-mix(in srgb,var(--gux-primary),#000 18%));color:#fff;font-weight:950;box-shadow:0 8px 18px rgba(var(--gux-primary-rgb),.16)}.process-steps__list .step-card__body{min-width:0!important}.process-steps__list .step-card__body p{max-width:82ch!important}
.local-proof__signal,.trust-band__signal-card,.proof-row--stacked{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.75rem!important;align-items:start!important}.local-proof__signal-copy,.trust-band__signal-copy{display:grid!important;gap:.25rem!important}.map-block__bullets{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))!important;gap:.6rem!important;list-style:none!important;margin:1rem 0!important;padding:0!important}.map-block__bullets li{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.5rem!important;padding:.7rem .75rem!important;border-radius:.9rem!important;background:#fff!important;border:1px solid var(--gux-border)!important;box-shadow:0 4px 14px rgba(15,23,42,.035)!important}.map-block__bullets li:before{content:'✓';color:var(--gux-primary);font-weight:950}.map-block__frame,.map-wrapper,.map-boxed-wrapper,.map-directory__visual{min-height:clamp(220px,30vw,335px)!important;border-radius:var(--gux-radius)!important;background:linear-gradient(135deg,#e6edf5,#f8fafc)!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow-soft)!important;overflow:hidden!important}
.faq-block__accordion,.faq-block__accordion--refined{display:grid!important;gap:.72rem!important;max-width:940px!important}.faq-item-refined{overflow:hidden!important}.faq-summary-refined{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:.75rem!important;align-items:center!important;cursor:pointer!important;list-style:none!important;padding:1rem!important;color:var(--gux-text)!important;font-weight:900!important}.faq-summary-refined::-webkit-details-marker{display:none!important}.faq-summary-refined:after{content:'+';font-weight:950;color:var(--gux-primary)}details[open]>.faq-summary-refined:after{content:'–'}.faq-summary-refined__count{display:none!important}.faq-content-refined{padding:0 1rem 1rem!important;color:var(--gux-muted)!important}.premium-depth-panel{border-radius:var(--gux-radius-lg)!important;background:linear-gradient(180deg,#fff,rgba(248,250,252,.96))!important;border:1px solid var(--gux-border)!important;box-shadow:var(--gux-shadow)!important;padding:clamp(1.2rem,3vw,2.25rem)!important}.premium-depth-card:before{content:'✓'!important}
body.gravity-final-ux-guard footer,body.gravity-final-ux-guard .footer-editorial{background:radial-gradient(circle at top left,rgba(var(--gux-primary-rgb),.22),transparent 34%),#0f172a!important;color:#fff!important;padding:clamp(2.4rem,5vw,4rem) 0!important}body.gravity-final-ux-guard footer p,body.gravity-final-ux-guard footer a,body.gravity-final-ux-guard .footer-editorial p,body.gravity-final-ux-guard .footer-editorial a{color:rgba(255,255,255,.74)!important}ul:empty,ol:empty,p:empty,h2:empty,h3:empty,li:empty{display:none!important}
@media(max-width:900px){.conversion-proof-strip__grid,.gux-proof-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hero__shell,.hero__minimal,.gfr-hero__panel,.services-grid__magazine,.local-proof__coverage,.process-steps__rail-layout,.price-guidance__insight,.cta-panel__consult,.map-block__context,.urgency-banner{grid-template-columns:minmax(0,1fr)!important}.hero__minimal>.hero-visual{grid-column:auto!important;grid-row:auto!important}body.gravity-final-ux-guard h1{max-width:100%!important}}
@media(max-width:640px){body.gravity-final-ux-guard{padding-bottom:5.6rem}.el-container{padding-inline:1rem!important}.hero__shell,.hero__minimal{padding:1.08rem!important;border-radius:1.2rem!important}.conversion-proof-strip__grid,.gux-proof-grid{grid-template-columns:1fr!important}.gux-button,.cta-primary,.card__btn{width:100%!important}.local-proof__signal,.trust-band__signal-card,.proof-row--stacked,.gux-step-item,.process-steps__list>li{grid-template-columns:minmax(0,1fr)!important}.gux-breadcrumbs__item:last-child .gux-breadcrumbs__text{max-width:72vw}.block__cta-note{border-radius:1rem!important;width:100%!important}}
`;
  $('head').append(`<!-- ${MARKER} --><meta name="${META_NAME}" content="v1"><style id="${STYLE_ID}">${css}</style>`);
}

export function applyFinalUxDeliveryGuard(html: string, context: FinalUxDeliveryGuardContext = {}): string {
  const raw = String(html || '');
  if (!raw.trim()) return raw;
  const city = text(context.city || 'tu zona');
  const niche = text(context.niche || 'servicio');
  const $ = cheerio.load(raw, { decodeEntities: false });
  ensureHead($);
  removeDuplicateFinalStyles($);
  normalizeBody($);
  normalizeTextNodes($, city);
  normalizeHeadings($, city, niche);
  normalizeNavigation($);
  normalizeBreadcrumbs($);
  normalizeButtons($);
  normalizeLists($);
  normalizeCardsAndSections($);
  normalizeImages($);
  injectCss($);
  return $.html({ decodeEntities: false }).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

export const finalUxDeliveryGuardMarker = MARKER;
