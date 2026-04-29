// Adapta la salida enriquecida del pipeline a la forma que esperan los renderers premium.
// Ajusta imports/rutas según tu repo.
import { buildNicheIntelligenceProfile, type NicheIntelligenceProfile } from '../niche-intelligence/index.js';

export interface AdaptBlockInputArgs {
  sectionId: string;
  section: any;
  contract?: any;
  data?: any;
  theme?: any;
  nicheProfile?: NicheIntelligenceProfile;
}

const SHARED_NICHE_PROFILE_KEY = '__gravityNicheIntelligenceProfile';
const SHARED_NICHE_PROFILE_CACHE = new Map<string, NicheIntelligenceProfile>();

function asArray<T = any>(value: any): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}


function buildProfileCacheKey(data: any, city?: string, niche?: string, localAreas: string[] = []): string {
  return JSON.stringify({
    niche: normalizeText(niche || data?.niche || data?.local?.niche),
    city: normalizeText(city || data?.city || data?.local?.city),
    intent: normalizeText(data?.intent || data?.intentModel?.intent || data?.intentModel?.pageType),
    businessName: normalizeText(data?.businessName || data?.local?.businessName),
    localAreas: localAreas.slice(0, 10).map(normalizeText).filter(Boolean).sort()
  });
}

function getSharedNicheProfile(params: {
  data?: any;
  section?: any;
  city?: string;
  niche?: string;
  localAreas?: string[];
  explicitProfile?: NicheIntelligenceProfile;
}): NicheIntelligenceProfile {
  const { data, section, city, niche, localAreas = [], explicitProfile } = params;
  const existing = explicitProfile
    || data?.nicheProfile
    || data?.missionContext?.nicheProfile
    || data?.runtimeContext?.nicheProfile
    || data?.[SHARED_NICHE_PROFILE_KEY];

  if (existing?.vertical && existing?.technicalVocabulary) return existing as NicheIntelligenceProfile;

  const key = buildProfileCacheKey(data, city, niche, localAreas);
  const cached = SHARED_NICHE_PROFILE_CACHE.get(key);
  if (cached) {
    if (data && typeof data === 'object') {
      try { Object.defineProperty(data, SHARED_NICHE_PROFILE_KEY, { value: cached, enumerable: false, configurable: true }); } catch {}
    }
    return cached;
  }

  const pageSeed = [
    data?.h1,
    data?.title,
    data?.seo?.title,
    data?.seo?.metaDescription,
    data?.intentModel?.primaryIntent,
    data?.intentModel?.summary,
    data?.research?.summary,
    data?.strategicContext?.summary,
    section?.metadata?.pageSeed
  ].map(normalizeText).filter(Boolean).join(' ');

  const profile = buildNicheIntelligenceProfile({
    niche,
    city,
    intent: data?.intent || data?.intentModel?.intent || data?.intentModel?.pageType || section?.metadata?.intent,
    localAreas,
    businessName: data?.businessName,
    seedText: pageSeed
  });

  SHARED_NICHE_PROFILE_CACHE.set(key, profile);
  if (data && typeof data === 'object') {
    try { Object.defineProperty(data, SHARED_NICHE_PROFILE_KEY, { value: profile, enumerable: false, configurable: true }); } catch {}
  }
  return profile;
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

function normalizeNicheLabel(niche?: string): string {
  const value = normalizeText(niche || 'servicio especializado');
  return value || 'servicio especializado';
}

function collectLocalSignals(section: any, data?: any): string[] {
  const semantic = section?.metadata?.semantic || {};
  const pools = [
    semantic?.localEntities,
    semantic?.zones,
    semantic?.neighborhoods,
    data?.localEntities,
    data?.neighborhoods,
    data?.geoData?.neighborhoods,
    data?.research?.geoData?.neighborhoods,
    data?.local?.neighborhoods,
    data?.intentModel?.localEntities,
    data?.intentModel?.neighborhoods
  ];

  return Array.from(
    new Set(
      pools
        .flatMap((pool) => asArray<any>(pool))
        .map((item: any) => normalizeText(item?.label || item?.name || item))
        .filter((item) => item.length > 2)
    )
  ).slice(0, 6);
}

function buildLocalProofItemBody(title: string, city?: string, niche?: string, index = 0): string {
  const place = city ? ` en ${city}` : '';
  const service = normalizeNicheLabel(niche);
  const normalizedTitle = normalizeText(title);
  const opening = normalizedTitle
    ? `Caso de referencia en ${normalizedTitle}`
    : `Caso de referencia${place}`;

  const patterns = [
    `${opening}: antes de confirmar el trabajo se contrasta el síntoma, el acceso, el alcance real y los materiales necesarios para evitar una solución genérica de ${service}.`,
    `${opening}: se valida la información local, la franja de intervención y el criterio técnico antes de prometer una actuación cerrada${place}.`,
    `${opening}: el equipo ordena diagnóstico, presupuesto y comprobaciones finales para que la decisión no dependa solo de rapidez o precio.`
  ];

  return patterns[index % patterns.length];
}

function ensureLocalProofItems(
  items: Array<{ title: string; body: string; meta?: string[] }>,
  section: any,
  data: any,
  city?: string,
  niche?: string
): Array<{ title: string; body: string; meta?: string[] }> {
  const localSignals = collectLocalSignals(section, data);
  const service = normalizeNicheLabel(niche);
  const enriched = items.map((item, index) => {
    const body = normalizeText(item.body);
    if (body.length >= 120 && /diagn[oó]stico|revisi[oó]n|criterio|presupuesto|alcance|comprob/i.test(body)) {
      return item;
    }
    return {
      ...item,
      body: body
        ? `${body} Se completa con diagnóstico previo, alcance claro y comprobación final para que el servicio de ${service} no quede en una promesa genérica.`
        : buildLocalProofItemBody(item.title, city, niche, index),
      meta: item.meta?.length ? item.meta : [city ? `Cobertura ${city}` : 'Cobertura local']
    };
  });

  if (enriched.length >= 3) return enriched.slice(0, 6);

  const generated = localSignals.length
    ? localSignals.map((label, index) => ({
        title: `Referencia operativa: ${label}`,
        body: buildLocalProofItemBody(label, city, niche, index),
        meta: [city ? `Zona de ${city}` : 'Zona local']
      }))
    : [
        {
          title: city ? `Coordinación real en ${city}` : 'Coordinación local real',
          body: `Se revisa disponibilidad, alcance y criterios técnicos antes de confirmar una intervención de ${service}, evitando mensajes de cobertura sin respaldo operativo.`,
          meta: ['Cobertura verificada']
        },
        {
          title: 'Diagnóstico documentado',
          body: `El caso se ordena con síntomas, materiales implicados, riesgos y decisión recomendada antes de ejecutar el trabajo o sustituir elementos.`,
          meta: ['Criterio técnico']
        },
        {
          title: 'Cierre de servicio comprobado',
          body: `Al terminar se repasan funcionamiento, limitaciones y siguientes pasos para que el resultado no dependa de una garantía genérica.`,
          meta: ['Comprobación final']
        }
      ];

  return [...enriched, ...generated].slice(0, 6);
}

function buildDefaultCtaText(niche?: string, profile?: NicheIntelligenceProfile): string {
  if (profile?.preferredCtas?.length) return profile.preferredCtas[0];
  const normalized = normalizeNicheLabel(niche).toLowerCase();
  if (/urgencia|24|cerraj|fontaner|electric|aver[ií]a|reparaci[oó]n/.test(normalized)) {
    return 'Pedir diagnóstico previo';
  }
  if (/reforma|pintor|carpinter|instalaci[oó]n|diseño|medici[oó]n/.test(normalized)) {
    return 'Solicitar valoración técnica';
  }
  return 'Solicitar orientación técnica';
}

function buildDefaultCtaNote(niche?: string, city?: string, profile?: NicheIntelligenceProfile): string {
  const service = normalizeNicheLabel(niche);
  const place = city ? ` en ${city}` : '';
  const criterion = profile?.decisionCriteria?.[0] || 'estado actual';
  const trust = profile?.trustAssets?.[0] || 'diagnóstico previo';
  return `Cuéntanos el caso, ubicación${place}, urgencia y ${criterion} para orientar el alcance con ${trust} antes de intervenir en ${service}.`;
}

function buildFallbackItemBody(title: string, city?: string, niche?: string, profile?: NicheIntelligenceProfile): string {
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

  const technicalTerm = profile?.technicalVocabulary?.[0];
  const decision = profile?.decisionCriteria?.[0];
  if (technicalTerm || decision) {
    return `Se explica con criterio técnico qué conviene revisar${place}, incluyendo ${technicalTerm || 'los elementos clave'} y ${decision || 'el alcance real'}, para resolver el caso sin promesas genéricas ni pasos innecesarios.`;
  }

  return `Se explica con criterio técnico qué conviene revisar${place} para resolver el caso sin promesas genéricas ni pasos innecesarios.`;
}

function buildFallbackFaqAnswer(question: string, city?: string, niche?: string, profile?: NicheIntelligenceProfile): string {
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

  const objection = profile?.buyerObjections?.[0] || 'la duda principal del cliente';
  const criterion = profile?.decisionCriteria?.[0] || 'el alcance real';
  return `${place}${service} se resuelve mejor cuando se explica qué se revisa primero, qué alternativas hay y qué decisión técnica encaja mejor con ${criterion}, especialmente si existe ${objection}.`;
}

function ensureItemsHaveBodies(items: any[], city?: string, niche?: string, profile?: NicheIntelligenceProfile): Array<{ title: string; body: string; meta?: string[] }> {
  return asArray(items)
    .map((item: any) => {
      const title = normalizeText(item?.title || item?.label || item?.name);
      if (!title) return null;
      const body = repairLocalPhrase(normalizeText(item?.body), city) || buildFallbackItemBody(title, city, niche, profile);
      const meta = asArray<string>(item?.meta).map((value) => normalizeText(value)).filter(Boolean).slice(0, 4);
      return { title, body, meta };
    })
    .filter(Boolean) as Array<{ title: string; body: string; meta?: string[] }>;
}

function deriveItemsFromH3(section: any, city?: string, niche?: string, profile?: NicheIntelligenceProfile): Array<{ title: string; body: string; meta?: string[] }> {
  const h3s = asArray<string>(section?.h3s);
  return ensureItemsHaveBodies(
    h3s.filter(Boolean).slice(0, 6).map((title) => ({ title, body: '', meta: [] })),
    city,
    niche,
    profile
  );
}

function ensureFaqAnswers(items: any[], city?: string, niche?: string, profile?: NicheIntelligenceProfile): Array<{ question: string; answer: string }> {
  return asArray(items)
    .map((item: any) => {
      const question = normalizeText(item?.question || item?.title);
      if (!question) return null;
      const answer = repairLocalPhrase(normalizeText(item?.answer), city) || buildFallbackFaqAnswer(question, city, niche, profile);
      return { question, answer };
    })
    .filter(Boolean) as Array<{ question: string; answer: string }>;
}

function deriveFaqsFromH3(section: any, city?: string, niche?: string, profile?: NicheIntelligenceProfile): Array<{ question: string; answer: string }> {
  const h3s = asArray<string>(section?.h3s);
  return ensureFaqAnswers(
    h3s.filter(Boolean).slice(0, 6).map((question) => ({ question, answer: '' })),
    city,
    niche,
    profile
  );
}

function deriveTrustBullets(section: any, data?: any, profile?: NicheIntelligenceProfile): string[] {
  const semantic = section?.metadata?.semantic || {};
  const sectionId = section?.section_id || section?.sectionId || 'default';

  const direct = asArray<string>(semantic?.trustBullets || semantic?.bullets).filter(Boolean);
  const globalPool = asArray<string>(data?.intentModel?.mandatoryTrustElements || data?.trustAssets).filter(Boolean);

  const combinedPool = Array.from(
    new Set(
      [...direct, ...globalPool, ...(profile?.trustAssets || [])]
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

function deriveMapNote(section: any, data?: any, profile?: NicheIntelligenceProfile): string | undefined {
  const semantic = section?.metadata?.semantic || {};
  if (semantic?.mapNote) return repairLocalPhrase(normalizeText(semantic.mapNote), data?.city);

  const city = data?.city || data?.local?.city;
  const niche = data?.niche;
  if (!city && !niche) return undefined;

  const parts = [
    city ? `Trabajamos con cobertura operativa en ${city}` : '',
    niche ? `y desplazamientos adaptados al servicio de ${niche}` : '',
    profile?.localModifiers?.[0] ? `con ${profile.localModifiers[0]} revisada antes de confirmar` : '',
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

export function adaptSectionToBlockInput({ sectionId, section, contract, data, theme, nicheProfile: explicitNicheProfile }: AdaptBlockInputArgs) {
  const semantic = section?.metadata?.semantic || {};
  const city = data?.city || data?.local?.city;
  const niche = data?.niche;
  const localAreas = collectLocalSignals(section, data);
  const nicheProfile = getSharedNicheProfile({
    data,
    section,
    city,
    niche,
    localAreas,
    explicitProfile: explicitNicheProfile
  });
  const internalLinks =
    section?.metadata?.internalLinks
    || section?.metadata?.links
    || data?.seo?.metadata?.internalLinks
    || [];

  const blockType = String(section?.blockType || section?.block_type || section?.type || section?.metadata?.block_type || '');
  const trustBullets = deriveTrustBullets(section, data, nicheProfile);

  const defaultCta = {
    text: semantic?.cta?.text || buildDefaultCtaText(niche, nicheProfile),
    phone: semantic?.cta?.phone || data?.phone || data?.local?.phone,
    note: semantic?.cta?.note || buildDefaultCtaNote(niche, city, nicheProfile)
  };

  const semanticItems = ensureItemsHaveBodies(semantic?.items, city, niche, nicheProfile);
  const derivedItems = semanticItems.length ? semanticItems : deriveItemsFromH3(section, city, niche, nicheProfile);
  const blockItems = blockType === 'local_proof'
    ? ensureLocalProofItems(derivedItems, section, data, city, niche)
    : derivedItems;
  const faqItems = ensureFaqAnswers(semantic?.faqItems, city, niche, nicheProfile);

  const content = {
    heading: normalizeHeading(section, semantic, city),
    subheading: asArray<string>(semantic?.intro || semantic?.subheading || [`${nicheProfile.verticalLabel}: ${nicheProfile.tone}. Se priorizan ${nicheProfile.decisionCriteria.slice(0, 2).join(' y ')} antes de recomendar una solución.`])
      .map((entry) => repairLocalPhrase(normalizeText(entry), city))
      .filter(Boolean),
    items: blockItems,
    bullets: trustBullets,
    trustBullets,
    faqItems: faqItems.length ? faqItems : deriveFaqsFromH3(section, city, niche, nicheProfile),
    table: semantic?.table,
    cta: defaultCta,
    mapNote: deriveMapNote(section, data, nicheProfile),
    decisionFactors: asArray(semantic?.decisionFactors),
    commonMistakes: asArray(semantic?.commonMistakes),
    links: asArray(internalLinks),

    h2: section?.h2,
    h3s: section?.h3s,
    html: section?.html || ''
  };

  return {
    sectionId: sectionId || section?.sectionId || section?.id || section?.metadata?.section_id || '',
    blockType,
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
    nicheProfile,
    contract
  };
}
