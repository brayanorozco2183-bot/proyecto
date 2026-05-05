import * as cheerio from 'cheerio';
import { FINAL_DELIVERY_CASCADE_LOCK_CSS } from '../design-system/finalDeliveryCascadeLockCss.js';

export interface CleanDeliveryHtmlContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureShell($: cheerio.CheerioAPI): void {
  if (!$('html').length) {
    const current = $.root().html() || '';
    $.root().empty().append(`<html lang="es-ES"><head></head><body>${current}</body></html>`);
  }
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
  const body = $('body').first();
  const classes = new Set(clean(body.attr('class')).split(/\s+/).filter(Boolean));
  classes.add('gravity-clean-delivery');
  classes.add('gravity-final-polish');
  for (const unstable of ['paradigm-bento_grid_system', 'paradigm-experimental', 'debug-layout', 'wireframe-mode']) classes.delete(unstable);
  body.attr('class', Array.from(classes).join(' '));
}

function pruneLegacyStyleTags($: cheerio.CheerioAPI): void {
  const ids = [
    'gravity-final-delivery-cascade-lock-css',
    'gravity-clean-delivery-cascade-lock-css',
    'gravity-delivery-stable-css',
    'gravity-final-delivery-emergency-css',
    'gravity-deterministic-premium-css',
    'patch-premium-safe-polish',
    'layout-hotfix-max-gravity',
    'layout-hotfix-performance',
    'el-utility-fixes'
  ];
  for (const id of ids) $(`#${id}`).remove();

  $('style').each((_i: number, el: any) => {
    const $el = $(el);
    const content = String($el.html() || '');
    const id = clean($el.attr('id'));
    if (id) return;
    // Do not remove the main theme style, because it usually contains :root tokens.
    // Remove only standalone duplicate patch layers with no theme tokens.
    const isStandaloneLegacy = /Gravity (?:Delivery Stable CSS|Final Delivery Emergency Lock|Clean Delivery Cascade Lock)/i.test(content) && !/:root\s*\{[^}]*--bg\s*:/i.test(content);
    if (isStandaloneLegacy) $el.remove();
  });
}

function injectFinalCss($: cheerio.CheerioAPI): void {
  pruneLegacyStyleTags($);
  $('head').append(`<style id="gravity-final-delivery-cascade-lock-css">${FINAL_DELIVERY_CASCADE_LOCK_CSS}</style>`);
}

function normalizeNavigation($: cheerio.CheerioAPI): void {
  const header = $('.site-header, header').first();
  if (!header.length) return;

  const desktopNavs = header.find('.nav--desktop, nav.nav').toArray().filter((el: any) => $(el).closest('.nav-mobile').length === 0);
  desktopNavs.forEach((el: any, index: number) => {
    const $el = $(el);
    $el.addClass('nav nav--desktop');
    if (index > 0) $el.remove();
  });

  const mobileNavs = header.find('.nav-mobile').toArray();
  mobileNavs.forEach((el: any, index: number) => {
    const $el = $(el);
    if (index > 0) {
      $el.remove();
      return;
    }
    $el.removeAttr('open');
    $el.attr('aria-label', $el.attr('aria-label') || 'Navegación móvil');
    let summary = $el.children('summary').first();
    if (!summary.length) {
      $el.prepend('<summary class="nav-mobile__summary" aria-label="Abrir menú">Menú</summary>');
      summary = $el.children('summary').first();
    }
    summary.addClass('nav-mobile__summary');
    if (!clean(summary.text())) summary.text('Menú');
    summary.attr('aria-label', summary.attr('aria-label') || 'Abrir menú');
    $el.find('.nav-mobile__panel').first().attr('aria-label', 'Menú móvil');
  });
}

