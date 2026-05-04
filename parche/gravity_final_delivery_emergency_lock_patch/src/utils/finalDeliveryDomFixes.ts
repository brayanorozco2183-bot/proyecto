import type * as cheerio from 'cheerio';
import { FINAL_DELIVERY_EMERGENCY_CSS } from '../design-system/finalDeliveryEmergencyCss.js';

export interface FinalDeliveryDomFixContext {
  city?: string;
  niche?: string;
}

function textOf($: cheerio.CheerioAPI, el: any): string {
  return String($(el).text() || '').replace(/\s+/g, ' ').trim();
}

function cleanLocalAssetSrc(src: string): string {
  const raw = String(src || '').trim();
  if (!raw || /^data:/i.test(raw) || /^https?:\/\//i.test(raw)) return raw;
  const withoutQuery = raw.split(/[?#]/)[0] || raw;
  const file = withoutQuery.replace(/\\/g, '/').split('/').filter(Boolean).pop();
  if (!file) return raw;
  return `./${file}`;
}

function ensureFinalEmergencyCss($: cheerio.CheerioAPI): void {
  $('#gravity-final-delivery-emergency-css').remove();
  $('head').append(`<style id="gravity-final-delivery-emergency-css">${FINAL_DELIVERY_EMERGENCY_CSS}</style>`);
}

function hardenNavigation($: cheerio.CheerioAPI): void {
  const body = $('body').first();
  const classes = new Set(String(body.attr('class') || '').split(/\s+/).filter(Boolean));
  classes.add('gravity-final-delivery-lock');
  body.attr('class', Array.from(classes).join(' '));

  $('.site-header').first().attr('data-final-nav-lock', 'true');
  $('.nav--desktop').attr('aria-label', 'Navegación principal').removeAttr('hidden');
  $('.nav-mobile').attr('aria-label', 'Navegación móvil').removeAttr('hidden');
  $('.nav-mobile').each((_i, el) => {
    const node = $(el);
    if (node.attr('open') !== undefined) node.removeAttr('open');
  });
}

function hardenHeroMedia($: cheerio.CheerioAPI, context: FinalDeliveryDomFixContext): void {
  const label = `${context.niche || 'Servicio profesional'} en ${context.city || 'tu zona'}`;
  $('.hero-visual__frame').each((_i, frame) => {
    const box = $(frame);
    const img = box.find('img').first();
    if (!img.length) {
      box.attr('data-image-missing', 'true');
      box.attr('role', 'img');
      box.attr('aria-label', label);
      return;
    }

    const current = String(img.attr('src') || '').trim();
    const fixed = cleanLocalAssetSrc(current);
    if (fixed) img.attr('src', fixed);
    else box.attr('data-image-missing', 'true');

    img.attr('alt', String(img.attr('alt') || label).trim() || label);
    img.attr('decoding', img.attr('decoding') || 'async');
    img.attr('loading', img.attr('loading') || 'eager');
    img.attr('onerror', "this.closest('.hero-visual__frame')?.setAttribute('data-image-missing','true');this.style.display='none';");

    if (/resolution-low/i.test(String(img.attr('data-image-warning') || '')) || String(img.attr('data-image-width-real') || '') === '640') {
      box.attr('data-image-low-quality', 'true');
    }
  });
}

function removeBrokenOrEmptyWrappers($: cheerio.CheerioAPI): void {
  $('.el-section-wrapper').each((_i, el) => {
    const node = $(el);
    const hasSection = node.find('section, article, footer, header, nav, img, iframe').length > 0;
    if (!hasSection && !textOf($, el)) node.remove();
  });

  $('ul, ol').each((_i, el) => {
    const node = $(el);
    if (!node.children('li').length && !textOf($, el)) node.remove();
  });

  $('.service-card__meta, .step-card__meta, .step-row__meta, .proof-row__meta, .price-card__facts').each((_i, el) => {
    const node = $(el);
    if (!node.children('li').length && !textOf($, el)) node.remove();
  });

  $('.service-card, .step-card, .proof-card, .price-card, .semantic-card, .testimonial-card, .trust-band__pill-card, .trust-band__signal-card').each((_i, el) => {
    const node = $(el);
    const hasMedia = node.find('img, iframe, svg, video').length > 0;
    if (!hasMedia && !textOf($, el)) node.remove();
  });

  $('style').each((_i, el) => {
    const css = String($(el).html() || '');
    if (/paradigm-bento_grid_system|paradigm-cinematic_scroll/i.test(css)) $(el).remove();
  });
}

function normalizeListClasses($: cheerio.CheerioAPI): void {
  $('.trust-band__pills').addClass('trust-band__pills--cards');
  $('.trust-band__pill-card').addClass('semantic-card');
  $('.local-proof__signal').addClass('proof-card');
  $('.process-step-rail__body').addClass('step-card');
  $('.price-card__facts li, .service-card__meta li, .step-row__meta li, .proof-row__meta li').each((_i, el) => {
    const node = $(el);
    if (!textOf($, el)) node.remove();
  });
}

function ensureCtaTargets($: cheerio.CheerioAPI): void {
  if (!$('#contacto').length) {
    const footer = $('footer').first();
    if (footer.length) footer.attr('id', 'contacto');
  }
  const ids = new Set($('[id]').map((_i, el) => String($(el).attr('id') || '')).get().filter(Boolean));
  $('a[href^="#"]').each((_i, el) => {
    const link = $(el);
    const href = String(link.attr('href') || '');
    const target = href.slice(1);
    if (!target || !ids.has(target)) link.attr('href', '#contacto');
  });
}

export function applyFinalDeliveryDomFixes($: cheerio.CheerioAPI, context: FinalDeliveryDomFixContext = {}): void {
  hardenNavigation($);
  hardenHeroMedia($, context);
  removeBrokenOrEmptyWrappers($);
  normalizeListClasses($);
  ensureCtaTargets($);
  ensureFinalEmergencyCss($);
}
