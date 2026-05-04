import * as cheerio from 'cheerio';
import { sanitizeBrandName as sanitizeCanonicalBrandName, repairBrokenLocalFragments as repairBrandGuardFragments, buildCanonicalBrandName } from './brandGuard.js';
import { normalizeFaqQuestionText, normalizeFaqAnswerText, normalizeFaqEntity, sanitizeFaqQuestion } from './faqSanitizer.js';
import { enforceTechnicalIntegrityPolish } from '../quality/technicalIntegrityGate.js';

export interface FinalHtmlPolishOptions {
  city?: string;
  niche?: string;
}

function normalizeText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(value: string): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const lower = token.toLowerCase();
      if (['de', 'en', 'y', 'la', 'el', 'los', 'las', 'del'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function detectCity($: cheerio.CheerioAPI, explicitCity = ''): string {
  const direct = normalizeText(explicitCity);
  if (direct) return direct;

  // Search in structured data first (most reliable)
  const ldJson = $('script[type="application/ld+json"]').first().html() || '';
  if (ldJson) {
    const areaMatch = ldJson.match(/"areaServed"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i);
    if (areaMatch?.[1]) return normalizeText(areaMatch[1]);
    const localityMatch = ldJson.match(/"addressLocality"\s*:\s*"([^"]+)"/i);
    if (localityMatch?.[1]) return normalizeText(localityMatch[1]);
  }

  const candidates = [
    $('link[rel="canonical"]').attr('href') || '',
    $('meta[property="og:url"]').attr('content') || '',
    $('meta[property="og:title"]').attr('content') || '',
    $('title').text(),
    $('h1').first().text(),
  ].join(' | ');

  // Look for "en [City]" pattern in specific SEO fields
  const pattern = /\b(?:en|de)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})\b/;
  const match = candidates.match(pattern);
  if (match?.[1]) return normalizeText(match[1]).replace(/[|,.;:]$/, '');

  return '';
}

function sanitizeBusinessName(value: string, city: string, niche?: string): string {
  return sanitizeCanonicalBrandName(value || buildCanonicalBrandName({ niche, city }), { niche, city, fallbackSuffix: 'Pro' });
}



function looksSeoDescriptionTruncated(value: string): boolean {
  const text = normalizeText(value);
  if (!text) return true;
  if (text.length < 90) return true;
  if (/\b(?:para|por|con|sin|de|del|la|el|los|las|y|en|garant|garanti|profesiona|instalaci[oó])$/i.test(text)) return true;
  if (!/[.!?]$/.test(text) && text.length >= 145) return true;
  return false;
}

function buildStablePremiumDescription(city: string, niche?: string): string {
  const cleanCity = normalizeText(city) || 'tu zona';
  const cleanNiche = normalizeText(niche || 'servicios profesionales').toLowerCase();
  const label = cleanNiche.includes(cleanCity.toLowerCase()) ? titleCase(cleanNiche) : `${titleCase(cleanNiche)} en ${cleanCity}`;
  return `${label} para averías, instalaciones, revisiones y mantenimiento. Diagnóstico previo, intervención proporcional y orientación clara antes de actuar.`;
}

function normalizeQuestionPunctuation(value: string): string {
  let text = normalizeText(value)
    .replace(/^Qué\b/i, '¿Qué')
    .replace(/^Como\b/i, '¿Cómo')
    .replace(/^Cómo\b/i, '¿Cómo')
    .replace(/^Cuando\b/i, '¿Cuándo')
    .replace(/^Cuándo\b/i, '¿Cuándo')
    .replace(/^Por qué\b/i, '¿Por qué')
    .replace(/^Porque\b/i, '¿Por qué');
  if (/^(qué|cómo|cuándo|por qué|cuál|cuáles|dónde|¿)/i.test(text) && !text.startsWith('¿')) text = `¿${text}`;
  if (text.startsWith('¿') && !/[?？]$/.test(text)) text += '?';
  return text;
}