function ensureContactAnchor($: cheerio.CheerioAPI, context: CleanDeliveryHtmlContext): void {
  if ($('#contacto').length) return;
  const target = $('.block--cta_panel, .cta-panel, .section-cta--terminal, footer, .footer-editorial, .site-footer').first();
  if (target.length) {
    target.attr('id', 'contacto');
    return;
  }
  const city = clean(context.city || 'tu zona');
  const niche = clean(context.niche || 'servicio profesional');
  const section = `<section id="contacto" class="block-section block--cta_panel gravity-contact-anchor"><div class="el-container"><div class="section-cta--terminal"><h2>Contacto para ${escapeHtml(niche)} en ${escapeHtml(city)}</h2><p>Describe la situación y revisa las opciones disponibles antes de confirmar una intervención.</p></div></div></section>`;
  const footer = $('footer, .footer-editorial, .site-footer').first();
  if (footer.length) footer.before(section);
  else $('body').append(section);
}

function repairAnchors($: cheerio.CheerioAPI): void {
  const anchors = new Set($('[id]').map((_i: number, el: any) => clean($(el).attr('id'))).get().filter(Boolean));
  $('a').each((_i: number, el: any) => {
    const $el = $(el);
    const text = clean($el.text()).toLowerCase();
    const classes = clean($el.attr('class')).toLowerCase();
    const isCta = /cta|btn|bot[oó]n|contact|presupuesto|solicitar|atenci[oó]n|llamar|consulta/.test(`${classes} ${text}`);
    const href = clean($el.attr('href'));

    if (!href || href === '#') {
      $el.attr('href', isCta ? '#contacto' : './');
      return;
    }
    if (href.startsWith('#')) {
      const target = href.slice(1).trim();
      if (!target || !anchors.has(target)) $el.attr('href', '#contacto');
      return;
    }
    if (/^tel:/i.test(href)) {
      const digits = href.replace(/\D/g, '');
      if (digits.length < 9) $el.attr('href', '#contacto');
      return;
    }
    if ((href === '/' || href === './' || href === './index.html') && isCta) $el.attr('href', '#contacto');
  });
}

function normalizeLocalImageSrc(src: string): string {
  const raw = clean(src);
  if (!raw || /^data:/i.test(raw) || /^https?:\/\//i.test(raw) || /^mailto:/i.test(raw)) return raw;
  if (/^\.\//.test(raw) && !/[\\]/.test(raw)) return raw;
  const withoutQuery = raw.split(/[?#]/)[0] || raw;
  const file = withoutQuery.replace(/\\/g, '/').split('/').filter(Boolean).pop() || raw;
  if (/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(file)) return `./${file}`;
  return raw.replace(/\\/g, '/');
}

function normalizeImages($: cheerio.CheerioAPI, context: CleanDeliveryHtmlContext): void {
  const label = clean(`${context.niche || 'Servicio local'} ${context.city || ''}`) || 'Servicio local';
  $('img').each((_i: number, el: any) => {
    const $el = $(el);
    const src = clean($el.attr('src') || $el.attr('data-src') || '');
    if (src) $el.attr('src', normalizeLocalImageSrc(src));
    if (!clean($el.attr('alt'))) $el.attr('alt', label);
    if (!$el.attr('decoding')) $el.attr('decoding', 'async');
    if (!$el.attr('loading') && !$el.closest('.hero, .hero-visual').length) $el.attr('loading', 'lazy');
    $el.attr('onerror', "this.classList.add('image-failed');this.style.display='none';var p=this.parentElement;if(p){p.classList.add('image-failed');}");
  });
  $('.hero-visual__frame').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.find('img').length === 0) $el.addClass('image-failed');
  });
}

function designLooseLists($: cheerio.CheerioAPI): void {
  $('ul, ol').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.closest('nav, header, footer, .site-header, .site-footer, .footer-editorial, .nav-mobile, .breadcrumb, .el-breadcrumbs, script, style').length) return;
    if ($el.children('li').length === 0) {
      $el.remove();
      return;
    }
    const existing = clean($el.attr('class'));
    if (!existing) $el.addClass('gravity-list-card');
  });
}

