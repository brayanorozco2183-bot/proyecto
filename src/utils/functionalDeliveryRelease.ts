import type { CheerioAPI } from 'cheerio';

export interface FunctionalDeliveryReleaseContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

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

function nicheLabel(niche?: string): string {
  const raw = clean(niche || 'servicio profesional');
  return raw ? titleCase(raw) : 'Servicio profesional';
}

function lowerNicheLabel(niche?: string): string {
  return nicheLabel(niche).toLowerCase();
}

function cityLabel(city?: string): string {
  return clean(city || 'tu zona');
}

function compactText(value: string, max = 150): string {
  const text = clean(value);
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const boundary = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('; '), clipped.lastIndexOf(', '));
  return clean((boundary > 70 ? clipped.slice(0, boundary + 1) : clipped.slice(0, clipped.lastIndexOf(' '))) || text.slice(0, max));
}

function safeHeading(text: string, context: FunctionalDeliveryReleaseContext): string {
  const city = cityLabel(context.city);
  const service = lowerNicheLabel(context.niche);
  let out = clean(text)
    .replace(/^Nuestros\s+Servicios$/i, `Servicios de ${service} en ${city}`)
    .replace(/^Servicios\s+Ofrecidos$/i, `Servicios de ${service} en ${city}`)
    .replace(/^Precios\s+Condicionados$/i, 'Qué condiciona el presupuesto')
    .replace(/^Precios\s+y\s+Tarifas$/i, 'Qué condiciona el presupuesto')
    .replace(/^Proceso\s+de\s+Servicio$/i, 'Proceso de trabajo')
    .replace(/^¿?Cómo\s+Funciona\s+Nuestro\s+Servicio\??$/i, 'Proceso de trabajo')
    .replace(/^Navegación\s+relacionada\s+del\s+proyecto$/i, `Más servicios relacionados en ${city}`)
    .replace(/^Testimonios\s+Locales$/i, 'Criterios locales de confianza')
    .replace(/^Lo\s+que\s+dicen\s+nuestros\s+clientes$/i, 'Señales de confianza')
    .replace(/^Contáctanos\s+Ahora\s*mismo$/i, 'Solicita orientación profesional')
    .replace(/^Solicitar\s+orientación\s+profesional\s+en\s+.+$/i, `Solicita orientación profesional en ${city}`)
    .replace(/^Cobertura\s+y\s+ubicación\s+operativa\s+en\s+(.+)$/i, `Cobertura operativa en ${city}`)
    .replace(/^Señales\s+de\s+confianza\s+que\s+conviene\s+exigir\s+antes\s+de\s+contratar$/i, 'Qué conviene exigir antes de contratar')
    .replace(/^Urgencias\s+y\s+Emergencias$/i, 'Atención prioritaria')
    .replace(/\bde\s+Jesús\b/g, `en ${city}`);
  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
}

function cleanClientVisibleText(value: string, context: FunctionalDeliveryReleaseContext): string {
  const city = cityLabel(context.city);
  let out = String(value || '')
    .replace(/\bundefined\b|\bnull\b|\[object Object\]/gi, ' ')
    .replace(/:\s*este\s+bloque[^.?!]*(?:[.?!]|$)/gi, ' ')
    .replace(/\bvisible\s+para\s*:?/gi, ' ')
    .replace(/\bcoherente\s+con\s*\./gi, '.')
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\bSignal\s*\d+\b/gi, 'Señal')
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

function removeStyleDebt($: CheerioAPI): void {
  $('style').remove();
}

function ensureBodyClass($: CheerioAPI): void {
  const body = $('body').first();
  if (!body.length) return;
  const classes = new Set(clean(body.attr('class') || '').split(/\s+/).filter(Boolean));
  classes.delete('gravity-release-visual-freeze');
  classes.delete('gravity-delivery-stable');
  classes.delete('gravity-global-project-polish');
  classes.add('gravity-functional-release');
  body.attr('class', Array.from(classes).join(' '));
}

function normalizeHead($: CheerioAPI): void {
  if (!$('meta[name="viewport"]').length) $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  $('meta[name="viewport"]').first().attr('content', 'width=device-width, initial-scale=1.0');
  $('meta[name="viewport"]').slice(1).remove();
  if (!$('meta[name="format-detection"]').length) $('head').append('<meta name="format-detection" content="telephone=yes">');
}