function repairObservedDebugFragments($: cheerio.CheerioAPI, city: string, _niche?: string): void {
  const safeCity = normalizeText(city) || 'la ciudad';
  const replacements: Array<[RegExp, string]> = [
    [/La presencia se comunica a nivel de\s*,\s*sin inventar oficinas ni direcciones precisas que no est[eé]n confirmadas\./gi, `La cobertura se comunica a nivel de ${safeCity}, sin inventar oficinas ni direcciones precisas no confirmadas.`],
    [/Cobertura comunicada a nivel de\s*(?=·|$)/gi, `Cobertura comunicada a nivel de ${safeCity} `],
    [/\bidentidad visible en y evita\b/gi, 'identidad visible para la página y evita'],
    [/\bmantiene una identidad visible en y evita\b/gi, 'mantiene una identidad visible para la página y evita'],
    [/\bSi el caso se parece a, puede ser útil valorar esa línea de trabajo dentro del cluster antes de elegir una intervención más amplia\./gi, 'Si el caso requiere una intervención amplia, conviene valorar primero el alcance real, los materiales necesarios y la comprobación final.'],
    [/\bSi el caso se parece a, puede ser útil valorar esa línea de trabajo[^.]*\./gi, 'Si el caso requiere una intervención amplia, conviene valorar primero el alcance real, los materiales necesarios y la comprobación final.'],
    [/\bComarca de la Vega de y Andalucía\b/gi, `${safeCity} y su entorno metropolitano`],
    [/\bComarca de la Vega de\s*(?=,|\.|;|:|\s+y\b|$)/gi, `${safeCity} y su entorno metropolitano`],
    [/\bnivel de\s*,/gi, `nivel de ${safeCity},`],
    [/\ben y evita publicar teléfonos no confirmados\b/gi, 'para la página y evita publicar teléfonos no confirmados'],
    [/\brevisar alta con contexto real\b/gi, 'revisar el caso con contexto real'],
    [/\bEscudos Protectors\b/gi, 'Escudos protectores'],
    [/\bsistemas cerrajeros\b/gi, 'sistemas de cerrajería'],
    [/\brecuperar el daño\b/gi, 'reducir el daño'],
    [/\bPara verificar la funcionalidad de tu\b/gi, 'Para verificar el funcionamiento de su'],
    [/\btu hogar\b/gi, 'la vivienda'],
    [/\btu casa\b/gi, 'la vivienda'],
    [/\bte recomendamos\b/gi, 'conviene valorar'],
    [/\bgarantizamos\b/gi, 'procuramos'],
    [/\bGarantía de Satisfacción del Cliente\b/gi, 'Compromiso de claridad en el servicio'],
    [/\bsoluciones eléctricas confiables\b/gi, 'soluciones eléctricas fiables'],
    [/\bconfiables\b/gi, 'fiables'],
    [/\bmantené\b/gi, 'mantenga'],
    [/\bprofesionales altamente capacitados\b/gi, 'profesionales con criterio técnico'],
    [/\baltamente capacitados\b/gi, 'con criterio técnico'],
    [/\bmateriales de alta calidad\b/gi, 'materiales adecuados a la instalación'],
    [/\bpara garant(?:izar|i)?\s*$/gi, 'con diagnóstico claro.'],
  ];

  $('body *').contents().each((_i, node) => {
    if (node.type !== 'text') return;
    const original = String((node as any).data || '');
    if (!original.trim()) return;
    let next = original;
    for (const [rx, repl] of replacements) next = next.replace(rx, repl);
    next = next.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ');
    if (next !== original) $(node).replaceWith(escapeHtml(next));
  });
}

function normalizeVisibleFaqQuestions($: cheerio.CheerioAPI): void {
  $('section[id*="faq" i] summary, .faq-block summary, .faq-item summary, .faq-entry h3, [data-faq-item] h3').each((_i: any, el: any) => {
    const $el = $(el);
    if ($el.closest('nav, header, .nav-mobile, .site-header').length) return;
    const text = normalizeQuestionPunctuation($el.text());
    if (text) $el.text(text);
  });
}

function stabilizeSeoMetaAndSchema($: cheerio.CheerioAPI, city: string, niche?: string): void {
  const safeCity = normalizeText(city);
  const desc = normalizeText($('meta[name="description"]').attr('content') || '');
  const finalDescription = looksSeoDescriptionTruncated(desc) || /profesionales\s+cualificados|soluciones\s+personalizadas|para garant/i.test(desc)
    ? buildStablePremiumDescription(safeCity, niche)
    : desc;

  if ($('meta[name="description"]').length) $('meta[name="description"]').attr('content', finalDescription);
  else $('head').append(`<meta name="description" content="${escapeHtml(finalDescription)}">`);
  $('meta[property="og:description"], meta[name="twitter:description"]').attr('content', finalDescription);

  $('script[type="application/ld+json"]').each((_i: any, el: any) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      for (const node of graph) {
        const type = node?.['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('WebPage')) node.description = finalDescription;
        if ((types.includes('Organization') || types.includes('LocalBusiness')) && node.address && safeCity) {
          const street = normalizeText(node.address.streetAddress || '');
          if (street && (street.toLowerCase() === safeCity.toLowerCase() || /^centro de /i.test(street) || street.toLowerCase() === `centro de ${safeCity}`.toLowerCase())) delete node.address.streetAddress;
          if (!node.address.addressLocality) node.address.addressLocality = safeCity;
          if (!node.address.addressCountry) node.address.addressCountry = 'ES';
        }
        if (types.includes('FAQPage') && Array.isArray(node.mainEntity)) {
          node.mainEntity = node.mainEntity
            .map((item: any) => ({ ...item, name: normalizeQuestionPunctuation(String(item?.name || '')), acceptedAnswer: { '@type': 'Answer', ...(item?.acceptedAnswer || {}), text: normalizeText(item?.acceptedAnswer?.text || '') } }))
            .filter((item: any) => {
              const q = normalizeText(item?.name || '');
              const a = normalizeText(item?.acceptedAnswer?.text || '');
              return q && a && !/^men[uú]$/i.test(q) && !/ÁreasServiciosDudasUrgencia/i.test(a);
            });
        }
        if (types.includes('WebSite') && node['@id'] === '#website') {
          const canonical = normalizeText($('link[rel="canonical"]').attr('href') || node.url || '');
          try { if (canonical) node['@id'] = `${new URL(canonical).origin}/#website`; } catch { /* keep previous */ }
        }
      }
      $(el).text(JSON.stringify(parsed));
    } catch {
      // Technical validation will report malformed JSON-LD.
    }
  });
}

