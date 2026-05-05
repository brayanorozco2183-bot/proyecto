import * as cheerio from 'cheerio';

export interface FinalTransmissionGuardContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
}

type CheerioAPI = cheerio.CheerioAPI;

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function canonicalNiche(context?: FinalTransmissionGuardContext): string {
  const raw = clean(context?.niche || 'servicio profesional').toLowerCase();
  if (/cerrajer/i.test(raw)) return 'cerrajería';
  if (/fontaner/i.test(raw)) return 'fontanería';
  if (/electric/i.test(raw)) return 'electricidad';
  if (/reforma/i.test(raw)) return 'reformas';
  if (/abogad/i.test(raw)) return 'servicios profesionales';
  return clean(context?.niche || 'servicio profesional').toLowerCase();
}

function stripLegacyDeliveryStyles($: CheerioAPI): void {
  const killIds = [
    /^patch-/i,
    /^layout-hotfix-/i,
    /^gravity-release-/i,
    /^gravity-global-project-polish/i,
    /^gravity-global-delivery-polish/i,
    /^gravity-functional-delivery-release-css$/i,
    /^gravity-final-ux-delivery-guard-css$/i,
    /^gravity-super-delivery-lock-css$/i,
    /^gravity-delivery-stable-css$/i,
    /^gravity-premium-visual/i,
    /^gravity-premium-layout/i,
    /^gravity-deterministic-premium-css$/i,
    /^gravity-premium-content-depth-css$/i,
    /^gravity-final-transmission-guard-css$/i,
  ];
  $('style').each((_i: number, el: any) => {
    const $el = $(el);
    const id = String($el.attr('id') || '');
    const css = String($el.html() || '');
    if (id && killIds.some((rx) => rx.test(id))) {
      $el.remove();
      return;
    }
    if (!id && /\.el-breadcrumbs\s*\{[\s\S]{0,1800}\.el-breadcrumbs__list/i.test(css)) {
      $el.remove();
      return;
    }
  });
}

function ensureHead($: CheerioAPI): void {
  if (!$('html').length) $.root().wrap('<html lang="es-ES"></html>');
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
  const viewport = $('meta[name="viewport"]');
  if (!viewport.length) $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  $('meta[name="gravity-final-transmission-guard"]').remove();
  $('head').append('<meta name="gravity-final-transmission-guard" content="v2-premium">');
}

function normalizeTextNodeText(text: string, context?: FinalTransmissionGuardContext): string {
  const city = clean(context?.city || 'tu zona');
  const niche = canonicalNiche(context);
  let out = String(text || '');
  out = out
    .replace(/\b(undefined|null|\[object Object\])\b/gi, ' ')
    .replace(/\b(Factor|Criterio|Aspecto)\s+de\s+[^.,:]+/gi, '')
    .replace(/\b(Prioridad|Estrategia|Metodolog[ií]a)\s+de\s+[^.,:]+/gi, '')
    .replace(/\bencontrá\b/gi, 'encuentra')
    .replace(/\bbombínes\b/gi, 'bombines')
    .replace(/\blos herramientas\b/gi, 'las herramientas')
    .replace(/\bescudos protector\b/gi, 'escudos protectores')
    .replace(/\bEscudos Protector\b/g, 'Escudos protectores')
    .replace(/\bNuestros técnicos están con criterio técnico para diagnosticar y resolver problemas de cerrajería con precisión técnica\.?/gi, 'Te orientamos antes de confirmar la intervención.')
    .replace(/\bNo dudes en ponerse en contacto con nosotros para obtener más información sobre[^.]*\.?/gi, 'Podemos orientarte antes de confirmar el trabajo.')
    .replace(/\bContáctanos ahora mismo para obtener un presupuesto sin compromiso\.?/gi, 'Solicita una orientación inicial.')
    .replace(/\bservicio de alta calidad y seguro\b/gi, 'servicio claro y proporcionado')
    .replace(/\bgarantizan una apertura segura y eficiente\b/gi, 'permiten valorar una apertura controlada')
    .replace(/\bgarantizando una protección efectiva\b/gi, 'buscando una protección proporcionada')
    .replace(/\bSoluciones de Seguridad y Acceso\b/g, 'diagnóstico claro y cobertura real')
    .replace(/\bPrueba Local\b/g, 'Comprobación final')
    .replace(/\bServicios principales en\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÜÑáéíóúüñ -]+)\b/g, `Servicios de ${niche} en $1`)
    .replace(/\bOfrecemos soluciones de seguridad y acceso para tu vivienda o negocio\.?/gi, 'Orientación clara antes de actuar y cobertura real en la zona.')
    .replace(/\bContacto visible\b/gi, `Cobertura en ${city}`)
    .replace(/\bEquipo especializado\b/gi, 'Criterio técnico')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ');
  return out;
}

