import * as cheerio from 'cheerio';
import { GLOBAL_PROJECT_POLISH_CSS } from '../design-system/globalProjectPolishCss.js';
import type { FinalDocumentSanitizerContext } from './finalDocumentSanitizer.js';

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

function cityLabel(context: FinalDocumentSanitizerContext): string {
  return normalizeText(context.city || 'tu zona');
}

function nicheLabel(context: FinalDocumentSanitizerContext): string {
  const raw = normalizeText(context.niche || 'servicio');
  if (!raw) return 'servicio';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function safeSentence(value: string, context: FinalDocumentSanitizerContext): string {
  const city = cityLabel(context);
  const service = nicheLabel(context).toLowerCase();
  let out = normalizeText(value)
    .replace(/\bundefined\b|\bnull\b|\[object Object\]/gi, ' ')
    .replace(/^\s*:\s*(?:este\s+bloque|bloque)\b[^.?!]*(?:[.?!]|$)/i, '')
    .replace(/\b(?:Criterio|Factor|Señal)\s+0?\d+\b[:\s-]*/gi, '')
    .replace(/\bvisible\s+para\s*:?\s*/gi, '')
    .replace(/\bcoherente\s+con\s*\.?\s*/gi, '')
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\ben\s+conviene\b/gi, `en ${city} conviene`)
    .replace(/\bNuestros Servicios\b/g, `Servicios de ${service} en ${city}`)
    .replace(/\bPrecios Condicionados\b/g, 'Qué condiciona el presupuesto')
    .replace(/\bContáctanos Ahora mismo\b/g, 'Solicita orientación profesional')
    .replace(/\bNavegación relacionada del proyecto\b/g, 'Servicios relacionados')
    .replace(/\bTestimonios Locales\b/gi, 'Señales locales de confianza')
    .replace(/\bLo que dicen nuestros clientes\b/gi, 'Criterios de confianza')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (/^Cómo identificar/i.test(out) && !out.startsWith('¿')) out = `¿${out.replace(/[?\s]+$/g, '')}?`;
  if (/^Qué datos/i.test(out) && !out.startsWith('¿')) out = `¿${out.replace(/[?\s]+$/g, '')}?`;
  if (/^Puedo /i.test(out) && !out.startsWith('¿')) out = `¿${out.replace(/[?\s]+$/g, '')}?`;
  return normalizeText(out);
}

function cleanVisibleText($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  $('body').find('*').contents().each((_i: number, node: any) => {
    if (node.type !== 'text') return;
    const before = String(node.data || '');
    const after = safeSentence(before, context);
    if (after !== normalizeText(before)) node.data = before.replace(before.trim(), after);
  });

  $('[alt], [title], [aria-label], [placeholder]').each((_i: number, el: any) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
      const current = String($el.attr(attr) || '');
      if (!current) continue;
      $el.attr(attr, safeSentence(current, context));
    }
  });
}

function normalizeBodyAndHead($: cheerio.CheerioAPI): void {
  const body = $('body').first();
  const classes = new Set(String(body.attr('class') || '').split(/\s+/).filter(Boolean));
  classes.add('gravity-global-polish');
  classes.add('gravity-release-visual-freeze');
  body.attr('class', Array.from(classes).join(' '));

  const styleIdsToRemove = [
    'gravity-global-project-polish-css',
    'gravity-premium-visual-polish-v2-css',
    'gravity-premium-layout-polish-css'
  ];
  for (const id of styleIdsToRemove) $(`style#${id}`).remove();
  $('head').append(`<style id="gravity-global-project-polish-css">${GLOBAL_PROJECT_POLISH_CSS}</style>`);
}

function normalizeBreadcrumbs($: cheerio.CheerioAPI): void {
  const nav = $('.el-breadcrumbs').first();
  if (!nav.length) return;
  nav.attr('aria-label', nav.attr('aria-label') || 'Breadcrumb');
  const list = nav.find('ol, ul').first();
  if (!list.length) return;
  list.addClass('el-breadcrumbs__list');
  list.children('li').each((_i: number, li: any) => {
    const item = $(li);
    item.addClass('el-breadcrumbs__item');
    if (item.find('.el-breadcrumbs__text').length === 0) {
      const text = normalizeText(item.text());
      item.empty().append(`<span class="el-breadcrumbs__text">${text}</span>`);
    }
  });
}

function normalizeNavigation($: cheerio.CheerioAPI): void {
  $('.nav-mobile[open]').removeAttr('open');
  $('.nav-mobile__panel').attr('aria-hidden', 'true');
  $('.nav--desktop').first().attr('aria-label', 'Principal');
}

function normalizeHero($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  $('.hero-visual__frame').each((_i: number, el: any) => {
    const frame = $(el);
    if (!frame.find('.release-hero-fallback').length) {
      frame.append('<span class="release-hero-fallback" aria-hidden="true"><span></span><span></span><span></span></span>');
    }
    const img = frame.find('img').first();
    if (img.length) {
      const src = String(img.attr('src') || '').trim();
      if (src && !/^(?:https?:|data:|\.\/|\/)/i.test(src)) img.attr('src', `./${src.replace(/^\/+/, '')}`);
      if (!img.attr('alt')) img.attr('alt', `${nicheLabel(context)} en ${cityLabel(context)}`);
      img.attr('onerror', "this.style.display='none';this.closest('.hero-visual__frame')?.classList.add('is-fallback');");
    }
  });
}