function syncFooterBrandWithSeo($: cheerio.CheerioAPI, city: string, niche?: string): void {
  const canonicalBrand = sanitizeBusinessName(
    normalizeText($('meta[property="og:site_name"]').attr('content') || $('.footer__brand-name').first().text()),
    city,
    niche,
  );
  if (!canonicalBrand) return;
  $('meta[property="og:site_name"]').attr('content', canonicalBrand);
  $('.footer__brand-name, .site-header__brand-name, .brand__name').each((_i: any, el: any) => {
    $(el).text(canonicalBrand);
  });
}

function preserveLocalIndexLinks($: cheerio.CheerioAPI): void {
  $('a[href]').each((_i: any, el: any) => {
    const $el = $(el);
    const href = normalizeText($el.attr('href') || '');
    if (!href) return;
    if ($el.closest('.internal-links-item').length) {
      if (href === '#top' || href === '/' || href === './') {
        $el.attr('href', './index.html');
        return;
      }
      if (!/^https?:|^mailto:|^tel:|^#/.test(href)) {
        let normalized = href.replace(/([^:])\/\/+?/g, '$1/').replace(/\/index\.html\/+$/i, '/index.html');
        if (!/\.html?(?:[#?]|$)/i.test(normalized)) {
          normalized = normalized.endsWith('/') ? `${normalized}index.html` : `${normalized}/index.html`;
        }
        $el.attr('href', normalized);
      }
    }
  });
}

function repairBrokenLocalPhrases($: cheerio.CheerioAPI, city: string): void {
  const safeCity = normalizeText(city);
  if (!safeCity) return;

  // Use DOM-aware text node replacement for repairs to avoid destroying HTML tags like <a>
  $('*').contents().each((_i, node) => {
    if (node.type === 'text') {
      let text = (node as any).data;
      if (!text) return;
      const original = text;

        // Reparaciones semánticas CORE (Patch Premium)
        let next = repairBrandGuardFragments(text, safeCity)
          .replace(/\bLlamativa y natural\b/gi, `Consultar presupuesto`)
          .replace(/\bLlamativa\b/gi, `Contactar`)
          .replace(/\bAventurero\b/gi, `Saber más`)
          .replace(/\bSiempre enlazamos al menos la money page de referencia para mantener una navegación interna útil y estable en\s*[A-ZÁÉÍÓÚÑa-záéíóúñ]+\s*\./gi, `Nuestra red de cobertura: sedes colaboradoras y servicios especializados de interés.`)
          .replace(/\bSiempre enlazamos la money page y hasta dos páginas ya generadas para reforzar navegación\s*[A-ZÁÉÍÓÚÑa-záéíóúñ]+\s*\./gi, `Te enlazamos con nuestra sede central y servicios de referencia para una navegación profesional.`)
          .replace(new RegExp(`>\\s*Cobertura real en\\s*${safeCity}\\s*`, 'gi'), `Cobertura real en ${safeCity}`)
          .replace(/\b[E|e]n\s+([\.|\?|,|!|:|;])/g, `en ${safeCity}$1`)
          .replace(/^,\s*la ciudad/gi, `${safeCity}, la ciudad`)
          .replace(/\bde\s+para cubrir\b/gi, `de ${safeCity} para cubrir`)
          .replace(/\bServicio en\s+(?:<\/li>|<\/p>)/gi, `Servicio en ${safeCity}$1`)
          .replace(/\bdesplazamiento a\s+es una parte/gi, `desplazamiento a ${safeCity} es una parte`)
          .replace(/\ben\s+(es|donde|se\s+caracteriza|ofrece|incluye|permite|ayuda|es\s+una\s+ciudad|es\s+crucial)\b/gi, `en ${safeCity} $1`)
          .replace(/\ben\s+compensa\b/gi, `en ${safeCity} compensa`)
          .replace(/\bNo se presentan rese[ñn]as inventadas\b/gi, '')
          .replace(/\bCliente satisfecho\b/gi, 'Resultado verificado')
          .replace(/\breputaci[oó]n sólida en\s*\./gi, `reputación sólida en ${safeCity}.`)
          .replace(/\bsolicita\s+orientaci[oó]n\s+profesional\s+en\s+[\.|,]/gi, `solicita orientación profesional en ${safeCity}.`)
          .replace(/\bservicio de ([a-záéíóúñ]+) en\s*\./gi, `servicio de $1 en ${safeCity}.`);

        // Hardening contra duplicidad de ciudad (AI artifacts)
        const cityEscaped = safeCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        next = next
          .replace(new RegExp(`\\b${cityEscaped}\\s+${cityEscaped}\\b`, 'gi'), safeCity)
          .replace(new RegExp(`\\ben\\s+${cityEscaped}\\s+en\\s+${cityEscaped}\\b`, 'gi'), `en ${safeCity}`)
          .replace(new RegExp(`\\b${cityEscaped}\\s+en\\s+${cityEscaped}\\b`, 'gi'), safeCity)
          .replace(new RegExp(`(?:en|de)\\s+${cityEscaped}\\s+en\\s+${cityEscaped}`, 'gi'), `en ${safeCity}`)
          .replace(new RegExp(`\\b${cityEscaped}\\s*,\\s*${cityEscaped}\\b`, 'gi'), safeCity)
          .replace(/\s{2,}/g, ' ');

        if (next !== text) {
          $(node).replaceWith(escapeHtml(next));
        }
    }
  });

  // Handle specific dangling headings
  $('h1, h2, h3, h4').each((_i: any, el: any) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (/\ben$/i.test(text)) {
      $el.text(`${text} ${safeCity}`);
    }
  });

  // Li repair
  $('li').each((_i: any, el: any) => {
    const $el = $(el);
    if ($el.text().trim() === 'Cobertura real en') {
      $el.text(`Cobertura real en ${safeCity}`);
    }
  });
}

// wrapOrphanText removed as it was destructive to premium layouts

function ensureMissingParagraphs($: cheerio.CheerioAPI, city: string): void {
  const safeCity = city || 'tu zona';
  [
    '.proof-row', '.proof-card-minimal', '.semantic-card', '.service-card', '.faq-card', '.internal-links-item', '.cta-panel', '.urgency-banner'
  ].forEach((selector) => {
    $(selector).each((_i: any, el: any) => {
      const $el = $(el);
      const visibleText = normalizeText($el.text());
      const heading = normalizeText($el.find('h3').first().text() || $el.find('strong').first().text() || $el.find('.internal-links-item__title').first().text());
      if (!visibleText || /^cliente satisfecho$/i.test(heading)) {
        if (/^cliente satisfecho$/i.test(heading)) {
            $el.find('h3, strong').first().text('Resultado verificado');
        }
        if (!visibleText) {
            $el.remove();
            return;
        }
      }
      // Only append if it's REALLY empty of descriptive text
      if ($el.find('p').length === 0 && heading && !visibleText.includes('conviene revisar') && !/^resultado verificado$/i.test(heading)) {
        $el.append(`<p>En ${safeCity}, conviene revisar ${heading.toLowerCase()} con contexto real y una solución proporcionada al caso.</p>`);
      }
    });
  });
}

function sanitizeBrandNodes($: cheerio.CheerioAPI, city: string, niche?: string): void {
  const selectors = [
    'meta[property="og:site_name"]',
    '.footer__brand-name',
    '.site-header__brand-name',
    '[data-brand-name]'
  ];

  selectors.forEach((selector) => {
    $(selector).each((_: any, el: any) => {
      const $el = $(el);
      const value = $el.attr('content') || $el.text();
      const next = sanitizeBusinessName(String(value || ''), city, niche);
      if (!next) return;
      if ($el.attr('content') !== undefined) $el.attr('content', next);
      else $el.text(next);
    });
  });

  $('script[type="application/ld+json"]').each((_: any, el: any) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      graph.forEach((item: any) => {
        if (item && typeof item === 'object' && typeof item.name === 'string') {
          item.name = sanitizeBusinessName(item.name, city, niche);
        }
      });
      $(el).text(JSON.stringify(parsed));
    } catch {
      // ignore malformed schema blocks
    }
  });
}