function normalizeVisibleCopy($: CheerioAPI, context?: FinalTransmissionGuardContext): void {
  $('body *').contents().each((_i: number, node: any) => {
    if (node.type !== 'text') return;
    const original = String(node.data || '');
    const next = normalizeTextNodeText(original, context);
    if (next !== original) node.data = next;
  });

  const titleReplacements: Array<[RegExp, string]> = [
    [/^Servicios Ofrecidos$/i, 'Servicios principales'],
    [/^Evaluación del Problema$/i, 'Evaluación inicial'],
    [/^Propuesta de Solución$/i, 'Propuesta clara'],
    [/^Realización del Trabajo$/i, 'Intervención'],
    [/^Instalación$/i, 'Comprobación final'],
    [/^Prueba Local$/i, 'Comprobación final'],
  ];
  $('h1,h2,h3,summary,.cta-primary,.card__btn').each((_i: number, el: any) => {
    const $el = $(el);
    const text = clean($el.text());
    if (!text) return;
    for (const [rx, replacement] of titleReplacements) {
      if (rx.test(text)) {
        $el.text(text.replace(rx, replacement));
        break;
      }
    }
  });
}

function compactButtons($: CheerioAPI): void {
  const buttonMap: Array<[RegExp, string]> = [
    [/consultar presupuesto sin compromiso/i, 'Pedir presupuesto'],
    [/pedir diagn[oó]stico previo/i, 'Pedir diagnóstico'],
    [/solicitar atenci[oó]n/i, 'Solicitar atención'],
    [/llamar ahora/i, 'Contactar ahora'],
    [/ver servicios/i, 'Ver servicios'],
    [/contactar/i, 'Contactar ahora'],
  ];
  $('a,button').each((_i: number, el: any) => {
    const $el = $(el);
    const label = clean($el.text());
    if (!label) return;
    if ($el.hasClass('nav__link') || $el.hasClass('nav-mobile__link')) return;
    
    for (const [rx, replacement] of buttonMap) {
      if (rx.test(label) || label.length > 22) {
        $el.text(replacement);
        $el.attr('aria-label', replacement);
        break;
      }
    }
    // Force styling
    $el.css({ 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'text-align': 'center' });
  });
}

function normalizeNavigation($: CheerioAPI): void {
  const body = $('body').first();
  body.addClass('gravity-final-transmission');
  body.attr('data-gravity-transmission', 'v2-premium');

  $('.nav-mobile').removeAttr('open');
  $('.site-header').addClass('gft-header');
}

function normalizeLists($: CheerioAPI): void {
  $('ul, ol').each((_i: number, el: any) => {
    const $el = $(el);
    if ($el.closest('nav,header,footer,.site-header').length) return;
    const cls = String($el.attr('class') || '');
    if ($el.is('ol') || /process/i.test(cls)) {
      $el.addClass('gux-step-list');
      $el.children('li').addClass('gux-step-item');
    } else {
      $el.addClass('gux-check-list');
      $el.children('li').addClass('gux-check-item');
    }
  });
}

function normalizeCards($: CheerioAPI): void {
  $('.service-card,.proof-card,.step-card,.price-card,.faq-item,.faq-entry,.semantic-card,.conversion-proof-item,.internal-links-item').addClass('gux-card');
}

