import * as cheerio from 'cheerio';

export interface PremiumVisualPolishContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

type CheerioAPI = cheerio.CheerioAPI;

function text(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return text(value).split(' ').map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '').join(' ').trim();
}

function serviceLabel(context: PremiumVisualPolishContext): string {
  const raw = text(context.niche || 'servicios').toLowerCase();
  return raw || 'servicios';
}

function cityLabel(context: PremiumVisualPolishContext): string {
  return text(context.city || 'tu zona');
}

function replaceVisibleText(value: string, context: PremiumVisualPolishContext): string {
  const city = cityLabel(context);
  const niche = serviceLabel(context);
  return String(value || '')
    .replace(/^\s*:\s*(?:este\s+bloque|bloque)\b[^.?!]*(?:[.?!]|$)/i, '')
    .replace(/\bInicio\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ -]+)\s+Cerrajeros/gi, 'Inicio $1 Cerrajeros')
    .replace(/\bNuestros\s+Servicios\b/gi, `Servicios de ${niche} en ${city}`)
    .replace(/\bProceso\s+de\s+Servicio\b/gi, 'Proceso de trabajo')
    .replace(/\bCómo\s+funciona\s+nuestro\s+servicio\b/gi, 'Proceso de trabajo')
    .replace(/\bPrecios\s+Condicionados\b/gi, 'Qué condiciona el presupuesto')
    .replace(/\bPrecios\s+y\s+Tarifas\b/gi, 'Qué condiciona el presupuesto')
    .replace(/\bCobertura\s+y\s+ubicación\s+operativa\s+en\s+/gi, 'Cobertura operativa en ')
    .replace(/\bSeñales\s+de\s+confianza\s+que\s+conviene\s+exigir\s+antes\s+de\s+contratar\b/gi, 'Qué conviene comprobar antes de contratar')
    .replace(/\bTestimonios\s+Locales\b/gi, 'Señales locales de confianza')
    .replace(/\bLo\s+que\s+dicen\s+nuestros\s+clientes\b/gi, 'Qué conviene comprobar antes de contratar')
    .replace(/\bSeñal\s+0?(\d+)\b/gi, 'Señal clave')
    .replace(/\bCriterio\s+0?(\d+)\b/gi, 'Criterio clave')
    .replace(/\bFactor\s+0?(\d+)\b/gi, 'Factor clave')
    .replace(/\bvisible\s+para\s*:?/gi, '')
    .replace(/\bcoherente\s+con\s*\./gi, `coherente con la cobertura indicada en ${city}.`)
    .replace(/\ben\s+y\b/gi, `en ${city} y`)
    .replace(/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`)
    .replace(/\bTrabajamos\s+con\s+cobertura\s+operativa\s+en\s+y\s+desplazamientos/gi, `Trabajamos con cobertura operativa en ${city} y desplazamientos`)
    .replace(/\bdiagnóstico\s+antes\s+de\s+sustituir\s+piezas\s+antes\s+de\s+intervenir/gi, 'diagnóstico antes de intervenir')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function polishBodyClasses($: CheerioAPI): void {
  const body = $('body').first();
  const classes = new Set(text(body.attr('class')).split(/\s+/).filter(Boolean));
  classes.add('gravity-premium-visual-polish-v2');
  classes.add('gravity-release-visual-freeze');
  body.attr('class', Array.from(classes).join(' '));
}

function polishVisibleCopy($: CheerioAPI, context: PremiumVisualPolishContext): void {
  $('body').find('*').contents().each((_i, node: any) => {
    if (node.type !== 'text') return;
    const before = String(node.data || '');
    const after = replaceVisibleText(before, context);
    node.data = after ? (before.startsWith(' ') ? ` ${after}` : after) : ' ';
  });

  $('[alt], [title], [aria-label], [placeholder], [content]').each((_i, el) => {
    const $el = $(el);
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      const raw = $el.attr(attr);
      if (typeof raw === 'string') $el.attr(attr, replaceVisibleText(raw, context));
    }
  });
}

function polishHeadings($: CheerioAPI, context: PremiumVisualPolishContext): void {
  const city = cityLabel(context);
  const service = serviceLabel(context);
  $('h1, h2, h3, summary, .block__title').each((_i, el) => {
    const $el = $(el);
    const current = text($el.text());
    if (!current) return;
    if (/^Nuestros Servicios$/i.test(current)) $el.text(`Servicios de ${service} en ${city}`);
    else if (/^Precios Condicionados$/i.test(current)) $el.text('Qué condiciona el presupuesto');
    else if (/^Contáctanos Ahora mismo$/i.test(current)) $el.text(`Solicitar orientación profesional en ${city}`);
    else if (/^Preguntas Frecuentes$/i.test(current)) $el.text('Preguntas frecuentes');
    else if (/^Navegación relacionada del proyecto$/i.test(current)) $el.text('Servicios relacionados');
  });
}

function polishBreadcrumbs($: CheerioAPI): void {
  $('.el-breadcrumbs').attr('data-premium-breadcrumbs', 'true');
  $('.el-breadcrumbs__list').attr('role', 'list');
  $('.el-breadcrumbs__item').each((index, el) => {
    const $el = $(el);
    $el.attr('data-breadcrumb-step', String(index + 1));
    if ($el.find('.el-breadcrumbs__text').length === 0 && text($el.text())) {
      $el.wrapInner('<span class="el-breadcrumbs__text"></span>');
    }
  });
}

function polishTrustStrip($: CheerioAPI): void {
  $('.conversion-proof-strip').attr('data-premium-proof-strip', 'true');
  $('.conversion-proof-item').each((_i, el) => {
    const $el = $(el);
    $el.addClass('premium-proof-card');
    const value = text($el.find('.conversion-proof-item__value').first().text());
    if (/^24h$/i.test(value)) $el.find('.conversion-proof-item__value').first().text('⚡');
    if (/^€$/i.test(value)) $el.find('.conversion-proof-item__value').first().text('€');
    if (/^📍$/i.test(value)) $el.find('.conversion-proof-item__value').first().text('⌁');
  });
}

function polishSignalCards($: CheerioAPI): void {
  $('.local-proof__signal, .trust-band__signal-card').addClass('premium-signal-card');
  $('.local-proof__signal-index, .trust-band__signal-index').each((_i, el) => {
    const $el = $(el);
    $el.attr('aria-hidden', 'true');
    $el.text('✓');
    $el.addClass('premium-check-index');
  });
  $('.local-proof__signal-copy strong, .trust-band__signal-copy h3').each((_i, el) => {
    const $el = $(el);
    const current = text($el.text());
    $el.text(replaceVisibleText(current, {}));
  });
}

function polishLooseLists($: CheerioAPI): void {
  $('main section ul, main section ol, .block-section ul, .block-section ol, .semantic-section ul, .semantic-section ol').each((_i, el) => {
    const $el = $(el);
    if ($el.closest('nav, header, footer, .nav-mobile, .nav__links-group, .footer__nav-list, .internal-links-grid').length) return;
    if ($el.children('li').length === 0 || !text($el.text())) {
      $el.remove();
      return;
    }
    const cls = text($el.attr('class'));
    if (!/(?:meta|pills|faq|breadcrumb|nav|links|internal|footer)/i.test(cls)) {
      $el.addClass('premium-designed-list');
    }
  });
}

function polishCtas($: CheerioAPI, context: PremiumVisualPolishContext): void {
  const city = cityLabel(context);
  $('.mobile-sticky-cta').attr('data-premium-mobile-cta', 'true');
  $('.mobile-sticky-cta__copy strong').each((_i, el) => { if (/contactar/i.test(text($(el).text()))) $(el).text('Solicitar contacto'); });
  $('.mobile-sticky-cta__copy span').each((_i, el) => {
    const $el = $(el);
    const current = text($el.text());
    if (!current || /cerrajer/i.test(current)) $el.text(`Cerrajería en ${city}`);
  });

  $('.block__cta-note').each((_i, el) => {
    const $el = $(el);
    let current = replaceVisibleText($el.text(), context);
    current = current.replace(/,?\s*urgencia\s+y\s+si\s+la\s+llave\s+gira\s*/i, '');
    current = current.replace(/\s+antes\s+de\s+intervenir\s+en\s+cerrajeros\.?/i, '.');
    if (current.length > 145) current = `${current.slice(0, 142).replace(/\s+\S*$/, '')}…`;
    $el.text(current);
  });
}

function polishMap($: CheerioAPI, context: PremiumVisualPolishContext): void {
  const city = cityLabel(context);
  $('.map-block').attr('data-premium-map', 'true');
  $('.map-block__note').each((_i, el) => {
    const $el = $(el);
    const current = replaceVisibleText($el.text(), context);
    if (!current || /cobertura\s+operativa\s+en\s+y/i.test(current)) {
      $el.text(`Trabajamos con cobertura operativa en ${city}. Antes de confirmar, se revisa la zona, el alcance del servicio y la disponibilidad real.`);
    } else {
      $el.text(current);
    }
  });
}

function polishEmptyWrappers($: CheerioAPI): void {
  $('.el-section-wrapper, section, article').each((_i, el) => {
    const $el = $(el);
    const hasMedia = $el.find('img, iframe, svg').length > 0;
    const hasForm = $el.find('form, input, textarea, button').length > 0;
    if (!hasMedia && !hasForm && !text($el.text())) $el.remove();
  });
}

function ensurePremiumCss($: CheerioAPI): void {
  $('#gravity-premium-visual-polish-v2-css').remove();
  $('head').append(`<style id="gravity-premium-visual-polish-v2-css">${PREMIUM_VISUAL_POLISH_V2_CSS}</style>`);
}

export function applyPremiumVisualPolishV2(html: string, context: PremiumVisualPolishContext = {}): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
  polishBodyClasses($);
  polishVisibleCopy($, context);
  polishHeadings($, context);
  polishBreadcrumbs($);
  polishTrustStrip($);
  polishSignalCards($);
  polishLooseLists($);
  polishCtas($, context);
  polishMap($, context);
  polishEmptyWrappers($);
  ensurePremiumCss($);
  return $.html({ decodeEntities: false }).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

export const PREMIUM_VISUAL_POLISH_V2_CSS = `
/* === Gravity Premium Visual Polish v2 — final client-facing cascade === */
body.gravity-premium-visual-polish-v2{--pv-bg:#f6f8fb;--pv-card:#fff;--pv-ink:var(--text,#0f172a);--pv-muted:var(--muted,#64748b);--pv-primary:var(--primary,#0f766e);--pv-primary-rgb:var(--primary-rgb,15,118,110);--pv-border:rgba(148,163,184,.16);--pv-border-strong:rgba(148,163,184,.24);--pv-shadow:0 12px 34px rgba(15,23,42,.07);--pv-soft:0 5px 18px rgba(15,23,42,.045);--pv-radius:1.35rem;background:linear-gradient(180deg,#fff 0%,var(--pv-bg) 45%,#fff 100%)!important;color:var(--pv-ink)!important}body.gravity-premium-visual-polish-v2 .el-container{max-width:1120px!important}
body.gravity-premium-visual-polish-v2 .el-breadcrumbs{padding:.85rem 0 .25rem!important;background:transparent!important;font-size:.82rem!important}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__list{display:flex!important;align-items:center!important;gap:.45rem!important;flex-wrap:wrap!important;list-style:none!important;width:max-content!important;max-width:100%!important;margin:0!important;padding:.55rem .75rem!important;border:1px solid var(--pv-border)!important;border-radius:999px!important;background:rgba(255,255,255,.9)!important;box-shadow:var(--pv-soft)!important}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__item{display:inline-flex!important;align-items:center!important;gap:.45rem!important;color:var(--pv-muted)!important;font-weight:750!important;max-width:100%!important}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__text{display:inline-block!important;color:inherit!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(52vw,36rem)}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__item:not(:last-child)::after{content:"/"!important;color:#94a3b8!important;opacity:.75!important}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__item:last-child{color:var(--pv-ink)!important}
body.gravity-premium-visual-polish-v2 .conversion-proof-strip{padding:clamp(.8rem,2vw,1.25rem) 0 clamp(1.5rem,3vw,2.35rem)!important}body.gravity-premium-visual-polish-v2 .conversion-proof-strip__grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:.75rem!important}body.gravity-premium-visual-polish-v2 .conversion-proof-item{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.12rem .7rem!important;align-items:center!important;min-height:5.2rem!important;padding:.9rem!important;border-radius:1.05rem!important;background:#fff!important;border:1px solid var(--pv-border)!important;box-shadow:var(--pv-soft)!important;overflow:hidden!important}body.gravity-premium-visual-polish-v2 .conversion-proof-item__value{grid-row:1 / span 2!important;display:grid!important;place-items:center!important;width:2.35rem!important;height:2.35rem!important;border-radius:.85rem!important;background:rgba(var(--pv-primary-rgb),.08)!important;border:1px solid rgba(var(--pv-primary-rgb),.12)!important;color:var(--pv-primary)!important;font-weight:950!important;font-size:1rem!important;line-height:1!important}body.gravity-premium-visual-polish-v2 .conversion-proof-item__label{font-size:.88rem!important;font-weight:950!important;color:var(--pv-ink)!important;line-height:1.1!important}body.gravity-premium-visual-polish-v2 .conversion-proof-item__text{font-size:.78rem!important;line-height:1.25!important;color:var(--pv-muted)!important;max-width:24ch!important}
body.gravity-premium-visual-polish-v2 .premium-designed-list{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))!important;gap:.65rem!important;list-style:none!important;margin:1rem 0!important;padding:0!important}body.gravity-premium-visual-polish-v2 .premium-designed-list li{position:relative!important;min-height:2.85rem!important;padding:.72rem .85rem .72rem 2.35rem!important;border:1px solid var(--pv-border)!important;border-radius:.95rem!important;background:#fff!important;box-shadow:var(--pv-soft)!important;color:var(--pv-ink)!important;font-weight:750!important;line-height:1.25!important}body.gravity-premium-visual-polish-v2 .premium-designed-list li::before{content:"✓"!important;position:absolute!important;left:.78rem!important;top:.75rem!important;display:grid!important;place-items:center!important;width:1.05rem!important;height:1.05rem!important;border-radius:999px!important;background:rgba(var(--pv-primary-rgb),.08)!important;color:var(--pv-primary)!important;font-weight:950!important;font-size:.72rem!important}
body.gravity-premium-visual-polish-v2 .trust-band__signal-grid,body.gravity-premium-visual-polish-v2 .local-proof__signal-list{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))!important;gap:.9rem!important}body.gravity-premium-visual-polish-v2 .local-proof__signal,body.gravity-premium-visual-polish-v2 .trust-band__signal-card{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.8rem!important;align-items:start!important;padding:1rem!important;border:1px solid var(--pv-border)!important;border-radius:1.05rem!important;background:#fff!important;box-shadow:var(--pv-soft)!important}body.gravity-premium-visual-polish-v2 .local-proof__signal-index,body.gravity-premium-visual-polish-v2 .trust-band__signal-index{display:grid!important;place-items:center!important;width:2rem!important;height:2rem!important;border-radius:999px!important;background:rgba(var(--pv-primary-rgb),.09)!important;border:1px solid rgba(var(--pv-primary-rgb),.12)!important;color:var(--pv-primary)!important;font-weight:950!important;font-size:.8rem!important;box-shadow:none!important}body.gravity-premium-visual-polish-v2 .local-proof__signal-copy,body.gravity-premium-visual-polish-v2 .trust-band__signal-copy{display:grid!important;gap:.25rem!important;min-width:0!important}body.gravity-premium-visual-polish-v2 .local-proof__signal-copy strong,body.gravity-premium-visual-polish-v2 .trust-band__signal-copy h3{margin:0!important;color:var(--pv-ink)!important;font-size:1rem!important;line-height:1.18!important;letter-spacing:-.02em!important}body.gravity-premium-visual-polish-v2 .local-proof__signal-copy span,body.gravity-premium-visual-polish-v2 .trust-band__signal-copy p{margin:0!important;color:var(--pv-muted)!important;font-size:.92rem!important;line-height:1.55!important}
body.gravity-premium-visual-polish-v2 .block__cta-group{display:flex!important;align-items:center!important;gap:.65rem!important;flex-wrap:wrap!important}body.gravity-premium-visual-polish-v2 .block__cta-note{display:inline-flex!important;align-items:center!important;max-width:32rem!important;min-height:2.6rem!important;padding:.62rem .85rem!important;border-radius:999px!important;background:rgba(15,23,42,.035)!important;border:1px solid var(--pv-border)!important;color:var(--pv-muted)!important;font-size:.86rem!important;line-height:1.25!important;white-space:normal!important}body.gravity-premium-visual-polish-v2 .cta-primary{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.42rem!important;min-height:3rem!important;padding:.76rem 1.05rem!important;border-radius:999px!important;white-space:nowrap!important;text-decoration:none!important;line-height:1!important}body.gravity-premium-visual-polish-v2 .cta-primary__icon{display:none!important}
body.gravity-premium-visual-polish-v2 .map-block__context{grid-template-columns:minmax(0,.95fr) minmax(280px,.9fr)!important;align-items:stretch!important}body.gravity-premium-visual-polish-v2 .map-block__frame{min-height:clamp(240px,28vw,340px)!important;border-radius:1.2rem!important}body.gravity-premium-visual-polish-v2 .map-block__support{border-radius:1rem!important;background:linear-gradient(180deg,#fff,rgba(248,250,252,.94))!important}
body.gravity-premium-visual-polish-v2 .mobile-sticky-cta{display:none!important}@media(max-width:760px){body.gravity-premium-visual-polish-v2{padding-bottom:5.4rem!important}body.gravity-premium-visual-polish-v2 .mobile-sticky-cta{position:fixed!important;left:.85rem!important;right:.85rem!important;bottom:.8rem!important;z-index:120!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:.75rem!important;padding:.72rem .72rem .72rem .95rem!important;border-radius:1.15rem!important;background:rgba(15,23,42,.96)!important;color:#fff!important;box-shadow:0 18px 48px rgba(2,6,23,.34)!important}body.gravity-premium-visual-polish-v2 .mobile-sticky-cta__copy{display:grid!important;gap:.08rem!important;min-width:0!important}body.gravity-premium-visual-polish-v2 .mobile-sticky-cta__copy strong{color:#fff!important;font-size:.95rem!important;line-height:1.1!important;white-space:nowrap!important}body.gravity-premium-visual-polish-v2 .mobile-sticky-cta__copy span{color:rgba(255,255,255,.72)!important;font-size:.78rem!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}body.gravity-premium-visual-polish-v2 .mobile-sticky-cta__button{display:grid!important;place-items:center!important;width:3rem!important;height:3rem!important;min-width:3rem!important;border-radius:.95rem!important;background:var(--pv-primary)!important;color:#fff!important;text-decoration:none!important}}
@media(max-width:900px){body.gravity-premium-visual-polish-v2 .conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}body.gravity-premium-visual-polish-v2 .map-block__context{grid-template-columns:1fr!important}}@media(max-width:640px){body.gravity-premium-visual-polish-v2 .conversion-proof-strip__grid{grid-template-columns:1fr!important}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__list{width:100%!important;border-radius:1rem!important}body.gravity-premium-visual-polish-v2 .el-breadcrumbs__text{max-width:70vw!important}body.gravity-premium-visual-polish-v2 .block__cta-note{border-radius:1rem!important;width:100%!important}.body{} }
`;
