import * as cheerio from 'cheerio';

export interface FinalClientFacingContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

function normalizeText(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePhone(value: unknown): string {
  const raw = normalizeText(value);
  if (!raw) return '';
  if (/\+\s*34\s*\+\s*34/i.test(raw)) return '';
  if (/(?:^|\D)(?:\d{1,3}\s*)?0{2,}(?:\s*0{2,}){2,}(?:\D|$)/.test(raw)) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return '';
  if (/^(\d)\1+$/.test(digits)) return '';
  if (/0{6,}/.test(digits)) return '';
  if (/^(?:34)?(?:600000000|666666666|999999999|960000000|910000000|900000000)$/.test(digits)) return '';
  if (digits.startsWith('34') && digits.length === 11) return `+${digits}`;
  if (raw.trim().startsWith('+')) return `+${digits}`;
  return digits;
}

function phonePattern(): RegExp {
  return /(?:\+\s*34\s*)?(?:\+\s*34\s*)?(?:[679]\d{2}|8\d{2}|9\d{2})(?:[\s.-]*\d{2}){3}|\+\s*34\s*\+\s*34\s*[\d\s.-]{7,}/gi;
}

function isPhoneOnly(text: string): boolean {
  const stripped = normalizeText(text).replace(phonePattern(), '').replace(/[():+\s.-]/g, '').trim();
  return stripped.length === 0;
}

function cleanClientText(value: string, context: FinalClientFacingContext): string {
  const city = normalizeText(context.city || 'la zona');
  let out = String(value || '');
  out = out
    .replace(/\+\s*34\s*\+\s*34/gi, '+34')
    .replace(/(?:Tel[eé]fono\s+directo|Llamar\s+ahora)\s*:\s*(?:\+?\d[\d\s.-]{7,})/gi, 'Solicitar contacto')
    .replace(/\b24\s*h\b/gi, 'Atención prioritaria')
    .replace(/\bPrecios\s+Condicionados\b/gi, 'Qué condiciona el presupuesto')
    .replace(/\bCont[aá]ctanos\s+Ahora(?:\s+mismo)?\b/gi, 'Solicita orientación')
    .replace(/\bTestimonios\s+Locales\b/gi, 'Señales de confianza locales')
    .replace(/\bLo\s+que\s+dicen\s+nuestros\s+clientes\b/gi, 'Señales que conviene revisar')
    .replace(/\bclientes\s+dicen\b/gi, 'señales que conviene revisar')
    .replace(/\breseñas?\s+reales?\b/gi, 'referencias verificables')
    .replace(/\bNuestros\s+t[eé]cnicos\s+est[aá]n\s+con\s+criterio\s+t[eé]cnico\b/gi, 'El equipo trabaja con criterio técnico')
    .replace(/\bcon\s+criterio\s+t[eé]cnico\s+para\s+identificar/gi, 'con método de diagnóstico para identificar')
    .replace(/\bpara\s*:\s*(?:\+?\d[\d\s.-]{7,}|contacto)\.?/gi, 'para solicitar contacto.')
    .replace(/\bvisible\s+para\s*:\s*/gi, 'visible para ')
    .replace(/\bcoherente\s+con\s*\./gi, `coherente con ${city}.`)
    .replace(/\bcoherente\s+con\s*$/gi, `coherente con ${city}`)
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\ben\s+conviene\b/gi, `en ${city} conviene`)
    .replace(/\bCriterio\s+(\d+)\b/gi, 'Aspecto $1')
    .replace(/\bFactor\s+(\d+)\b/gi, 'Aspecto $1')
    .replace(/\bP[aá]gina\s+Principal\b/g, 'Información principal')
    .replace(/\{\{.*?\}\}|\[\[.*?\]\]|__[^_]+__|\$\{.*?\}|\[object Object\]|\bundefined\b|\bnull\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

  // Remove known generated placeholder addresses from visible copy.
  out = out.replace(/Calle\s+de\s+Col[oó]n,?\s*10,?\s*46004\s+Valencia/gi, city);
  return out;
}

function sanitizeJsonLd($: cheerio.CheerioAPI, context: FinalClientFacingContext): void {
  const safePhone = normalizePhone(context.phone);
  const city = normalizeText(context.city || '');
  $('script[type="application/ld+json"]').each((_i, el) => {
    const $el = $(el);
    try {
      const parsed = JSON.parse($el.text() || '{}');
      const root = parsed && typeof parsed === 'object' ? parsed : {};
      const graph = Array.isArray(root['@graph']) ? root['@graph'] : [root];
      for (const node of graph) {
        if (!node || typeof node !== 'object') continue;
        const rawType = node['@type'];
        const types = Array.isArray(rawType) ? rawType.map(String) : [String(rawType || '')];
        if (types.includes('Organization') || types.includes('LocalBusiness')) {
          if (safePhone) node.telephone = safePhone;
          else {
            delete node.telephone;
            delete node.contactPoint;
          }
          if (node.address && typeof node.address === 'object') {
            delete node.address.streetAddress;
            if (city) node.address.addressLocality = city;
            node.address.addressCountry = 'ES';
            if (!node.address.addressLocality && !node.address.addressCountry) delete node.address;
          } else if (city) {
            node.address = { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'ES' };
          }
        }
        if (types.includes('Service') && city) node.areaServed = { '@type': 'City', name: city };
      }
      if (Array.isArray(root['@graph'])) root['@graph'] = graph;
      $el.text(JSON.stringify(root));
    } catch {
      // Keep malformed JSON-LD untouched; upstream validators can report it.
    }
  });
}

function ensureClientFacingCss($: cheerio.CheerioAPI): void {
  $('#gravity-final-client-facing-css').remove();
  $('head').append(`<style id="gravity-final-client-facing-css">
body.gravity-client-facing-final .nav-mobile{display:none!important}body.gravity-client-facing-final .nav--desktop{display:flex!important}body.gravity-client-facing-final .nav-mobile[open]>.nav-mobile__panel{display:block!important}@media(max-width:760px){body.gravity-client-facing-final .nav--desktop{display:none!important}body.gravity-client-facing-final .nav-mobile{display:block!important}body.gravity-client-facing-final .nav-mobile:not([open])>.nav-mobile__panel{display:none!important}}body.gravity-client-facing-final .content-list,body.gravity-client-facing-final section ul:not([class]),body.gravity-client-facing-final article ul:not([class]){display:grid;gap:.6rem;list-style:none;padding:0;margin:1rem 0}body.gravity-client-facing-final .content-list li,body.gravity-client-facing-final section ul:not([class]) li,body.gravity-client-facing-final article ul:not([class]) li{position:relative;padding:.72rem .85rem .72rem 2.2rem;border:1px solid rgba(148,163,184,.18);border-radius:.9rem;background:#fff;box-shadow:0 4px 14px rgba(15,23,42,.04)}body.gravity-client-facing-final .content-list li:before,body.gravity-client-facing-final section ul:not([class]) li:before,body.gravity-client-facing-final article ul:not([class]) li:before{content:"✓";position:absolute;left:.8rem;top:.72rem;width:1rem;height:1rem;display:grid;place-items:center;border-radius:999px;color:var(--primary,#0f766e);font-weight:900}body.gravity-client-facing-final .hero-visual__frame.is-image-missing img{display:none!important}body.gravity-client-facing-final .hero-visual__frame.is-image-missing:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 20%,rgba(255,255,255,.22),transparent 28%),linear-gradient(135deg,#0f172a,var(--primary,#0f766e));}body.gravity-client-facing-final .hero-visual__frame{position:relative}body.gravity-client-facing-final a[href^="tel:"]{white-space:nowrap}body.gravity-client-facing-final .is-empty-artifact{display:none!important}
</style>`);
}

function normalizeLocalImages($: cheerio.CheerioAPI): void {
  $('img[src]').each((_i, el) => {
    const $el = $(el);
    let src = normalizeText($el.attr('src') || '');
    if (!src || /^(?:https?:|data:|blob:)/i.test(src)) return;
    src = src.replace(/\\/g, '/').split('/').filter(Boolean).pop() || src;
    if (!src.startsWith('./')) src = `./${src}`;
    $el.attr('src', src);
    if ($el.closest('.hero-visual, .hero, [data-image-kind="hero"]').length) {
      const frame = $el.closest('.hero-visual__frame');
      if (frame.length) frame.addClass('has-local-image');
      $el.attr('onerror', "this.style.display='none';var p=this.closest('.hero-visual__frame');if(p){p.classList.add('is-image-missing');}");
    }
  });
}

function cleanupVisibleElements($: cheerio.CheerioAPI, context: FinalClientFacingContext): void {
  $('body').addClass('gravity-client-facing-final');
  $('.nav-mobile').removeAttr('open');

  $('a[href^="tel:"]').each((_i, el) => {
    const $el = $(el);
    const href = normalizeText($el.attr('href') || '');
    const text = normalizeText($el.text());
    const normalized = normalizePhone(href || text);
    if (!normalized) {
      $el.attr('href', '#contacto');
      if (!text || isPhoneOnly(text) || /llamar/i.test(text)) $el.text('Solicitar contacto');
    } else {
      $el.attr('href', `tel:${normalized.replace(/^\+/, '+')}`);
    }
  });

  $('body').find('*').contents().each((_i, node: any) => {
    if (node.type !== 'text') return;
    const original = String(node.data || '');
    let cleaned = cleanClientText(original, context);
    if (isPhoneOnly(cleaned) && !normalizePhone(context.phone)) cleaned = '';
    node.data = cleaned;
  });

  $('[alt], [title], [aria-label], [placeholder], [content]').each((_i, el) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const current = $el.attr(attr);
      if (typeof current === 'string') $el.attr(attr, cleanClientText(current, context));
    }
  });

  $('p, li, span, small, strong, a').each((_i, el) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (!text) return;
    if (!normalizePhone(context.phone) && isPhoneOnly(text)) {
      if ($el.is('a')) $el.text('Solicitar contacto');
      else $el.addClass('is-empty-artifact').empty();
    }
    if (/^(?:Criterio|Factor)\s+\d+$/i.test(text)) $el.text(text.replace(/^Criterio/i, 'Aspecto').replace(/^Factor/i, 'Aspecto'));
    if (/^Atención\s+prioritaria$/i.test(text) && $el.hasClass('conversion-proof-item__value')) $el.text('✓');
  });

  $('ul, ol').each((_i, el) => {
    const $el = $(el);
    if ($el.children('li').length === 0 || normalizeText($el.text()).length === 0) $el.addClass('is-empty-artifact');
    if (!$el.attr('class')) $el.addClass('content-list');
  });
  $('p, li, h2, h3, h4, span, article, section').each((_i, el) => {
    const $el = $(el);
    if ($el.children().length === 0 && normalizeText($el.text()).length === 0) $el.addClass('is-empty-artifact');
  });
}

export function polishClientFacingHtml(html: string, context: FinalClientFacingContext = {}): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  cleanupVisibleElements($, context);
  normalizeLocalImages($);
  sanitizeJsonLd($, context);
  ensureClientFacingCss($);
  return $.html()
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}