function injectFinalCss($: CheerioAPI): void {
  $('#gravity-final-transmission-guard-css').remove();
  $('head').append(`<style id="gravity-final-transmission-guard-css">${PREMIUM_V2_CSS}</style>`);
}

const PREMIUM_V2_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;950&display=swap');
:root {
  --gux-font: 'Outfit', sans-serif;
  --gux-bg: #f8fafc;
  --gux-text: #0f172a;
  --gux-muted: #64748b;
  --gux-primary: #0a192f;
  --gux-accent: #3b82f6;
  --gux-border: rgba(148, 163, 184, 0.12);
  --gux-radius: 20px;
  --gux-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}
html, body { max-width: 100%; overflow-x: hidden; font-family: var(--gux-font) !important; }
body.gravity-final-transmission { background: var(--gux-bg) !important; color: var(--gux-text) !important; line-height: 1.6; }
body.gravity-final-transmission * { box-sizing: border-box; overflow-wrap: break-word !important; word-break: break-word !important; }
.el-container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 1.5rem; }

/* Navbar Premium */
.site-header {
  position: sticky !important; top: 1rem; z-index: 1000; margin: 0 auto; width: 95%; max-width: 1200px;
  border-radius: 999px; background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,0.3) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
}

/* Buttons Premium */
.gux-button, .cta-primary, .card__btn, a[class*="btn"], button {
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  padding: 1rem 2rem !important; min-height: 3.5rem !important; border-radius: 999px !important;
  background: var(--gux-primary) !important; color: #fff !important; font-weight: 700 !important;
  text-decoration: none !important; transition: all 0.2s ease !important;
}

/* Lists Premium */
.gux-check-list { display: grid !important; gap: 1rem !important; list-style: none !important; padding: 0 !important; }
.gux-check-item { 
  display: grid !important; grid-template-columns: 2.5rem 1fr !important; align-items: center !important;
  background: #fff !important; padding: 1.25rem !important; border-radius: var(--gux-radius) !important;
  border: 1px solid var(--gux-border) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;
}
.gux-check-item:before {
  content: '✓'; display: flex; align-items: center; justify-content: center; width: 1.75rem; height: 1.75rem;
  background: rgba(59, 130, 246, 0.1); color: var(--gux-accent); border-radius: 50%; font-weight: 800;
}

/* Process Rail */
.gux-step-list { display: flex !important; flex-direction: column !important; gap: 1.5rem !important; padding: 0 !important; counter-reset: step; }
.gux-step-item { 
  display: grid !important; grid-template-columns: 4rem 1fr !important; align-items: center !important; gap: 1.5rem !important;
  padding: 1.5rem !important; background: #fff !important; border-radius: var(--gux-radius) !important;
  border: 1px solid var(--gux-border) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
}
.gux-step-item:before {
  content: counter(step, decimal-leading-zero); counter-increment: step;
  width: 3.5rem; height: 3.5rem; background: linear-gradient(135deg, var(--gux-primary), var(--gux-accent));
  color: #fff; display: flex; align-items: center; justify-content: center; border-radius: 16px; font-weight: 950;
}

/* Cards Magazine */
.gux-card {
  padding: 2rem !important; background: #fff !important; border-radius: var(--gux-radius) !important;
  border: 1px solid var(--gux-border) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.04) !important;
}
`;

export function applyFinalTransmissionGuard(html: string, context: FinalTransmissionGuardContext = {}): string {
  const source = String(html || '').normalize('NFC');
  if (!source.trim()) return source;
  const $ = cheerio.load(source, { decodeEntities: false });
  ensureHead($);
  stripLegacyDeliveryStyles($);
  normalizeNavigation($);
  normalizeVisibleCopy($, context);
  compactButtons($);
  normalizeLists($);
  normalizeCards($);
  injectFinalCss($);
  const marker = '<!-- GRAVITY_FINAL_TRANSMISSION_GUARD_APPLIED -->';
  return $.html().replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim() + '\n' + marker;
}