function normalizeBreadcrumbs($: CheerioAPI): void {
  const candidates = $('.el-breadcrumbs, .breadcrumbs, [aria-label*="breadcrumb" i], [class*="breadcrumb" i]').filter((_i, el) => {
    return $(el).closest('script, style').length === 0;
  });

  candidates.each((_i, el) => {
    const box = $(el);
    box.addClass('gfr-breadcrumbs').attr('aria-label', box.attr('aria-label') || 'Breadcrumb');
    box.find('ol, ul').first().addClass('gfr-breadcrumbs__list');
    box.find('li').addClass('gfr-breadcrumbs__item');
    box.find('a').addClass('gfr-breadcrumbs__link');
    box.find('span').addClass('gfr-breadcrumbs__current');
  });

  $('main > p, body > p').each((_i, el) => {
    const text = clean($(el).text());
    if (/^Inicio\s+.+\s+(Cerrajeros?|Electricistas?|Fontaneros?|Abogados?|Reformas?)\b/i.test(text)) {
      const parts = text.split(/\s{2,}|\s+\/\s+|\s+›\s+/).filter(Boolean).slice(0, 3);
      if (parts.length >= 2) {
        $(el).replaceWith(`<nav class="gfr-breadcrumbs" aria-label="Breadcrumb"><ol class="gfr-breadcrumbs__list">${parts.map((part, idx) => `<li class="gfr-breadcrumbs__item ${idx === parts.length - 1 ? 'is-current' : ''}">${escapeHtml(part)}</li>`).join('')}</ol></nav>`);
      }
    }
  });
}

function normalizeNavigation($: CheerioAPI): void {
  $('.nav-mobile').removeAttr('open').attr('data-gfr-mobile-nav', 'closed');
  $('.nav--desktop').attr('data-gfr-desktop-nav', 'true');
  $('.nav__cta, .nav-mobile__cta').addClass('gfr-nav-cta');
}

function normalizeHero($: CheerioAPI, context: FunctionalDeliveryReleaseContext): void {
  const hero = $('.hero').first();
  if (!hero.length) return;
  hero.addClass('gfr-hero');
  hero.find('.hero__minimal, .hero__shell, .hero__centered--with-media').first().addClass('gfr-hero__panel');
  hero.find('h1').first().addClass('gfr-hero__title');
  hero.find('.hero__subtitle, p').first().addClass('gfr-hero__lead');
  hero.find('.cta-row').first().addClass('gfr-hero__actions');
  const frame = hero.find('.hero-visual__frame').first();
  if (frame.length) {
    frame.addClass('gfr-hero__visual-frame');
    if (!frame.find('.gfr-hero__fallback').length) {
      frame.append('<span class="gfr-hero__fallback" aria-hidden="true"><i></i><i></i><i></i></span>');
    }
  }
  hero.find('img').each((_i, el) => {
    const img = $(el);
    const src = clean(img.attr('src') || '');
    if (src && !/^(?:https?:|data:|\/)/i.test(src) && !src.startsWith('./')) img.attr('src', `./${src.replace(/^\.\//, '')}`);
    if (!img.attr('alt')) img.attr('alt', `${nicheLabel(context.niche)} en ${cityLabel(context.city)}`);
    img.attr('loading', img.attr('loading') || 'eager');
    img.attr('decoding', img.attr('decoding') || 'async');
  });
}

function normalizeProofStrip($: CheerioAPI): void {
  $('.conversion-proof-strip').addClass('gfr-proof-strip');
  $('.conversion-proof-strip__grid').addClass('gfr-proof-strip__grid');
  $('.conversion-proof-item').each((_i, el) => {
    const item = $(el).addClass('gfr-proof-card');
    item.find('.conversion-proof-item__value').first().addClass('gfr-proof-card__icon');
    item.find('.conversion-proof-item__label').first().addClass('gfr-proof-card__label');
    item.find('.conversion-proof-item__text').first().addClass('gfr-proof-card__text');
  });
}

function normalizeSections($: CheerioAPI, context: FunctionalDeliveryReleaseContext): void {
  $('.block-section, .semantic-section, .el-section').addClass('gfr-section');
  $('.block-section > .el-container, .semantic-section__container, .el-section > .el-container').addClass('gfr-section__container');
  $('.block__header, .section-title').addClass('gfr-section__header');
  $('h1, h2, h3, summary').each((_i, el) => {
    const node = $(el);
    const current = clean(node.text());
    const next = safeHeading(current, context);
    if (next && next !== current) node.text(next);
  });
}