function ensureInternalLinkAnchors($: cheerio.CheerioAPI): void {
  $('.internal-links-item').each((_i: any, el: any) => {
    const $el = $(el);
    const existingAnchor = $el.find('a[href]').first();
    if (!existingAnchor.length) return;

    const href = normalizeText(existingAnchor.attr('href') || '');
    if (!href || href === '#top') {
      existingAnchor.remove();
      return;
    }

    if (!$el.find('.internal-links-item__title').length) {
      const kicker = normalizeText($el.find('.internal-links-item__kicker').first().text());
      const text = normalizeText($el.text()).replace(/Abrir página.?/i, '').trim();
      if (text) {
        const title = kicker ? text.replace(new RegExp(`^${kicker}\s*`, 'i'), '').trim() : text;
        $el.prepend(`<strong class="internal-links-item__title">${escapeHtml(title)}</strong>`);
      }
    }
  });
}

function shortenOverlyLongButtons($: cheerio.CheerioAPI): void {
  // Target primary CTAs and common links that might have escaped as paragraphs
  $('a.cta-primary, .internal-links-item__anchor, .block__cta-group a, a.section-cta').each((_i: any, el: any) => {
    const $el = $(el);
    
    // 1. Remove block elements from inside links (common LLM hallucination)
    $el.find('p, div, br').replaceWith(' ');
    
    let text = normalizeText($el.text());
    
    // 2. Remove placeholders like [Número] or [Name]
    text = text.replace(/\[[^\]]+\]/g, '').replace(/\bNúmero\b/gi, '').trim();

    // 3. Robust truncation for premium look
    if (text.length > 50) {
      const parts = text.split(/[.?!:]/);
      // Take the first short sentence or just first 45 chars
      let bestText = parts[0].trim();
      if (bestText.length > 45 || bestText.length < 5) {
        bestText = text.substring(0, 42) + '...';
      }
      $el.text(bestText);
    }
  });
}


