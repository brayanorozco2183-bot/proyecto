import * as cheerio from 'cheerio';
import { DETERMINISTIC_PREMIUM_CSS } from '../design-system/deterministicPremiumCss.js';

export interface DeterministicHtmlContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

function normalizeText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function serviceLabel(niche?: string): string {
  const raw = normalizeText(niche || 'servicio profesional').toLowerCase();
  return raw || 'servicio profesional';
}

function injectCss($: cheerio.CheerioAPI): void {
  const existing = $('#gravity-deterministic-premium-css');
  if (existing.length) existing.text(DETERMINISTIC_PREMIUM_CSS);
  else $('head').append(`<style id="gravity-deterministic-premium-css">${DETERMINISTIC_PREMIUM_CSS}</style>`);
}

function removeEmptyStructures($: cheerio.CheerioAPI): void {
  $('ul, ol').each((_i: number, el: any) => {
    const node = $(el);
    if (normalizeText(node.text()).length === 0) node.remove();
  });
  $('p, li, h2, h3, span').each((_i: number, el: any) => {
    const node = $(el);
    if (normalizeText(node.text()).length === 0 && node.children().length === 0) node.remove();
  });
}

function repairBrokenVisibleCopy($: cheerio.CheerioAPI, context: DeterministicHtmlContext): void {
  const city = normalizeText(context.city || 'tu zona');
  const niche = serviceLabel(context.niche);
  const replacements: Array<[RegExp, string]> = [
    [/^[:;,.\s]+este\s+bloque\s+resume/i, 'Este bloque resume'],
    [/\ben\s+y\b/gi, `en ${city} y`],
    [/\ben\s+puede\s+variar\b/gi, `en ${city} puede variar`],
    [/\ben\s+c[oó]mo\b/gi, `en ${city} y cómo`],
    [/\baver[ií]as\s+comunes\s+en\s+y\b/gi, `averías comunes en ${city} y`],
    [/\bLo\s+que\s+dicen\s+nuestros\s+clientes\b/gi, 'Criterios para valorar una intervención bien planteada'],
    [/\breseñas?\s+de\s+clientes\b/gi, 'señales verificables del servicio'],
    [/\bclientes\s+opinan\b/gi, 'criterios de revisión'],
    [/\bNuestros\s+servicios\s+son\s+gratuitos\s+y\s+sin\s+compromiso\.?/gi, 'La orientación inicial se plantea sin compromiso antes de decidir la intervención.'],
    [/\bcobertura\s+operativa\s+en\s+la\s+zona\s+revisada\s+antes\s+de\s+confirmar\b/gi, `cobertura operativa en ${city} revisada antes de confirmar`],
    [/\bcobertura\s+operativa\s+en\s+cobertura\s+operativa\b/gi, 'cobertura operativa'],
    [/\bCont[aá]ctanos\s+Ahora\s+mismo\b/gi, 'Solicitar orientación'],
    [/\bConsultar\s+presupuesto\s+sin\s+compromiso\s+Consultar\s+presupuesto\s+sin\s+compromiso\b/gi, 'Consultar presupuesto sin compromiso']
  ];

  $('h1,h2,h3,p,li,span,strong,summary,a,small').each((_i: number, el: any) => {
    const node = $(el);
    if (node.children().length > 3 && !node.is('a')) return;
    const original = normalizeText(node.text());
    if (!original) return;
    let next = original;
    for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
    next = next
      .replace(new RegExp(`\\b${city}\\s+${city}\\b`, 'gi'), city)
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (next !== original && next.length > 0) node.text(next);
  });

  $('[data-block-type="local_proof"], .local-proof, .block--local_proof').find('h2,h3').each((_i: number, el: any) => {
    const node = $(el);
    const text = normalizeText(node.text());
    if (/clientes|reseñas|testimonios/i.test(text)) node.text('Señales de una intervención bien planteada');
  });

  $('h2,h3,summary').each((_i: number, el: any) => {
    const node = $(el);
    const text = normalizeText(node.text());
    if (/^(que|qué|como|cómo|cuando|cuándo|cuanto|cuánto|por qué|puedo|conviene)\b/i.test(text) && !text.startsWith('¿')) {
      node.text(`¿${text.replace(/^¿+|\?+$/g, '')}?`);
    }
  });
}