function normalizeCards($: CheerioAPI): void {
  const cardSelector = [
    '.service-card', '.proof-card', '.step-card', '.price-card', '.faq-item', '.faq-entry', '.faq-item-refined',
    '.semantic-card', '.trust-band__signal-card', '.conversion-proof-item', '.internal-links-item', '.services-grid__magazine-feature',
    '.process-step-rail__body', '.map-block__support', '.proof-card-minimal'
  ].join(', ');
  $(cardSelector).addClass('gfr-card');
  $('.services-grid__cards, .semantic-items, .local-proof__grid, .local-proof__signal-list, .trust-band__signal-grid, .process-steps__timeline, .price-guidance__cards, .internal-links-grid').addClass('gfr-grid');
  $('.service-card__icon, .process-step-rail__index, .step-card__index, .local-proof__signal-index, .trust-band__signal-index, .proof-row__ordinal').addClass('gfr-card__icon');
}

function normalizeLists($: CheerioAPI): void {
  $('main section ul, main section ol, .block-section ul, .block-section ol, .semantic-section ul, .semantic-section ol').each((_i, el) => {
    const list = $(el);
    if (list.children('li').length === 0) {
      list.remove();
      return;
    }
    if (list.closest('nav, header, footer, .nav-mobile, .nav--desktop, .gfr-breadcrumbs').length) return;
    const className = clean(list.attr('class') || '');
    if (!className || /(?:meta|facts|pills|trust|bullets|unstyled)/i.test(className)) {
      list.addClass('gfr-list');
      list.children('li').addClass('gfr-list__item');
    }
  });
}

function normalizeTrustSignals($: CheerioAPI): void {
  $('[class*="local-proof"], [class*="trust-band"], [data-block-type="local_proof"], [data-block-type="trust_band"]').addClass('gfr-trust-block');
  $('.local-proof__signal, .proof-row, .trust-band__signal-card').addClass('gfr-signal-card');
  $('.local-proof__signal-index, .trust-band__signal-index, .proof-row__ordinal').each((_i, el) => {
    $(el).addClass('gfr-signal-check').text('✓');
  });
  $('.local-proof__signal-copy strong, .trust-band__signal-copy h3, .proof-row h3').each((_i, el) => {
    const node = $(el);
    const text = clean(node.text()).replace(/^Señal\s*:?\s*/i, '').replace(/^Criterio\s*:?\s*/i, '').replace(/^Factor\s*:?\s*/i, '');
    if (text) node.text(text);
  });
}

function normalizeProcess($: CheerioAPI): void {
  $('[class*="process-steps"], [data-block-type="process_steps"]').addClass('gfr-process');
  $('.process-step-rail, .step-card').addClass('gfr-process-step');
  $('.process-step-rail__index, .step-card__index').each((idx, el) => {
    $(el).text(String(idx + 1).padStart(2, '0'));
  });
}

function normalizeMapAndCta($: CheerioAPI, context: FunctionalDeliveryReleaseContext): void {
  $('[class*="map-block"], .map-wrapper, .map-boxed-wrapper, .map-directory__visual').addClass('gfr-map-block');
  $('.map-block__frame, .map-block__frame--boxed, .map-block__frame--context, .map-wrapper, .map-boxed-wrapper, .map-directory__visual').addClass('gfr-map-frame');
  $('.map-block__frame, .map-wrapper, .map-boxed-wrapper, .map-directory__visual').each((_i, el) => {
    const frame = $(el);
    if (!frame.find('iframe,img,.gfr-map-fallback').length) {
      frame.append(`<div class="gfr-map-fallback"><strong>${escapeHtml(cityLabel(context.city))}</strong><span>Zona de cobertura operativa</span></div>`);
    }
  });

  $('.mobile-sticky-cta').each((_i, el) => {
    const box = $(el).addClass('gfr-mobile-cta');
    const text = clean(box.text());
    if (/Contactar\s*cerrajer/i.test(text) || text.length < 12 || text.length > 95) {
      box.html(`<span><strong>Contactar</strong><small>${escapeHtml(nicheLabel(context.niche))} en ${escapeHtml(cityLabel(context.city))}</small></span><a class="gfr-mobile-cta__button" href="#contacto" aria-label="Contactar">→</a>`);
    }
  });

  $('.cta-primary, .card__btn, .internal-links-item__anchor, .nav__cta, .nav-mobile__cta').addClass('gfr-button');
  $('.block__cta-note, .block__cta-phone').each((_i, el) => {
    const node = $(el);
    const text = compactText(node.text(), 130);
    if (text) node.text(text);
  });
}