function dedupeRepeatedTrustSignals($: cheerio.CheerioAPI): void {
  const seen = new Set<string>();
  $('.block__pill, .hero-block__trust .pill, .trust-band__item, .hero-proof-card__eyebrow').each((_i: any, el: any) => {
    const node = $(el);
    const key = normalizeText(node.text()).toLowerCase();
    if (!key) return;
    if (seen.has(key) && /garant[ií]a por escrito|diagn[oó]stico t[eé]cnico|diagn[oó]stico claro|cobertura real/.test(key)) {
      node.remove();
      return;
    }
    seen.add(key);
  });
}

function sanitizeFaqVisibleAndSchema($: cheerio.CheerioAPI): void {
  $('.faq-item, .faq-card, .faq-entry, [data-faq-item], details').each((_i: any, el: any) => {
    const $el = $(el);
    const questionNode = $el.find('summary, .faq-question, .faq-card__question, .faq-summary-refined, h3, h4').first();
    if (questionNode.length) questionNode.text(normalizeFaqQuestionText(questionNode.text()));
    const answerNode = $el.find('.faq-answer, .faq-card__answer, .faq-content, p').first();
    if (answerNode.length) answerNode.text(normalizeFaqAnswerText(answerNode.text()));
  });

  $('script[type="application/ld+json"]').each((_i: any, el: any) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      for (const node of graph) {
        const type = node?.['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('FAQPage') && Array.isArray(node.mainEntity)) {
          node.mainEntity = node.mainEntity
            .map((item: any) => normalizeFaqEntity(item))
            .filter((item: any) => normalizeFaqQuestionText(item?.name || '') && normalizeFaqAnswerText(item?.acceptedAnswer?.text || ''));
        }
      }
      $(el).text(JSON.stringify(parsed));
    } catch {
      // ignore malformed schema blocks here; quality gate reports them.
    }
  });
}


function alignSeoAndSchema($: cheerio.CheerioAPI, city: string, niche?: string): void {
  const title = normalizeText($('title').text());
  const h1 = normalizeText($('h1').first().text()) || title;
  const finalTitle = title || h1;
  const finalCity = normalizeText(city);
  const finalNiche = normalizeText(niche || '');

  if (!title && h1) {
    if ($('head title').length) $('head title').text(h1);
    else $('head').prepend(`<title>${escapeHtml(h1)}</title>`);
  }

  const metaDescription = normalizeText($('meta[name="description"]').attr('content') || '');
  const fallbackDescription = metaDescription || `${finalNiche || 'Servicio profesional'} en ${finalCity || 'tu zona'} con proceso claro y cobertura real.`;

  $('meta[property="og:title"], meta[name="twitter:title"]').each((_i: any, el: any) => {
    $(el).attr('content', finalTitle || h1);
  });

  const footerBrand = normalizeText($('.footer__brand-name').first().text());
  if (footerBrand && finalCity) {
    const footerText = normalizeText($('footer').text()).toLowerCase();
    if (!footerText.includes(finalCity.toLowerCase())) {
      $('.footer__tagline').first().text(`${finalCity} · Servicio local con atención técnica y seguimiento claro`);
    }
  }

  $('script[type="application/ld+json"]').each((_i: any, el: any) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      const breadcrumb = graph.find((node: any) => {
        const t = node?.['@type'];
        return t === 'BreadcrumbList' || (Array.isArray(t) && t.includes('BreadcrumbList'));
      });
      for (const node of graph) {
        const type = node?.['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('WebPage')) {
          node.name = finalTitle || h1;
          if (!node.description) node.description = fallbackDescription;
        }
        if (types.includes('FAQPage') && Array.isArray(node.mainEntity)) {
          node.mainEntity = node.mainEntity
            .map((item: any) => ({ ...item, name: sanitizeFaqQuestion(item?.name || '') }))
            .filter((item: any) => normalizeText(item?.name || '') && normalizeText(item?.acceptedAnswer?.text || ''));
        }
      }
      if (breadcrumb?.itemListElement?.length) {
        const last = breadcrumb.itemListElement[breadcrumb.itemListElement.length - 1];
        if (last) last.name = finalTitle || h1;
      }
      $(el).text(JSON.stringify(parsed));
    } catch {
      // ignore malformed schema blocks
    }
  });
}

