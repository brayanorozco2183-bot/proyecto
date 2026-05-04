export interface PremiumNicheGuardContext {
  niche?: string;
  city?: string;
}

function normalizeKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseCity(city?: string): string {
  const raw = String(city || '').trim();
  if (!raw) return 'esta localidad';
  return raw
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function isElectrician(ctx: PremiumNicheGuardContext): boolean {
  const n = normalizeKey(ctx.niche || '');
  return /electric|electricista|instalaciones electricas|cuadro electrico|diferencial/.test(n);
}

function isLocksmith(ctx: PremiumNicheGuardContext): boolean {
  const n = normalizeKey(ctx.niche || '');
  return /cerraj|cerradur|bombin|llave|blindad|apertura/.test(n);
}

function applyGeneralTextFixes(text: string, ctx: PremiumNicheGuardContext): string {
  const city = titleCaseCity(ctx.city);
  let out = String(text || '');

  out = out
    .replace(/\bmanten[eé]\b/gi, 'mantenga')
    .replace(/\bconfiables\b/gi, 'fiables')
    .replace(/\bEl\s+Mejor\s+Servicio\s+de\s+/gi, '')
    .replace(/\bel\s+mejor\s+servicio\s+de\s+/gi, '')
    .replace(/\bexpertos?\b/gi, 'profesionales')
    .replace(/\bsoluciones\s+personalizadas\b/gi, 'soluciones ajustadas al caso')
    .replace(/\baltamente\s+capacitados\b/gi, 'con criterio técnico')
    .replace(/\bmateriales\s+de\s+alta\s+calidad\b/gi, 'materiales adecuados al uso')
    .replace(/\bgarantizamos\b/gi, 'buscamos asegurar')
    .replace(/\bGarant[ií]a\s+de\s+Satisfacci[oó]n(?:\s+del\s+Cliente)?\b/gi, 'Compromiso de claridad')
    .replace(/\btu\s+hogar\b/gi, 'su vivienda')
    .replace(/\btu\s+casa\b/gi, 'su vivienda')
    .replace(/\bte\s+recomendamos\b/gi, 'conviene valorar')
    .replace(/\btus\s+necesidades\b/gi, 'sus necesidades')
    .replace(/\btus\s+instalaciones\b/gi, 'sus instalaciones')
    .replace(/\bpara\s+garant\s*$/gi, 'para orientar la intervención con claridad')
    .replace(/\bpara\s+garant(?=[\s.,;:!?<])/gi, 'para orientar la intervención')
    .replace(/\bLa presencia se comunica a nivel de\s*,/gi, `La cobertura se comunica a nivel de ${city},`)
    .replace(/\bCobertura comunicada a nivel de\s*(?=·|\.|,|$)/gi, `Cobertura comunicada a nivel de ${city} `)
    .replace(/\bidentidad visible en\s+y\s+evita\b/gi, `identidad visible en ${city} y evita`)
    .replace(/\bvisible en\s+y\s+evita\b/gi, `visible en ${city} y evita`)
    .replace(/\bSi el caso se parece a\s*,/gi, 'Si el caso requiere una intervención más amplia,')
    .replace(/\bNo se presentan rese[ñn]as inventadas\b/gi, '')
    .replace(/\bCliente satisfecho\b/gi, 'Resultado verificado')
    .replace(/\ben todo el distrito de\s*([,.;:!?¡¿]|$)/gi, `en todo el distrito de ${city}$1`)
    .replace(/\bComarca de la Vega de\s+y\s+Andaluc[ií]a\b/gi, `${city}, su área metropolitana y otras zonas de Andalucía según disponibilidad`)
    .replace(/\bComarca de la Vega de\s*(?=[,.;]|$)/gi, `${city} y su área metropolitana`)
    .replace(/\bnivel de\s*,/gi, `nivel de ${city},`)
    .replace(/\ben\s+y\s+evita\b/gi, `en ${city} y evita`)
    .replace(/\ba\s*,\s*puede ser útil\b/gi, 'a una intervención compleja, puede ser útil')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([¿¡])\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return out;
}

function applyElectricianFixes(text: string, ctx: PremiumNicheGuardContext): string {
  if (!isElectrician(ctx)) return text;
  const city = titleCaseCity(ctx.city);
  let out = String(text || '');

  out = out
    .replace(/\bmantenimiento\s+electr[oó]nico\b/gi, 'mantenimiento eléctrico')
    .replace(/\bservicio\s+de\s+mantenimiento\s+electr[oó]nico\b/gi, 'servicio eléctrico')
    .replace(/\bmantenimiento\s+electr[oó]nico\s+en\s+/gi, 'mantenimiento eléctrico en ')
    .replace(/\breparaci[oó]n\s+de\s+aparatos\s+el[eé]ctricos\b/gi, 'revisión de instalaciones y puntos eléctricos')
    .replace(/\blocalizaci[oó]n\s+y\s+reparaci[oó]n\s+de\s+aparatos\s+el[eé]ctricos\b/gi, 'Localización de averías e instalaciones eléctricas')
    .replace(/\baparatos\s+el[eé]ctricos\b/gi, 'equipos e instalaciones eléctricas')
    .replace(/\belectr[oó]nico\b/gi, 'eléctrico')
    .replace(/\belectr[oó]nica\b/gi, 'eléctrica')
    .replace(/\bcuadro\s+el[eé]ctrico\s+es\s+un\s+documento\b/gi, 'cuadro eléctrico es el conjunto de protecciones y circuitos')
    .replace(/\bdocumento\s+que\s+registra[^.?!]*cuadro\s+el[eé]ctrico[^.?!]*[.?!]?/gi, 'elemento que organiza las protecciones, circuitos y maniobras principales de la instalación eléctrica.')
    .replace(/\bherrajes\b/gi, 'mecanismos y protecciones')
    .replace(/\bNormativa\s+CE\s+503\b/gi, 'Normativa de Baja Tensión (REBT)')
    .replace(/\bseguridad\s+de\s+su\s+vivienda\b/gi, 'seguridad y fiabilidad de la instalación')
    .replace(/\bElectricistas\s+en\s+Granada:\s*El\s+Mejor\s+Servicio\s+de\s+Mantenimiento\s+El[eé]ctrico\b/gi, `Electricistas en ${city} con diagnóstico claro y trabajo eléctrico seguro`);

  return out;
}

function applyLocksmithFixes(text: string, ctx: PremiumNicheGuardContext): string {
  if (!isLocksmith(ctx)) return text;
  return String(text || '')
    .replace(/\bEscudos\s+Protectors\b/gi, 'Escudos protectores')
    .replace(/\bsistemas\s+cerrajeros\b/gi, 'sistemas de cierre')
    .replace(/\brecuperar\s+el\s+daño\b/gi, 'reducir el daño');
}

export function polishPremiumText(value: string, ctx: PremiumNicheGuardContext = {}): string {
  let out = String(value || '');
  out = applyGeneralTextFixes(out, ctx);
  out = applyElectricianFixes(out, ctx);
  out = applyLocksmithFixes(out, ctx);
  return out.replace(/\s{2,}/g, ' ').trim();
}

export function polishPremiumHtml(html: string, ctx: PremiumNicheGuardContext = {}): string {
  let out = String(html || '');
  if (!out) return out;

  // Preserve tags/attributes by editing only text nodes in a simple split.
  const parts = out.split(/(<[^>]+>)/g);
  out = parts.map(part => /^<[^>]+>$/.test(part) ? part : polishPremiumText(part, ctx)).join('');

  // Safe attribute-level normalizations for SEO attributes where text may be visible to crawlers.
  out = out.replace(/(content=["'])([^"']*)(["'])/gi, (_m, a, b, c) => `${a}${polishPremiumText(b, ctx)}${c}`);
  out = out.replace(/(alt=["'])([^"']*)(["'])/gi, (_m, a, b, c) => `${a}${polishPremiumText(b, ctx)}${c}`);
  return out;
}

export function polishPlanningLabel(value: string, ctx: PremiumNicheGuardContext = {}): string {
  let out = polishPremiumText(value, ctx);
  const city = titleCaseCity(ctx.city);
  if (isElectrician(ctx)) {
    if (/^electricistas en [a-záéíóúñ\s]+:?$/i.test(out) || /el mejor servicio/i.test(out)) {
      out = `Electricistas en ${city} con diagnóstico claro y trabajo eléctrico seguro`;
    }
    if (/mantenimiento electr/i.test(out) && /mejor servicio/i.test(out)) {
      out = `Electricistas en ${city} con diagnóstico claro y trabajo eléctrico seguro`;
    }
  }
  return out;
}

export function buildNicheGuardPrompt(ctx: PremiumNicheGuardContext = {}): string {
  const city = titleCaseCity(ctx.city);
  if (isElectrician(ctx)) {
    return `\nGUARDRAIL SECTORIAL ELECTRICISTAS ESPAÑA:\n- Escribe sobre instalaciones eléctricas, averías eléctricas, cuadros eléctricos, diferenciales, magnetotérmicos, cableado, enchufes, interruptores, puntos de luz, boletines/IEE si procede y mantenimiento eléctrico.\n- NO uses "mantenimiento electrónico" para este nicho; debe ser "mantenimiento eléctrico".\n- Evita orientar la página a reparación de electrodomésticos o "aparatos eléctricos" salvo mención secundaria.\n- H1 recomendado si dudas: "Electricistas en ${city} con diagnóstico claro y trabajo eléctrico seguro".\n- FAQs recomendadas: "¿Por qué salta el diferencial y cómo se diagnostica?", "¿Cuándo conviene revisar el cuadro eléctrico?", "¿Qué datos ayudan a valorar una avería eléctrica?", "¿Qué influye en el presupuesto de un electricista?".\n- Usa tono profesional de España: usted/impersonal, no voseo ni fórmulas latinoamericanas.`;
  }
  return `\nGUARDRAIL EDITORIAL GENERAL:\n- Evita clichés: "el mejor servicio", "expertos", "soluciones personalizadas", "altamente capacitados", "materiales de alta calidad".\n- Usa español de España, tono profesional y frases completas sin variables vacías.\n- No dejes fragmentos como "nivel de,", "visible en y evita", "se parece a," o "para garant".`;
}