function normalizeTextNodes($: CheerioAPI, context: FunctionalDeliveryReleaseContext): void {
  $('body *').contents().each((_i, node: any) => {
    if (node.type !== 'text') return;
    const original = String(node.data || '');
    const next = cleanClientVisibleText(original, context);
    if (next !== original) node.data = next;
  });
  $('[alt], [title], [aria-label], [placeholder], [content]').each((_i, el) => {
    const node = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const value = node.attr(attr);
      if (value) node.attr(attr, cleanClientVisibleText(value, context));
    }
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
  $('ul:empty, ol:empty, p:empty, h2:empty, h3:empty, li:empty').remove();
  $('.service-card, .proof-card, .step-card, .price-card, .semantic-card, .faq-entry, .faq-item').each((_i, el) => {
    const node = $(el);
    if (!clean(node.text()) && !node.find('img, iframe, svg').length) node.remove();
  });
}

function functionalReleaseCss(): string {
  return `
/* === Gravity Functional Delivery Release v1 === */
:root{--gfr-bg:#f6f8fb;--gfr-surface:#fff;--gfr-text:var(--text,#0f172a);--gfr-muted:var(--muted,#64748b);--gfr-primary:var(--primary,#0a192f);--gfr-primary-rgb:var(--primary-rgb,10,25,47);--gfr-accent:var(--accent,#0f766e);--gfr-border:rgba(148,163,184,.18);--gfr-border-strong:rgba(148,163,184,.28);--gfr-radius:18px;--gfr-radius-lg:28px;--gfr-shadow:0 18px 50px rgba(15,23,42,.08);--gfr-shadow-soft:0 8px 24px rgba(15,23,42,.055);--gfr-section:clamp(3.1rem,5vw,5.4rem)}
html,body{max-width:100%;overflow-x:clip}body.gravity-functional-release{margin:0;background:linear-gradient(180deg,#fff 0%,var(--gfr-bg) 42%,#fff 100%)!important;color:var(--gfr-text)!important;font-family:var(--font-body,Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);line-height:1.65}body.gravity-functional-release *{box-sizing:border-box}body.gravity-functional-release img,body.gravity-functional-release iframe,body.gravity-functional-release svg,body.gravity-functional-release video{max-width:100%}body.gravity-functional-release .el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem)}
body.gravity-functional-release .site-header{position:sticky!important;top:0;z-index:100;background:rgba(255,255,255,.96)!important;padding:.65rem 0;border-bottom:1px solid rgba(148,163,184,.12);box-shadow:0 8px 22px rgba(15,23,42,.045)}body.gravity-functional-release .site-header__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem;min-height:3.6rem;padding:.55rem .75rem;border-radius:999px;background:#fff;border:1px solid rgba(148,163,184,.14);box-shadow:var(--gfr-shadow-soft)}body.gravity-functional-release .brand,body.gravity-functional-release .brand__name{font-weight:950;letter-spacing:-.025em;color:var(--gfr-text)!important;text-decoration:none;white-space:nowrap}@media(min-width:761px){body.gravity-functional-release .nav--desktop{display:flex!important;align-items:center!important;gap:.45rem!important}body.gravity-functional-release .nav-mobile{display:none!important}}@media(max-width:760px){body.gravity-functional-release .nav--desktop{display:none!important}body.gravity-functional-release .nav-mobile{display:block!important;margin-left:auto}body.gravity-functional-release .nav-mobile:not([open]) .nav-mobile__panel{display:none!important}body.gravity-functional-release .nav-mobile[open] .nav-mobile__panel{display:grid!important}}body.gravity-functional-release .nav__links-group,body.gravity-functional-release .nav-mobile__links{display:flex;align-items:center;gap:.25rem;flex-wrap:wrap}body.gravity-functional-release .nav__link,body.gravity-functional-release .nav-mobile__link{display:inline-flex;align-items:center;min-height:2.4rem;padding:.55rem .75rem;border-radius:999px;color:var(--gfr-text)!important;font-weight:850;font-size:.9rem;text-decoration:none}body.gravity-functional-release .nav__link:hover,body.gravity-functional-release .nav__link.is-active{background:rgba(15,23,42,.055)}body.gravity-functional-release .nav-mobile__summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;min-height:2.5rem;padding:0 .9rem;border-radius:999px;background:#fff;border:1px solid var(--gfr-border);font-weight:900}body.gravity-functional-release .nav-mobile__summary::-webkit-details-marker{display:none}body.gravity-functional-release .nav-mobile__panel{position:absolute;right:1rem;margin-top:.75rem;width:min(22rem,calc(100vw - 2rem));padding:.9rem;border-radius:1.15rem;background:#fff;border:1px solid var(--gfr-border);box-shadow:var(--gfr-shadow);z-index:100}.gfr-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.5rem;min-height:2.9rem;padding:.72rem 1.05rem;border-radius:999px!important;background:linear-gradient(135deg,var(--gfr-primary),color-mix(in srgb,var(--gfr-primary),#000 14%))!important;color:#fff!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.18)!important;font-weight:950!important;box-shadow:0 10px 22px rgba(var(--gfr-primary-rgb),.16)!important;white-space:nowrap}
.gfr-breadcrumbs{max-width:1180px;margin:.85rem auto 0;padding:0 clamp(1rem,3vw,2rem);font-size:.82rem;color:var(--gfr-muted)}.gfr-breadcrumbs__list{display:flex!important;align-items:center;gap:.45rem;flex-wrap:wrap;list-style:none!important;margin:0!important;padding:0!important}.gfr-breadcrumbs__item,.gfr-breadcrumbs__link,.gfr-breadcrumbs__current{display:inline-flex;align-items:center;gap:.4rem;color:var(--gfr-muted)!important;text-decoration:none!important}.gfr-breadcrumbs__item:not(:last-child)::after{content:'›';opacity:.45;font-weight:900}.gfr-breadcrumbs__item.is-current,.gfr-breadcrumbs__current:last-child{color:var(--gfr-text)!important;font-weight:850}
body.gravity-functional-release .gfr-section,body.gravity-functional-release .block-section,body.gravity-functional-release .semantic-section,body.gravity-functional-release .el-section{padding:var(--gfr-section) 0!important}body.gravity-functional-release .el-section-wrapper{padding-block:0!important;background:transparent!important}.gfr-section__container,.block-section>.el-container,.semantic-section__container{border-radius:var(--gfr-radius-lg)!important}.gfr-section__header,.block__header,.section-title{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.35rem;margin-bottom:clamp(1.15rem,2.5vw,2rem)!important;max-width:820px}.gfr-section__header p,.block__subtitle,.block__header p{max-width:70ch;color:var(--gfr-muted)!important;font-size:clamp(1rem,1.28vw,1.12rem)}body.gravity-functional-release h1,body.gravity-functional-release h2,body.gravity-functional-release h3{font-family:var(--font-display,Sora,Inter,system-ui,sans-serif);color:var(--gfr-text)!important;letter-spacing:-.04em;line-height:1.06;text-wrap:balance;margin-top:0}body.gravity-functional-release h1{font-size:clamp(2.25rem,5vw,4.6rem)!important;max-width:15ch;margin-bottom:1rem!important}body.gravity-functional-release h2{font-size:clamp(1.72rem,3vw,2.65rem)!important;max-width:19ch;margin-bottom:.85rem!important}body.gravity-functional-release h3{font-size:clamp(1.08rem,1.55vw,1.35rem)!important;margin-bottom:.55rem!important}body.gravity-functional-release p{color:var(--gfr-muted);margin:0}
.gfr-hero{padding-top:clamp(1.3rem,3vw,2.3rem)!important}.gfr-hero__panel,.hero__minimal,.hero__shell,.hero__centered--with-media{display:grid!important;grid-template-columns:minmax(0,.98fr) minmax(300px,.74fr)!important;align-items:center!important;gap:clamp(1.25rem,3.6vw,3rem)!important;max-width:1180px!important;margin-inline:auto!important;padding:clamp(1.35rem,3vw,2.7rem)!important;border-radius:var(--gfr-radius-lg)!important;background:radial-gradient(circle at 100% 0,rgba(var(--gfr-primary-rgb),.10),transparent 34%),#fff!important;border:1px solid var(--gfr-border)!important;box-shadow:var(--gfr-shadow)!important;color:var(--gfr-text)!important;overflow:hidden}.hero__minimal>.hero__eyebrow,.hero__minimal>h1,.hero__minimal>.hero__subtitle,.hero__minimal>.cta-row,.hero__minimal>.hero__bullets{grid-column:1}.hero__minimal>.hero-visual{grid-column:2;grid-row:1/span 7;margin:0!important}.gfr-hero__lead,.hero__subtitle{font-size:clamp(1.03rem,1.45vw,1.22rem)!important;max-width:62ch;color:var(--gfr-muted)!important}.hero__eyebrow,.block__eyebrow,.card__eyebrow{display:inline-flex;width:max-content;max-width:100%;align-items:center;min-height:2rem;padding:.38rem .68rem;border-radius:999px;background:rgba(var(--gfr-primary-rgb),.075);border:1px solid rgba(var(--gfr-primary-rgb),.13);color:var(--gfr-primary)!important;font-size:.76rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.85rem}.gfr-hero__visual-frame,.hero-visual__frame{position:relative;min-height:clamp(280px,34vw,440px)!important;border-radius:clamp(1.15rem,2vw,1.65rem)!important;overflow:hidden;background:radial-gradient(circle at 70% 18%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,var(--gfr-primary),color-mix(in srgb,var(--gfr-primary),#fff 26%))!important;box-shadow:var(--gfr-shadow)!important;border:1px solid rgba(255,255,255,.75)!important}.hero-visual__frame img{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover}.gfr-hero__fallback{position:absolute;inset:0;display:grid;place-items:center;opacity:.14;pointer-events:none}.gfr-hero__fallback i{position:absolute;border-radius:999px;background:#fff}.gfr-hero__fallback i:nth-child(1){width:42%;height:42%;right:8%;top:8%}.gfr-hero__fallback i:nth-child(2){width:28%;height:28%;left:15%;bottom:18%}.gfr-hero__fallback i:nth-child(3){width:14%;height:14%;left:48%;top:42%}
.gfr-proof-strip{padding:clamp(1rem,2.4vw,1.5rem) 0!important}.gfr-proof-strip__grid,.conversion-proof-strip__grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:.8rem!important}.gfr-proof-card,.conversion-proof-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.15rem .72rem!important;align-items:center!important;min-height:5.3rem!important;padding:1rem!important;border-radius:1.05rem!important;background:#fff!important;border:1px solid var(--gfr-border)!important;box-shadow:var(--gfr-shadow-soft)!important}.gfr-proof-card__icon,.conversion-proof-item__value{grid-row:span 2;display:inline-grid!important;place-items:center;width:2.55rem;height:2.55rem;border-radius:.85rem;background:rgba(var(--gfr-primary-rgb),.08);color:var(--gfr-primary);font-weight:950}.gfr-proof-card__label,.conversion-proof-item__label{font-weight:950;color:var(--gfr-text);line-height:1.15}.gfr-proof-card__text,.conversion-proof-item__text{font-size:.88rem;color:var(--gfr-muted);line-height:1.25}
.gfr-grid,.services-grid__cards,.semantic-items,.trust-grid,.local-proof__grid,.local-proof__signal-list,.process-steps__timeline,.price-guidance__cards,.testimonials-grid,.internal-links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr))!important;gap:clamp(.9rem,1.8vw,1.25rem)!important;align-items:stretch!important}.gfr-card,.service-card,.proof-card,.step-card,.price-card,.faq-item,.faq-entry,.faq-item-refined,.testimonial-card,.semantic-card,.trust-band__signal-card,.conversion-proof-item,.internal-links-item,.services-grid__magazine-feature,.process-step-rail__body,.map-block__support,.proof-card-minimal{min-width:0;border-radius:var(--gfr-radius)!important;background:#fff!important;border:1px solid var(--gfr-border)!important;box-shadow:var(--gfr-shadow-soft)!important;padding:clamp(1.05rem,2vw,1.45rem)!important}.gfr-card:hover{border-color:var(--gfr-border-strong)}.gfr-card p,.service-card p,.proof-card p,.step-card p,.price-card p,.semantic-card p{color:var(--gfr-muted)!important}.gfr-card__icon,.service-card__icon,.process-step-rail__index,.step-card__index,.local-proof__signal-index,.trust-band__signal-index,.proof-row__ordinal{display:inline-grid!important;place-items:center;width:2.55rem!important;height:2.55rem!important;border-radius:999px!important;background:linear-gradient(135deg,var(--gfr-primary),color-mix(in srgb,var(--gfr-primary),#000 18%))!important;color:#fff!important;font-weight:950!important;box-shadow:0 8px 18px rgba(var(--gfr-primary-rgb),.16)!important;flex:0 0 auto}.service-card__meta,.step-card__meta,.step-row__meta,.proof-row__meta,.price-card__facts,.block__pills,.services-grid__trust,.urgency-banner__pills{display:flex!important;flex-wrap:wrap!important;gap:.45rem!important;list-style:none!important;margin:.85rem 0 0!important;padding:0!important}.service-card__meta li,.step-card__meta li,.step-row__meta li,.proof-row__meta li,.price-card__facts li,.block__pill{display:inline-flex!important;align-items:center;min-height:1.9rem;padding:.36rem .6rem;border-radius:999px;background:rgba(var(--gfr-primary-rgb),.055);border:1px solid rgba(var(--gfr-primary-rgb),.11);color:var(--gfr-primary);font-size:.8rem;font-weight:850;line-height:1.15}.gfr-list{display:grid!important;gap:.58rem!important;list-style:none!important;margin:1rem 0 0!important;padding:0!important}.gfr-list__item{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:.55rem;align-items:start;padding:.72rem .78rem;border-radius:.9rem;background:#fff;border:1px solid var(--gfr-border);box-shadow:0 4px 14px rgba(15,23,42,.035);color:var(--gfr-muted)}.gfr-list__item::before{content:'✓';display:inline-grid;place-items:center;width:1.35rem;height:1.35rem;border-radius:999px;background:rgba(var(--gfr-primary-rgb),.08);color:var(--gfr-primary);font-weight:950;font-size:.78rem;margin-top:.05rem}
.gfr-process .process-steps__rail,.process-steps__rail{display:grid!important;gap:.85rem!important;padding-left:0!important}.gfr-process .process-steps__rail::before,.process-steps__rail::before{display:none!important}.gfr-process-step,.process-step-rail{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.9rem!important;align-items:start!important;padding:0!important}.process-step-rail__body{min-width:0!important}.gfr-trust-block .gfr-signal-card,.local-proof__signal,.trust-band__signal-card,.proof-row--stacked{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.82rem!important;align-items:start!important}.gfr-signal-check,.local-proof__signal-index,.trust-band__signal-index,.proof-row__ordinal{font-size:0!important}.gfr-signal-check::before,.local-proof__signal-index::before,.trust-band__signal-index::before,.proof-row__ordinal::before{content:'✓';font-size:.95rem;color:#fff}.local-proof__signal-copy,.trust-band__signal-copy{display:grid;gap:.25rem;min-width:0}.local-proof__signal-copy span,.trust-band__signal-copy p,.proof-row p{color:var(--gfr-muted)!important}
.faq-block__accordion,.faq-block__accordion--refined{display:grid!important;gap:.75rem!important;max-width:940px}.faq-item-refined{overflow:hidden}.faq-summary-refined{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:.75rem!important;align-items:center!important;cursor:pointer;list-style:none!important;padding:1rem 1.05rem!important;color:var(--gfr-text)!important;font-weight:900}.faq-summary-refined::-webkit-details-marker{display:none}.faq-summary-refined::after{content:'+';font-weight:950;color:var(--gfr-primary)}details[open]>.faq-summary-refined::after{content:'–'}.faq-summary-refined__count{display:none!important}.faq-content-refined{padding:0 1.05rem 1.05rem!important;color:var(--gfr-muted)!important}.gfr-map-frame,.map-block__frame,.map-wrapper,.map-boxed-wrapper,.map-directory__visual{position:relative;min-height:clamp(230px,30vw,340px)!important;border-radius:var(--gfr-radius)!important;background:linear-gradient(135deg,#e6edf5,#f8fafc)!important;border:1px solid var(--gfr-border)!important;box-shadow:var(--gfr-shadow-soft)!important;overflow:hidden}.gfr-map-fallback{position:absolute;inset:auto 1rem 1rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.8rem .9rem;border-radius:1rem;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.75);box-shadow:0 8px 20px rgba(15,23,42,.08)}.gfr-map-fallback strong{color:var(--gfr-text)}.gfr-map-fallback span{color:var(--gfr-muted);font-size:.9rem}.block__cta-group{display:flex!important;align-items:center!important;gap:.7rem!important;flex-wrap:wrap!important;margin-top:1.05rem!important}.block__cta-note,.block__cta-phone{display:inline-flex;align-items:center;min-height:2.55rem;max-width:35rem;padding:.62rem .82rem;border-radius:999px;background:rgba(15,23,42,.035);border:1px solid var(--gfr-border);color:var(--gfr-muted);font-size:.88rem;font-weight:650;line-height:1.25}.gfr-mobile-cta{display:none!important}.internal-links-hub{margin-top:clamp(2rem,4vw,3.5rem)!important;padding:clamp(2rem,4vw,3.5rem) 0!important;background:transparent!important}.internal-links-item__anchor{width:100%}
.footer-editorial,footer{background:radial-gradient(circle at top left,rgba(var(--gfr-primary-rgb),.20),transparent 34%),#0f172a!important;color:#fff!important;padding:clamp(2.4rem,5vw,4rem) 0!important}.footer-editorial p,.footer-editorial a,footer p,footer a{color:rgba(255,255,255,.72)!important}.footer__grid-refined,.footer__links-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))!important;gap:1.25rem!important}ul:empty,ol:empty,p:empty,h2:empty,h3:empty,li:empty{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}@media(max-width:900px){.gfr-proof-strip__grid,.conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.gfr-hero__panel,.hero__minimal,.hero__shell,.hero__centered--with-media,.services-grid__magazine,.local-proof__coverage,.process-steps__rail-layout,.price-guidance__insight,.cta-panel__consult,.map-block__context,.urgency-banner{grid-template-columns:minmax(0,1fr)!important}.hero__minimal>.hero-visual{grid-column:auto!important;grid-row:auto!important}.hero h1{max-width:100%!important}}@media(max-width:640px){body.gravity-functional-release{padding-bottom:5.5rem}.el-container{padding-inline:1rem!important}.gfr-hero__panel,.hero__minimal,.hero__shell{padding:1.12rem!important;border-radius:1.25rem!important}.gfr-proof-strip__grid,.conversion-proof-strip__grid{grid-template-columns:1fr!important}.gfr-button,.cta-primary,.card__btn{width:100%!important}.gfr-trust-block .gfr-signal-card,.local-proof__signal,.trust-band__signal-card,.proof-row--stacked,.gfr-process-step,.process-step-rail{grid-template-columns:minmax(0,1fr)!important}.gfr-mobile-cta{position:fixed;left:.85rem;right:.85rem;bottom:.85rem;z-index:120;display:flex!important;align-items:center;justify-content:space-between;gap:.85rem;padding:.75rem .8rem .75rem 1rem;border-radius:1.15rem;background:rgba(15,23,42,.94);color:#fff;box-shadow:0 18px 44px rgba(2,6,23,.32)}.gfr-mobile-cta strong{display:block;color:#fff;font-size:.96rem;line-height:1.1}.gfr-mobile-cta small{display:block;color:rgba(255,255,255,.72);font-size:.78rem;max-width:16rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gfr-mobile-cta__button{display:inline-grid;place-items:center;width:3rem;height:3rem;border-radius:.95rem;background:var(--gfr-accent);color:#fff;text-decoration:none;font-weight:950;flex:0 0 auto}}
`;
}

function injectFinalCss($: CheerioAPI): void {
  $('#gravity-functional-delivery-release-css').remove();
  $('head').append(`<style id="gravity-functional-delivery-release-css">${functionalReleaseCss()}</style>`);
}

export function applyFunctionalDeliveryRelease($: CheerioAPI, context: FunctionalDeliveryReleaseContext = {}): void {
  normalizeHead($);
  removeStyleDebt($);
  ensureBodyClass($);
  normalizeTextNodes($, context);
  normalizeBreadcrumbs($);
  normalizeNavigation($);
  normalizeHero($, context);
  normalizeProofStrip($);
  normalizeSections($, context);
  normalizeCards($);
  normalizeLists($);
  normalizeTrustSignals($);
  normalizeProcess($);
  normalizeMapAndCta($, context);
  fixInternalAnchors($);
  removeEmptyArtifacts($);
  injectFinalCss($);
}