function variateRepetitiveKickers($: cheerio.CheerioAPI, niche?: string, city?: string): void {
  const kickers = $('.service-card__kicker, .internal-links-item__kicker, .block__eyebrow, .card__eyebrow');
  const seenContent = new Map<string, number>();
  
  const variants = [
    'Garantía técnica',
    'Resultado profesional',
    'Atención en ' + (city || 'Madrid'),
    'Servicio verificado',
    'Opción recomendada',
    'Soporte directo',
    'Calidad certificada'
  ];

  kickers.each((i: any, el: any) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    if (!text) return;

    const count = seenContent.get(text) || 0;
    seenContent.set(text, count + 1);

    // If we've seen this exact kicker more than once, variate it
    if (count > 0 || text.length > 35) {
      const newText = variants[(i + count) % variants.length];
      $el.text(newText);
    }
  });
}

function injectPremiumConsistencyCss($: cheerio.CheerioAPI): void {
  if ($('#patch-premium-safe-polish').length) return;
  const css = `
  <style id="patch-premium-safe-polish">
    .map-block__split{grid-template-columns:repeat(auto-fit,minmax(330px,1fr));align-items:stretch;gap:clamp(1.5rem,3vw,2.5rem)}
    .map-block__frame,.map-block__frame--boxed,.map-wrapper,.map-boxed-wrapper,.map-directory__visual{min-height:420px;height:100%;border:1px solid rgba(var(--primary-rgb),0.15);box-shadow:var(--shadow-lift)}
    .map-block__iframe,.map-iframe,iframe.map-iframe{display:block;width:100%;height:100%;min-height:inherit;border:0}

    .internal-links-hub{margin-top:clamp(4rem,7vw,6rem);padding:clamp(2rem,5vw,4rem) 0;position:relative;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(var(--primary-rgb),0.03),rgba(255,255,255,0))}
    .internal-links-hub__header{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.75rem;max-width:min(920px,100%);margin:0 auto clamp(2rem,4vw,3.5rem)}
    .internal-links-hub__header .block__title{font-size:clamp(1.8rem,3.5vw,2.8rem);letter-spacing:-0.03em}
    .internal-links-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.6rem;align-items:stretch;max-width:1200px;margin:0 auto}
    .internal-links-grid--single{max-width:640px;grid-template-columns:minmax(0,1fr)}
    .internal-links-item{display:flex;flex-direction:column;gap:1.15rem;padding:2.2rem 2.2rem 2rem;background:rgba(255,255,255,0.85);border:1px solid rgba(var(--primary-rgb),0.12);border-radius:1.75rem;box-shadow:var(--shadow-soft);backdrop-filter:blur(12px);transition:all .4s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden}
    .internal-links-item:hover{transform:translateY(-8px);box-shadow:var(--shadow-dramatic);border-color:rgba(var(--primary-rgb),0.35);background:#fff}
    .internal-links-item::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(var(--primary-rgb),0.05),transparent);opacity:0;transition:opacity .4s ease}
    .internal-links-item:hover::before{opacity:1}
    .internal-links-item__kicker{font-size:.75rem;text-transform:uppercase;letter-spacing:.15em;font-weight:900;color:var(--primary);opacity:.6}
    .internal-links-item__title,h3.internal-links-item__title{margin:0;font-size:1.35rem;font-weight:800;line-height:1.2;color:var(--text)}
    .internal-links-item p,.internal-links-item__description{margin:0;color:var(--muted);line-height:1.75;font-size:1.02rem}
    .internal-links-item__anchor{display:inline-flex;align-items:center;justify-content:center;min-height:3.4rem;margin-top:auto;padding:.8rem 1.75rem;border-radius:999px;background:var(--primary);border:1px solid rgba(255,255,255,0.15);color:#fff;font-weight:800;text-decoration:none;transition:all .3s ease;box-shadow:0 8px 20px rgba(var(--primary-rgb),0.18)}
    .internal-links-item__anchor:hover{background:var(--text);transform:scale(1.02);box-shadow:0 12px 28px rgba(0,0,0,0.2)}
    .internal-links-item__cta{color:inherit;font-weight:900;font-size:.95rem}
    .internal-links-item--money{background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(var(--primary-rgb),0.05));border-color:rgba(var(--primary-rgb),0.25)}

    .semantic-section .block__header{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.6rem;max-width:min(880px,100%);margin:0 auto clamp(2rem,4vw,3.5rem)}
    .semantic-section .block__title{font-size:clamp(1.75rem,3.2vw,2.5rem);font-weight:900}
    .semantic-section .block__header p{max-width:65ch;font-size:1.15rem;line-height:1.7}
    .semantic-section .semantic-card,.semantic-section .service-card,.semantic-section .faq-card,.semantic-section .proof-card,.semantic-section .testimonial-card{border-radius:1.5rem;padding:2rem;background:#fff;border:1px solid rgba(148,163,184,0.14);box-shadow:var(--shadow-soft);transition:all .3s ease}
    .semantic-section .semantic-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lift);border-color:rgba(var(--primary-rgb),0.2)}

    .premium-gradient-text{background:linear-gradient(135deg,var(--text) 30%,var(--primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .glass-panel{background:rgba(255,255,255,0.72);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.88);box-shadow:var(--shadow-lift)}
    .text-balance{text-wrap:balance}
    .hero__minimal{box-shadow:0 30px 90px -10px rgba(15,23,42,0.15),0 0 0 1px rgba(255,255,255,0.85);border-radius:2.5rem}

    .service-card__kicker{display:inline-flex;align-items:center;gap:.4rem;width:max-content;max-width:100%;padding:.45rem .7rem;border-radius:999px;background:rgba(var(--primary-rgb),0.08);border:1px solid rgba(var(--primary-rgb),0.12);font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);margin-bottom:.95rem}
    .services-grid__cards--balanced{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
    .services-grid__magazine{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(1.25rem,2.8vw,2.4rem);align-items:start}
    .services-grid__magazine-lead,.services-grid__magazine-stack{display:flex;flex-direction:column;gap:1rem;min-width:0}
    .services-grid__magazine-feature{padding:1.3rem 1.35rem;border-radius:1.25rem;background:linear-gradient(180deg,rgba(var(--primary-rgb),0.06),rgba(255,255,255,0.98));border:1px solid rgba(var(--primary-rgb),0.12);box-shadow:var(--shadow-soft)}
    .service-card--compact{padding:1.25rem 1.2rem}
    .service-card--compact p{font-size:.98rem}

    .process-steps__rail-layout{display:grid;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:clamp(1.25rem,3vw,2.4rem);align-items:start}
    .process-steps__rail-copy{display:flex;flex-direction:column;gap:1rem}
    .process-steps__rail{position:relative;display:flex;flex-direction:column;gap:1rem;padding-left:1.2rem}
    .process-steps__rail:before{content:"";position:absolute;left:1.45rem;top:.3rem;bottom:.3rem;width:2px;background:linear-gradient(180deg,rgba(var(--primary-rgb),.35),rgba(var(--primary-rgb),.08))}
    .process-step-rail{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:1rem;align-items:start;padding:1.1rem 1.2rem 1.1rem 0}
    .process-step-rail__index{display:inline-grid;place-items:center;width:3rem;height:3rem;border-radius:999px;background:linear-gradient(135deg,var(--primary),color-mix(in srgb,var(--primary),#000 18%));color:#fff;font-weight:900;box-shadow:0 10px 22px rgba(var(--primary-rgb),.22);position:relative;z-index:1}
    .process-step-rail__body{padding:1.1rem 1.2rem;border-radius:1.2rem;background:#fff;border:1px solid rgba(148,163,184,.14);box-shadow:var(--shadow-soft)}
    .process-step-rail__body h3{margin-top:0}

    .local-proof__coverage{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(1.25rem,3vw,2.35rem);align-items:start}
    .local-proof__coverage-copy,.local-proof__coverage-cards,.local-proof__coverage-list{display:flex;flex-direction:column;gap:1rem}
    .proof-card--coverage{padding:1.25rem 1.25rem 1.35rem;border-radius:1.25rem;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.9));border:1px solid rgba(148,163,184,.16)}

    .faq-block__accordion--refined{display:grid;gap:.9rem}
    .faq-item-refined{border-radius:1.15rem;border:1px solid rgba(148,163,184,.14);background:#fff;box-shadow:var(--shadow-soft);overflow:hidden}
    .faq-summary-refined{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1.1rem 1.2rem;cursor:pointer;list-style:none}
    .faq-summary-refined::-webkit-details-marker{display:none}
    .faq-summary-refined__count{display:inline-grid;place-items:center;width:2.2rem;height:2.2rem;border-radius:999px;background:rgba(var(--primary-rgb),.08);border:1px solid rgba(var(--primary-rgb),.12);font-size:.78rem;font-weight:900;color:var(--primary)}
    .faq-summary-refined__text{font-weight:700;color:var(--text);line-height:1.35}
    .faq-content-refined{padding:0 1.2rem 1.15rem 4.3rem}

    .cta-panel__consult{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.8fr);gap:clamp(1.2rem,3vw,2.4rem);align-items:start}
    .cta-panel__consult-copy{display:flex;flex-direction:column;gap:1rem;min-width:0}
    .cta-panel__consult-card{display:flex;flex-direction:column;gap:1rem;padding:1.25rem 1.2rem;border-radius:1.35rem;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.88));border:1px solid rgba(var(--primary-rgb),0.12);box-shadow:var(--shadow-lift)}

    .price-guidance__insight{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(1.25rem,3vw,2.4rem);align-items:start}
    .price-guidance__insight-copy,.price-guidance__insight-panels{display:flex;flex-direction:column;gap:1rem}
    .price-card--insight{padding:1.2rem 1.2rem 1.3rem;border-radius:1.2rem;background:#fff;border:1px solid rgba(148,163,184,.16);box-shadow:var(--shadow-soft)}

    .map-block__context{display:grid;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:clamp(1.25rem,3vw,2.5rem);align-items:stretch}
    .map-block__context-copy{display:flex;flex-direction:column;gap:1rem;min-width:0}
    .map-block__support{padding:1.1rem 1.15rem;border-radius:1.2rem;background:linear-gradient(180deg,rgba(var(--primary-rgb),0.04),rgba(255,255,255,.96));border:1px solid rgba(var(--primary-rgb),0.1);box-shadow:var(--shadow-soft)}
    .map-block__support h3{margin-top:0}

    .urgency-panel--command .urgency-banner{grid-template-columns:minmax(0,1fr) minmax(170px,.4fr) minmax(220px,.68fr)}
    .urgency-banner__content .block__header{margin-bottom:.2rem}

    .block-section.block--faq .block__header,.block-section.block--internal_linking .block__header,.block-section.block--cta_panel .block__header{text-align:left;align-items:flex-start}

    @media (max-width:820px){
      .map-block__split,.internal-links-grid,.services-grid__magazine,.process-steps__rail-layout,.local-proof__coverage,.cta-panel__consult,.price-guidance__insight,.map-block__context{grid-template-columns:1fr;gap:1.5rem}
      .internal-links-item{padding:1.75rem}
    }
  </style>`;
  $('head').append(css);
}