function normalizeLists($: cheerio.CheerioAPI): void {
  $('main section ul:not([class]), .block-section ul:not([class])').each((_i: number, el: any) => {
    const list = $(el);
    if (list.closest('nav, footer, .nav-mobile__panel, .nav__links-group').length) return;
    list.addClass('global-polish-list');
  });
  $('ul, ol').each((_i: number, el: any) => {
    const list = $(el);
    if (list.children('li').length === 0) list.remove();
  });
}

function normalizeProofAndSignals($: cheerio.CheerioAPI): void {
  $('.local-proof__signal-index, .trust-band__signal-index, .proof-row__ordinal').each((_i: number, el: any) => {
    $(el).text('✓').attr('aria-hidden', 'true');
  });
  $('span, strong, h3, h4').each((_i: number, el: any) => {
    const node = $(el);
    const text = normalizeText(node.text());
    if (/^(?:Señal|Criterio|Factor)\s+0?\d+$/i.test(text)) node.text('✓').attr('aria-hidden', 'true');
  });
}

function normalizeCtas($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  $('.mobile-sticky-cta__copy strong').each((_i: number, el: any) => $(el).text('Contactar'));
  $('.mobile-sticky-cta__copy span').each((_i: number, el: any) => $(el).text(`${nicheLabel(context)} en ${cityLabel(context)}`));
  $('.mobile-sticky-cta__button').each((_i: number, el: any) => {
    const btn = $(el);
    btn.attr('href', '#contacto');
    btn.attr('aria-label', 'Solicitar contacto');
  });

  $('.block__cta-note').each((_i: number, el: any) => {
    const note = $(el);
    const text = normalizeText(note.text());
    if (text.length > 150 || /capacitados|certificados|garant[ií]a|sin compromiso/i.test(text)) {
      note.text(`Cuéntanos el caso y la zona de ${cityLabel(context)} para orientar el alcance antes de intervenir.`);
    }
  });
}

function normalizeMap($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  $('.map-block__frame, .map-wrapper, .map-boxed-wrapper, .map-directory__visual').each((_i: number, el: any) => {
    const frame = $(el);
    if (!frame.find('iframe').length && !frame.find('.global-polish-map-fallback').length) {
      frame.append(`<div class="global-polish-map-fallback" aria-hidden="true"><strong>${cityLabel(context)}</strong><span>Zona de cobertura operativa</span></div>`);
    }
  });
}

function normalizeInternalAnchors($: cheerio.CheerioAPI): void {
  if (!$('#contacto').length) $('footer').first().attr('id', 'contacto');
  const ids = new Set($('[id]').map((_i: number, el: any) => String($(el).attr('id') || '')).get().filter(Boolean));
  $('a[href^="#"]').each((_i: number, el: any) => {
    const link = $(el);
    const href = String(link.attr('href') || '').trim();
    const target = href.slice(1);
    if (!target || !ids.has(target)) link.attr('href', '#contacto');
  });
}

function removeVisualNoise($: cheerio.CheerioAPI): void {
  $('style').each((_i: number, el: any) => {
    const style = $(el);
    const css = style.text();
    if (/paradigm-bento_grid_system|paradigm-cinematic_scroll/i.test(css)) style.remove();
  });
  $('[class]').each((_i: number, el: any) => {
    const node = $(el);
    const cleaned = String(node.attr('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !/^paradigm-(?:bento|cinematic)/i.test(token))
      .join(' ');
    if (cleaned) node.attr('class', cleaned);
    else node.removeAttr('class');
  });
  $('.el-section-wrapper').each((_i: number, el: any) => {
    const node = $(el);
    if (normalizeText(node.text()).length === 0 && node.find('img,iframe,svg,video,a,button').length === 0) node.remove();
  });
}

function normalizeHeadings($: cheerio.CheerioAPI, context: FinalDocumentSanitizerContext): void {
  const city = cityLabel(context);
  const service = nicheLabel(context).toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/^Nuestros Servicios$/i, `Servicios de ${service} en ${city}`],
    [/^Proceso de Servicio$/i, 'Proceso de trabajo'],
    [/^Precios de Servicios$/i, 'Qué condiciona el presupuesto'],
    [/^Precios y Tarifas$/i, 'Qué condiciona el presupuesto'],
    [/^Precios Condicionados$/i, 'Qué condiciona el presupuesto'],
    [/^Contáctanos Ahora(?: mismo)?$/i, 'Solicita orientación profesional'],
    [/^Navegación relacionada del proyecto$/i, 'Servicios relacionados'],
    [/^Cobertura y ubicación operativa en .+$/i, `Cobertura operativa en ${city}`]
  ];
  $('h1,h2,h3,summary,strong,span').each((_i: number, el: any) => {
    const node = $(el);
    const text = normalizeText(node.text());
    if (!text) return;
    for (const [rx, replacement] of map) {
      if (rx.test(text)) {
        node.text(replacement);
        return;
      }
    }
  });
}

export function applyGlobalProjectPolish(html: string, context: FinalDocumentSanitizerContext): string {
  if (!html || !html.trim()) return html;
  const $ = cheerio.load(html, { decodeEntities: false });
  normalizeBodyAndHead($);
  normalizeBreadcrumbs($);
  normalizeNavigation($);
  normalizeHeadings($, context);
  cleanVisibleText($, context);
  normalizeHero($, context);
  normalizeLists($);
  normalizeProofAndSignals($);
  normalizeCtas($, context);
  normalizeMap($, context);
  normalizeInternalAnchors($);
  removeVisualNoise($);
  return $.html().replace(/\s{2,}/g, ' ').trim();
}
