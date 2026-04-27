// Adapta la salida enriquecida del pipeline a la forma que esperan los renderers premium.
// Ajusta imports/rutas según tu repo.

export interface AdaptBlockInputArgs {
  sectionId: string;
  section: any;
  contract?: any;
  data?: any;
  theme?: any;
}

function asArray<T = any>(value: any): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function repairLocalPhrase(value: string, city?: string): string {
  let out = normalizeText(value);
  if (!out) return '';
  if (city) {
    out = out.replace(/\bEn\s*,/g, `En ${city},`);
    out = out.replace(/\ben\s+compensa\b/gi, `en ${city} compensa`);
    out = out.replace(/\bCobertura real en\s*$/i, `Cobertura real en ${city}`);
    out = out.replace(/\bCobertura y ubicaci[oó]n operativa en\s*$/i, `Cobertura y ubicación operativa en ${city}`);
  }
  return out;
}

function sanitizeTrustLabel(value: string, city?: string): string {
  const raw = normalizeText(value);
  if (!raw) return '';

  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const replacements: Array<[RegExp, string]> = [
    [/^telefono visible$/i, 'Atención directa'],
    [/^atencion inmediata$/i, 'Respuesta ágil'],
    [/^atencion directa$/i, 'Atención directa'],
    [/^cobertura local$/i, city ? `Cobertura real en ${city}` : 'Cobertura real'],
    [/^faq util$/i, 'Respuestas claras'],
    [/^proceso claro$/i, 'Proceso explicado'],
    [/^presupuesto sin compromiso$/i, 'Presupuesto desglosado'],
    [/^presupuesto claro$/i, 'Presupuesto claro'],
    [/^transparencia total$/i, 'Transparencia desde el inicio'],
    [/^tecnicos cualificados$/i, 'Equipo especializado'],
    [/^equipo especializado$/i, 'Equipo especializado'],
    [/^garantia por escrito$/i, 'Garantía por escrito'],
  ];

  for (const [rx, label] of replacements) {
    if (rx.test(normalized)) return label;
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildFallbackItemBody(title: string, city?: string, niche?: string): string {
  const normalized = normalizeText(title).toLowerCase();
  const place = city ? ` en ${city}` : '';
  const service = niche ? ` de ${niche}` : ' del servicio';

  if (/cobertura|zona|desplazamiento/.test(normalized)) {
    return `Se revisa la cobertura operativa${place}, el desplazamiento y el tipo de acceso antes de confirmar una intervención${service}.`;
  }
  if (/agenda|coordinaci[oó]n|proceso/.test(normalized)) {
    return `Ayuda a ordenar agenda, tiempos de revisión y criterios previos${place} para que la actuación no quede a medias.`;
  }
  if (/validar|confirmar|revisi[oó]n/.test(normalized)) {
    return `Conviene confirmar estado previo, materiales y alcance real${place} antes de desplazar equipo o comprometer una solución incompleta.`;
  }
  if (/garant/i.test(normalized)) {
    return `Se detalla por escrito el alcance del trabajo y qué parte de la intervención queda cubierta cuando corresponde${place}.`;
  }
  if (/proceso|criterio/.test(normalized)) {
    return `El valor está en explicar qué se revisa primero, qué se hará después y qué decisión encaja mejor con el caso${place}.`;
  }

  return `Se explica con criterio técnico qué conviene revisar${place} para resolver el caso sin promesas genéricas ni pasos innecesarios.`;
}

function buildFallbackFaqAnswer(question: string, city?: string, niche?: string): string {
  const q = normalizeText(question).toLowerCase();
  const place = city ? `En ${city}, ` : '';
  const service = niche ? `el servicio de ${niche}` : 'el servicio';

  if (/bomb[ií]n|cerradura/.test(q)) {
    return `${place}la decisión depende del estado del cilindro, del mecanismo completo y de si compensa intervenir solo una pieza o revisar todo el conjunto antes de cerrar el trabajo.`;
  }
  if (/presupuesto|cu[aá]nto influye|precio/.test(q)) {
    return `${place}el presupuesto cambia por el tipo de cierre, la complejidad del acceso y las piezas necesarias, así que ${service} se valora mejor cuando te explican alcance y comprobaciones finales.`;
  }
  if (/llaves|copia/.test(q)) {
    return `${place}lo prudente es valorar riesgo, tipo de puerta y nivel de acceso antes de decidir si basta con cambiar el bombín o si conviene rehacer la configuración del cierre.`;
  }
  if (/antibumping/.test(q)) {
    return `${place}conviene revisar compatibilidad con escudo, puerta y uso real de la instalación antes de decidir si solo se cambia el cilindro o si interesa reforzar más puntos del acceso.`;
  }
  if (/cierre|persiana|local comercial/.test(q)) {
    return `${place}estos casos suelen resolverse mejor separando avería principal, ajustes mecánicos y disponibilidad del local para no multiplicar tiempos muertos.`;
  }

  return `${place}${service} se resuelve mejor cuando se explica qué se revisa primero, qué alternativas hay y qué decisión técnica encaja mejor con el caso real.`;
}

function ensureItemsHaveBodies(items: any[], city?: string, niche?: string): Array<{ title: string; body: string; meta?: string[] }> {
  return asArray(items)
    .map((item: any) => {
      const title = normalizeText(item?.title || item?.label || item?.name);
      if (!title) return null;
      const body = repairLocalPhrase(normalizeText(item?.body), city) || buildFallbackItemBody(title, city, niche);
      const meta = asArray<string>(item?.meta).map((value) => normalizeText(value)).filter(Boolean).slice(0, 4);
      return { title, body, meta };
    })
    .filter(Boolean) as Array<{ title: string; body: string; meta?: string[] }>;
}

function deriveItemsFromH3(section: any, city?: string, niche?: string): Array<{ title: string; body: string; meta?: string[] }> {
  const h3s = asArray<string>(section?.h3s);
  return ensureItemsHaveBodies(
    h3s.filter(Boolean).slice(0, 6).map((title) => ({ title, body: '', meta: [] })),
    city,
    niche
  );
}

function ensureFaqAnswers(items: any[], city?: string, niche?: string): Array<{ question: string; answer: string }> {
  return asArray(items)
    .map((item: any) => {
      const question = normalizeText(item?.question || item?.title);
      if (!question) return null;
      const answer = repairLocalPhrase(normalizeText(item?.answer), city) || buildFallbackFaqAnswer(question, city, niche);
      return { question, answer };
    })
    .filter(Boolean) as Array<{ question: string; answer: string }>;
}

function deriveFaqsFromH3(section: any, city?: string, niche?: string): Array<{ question: string; answer: string }> {
  const h3s = asArray<string>(section?.h3s);
  return ensureFaqAnswers(
    h3s.filter(Boolean).slice(0, 6).map((question) => ({ question, answer: '' })),
    city,
    niche
  );
}

function deriveTrustBullets(section: any, data?: any): string[] {
  const semantic = section?.metadata?.semantic || {};
  const sectionId = section?.section_id || section?.sectionId || 'default';

  const direct = asArray<string>(semantic?.trustBullets || semantic?.bullets).filter(Boolean);
  const globalPool = asArray<string>(data?.intentModel?.mandatoryTrustElements || data?.trustAssets).filter(Boolean);

  const combinedPool = Array.from(
    new Set(
      [...direct, ...globalPool]
        .map((item) => sanitizeTrustLabel(String(item || '').replace(/\s+/g, ' ').trim(), data?.city))
        .map((item) => item.replace(/\s*·\s*[^·]+$/g, '').replace(/[.;:,]+$/g, '').trim())
        .filter(Boolean)
    )
  ).filter((b) => b.length > 2);

  if (combinedPool.length === 0) {
    return [
      data?.city ? `Cobertura real en ${data.city}` : 'Atención local garantizada',
      'Diagnóstico técnico profesional',
      'Garantía por escrito'
    ];
  }

  const salt = sectionId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const rotated = [...combinedPool];
  for (let i = 0; i < salt % rotated.length; i++) {
    rotated.push(rotated.shift()!);
  }

  return rotated.slice(0, 4);
}

function deriveMapNote(section: any, data?: any): string | undefined {
  const semantic = section?.metadata?.semantic || {};
  if (semantic?.mapNote) return repairLocalPhrase(normalizeText(semantic.mapNote), data?.city);

  const city = data?.city || data?.local?.city;
  const niche = data?.niche;
  if (!city && !niche) return undefined;

  const parts = [
    city ? `Trabajamos con cobertura operativa en ${city}` : '',
    niche ? `y desplazamientos adaptados al servicio de ${niche}` : '',
    data?.phone ? '. También puedes confirmar por teléfono la zona exacta antes de reservar.' : '.'
  ].join(' ').replace(/\s+\./g, '.').trim();

  return parts || undefined;
}

function normalizeHeading(section: any, semantic: any, city?: string): string {
  const heading = repairLocalPhrase(normalizeText(section?.h2 || semantic?.heading || ''), city);
  if (/\bCobertura real en\s*$/i.test(heading) && city) return `Cobertura real en ${city}`;
  if (/\bCobertura y ubicaci[oó]n operativa en\s*$/i.test(heading) && city) return `Cobertura y ubicación operativa en ${city}`;
  return heading;
}

export function adaptSectionToBlockInput({ sectionId, section, contract, data, theme }: AdaptBlockInputArgs) {
  const semantic = section?.metadata?.semantic || {};
  const city = data?.city || data?.local?.city;
  const niche = data?.niche;
  const internalLinks =
    section?.metadata?.internalLinks
    || section?.metadata?.links
    || data?.seo?.metadata?.internalLinks
    || [];

  const trustBullets = deriveTrustBullets(section, data);

  const defaultCta = {
    text: semantic?.cta?.text || 'Contactar ahora',
    phone: semantic?.cta?.phone || data?.phone || data?.local?.phone,
    note: semantic?.cta?.note
  };

  const semanticItems = ensureItemsHaveBodies(semantic?.items, city, niche);
  const faqItems = ensureFaqAnswers(semantic?.faqItems, city, niche);

  const content = {
    heading: normalizeHeading(section, semantic, city),
    subheading: asArray<string>(semantic?.intro || semantic?.subheading || [])
      .map((entry) => repairLocalPhrase(normalizeText(entry), city))
      .filter(Boolean),
    items: semanticItems.length ? semanticItems : deriveItemsFromH3(section, city, niche),
    bullets: trustBullets,
    trustBullets,
    faqItems: faqItems.length ? faqItems : deriveFaqsFromH3(section, city, niche),
    table: semantic?.table,
    cta: defaultCta,
    mapNote: deriveMapNote(section, data),
    decisionFactors: asArray(semantic?.decisionFactors),
    commonMistakes: asArray(semantic?.commonMistakes),
    links: asArray(internalLinks),

    h2: section?.h2,
    h3s: section?.h3s,
    html: section?.html || ''
  };

  return {
    sectionId: sectionId || section?.sectionId || section?.id || section?.metadata?.section_id || '',
    blockType: String(section?.blockType || section?.block_type || section?.type || section?.metadata?.block_type || ''),
    variant: contract?.variant || contract?.visualVariant || section?.visual_variant || 'default',
    layoutHint: contract?.sectionPattern || section?.pattern || section?.layout_hint || 'default',
    content,
    seo: {
      ...(data?.seo || {}),
      city: data?.city,
      canonical: data?.seo?.canonical,
      metadata: {
        ...(data?.seo?.metadata || {}),
        internalLinks: asArray(internalLinks)
      }
    },
    design: theme,
    local: {
      city: data?.city,
      niche: data?.niche,
      phone: data?.phone,
      address: data?.local?.address || data?.address,
      businessName: data?.businessName,
      mapEmbedUrl: section?.metadata?.mapEmbedUrl || data?.local?.mapEmbedUrl,
      ctaHref: data?.local?.ctaHref || (data?.phone ? `tel:${data.phone}` : undefined),
      labels: data?.local?.labels || {}
    },
    contract
  };
}