function removeOnlyKnownBadGeneratedStyle($: cheerio.CheerioAPI): void {
  const optimized = $('#optimized-bundle');
  if (!optimized.length) return;
  const css = optimized.text();
  const corruptionSignals = [
    /--hero-title-size:1rem;--h1-size:1rem;--h2-size:1rem;/,
    /background:#f8fafc,transparent 25%\)/,
    /\.replace\(/,
    /#f8fafc\)/,
  ];
  if (corruptionSignals.some((rx) => rx.test(css))) optimized.remove();
}

function removeDuplicatePatchStyles($: cheerio.CheerioAPI): void {
  const ids = ['premium-alignment-polish', 'patch-premium-consistency', 'layout-hotfix-performance'];
  ids.forEach((id) => {
    const nodes = $(`style#${id}`);
    if (nodes.length > 1) nodes.slice(1).remove();
  });
}

export function finalHtmlPolish(html: string, options: FinalHtmlPolishOptions = {}): string {
  const initial = String(html || '').normalize('NFC');
  if (!initial.trim()) return initial;

  const $ = cheerio.load(initial, { decodeEntities: false });
  const city = detectCity($, options.city || '');

  // Core Tag-Aware Repairs
  repairBrokenLocalPhrases($, city);
  repairObservedDebugFragments($, city, options.niche);
  normalizeVisibleFaqQuestions($);
  ensureMissingParagraphs($, city);
  shortenOverlyLongButtons($);
  variateRepetitiveKickers($, options.niche, city);
  sanitizeBrandNodes($, city, options.niche);
  sanitizeFaqVisibleAndSchema($);
  alignSeoAndSchema($, city, options.niche);
  stabilizeSeoMetaAndSchema($, city, options.niche);
  syncFooterBrandWithSeo($, city, options.niche);
  ensureInternalLinkAnchors($);
  // BLE V2.2: no forzamos /index.html; production links se normalizan en technicalIntegrityGate.
  injectPremiumConsistencyCss($);
  removeOnlyKnownBadGeneratedStyle($);
  removeDuplicatePatchStyles($);

  // Structural sanity check: remove segments that look like system residue
  $('.internal-links-hub .generic-layout').remove();

  const output = enforceTechnicalIntegrityPolish($.html({ decodeEntities: false }), { city, niche: options.niche });
  return output.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
}