function cleanTextValue(value: string, context: CleanDeliveryHtmlContext): string {
  const city = clean(context.city || 'tu zona');
  let out = String(value || '');
  out = out
    .replace(/:\s*este bloque resume[^.?!]*(?:[.?!]|$)/gi, ' ')
    .replace(/\b(?:Factor|Criterio)\s*\d+\b\s*[:.-]?/gi, 'Aspecto clave')
    .replace(/\bTestimonios\s+Locales\b/gi, 'Señales locales de confianza')
    .replace(/\bLo que dicen nuestros clientes\b/gi, 'Qué conviene comprobar antes de contratar')
    .replace(/\b(?:opiniones|reseñas|testimonios)\s+de\s+clientes\b/gi, 'señales de confianza')
    .replace(/\bclientes\s+dicen\b/gi, 'conviene revisar')
    .replace(/\bEn\s*([,.;:])/g, `En ${city}$1`)
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\ben\s+conviene\b/gi, `en ${city} conviene`)
    .replace(/\b(?:undefined|null|object object|NaN)\b/gi, ' ')
    .replace(/\{\{[^}]+\}\}|\[\[[^\]]+\]\]|__[^_]+__|\$\{[^}]+\}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ');
  return out;
}

function repairVisibleText($: cheerio.CheerioAPI, context: CleanDeliveryHtmlContext): void {
  $('body').find('*').contents().each((_i: number, node: any) => {
    if (node.type !== 'text') return;
    const parent = node.parent ? $(node.parent) : null;
    if (parent && parent.closest('script, style, noscript, code, pre').length) return;
    const next = cleanTextValue(node.data || '', context);
    if (next !== node.data) node.data = next;
  });
  $('[alt], [title], [aria-label], [placeholder]').each((_i: number, el: any) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
      const current = $el.attr(attr);
      if (current) $el.attr(attr, cleanTextValue(current, context).trim());
    }
  });
}

function reorderKnownBlocks($: cheerio.CheerioAPI): void {
  const footer = $('footer, .footer-editorial, .site-footer').first();
  if (footer.length) {
    $('.internal-links-hub, .block--internal_linking, [data-block-type="internal_linking"]').each((_i: number, el: any) => {
      const $el = $(el);
      if ($el.nextAll().filter(footer).length === 0) footer.before($el);
    });
    $('.block--cta_panel, .cta-panel, .section-cta--terminal').not('#contacto').last().each((_i: number, el: any) => {
      const $el = $(el);
      if ($el.nextAll().filter(footer).length === 0) footer.before($el);
    });
  }
}

function removeEmptyArtifacts($: cheerio.CheerioAPI): void {
  $('ul, ol').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.children('li').length === 0 && clean($el.text()) === '') $el.remove();
  });
  $('.service-card, .step-card, .proof-card, .price-card, .semantic-card, .faq-item, .faq-entry, .testimonial-card, .conversion-proof-item').each((_i: number, el: any) => {
    const $el = $(el);
    if (clean($el.text()) === '' && $el.find('img, iframe, svg').length === 0) $el.remove();
  });
  $('section, article, div').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.hasClass('el-container') || $el.hasClass('site-header__inner')) return;
    if (clean($el.text()) === '' && $el.children().length === 0 && $el.find('img, iframe, svg').length === 0) $el.remove();
  });
}

function normalizeClassAttributes($: cheerio.CheerioAPI): void {
  $('[class]').each((_i: number, el: any) => {
    const $el = $(el);
    const tokens = clean($el.attr('class')).split(/\s+/).filter(Boolean).filter((token) => !/^(?:undefined|null|NaN)$/i.test(token));
    if (tokens.length) $el.attr('class', Array.from(new Set(tokens)).join(' '));
    else $el.removeAttr('class');
  });
}

export function normalizeCleanDeliveryHtml(html: string, context: CleanDeliveryHtmlContext = {}): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  ensureShell($);
  normalizeClassAttributes($);
  normalizeNavigation($);
  ensureContactAnchor($, context);
  repairVisibleText($, context);
  normalizeImages($, context);
  designLooseLists($);
  removeEmptyArtifacts($);
  reorderKnownBlocks($);
  repairAnchors($);
  injectFinalCss($);
  return $.html({ decodeEntities: false })
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
