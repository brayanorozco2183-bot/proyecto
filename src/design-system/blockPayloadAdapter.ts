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

function deriveItemsFromH3(section: any): Array<{ title: string; body: string; meta?: string[] }> {
  const h3s = asArray<string>(section?.h3s);
  return h3s
    .filter(Boolean)
    .slice(0, 6)
    .map((title) => ({
      title,
      body: '',
      meta: []
    }));
}

function deriveFaqsFromH3(section: any): Array<{ question: string; answer: string }> {
  const h3s = asArray<string>(section?.h3s);
  return h3s
    .filter(Boolean)
    .slice(0, 6)
    .map((question) => ({ question, answer: '' }));
}

function deriveTrustBullets(section: any, data?: any): string[] {
  const semantic = section?.metadata?.semantic || {};
  const sectionId = section?.section_id || section?.sectionId || 'default';
  
  // 1. Recolectar todas las fuentes posibles de señales
  const direct = asArray<string>(semantic?.trustBullets || semantic?.bullets).filter(Boolean);
  const globalPool = asArray<string>(data?.intentModel?.mandatoryTrustElements || data?.trustAssets).filter(Boolean);
  
  // 2. Crear un pool único y limpio
  const combinedPool = Array.from(new Set([...direct, ...globalPool])).filter(b => b.length > 2);

  // 3. Si no hay nada, usar fallback básico
  if (combinedPool.length === 0) {
    return [
        data?.city ? `Cobertura real en ${data.city}` : 'Atención local garantizada',
        'Diagnóstico técnico profesional',
        'Garantía por escrito'
    ];
  }

  // 4. Aplicar rotación determinista basada en el ID de la sección
  const salt = sectionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rotated = [...combinedPool];
  for (let i = 0; i < salt % rotated.length; i++) {
      rotated.push(rotated.shift()!);
  }

  return rotated.slice(0, 4);
}

function deriveMapNote(section: any, data?: any): string | undefined {
  const semantic = section?.metadata?.semantic || {};
  if (semantic?.mapNote) return semantic.mapNote;

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

export function adaptSectionToBlockInput({ sectionId, section, contract, data, theme }: AdaptBlockInputArgs) {
  const semantic = section?.metadata?.semantic || {};
  const internalLinks = section?.metadata?.internalLinks || data?.seo?.metadata?.internalLinks || [];
  const trustBullets = deriveTrustBullets(section, data);

  const defaultCta = {
    text: semantic?.cta?.text || 'Contactar ahora',
    phone: semantic?.cta?.phone || data?.phone || data?.local?.phone,
    note: semantic?.cta?.note
  };

  const content = {
    // forma nueva esperada por los componentes
    heading: section?.h2 || semantic?.heading || '',
    subheading: semantic?.intro || semantic?.subheading || [],
    items: semantic?.items || deriveItemsFromH3(section),
    bullets: trustBullets,
    trustBullets,
    faqItems: semantic?.faqItems || deriveFaqsFromH3(section),
    table: semantic?.table,
    cta: defaultCta,
    mapNote: deriveMapNote(section, data),
    decisionFactors: semantic?.decisionFactors || [],
    commonMistakes: semantic?.commonMistakes || [],
    links: internalLinks,

    // compatibilidad hacia atrás
    h2: section?.h2,
    h3s: section?.h3s,
    html: section?.html || ''
  };

  return {
    sectionId,
    blockType: String(section?.blockType || section?.block_type || ''),
    variant: contract?.variant || contract?.visualVariant || section?.visual_variant || 'default',
    layoutHint: contract?.sectionPattern || section?.pattern || section?.layout_hint || 'default',
    content,
    seo: {
      ...(data?.seo || {}),
      city: data?.city,
      canonical: data?.seo?.canonical,
      metadata: {
        ...(data?.seo?.metadata || {}),
        internalLinks
      }
    },
    design: theme,
    local: {
      city: data?.city,
      niche: data?.niche,
      phone: data?.phone,
      businessName: data?.businessName,
      mapEmbedUrl: section?.metadata?.mapEmbedUrl || data?.local?.mapEmbedUrl,
      ctaHref: data?.local?.ctaHref || (data?.phone ? `tel:${data.phone}` : undefined),
      labels: data?.local?.labels || {}
    },
    contract
  };
}