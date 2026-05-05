import * as cheerio from 'cheerio';

export interface PremiumContentDepthContext {
  city?: string;
  niche?: string;
  businessName?: string;
  phone?: string;
  targetWords?: number;
}

const MARKER = 'GRAVITY_PREMIUM_CONTENT_DEPTH_APPLIED';
const CSS_ID = 'gravity-premium-content-depth-css';

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return clean(value)
    .split(' ')
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ');
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wordCount(value: string): number {
  const words = clean(value).match(/[\p{L}\p{N}ÁÉÍÓÚÜÑáéíóúüñ]+(?:[-'][\p{L}\p{N}ÁÉÍÓÚÜÑáéíóúüñ]+)?/gu);
  return words ? words.length : 0;
}

function normalizeNicheLabel(raw?: string): string {
  const value = clean(raw || 'servicio local').replace(/[-_]+/g, ' ');
  const lower = value.toLowerCase();
  if (/cerraj/i.test(lower)) return 'cerrajería';
  if (/electric/i.test(lower)) return 'electricidad';
  if (/fontaner|plomer/i.test(lower)) return 'fontanería';
  if (/reforma/i.test(lower)) return 'reformas';
  if (/abog/i.test(lower)) return 'asesoría legal';
  if (/dent/i.test(lower)) return 'clínica dental';
  return lower;
}

function inferCity($: cheerio.CheerioAPI): string {
  const candidates = [
    $('script[type="application/ld+json"]').text(),
    $('title').first().text(),
    $('h1').first().text(),
    $('meta[property="og:title"]').attr('content') || '',
    $('meta[name="description"]').attr('content') || ''
  ].join(' ');
  const schemaCity = candidates.match(/"addressLocality"\s*:\s*"([^"]{2,80})"/i)?.[1]
    || candidates.match(/"name"\s*:\s*"([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]{2,60})"\s*}\s*,?\s*}\s*,?\s*{?"@type"\s*:\s*"Service"/i)?.[1];
  if (schemaCity) return titleCase(schemaCity);
  const fromTitle = candidates.match(/\ben\s+([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]{2,45})(?:\s+con|\s*:|\.|,|$)/)?.[1];
  return titleCase(fromTitle || 'tu zona');
}

function inferNiche($: cheerio.CheerioAPI): string {
  const text = [$('title').first().text(), $('h1').first().text(), $('meta[name="description"]').attr('content') || ''].join(' ');
  if (/cerraj/i.test(text)) return 'cerrajería';
  if (/electric/i.test(text)) return 'electricidad';
  if (/fontaner/i.test(text)) return 'fontanería';
  if (/reforma/i.test(text)) return 'reformas';
  return 'servicio local';
}

function getTargetWords(context: PremiumContentDepthContext): number {
  const raw = Number(context.targetWords || process.env.GRAVITY_PREMIUM_TARGET_WORDS || 2200);
  if (Number.isFinite(raw)) return Math.max(1800, Math.min(3200, Math.round(raw)));
  return 2200;
}

function rewriteSentence(text: string, city: string): string {
  let out = clean(text)
    .replace(/\bOfrecemos\s+un\s+servicio\s+r[aá]pido\s+y\s+seguro,?\s+con\s+una\s+garant[ií]a\s+de\s+tiempo\s+r[eé]cord\s+de\s+respuesta\.?/gi, 'Explicamos la intervención antes de actuar y priorizamos una solución proporcionada al estado real del acceso.')
    .replace(/\bOfrecemos\s+un\s+servicio\s+r[aá]pido\s+y\s+seguro\.?/gi, 'Trabajamos con diagnóstico previo y explicación clara de la intervención.')
    .replace(/\bNuestro\s+equipo\s+de\s+([^.!?]{0,80}?)\s+est[aá]\s+capacitado\s+para\s+realizar/gi, 'El servicio se plantea con revisión previa para realizar')
    .replace(/\bNuestros\s+t[eé]cnicos\s+en\s+([^.!?]{0,80}?)\s+est[aá]n\s+preparados\s+para\s+realizar/gi, 'La intervención se organiza para realizar')
    .replace(/\bcontamos\s+con\s+los\s+herramientas\s+adecuadas/gi, 'se utilizan herramientas adecuadas')
    .replace(/\blos\s+herramientas\b/gi, 'las herramientas')
    .replace(/\bgarantizar\s+la\s+satisfacci[oó]n\s+del\s+cliente\b/gi, 'comprobar el resultado y explicar el cierre del trabajo')
    .replace(/\bnormativas\s+locales\s+y\s+las\s+mejores\s+pr[aá]cticas\s+del\s+mercado\b/gi, 'criterios técnicos aplicables y la seguridad de uso')
    .replace(/\bpersonal\s+t[eé]cnico\s+que\s+han\s+trabajado\b/gi, 'personal técnico con experiencia')
    .replace(/\btodos\s+Servicios\s+de\b/g, 'los servicios de')
    .replace(/\b24\s*\/\s*7\b/g, 'según disponibilidad operativa')
    .replace(/\bGarant[ií]a\s+de\s+tiempo\s+r[eé]cord\b/gi, 'Respuesta coordinada')
    .replace(/\bProporci[oó]n\s+Activa\b/gi, 'Propuesta de intervención')
    .replace(/\bPrueba\s+Local\s+Prudente\b/gi, 'Comprobación local')
    .replace(/\bPrecios\s+Condicionados\b/gi, 'Qué condiciona el presupuesto')
    .replace(/\bNuestros\s+Servicios\b/gi, `Servicios principales en ${city}`)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}

function serviceCardSummary(title: string, city: string, niche: string): string {
  const normalized = clean(title).toLowerCase();
  if (/apertura|puerta|acceso/.test(normalized)) {
    return `Revisión del acceso, identificación del bloqueo y apertura controlada cuando el caso lo permite. Antes de actuar se explica el alcance de la intervención para evitar cambios innecesarios.`;
  }
  if (/bomb[ií]n|cerradura|cilindro|escudo|antibumping/.test(normalized)) {
    return `Se valora el estado de la cerradura, la compatibilidad de piezas y el nivel de seguridad buscado. La propuesta se ajusta al uso real de la vivienda, local o comunidad.`;
  }
  if (/urgencia|prioritaria|emergencia/.test(normalized)) {
    return `Atención orientada a resolver el acceso con información clara desde el primer contacto. Se priorizan los casos donde hay bloqueo real, pérdida de llaves o riesgo de seguridad.`;
  }
  if (/seguridad|refuerzo|protecci/.test(normalized)) {
    return `Análisis de puntos vulnerables y opciones de refuerzo proporcionadas. La recomendación se plantea según el tipo de puerta, uso diario y presupuesto disponible.`;
  }
  return `Servicio de ${niche} en ${city} con revisión previa, explicación de opciones y una intervención proporcional al estado real del trabajo.`;
}

function compactCardParagraphs($: cheerio.CheerioAPI, city: string, niche: string): void {
  const cardSelector = '.service-card, .price-card, .proof-card, .semantic-card, .trust-band__signal-card, .local-proof__signal, .process-step-rail__body, .step-card, article';
  $(cardSelector).each((_i: number, el: any) => {
    const $card = $(el);
    if ($card.closest('footer, header, nav, .internal-links-hub').length) return;
    const title = clean($card.find('h3,h2,strong').first().text());
    $card.find('p').each((idx: number, p: any) => {
      const $p = $(p);
      const original = clean($p.text());
      if (!original) return;
      let next = rewriteSentence(original, city);
      const isService = $card.hasClass('service-card') || $card.closest('#services-grid, [data-block-type="services_grid"]').length > 0;
      const shouldReplace = isService && (next.length > 360 || /servicio r[aá]pido|tiempo r[eé]cord|herramientas adecuadas|est[aá] capacitado|est[aá]n preparados|mejores pr[aá]cticas|satisfacci[oó]n del cliente/i.test(original));
      if (shouldReplace) next = serviceCardSummary(title, city, niche);
      if (!isService && next.length > 520) {
        const sentences = next.match(/[^.!?]+[.!?]+/g) || [];
        next = clean(sentences.slice(0, 2).join(' ') || next.slice(0, 420));
      }
      if (idx > 0 && isService && next.length > 240) {
        const sentences = next.match(/[^.!?]+[.!?]+/g) || [];
        next = clean(sentences[0] || next.slice(0, 220));
      }
      if (next !== original) $p.text(next);
    });
  });
}

function improveHeadings($: cheerio.CheerioAPI, city: string, niche: string): void {
  const replacements: Array<[RegExp, string]> = [
    [/^Nuestros\s+Servicios$/i, `Servicios principales en ${city}`],
    [/^Servicios$/i, `Servicios de ${niche} en ${city}`],
    [/^Proceso\s+de\s+Servicio$/i, 'Proceso de trabajo'],
    [/^C[oó]mo\s+funciona\s+nuestro\s+servicio\??$/i, 'Proceso de trabajo'],
    [/^Precios\s+y\s+Tarifas$/i, 'Qué condiciona el presupuesto'],
    [/^Precios\s+Condicionados$/i, 'Qué condiciona el presupuesto'],
    [/^Prueba\s+Local\s+Prudente$/i, 'Comprobación local'],
    [/^Testimonios\s+Locales$/i, 'Señales de confianza'],
    [/^Navegaci[oó]n\s+relacionada\s+del\s+proyecto$/i, 'Servicios relacionados'],
    [/^Proporci[oó]n\s+Activa$/i, 'Propuesta de intervención']
  ];
  $('h1,h2,h3,summary,.block__title').each((_i: number, el: any) => {
    const $el = $(el);
    const text = clean($el.text());
    if (!text) return;
    for (const [rx, replacement] of replacements) {
      if (rx.test(text)) {
        $el.text(replacement);
        return;
      }
    }
  });
}

function normalizeCtaNotes($: cheerio.CheerioAPI): void {
  $('.block__cta-note, .block__cta-phone, small, .cta-note').each((_i: number, el: any) => {
    const $el = $(el);
    const text = clean($el.text());
    if (!text) return;
    if (/24\s*\/\s*7|disponibles\s+todo|tiempo\s+r[eé]cord|consultas\s+y\s+solicitudes/i.test(text) || text.length > 155) {
      $el.text('Te orientamos antes de confirmar la intervención.');
    }
  });
}

function cleanVisibleTextNodes($: cheerio.CheerioAPI, city: string): void {
  $('body').find('*').contents().each((_i: number, node: any) => {
    if (node.type !== 'text') return;
    const original = String(node.data || '');
    const next = rewriteSentence(original, city)
      .replace(/\b(undefined|null|\[object Object\])\b/gi, '')
      .replace(/\bSeñal\s+0?\d+\b/gi, 'Señal de confianza')
      .replace(/\bCriterio\s+0?\d+\b/gi, 'Criterio de revisión')
      .replace(/\bFactor\s+0?\d+\b/gi, 'Factor relevante')
      .replace(/\s{2,}/g, ' ');
    if (next !== original.trim()) node.data = next;
  });
}

function sectionIntro(city: string, niche: string): string {
  return `En ${city}, una página útil de ${niche} no debe limitarse a listar servicios: también debe explicar cuándo conviene actuar, qué datos ayudan a orientar el caso y qué señales permiten distinguir una intervención proporcionada de una actuación improvisada.`;
}

function commonCasesBlock(city: string, niche: string): string {
  const lock = /cerraj/i.test(niche);
  const title = lock ? `Situaciones habituales de cerrajería en ${city}` : `Situaciones habituales en ${city}`;
  const cards = lock ? [
    ['Llave partida o bloqueada', 'Cuando la llave se queda dentro, gira mal o se parte, conviene revisar primero el estado del bombín. Forzar la puerta puede convertir una reparación sencilla en una sustitución completa.'],
    ['Puerta cerrada sin vuelta de llave', 'No todos los casos requieren cambiar cerradura. Si la puerta solo está cerrada de golpe, se valora el tipo de resbalón, el marco y el nivel de acceso antes de decidir la técnica.'],
    ['Bombín endurecido o antiguo', 'Un bombín que rasca, se atasca o exige demasiada fuerza suele avisar antes de fallar. Revisarlo a tiempo ayuda a evitar bloqueos y decisiones precipitadas.'],
    ['Refuerzo de seguridad', 'Cuando se busca mejorar protección, se comparan bombín, escudo, cerradura y hábitos de uso. La mejor solución no siempre es la más cara, sino la más coherente con la puerta.']
  ] : [
    ['Avería recurrente', 'Cuando un problema aparece varias veces, conviene revisar la causa y no solo el síntoma visible. Así se evita repetir actuaciones poco duraderas.'],
    ['Instalación antigua', 'Los elementos antiguos pueden seguir funcionando, pero requieren comprobar compatibilidad, seguridad y disponibilidad de piezas antes de decidir una sustitución.'],
    ['Urgencia real', 'En una incidencia urgente, la prioridad es entender el alcance del problema, orientar el desplazamiento y explicar los posibles escenarios antes de intervenir.'],
    ['Mejora preventiva', 'Muchas mejoras se pueden planificar sin presión si se revisa el estado actual, el uso diario y el nivel de exigencia que necesita el inmueble.']
  ];
  return premiumBlock('premium-depth-casos', 'Guía práctica', title, [
    sectionIntro(city, niche),
    `Estos casos ayudan a ordenar la conversación inicial y a preparar una intervención más clara. La clave es aportar información concreta: síntoma, antigüedad aproximada, tipo de inmueble, urgencia real y cualquier manipulación previa.`
  ], cards as [string, string][]);
}

function decisionBlock(city: string, niche: string): string {
  return premiumBlock('premium-depth-decision', 'Criterio técnico', `Cómo decidir la intervención adecuada`, [
    `La decisión entre ajustar, reparar o sustituir no debería tomarse solo por rapidez. En ${city}, un servicio bien planteado empieza por comprobar el estado real, explicar alternativas y evitar cambios completos cuando una solución parcial es suficiente.`,
    `También conviene diferenciar entre una solución provisional y una intervención pensada para durar. Esa distinción permite comparar presupuestos con más criterio y entender por qué dos propuestas pueden tener alcances diferentes.`
  ], [
    ['Estado real del elemento', 'Se revisa si el problema viene de desgaste, instalación, uso diario, falta de ajuste o una pieza concreta. Sin esa lectura, el presupuesto puede ser demasiado genérico.'],
    ['Compatibilidad de materiales', 'Antes de sustituir, conviene confirmar medidas, calidades y compatibilidad. Una pieza aparentemente similar puede no encajar bien o no ofrecer el nivel de seguridad esperado.'],
    ['Uso del inmueble', 'No exige lo mismo una vivienda habitual, un local con mucho tránsito o una comunidad. El uso condiciona durabilidad, prioridad y tipo de solución recomendada.'],
    ['Coste frente a duración', 'La opción más barata no siempre es la más conveniente si obliga a repetir el trabajo. La opción más cara tampoco tiene sentido si el caso permite una reparación proporcionada.']
  ]);
}

function mistakesBlock(city: string, niche: string): string {
  return premiumBlock('premium-depth-errores', 'Antes de contratar', `Errores que conviene evitar`, [
    `Un buen resultado depende tanto de la intervención como de la información previa. Antes de confirmar un servicio de ${niche} en ${city}, es útil revisar algunos puntos que suelen generar malentendidos.`,
    `Estos errores no siempre indican mala práctica, pero sí aumentan el riesgo de presupuestos poco claros, desplazamientos innecesarios o decisiones tomadas con demasiada prisa.`
  ], [
    ['Aceptar una solución sin diagnóstico', 'Si no se ha explicado qué se va a revisar, qué alternativas existen y qué puede cambiar el precio, es difícil comparar la propuesta con criterio.'],
    ['No describir el síntoma', 'Frases como “no funciona” ayudan poco. Es mejor indicar cuándo empezó, si el problema se repite, si hay ruido, bloqueo, holgura o una pieza visible dañada.'],
    ['Elegir solo por urgencia', 'La rapidez importa, pero debe ir acompañada de claridad. Una intervención urgente también puede explicar alcance, condiciones y pasos básicos antes de actuar.'],
    ['No comprobar el cierre del trabajo', 'Al finalizar, conviene probar el funcionamiento, revisar que no haya roces o bloqueos y conservar una explicación básica de lo realizado.']
  ]);
}

function comparisonBlock(city: string, niche: string): string {
  return premiumBlock('premium-depth-comparacion', 'Comparación útil', `Qué pedir antes de confirmar`, [
    `Cuando hay varias opciones, conviene pedir una explicación sencilla y comparable. No se trata de exigir un informe complejo, sino de entender qué incluye cada propuesta y qué queda pendiente de validar en la visita.`,
    `Esta comparación ayuda a separar una orientación inicial de un presupuesto definitivo. En trabajos locales, esa diferencia es importante porque el estado real del inmueble puede cambiar la intervención.`
  ], [
    ['Alcance previsto', 'Qué se va a revisar, qué parte se puede resolver en el momento y qué dependerá del estado real una vez visto el problema.'],
    ['Materiales posibles', 'Qué piezas pueden hacer falta, si existen alternativas y si hay diferencias relevantes de seguridad, compatibilidad o duración.'],
    ['Condiciones del desplazamiento', 'Qué información se necesita antes de acudir, qué puede modificar el precio y cómo se confirma la intervención.'],
    ['Comprobación final', 'Qué pruebas se harán al terminar y qué explicación recibirá el cliente para usar correctamente la solución aplicada.']
  ]);
}

function premiumBlock(id: string, eyebrow: string, title: string, paragraphs: string[], cards: [string, string][]): string {
  return `
<section id="${id}" class="block-section premium-depth-section gpc-depth-section" data-block-type="premium_content_depth">
  <div class="el-container">
    <div class="premium-depth-panel">
      <header class="block__header premium-depth-header">
        <span class="block__eyebrow">${escapeHtml(eyebrow)}</span>
        <h2 class="block__title">${escapeHtml(title)}</h2>
        ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      </header>
      <div class="premium-depth-grid">
        ${cards.map(([h, p]) => `<article class="premium-depth-card"><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p></article>`).join('')}
      </div>
    </div>
  </div>
</section>`;
}

function insertBeforeBestAnchor($: cheerio.CheerioAPI, html: string): void {
  const anchors = ['#faq', '[data-block-type="faq"]', '.block--faq', '#contacto', 'footer'];
  for (const selector of anchors) {
    const target = $(selector).first();
    if (target.length) {
      target.before(html);
      return;
    }
  }
  $('body').append(html);
}

function insertAfterBestAnchor($: cheerio.CheerioAPI, html: string): void {
  const anchors = ['#services-grid', '[data-block-type="services_grid"]', '.block--services_grid', '.conversion-proof-strip'];
  for (const selector of anchors) {
    const target = $(selector).last();
    if (target.length) {
      target.after(html);
      return;
    }
  }
  insertBeforeBestAnchor($, html);
}

function ensurePremiumDepth($: cheerio.CheerioAPI, city: string, niche: string, targetWords: number): void {
  const mode = clean(process.env.GRAVITY_CONTENT_DEPTH || 'premium').toLowerCase();
  if (mode === 'compact') return;

  const blocks = [
    { id: 'premium-depth-casos', html: () => commonCasesBlock(city, niche), position: 'after' },
    { id: 'premium-depth-decision', html: () => decisionBlock(city, niche), position: 'before' },
    { id: 'premium-depth-errores', html: () => mistakesBlock(city, niche), position: 'before' },
    { id: 'premium-depth-comparacion', html: () => comparisonBlock(city, niche), position: 'before' }
  ];

  for (const block of blocks) {
    if (wordCount($('body').text()) >= targetWords) break;
    if ($(`#${block.id}`).length) continue;
    if (block.position === 'after') insertAfterBestAnchor($, block.html());
    else insertBeforeBestAnchor($, block.html());
  }
}

function injectCss($: cheerio.CheerioAPI): void {
  $(`#${CSS_ID}`).remove();
  $('head').append(`<style id="${CSS_ID}">${premiumDepthCss()}</style>`);
}

function premiumDepthCss(): string {
  return `
/* === Gravity Premium Content Depth v1 === */
body.gravity-premium-content-depth .premium-depth-section{padding:clamp(3.2rem,5vw,5.5rem) 0!important;background:transparent!important}
body.gravity-premium-content-depth .premium-depth-panel{border-radius:clamp(1.25rem,2.4vw,2rem);background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.95));border:1px solid rgba(148,163,184,.16);box-shadow:0 16px 45px rgba(15,23,42,.07);padding:clamp(1.35rem,3vw,2.4rem)}
body.gravity-premium-content-depth .premium-depth-header{max-width:880px;margin-bottom:clamp(1.25rem,2.6vw,2rem)!important}
body.gravity-premium-content-depth .premium-depth-header .block__title{max-width:20ch!important;margin-bottom:.75rem!important}
body.gravity-premium-content-depth .premium-depth-header p{max-width:78ch;color:var(--muted,#64748b)!important;font-size:clamp(1rem,1.25vw,1.12rem);line-height:1.72;margin:.35rem 0 0!important}
body.gravity-premium-content-depth .premium-depth-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr));gap:clamp(.9rem,1.8vw,1.25rem);align-items:stretch}
body.gravity-premium-content-depth .premium-depth-card{position:relative;min-width:0;border-radius:clamp(1rem,1.8vw,1.35rem);background:#fff;border:1px solid rgba(148,163,184,.17);box-shadow:0 8px 22px rgba(15,23,42,.045);padding:clamp(1.05rem,2vw,1.45rem)}
body.gravity-premium-content-depth .premium-depth-card:before{content:'✓';display:inline-grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:999px;background:rgba(var(--primary-rgb,10,25,47),.08);color:var(--primary,#0a192f);font-weight:950;margin-bottom:.8rem}
body.gravity-premium-content-depth .premium-depth-card h3{font-size:clamp(1.05rem,1.45vw,1.25rem)!important;line-height:1.15!important;letter-spacing:-.025em!important;margin:0 0 .55rem!important;color:var(--text,#0f172a)!important}
body.gravity-premium-content-depth .premium-depth-card p{color:var(--muted,#64748b)!important;line-height:1.65!important;margin:0!important}
body.gravity-premium-content-depth .service-card p,body.gravity-premium-content-depth .price-card p,body.gravity-premium-content-depth .proof-card p{line-height:1.62!important}
body.gravity-premium-content-depth .service-card__meta,body.gravity-premium-content-depth .step-row__meta,body.gravity-premium-content-depth .price-card__facts{margin-top:.9rem!important}
body.gravity-premium-content-depth .block__cta-note{max-width:34rem!important;white-space:normal!important}
body.gravity-premium-content-depth meta[name="gravity-premium-word-count"]{display:none!important}
@media(max-width:760px){body.gravity-premium-content-depth .premium-depth-panel{padding:1.1rem;border-radius:1.2rem}body.gravity-premium-content-depth .premium-depth-grid{grid-template-columns:1fr}.premium-depth-section{padding:2.75rem 0!important}}
`.trim().replace(/\s+/g, ' ');
}

function markDocument($: cheerio.CheerioAPI, context: PremiumContentDepthContext): void {
  const body = $('body').first();
  if (body.length) {
    const classes = new Set(clean(body.attr('class')).split(/\s+/).filter(Boolean));
    classes.add('gravity-premium-content-depth');
    body.attr('class', Array.from(classes).join(' '));
    body.attr('data-gravity-content-depth', 'premium-v1');
  }
  $('meta[name="gravity-premium-content-depth"]').remove();
  $('head').append('<meta name="gravity-premium-content-depth" content="v1">');
  $('meta[name="gravity-premium-word-count"]').remove();
  $('head').append(`<meta name="gravity-premium-word-count" content="${wordCount($('body').text())}">`);
  if (!$('html').html()?.includes(MARKER)) {
    $('head').append(`<!-- ${MARKER} -->`);
  }
}

export function applyPremiumContentDepth(html: string, context: PremiumContentDepthContext = {}): string {
  if (!html || typeof html !== 'string') return html;
  if (String(process.env.GRAVITY_PREMIUM_CONTENT_DEPTH || 'true').toLowerCase() === 'false') return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  if (!$('html').length || !$('body').length) return html;

  const city = titleCase(clean(context.city) || inferCity($));
  const niche = normalizeNicheLabel(context.niche || inferNiche($));
  const targetWords = getTargetWords(context);

  cleanVisibleTextNodes($, city);
  improveHeadings($, city, niche);
  compactCardParagraphs($, city, niche);
  normalizeCtaNotes($);
  ensurePremiumDepth($, city, niche, targetWords);
  injectCss($);
  markDocument($, context);

  return $.html().replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export const premiumContentDepthMarker = MARKER;