function stabilizeClasses($: cheerio.CheerioAPI): void {
  $('body').addClass('gravity-deterministic-ai gravity-production-stable system-panelled page-surface-tinted');
  $('.process-step-rail__body').addClass('step-card');
  $('.proof-row, .local-proof__signal').addClass('proof-card');
  $('.trust-band__signal-card, .map-block__support').addClass('semantic-card');
  $('.services-grid__magazine-feature').addClass('service-card');
  $('[data-block-type]').each((_i: number, el: any) => {
    const node = $(el);
    const type = String(node.attr('data-block-type') || '').replace(/[^a-z0-9_-]/gi, '_');
    if (type) node.addClass(`gdk-block gdk-block--${type}`);
  });
}

function replaceLowQualityHeroMedia($: cheerio.CheerioAPI, context: DeterministicHtmlContext): void {
  const title = escapeHtml(serviceLabel(context.niche));
  const city = escapeHtml(context.city || 'Cobertura local');
  $('.hero-visual__frame').each((_i: number, el: any) => {
    const frame = $(el);
    const img = frame.find('img').first();
    const warning = String(img.attr('data-image-warning') || '');
    const width = Number(img.attr('data-image-width-real') || img.attr('width') || 0);
    const isLowQuality = /resolution-low/i.test(warning) || (width > 0 && width < 900);
    if (!isLowQuality) return;
    frame.empty().append(`
      <div class="gdk-hero-illustration" role="img" aria-label="${title} en ${city}">
        <div class="gdk-hero-illustration__panel">
          <span>${title}</span>
          <strong>${city}</strong>
          <em>Diagnóstico claro · cobertura real · actuación proporcionada</em>
        </div>
      </div>
    `);
  });
}

function ensureHeroIllustrationCss($: cheerio.CheerioAPI): void {
  if ($('#gravity-deterministic-hero-illustration-css').length) return;
  $('head').append(`<style id="gravity-deterministic-hero-illustration-css">
    .gdk-hero-illustration{min-height:inherit;height:100%;display:grid;place-items:center;padding:clamp(1.2rem,3vw,2rem);background:radial-gradient(circle at 82% 18%,rgba(255,255,255,.22),transparent 30%),linear-gradient(135deg,#0f172a,var(--primary,#0f766e));color:#fff}
    .gdk-hero-illustration__panel{width:min(100%,26rem);display:grid;gap:.55rem;padding:1.25rem;border-radius:1.35rem;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.20);box-shadow:0 24px 60px rgba(2,6,23,.22)}
    .gdk-hero-illustration__panel span{font-size:.76rem;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:rgba(255,255,255,.76)}
    .gdk-hero-illustration__panel strong{font-size:clamp(2rem,4vw,3.2rem);line-height:1;letter-spacing:-.05em;color:#fff}
    .gdk-hero-illustration__panel em{font-style:normal;color:rgba(255,255,255,.78);font-weight:700}
  </style>`);
}

function ensureContactAnchor($: cheerio.CheerioAPI): void {
  const hasContactLinks = $('a[href="#contacto"]').length > 0;
  if (!hasContactLinks || $('#contacto').length > 0) return;

  const preferred = $('[data-block-type="cta_panel"], .block--cta_panel, .section-cta--terminal, footer').last();
  if (preferred.length) {
    preferred.attr('id', 'contacto');
    preferred.attr('data-gravity-contact-anchor', 'auto');
    return;
  }

  const lastSection = $('section').last();
  if (lastSection.length) {
    lastSection.attr('id', 'contacto');
    lastSection.attr('data-gravity-contact-anchor', 'auto');
  }
}

function normalizeHashLinks($: cheerio.CheerioAPI): void {
  $('a[href^="#"]').each((_i: number, el: any) => {
    const node = $(el);
    const href = normalizeText(node.attr('href') || '');
    if (!href || href === '#') return;
    const id = href.slice(1).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!id) return;
    const escaped = id.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
    if ($(`#${escaped}`).length === 0 && href !== '#contacto') {
      node.attr('href', '#contacto');
      node.attr('data-gravity-link-repaired', 'missing-anchor');
    }
  });
}

export function applyDeterministicHtmlSanitizer(html: string, context: DeterministicHtmlContext = {}): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  injectCss($);
  ensureHeroIllustrationCss($);
  stabilizeClasses($);
  ensureContactAnchor($);
  normalizeHashLinks($);
  repairBrokenVisibleCopy($, context);
  replaceLowQualityHeroMedia($, context);
  removeEmptyStructures($);
  ensureContactAnchor($);
  normalizeHashLinks($);
  repairBrokenVisibleCopy($, context);
  return $.html().replace(/\s{2,}/g, ' ').trim();
}
