export interface ResearchDecision<T = any> {
  accepted: T[];
  rejected: Array<T & { research_score?: number; research_reason?: string }>;
}

export interface ResearchQualitySummary {
  qualityConfidence: 'low' | 'medium' | 'high';
  acceptedOrganicCount: number;
  acceptedAuditCount: number;
  rejectedOrganicCount: number;
  rejectedAuditCount: number;
  geoSignalCount: number;
  notes: string[];
}

const DIRECTORY_HOST_PATTERNS = [
  'wallapop', 'habitissimo', 'houzz', 'pinterest', 'paginasamarillas', 'milanuncios', 'cronoshare', 'yelp',
  'trustpilot', 'pronto-pro', 'instaladores', 'portal', 'directorios',
];
const MESSAGING_HOST_PATTERNS = ['wa.link', 'whatsapp.com', 'api.whatsapp.com', 't.me', 'telegram.me'];
const SOCIAL_HOST_PATTERNS = ['facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'x.com', 'twitter.com', 'tiktok.com'];
const BANNED_HOST_PATTERNS = ['schema.org', 'w3.org', 'facebook.com', 'instagram.com'];

const CITY_SIGNAL_LEXICON = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'malaga', 'murcia', 'alicante', 'bilbao', 'valladolid',
  'cordoba', 'granada', 'vigo', 'gijon', 'oviedo', 'santander', 'pamplona', 'toledo', 'getafe', 'mostoles', 'leganes',
  'parla', 'fuenlabrada', 'alcorcon', 'alcala-de-henares', 'valdemoro', 'pinto', 'pozuelo', 'majadahonda', 'las-rozas'
];

const FAMILY_SIGNAL_MAP: Record<string, RegExp[]> = {
  cerrajeros: [/\b(apertura|cerradura|bombin|bomb[ií]n|cilindro|antibumping|llave|escudo|cerrojo|amaestramiento)\b/i],
  fontaneros: [/\b(fuga|tuberia|tuber[ií]a|grifo|desatasco|cisterna|sifon|sif[oó]n|bajante|caldera)\b/i],
  electricistas: [/\b(cuadro electrico|cuadro el[eé]ctrico|enchufe|cableado|iluminacion|iluminaci[oó]n|boletin|bolet[ií]n|diferencial)\b/i],
  carpinteros: [/\b(muebles? a medida|armarios? empotrados?|vestidores?|melamina|madera maciza|herrajes|bisagras|barnizado|lacado|tarima|parqu[eé]|ebanister[ií]a|puertas? de interior)\b/i],
  pintores: [/\b(pintura|barniz|esmalte|lacado|fachada|alisar|gotel[eé]|imprimaci[oó]n)\b/i],
  persianas: [/\b(persiana|estor|lama|motor|guia|gu[ií]a|cierre metalico|cierre met[aá]lico)\b/i],
};

export function normalizeResearchText(value: any): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeResearchUrl(raw: string): string {
  try {
    const url = new URL(String(raw || '').trim().replace(/[).,;]+$/, ''));
    url.hash = '';
    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    return `${url.protocol}//${url.host}${pathname}${url.search}`;
  } catch {
    return String(raw || '').trim();
  }
}

export function slugifyResearch(value: string): string {
  return normalizeResearchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function getHost(value: string): string {
  try {
    return new URL(normalizeResearchUrl(value)).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function detectServiceFamily(value: string): string | null {
  const normalized = slugifyResearch(value);
  if (!normalized) return null;

  const families: Array<[string, RegExp]> = [
    ['cerrajeros', /cerraj|cerradur|bombin|cilindr|antibumping|llave|candado/],
    ['fontaneros', /fontan|plomer|desatas|tuber|fuga|grifo/],
    ['electricistas', /electric|cuadro-electrico|enchufe|cableado|iluminacion/],
    ['carpinteros', /carpint|ebanist|madera|armario|puerta-de-madera|tarima/],
    ['pintores', /pintor|pintura|barniz|lacado|fachada|decor/],
    ['persianas', /persiana|estor|cierre-metalico/],
  ];

  for (const [family, pattern] of families) {
    if (pattern.test(normalized)) return family;
  }
  return null;
}

export function hasForeignCitySignal(raw: string, city: string): boolean {
  const haystack = slugifyResearch(raw);
  const target = slugifyResearch(city);
  if (!haystack || !target) return false;
  return CITY_SIGNAL_LEXICON.some((candidate) => candidate !== target && haystack.includes(candidate));
}

export function classifyResearchHost(rawUrl: string): 'business_site' | 'directory' | 'marketplace' | 'messaging' | 'social' | 'banned' | 'unknown' {
  const host = getHost(rawUrl);
  if (!host) return 'unknown';
  if (BANNED_HOST_PATTERNS.some((item) => host === item || host.endsWith(`.${item}`))) return 'banned';
  if (MESSAGING_HOST_PATTERNS.some((item) => host === item || host.endsWith(`.${item}`))) return 'messaging';
  if (SOCIAL_HOST_PATTERNS.some((item) => host === item || host.endsWith(`.${item}`))) return 'social';
  if (DIRECTORY_HOST_PATTERNS.some((item) => host.includes(item))) return host.includes('milanuncios') ? 'marketplace' : 'directory';
  return 'business_site';
}

export function isBannedResearchUrl(rawUrl: string): boolean {
  const normalized = normalizeResearchUrl(rawUrl);
  if (!normalized) return true;
  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();
    if (/(^|\.)google\./.test(host)) return true;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) return true;
    if (classifyResearchHost(normalized) === 'banned') return true;
    if (/\.pdf(?:$|[?#])/.test(pathname)) return true;
    if (/\/(trabajo|empleo|jobs?|oferta(?:s)?|career|careers|download|pdf)\b/.test(`${pathname}${url.search.toLowerCase()}`)) return true;
    return false;
  } catch {
    return true;
  }
}

function scoreHost(rawUrl: string): number {
  switch (classifyResearchHost(rawUrl)) {
    case 'business_site': return 18;
    case 'directory': return -14;
    case 'marketplace': return -18;
    case 'messaging': return -30;
    case 'social': return -24;
    default: return 0;
  }
}

function scoreContentMatch(text: string, niche: string, city: string): number {
  const normalized = normalizeResearchText(text);
  const nicheFamily = detectServiceFamily(niche);
  let score = 0;
  if (!normalized) return score;

  const family = detectServiceFamily(normalized);
  if (nicheFamily && family && nicheFamily === family) score += 16;
  if (nicheFamily && family && nicheFamily !== family) score -= 26;

  const normalizedCity = normalizeResearchText(city);
  const slugCity = slugifyResearch(city);
  if (normalizedCity && normalized.includes(normalizedCity)) score += 10;
  if (slugCity && normalized.includes(slugCity)) score += 4;
  if (hasForeignCitySignal(normalized, city)) score -= 16;

  const familySignals = nicheFamily ? (FAMILY_SIGNAL_MAP[nicheFamily] || []) : [];
  if (familySignals.some((pattern) => pattern.test(normalized))) score += 10;

  if (/\b(24h|urgente|hoy|inmediato)\b/.test(normalized)) {
    score += nicheFamily === 'cerrajeros' || nicheFamily === 'persianas' ? 6 : 1;
  }

  if (/\b(contacto|blog|sobre nosotros|aviso legal|cookies|privacidad)\b/.test(normalized)) score -= 4;
  if (/\b(trabajo|empleo|vacante|curriculum|bolsa de trabajo)\b/.test(normalized)) score -= 20;
  if (/\b(facebook|instagram|linkedin|whatsapp|telegram|youtube|tiktok)\b/.test(normalized)) score -= 18;
  if (/\b(opiniones|resenas|reseñas)\b/.test(normalized) && nicheFamily && nicheFamily !== 'cerrajeros') score -= 2;
  return score;
}

export function prepareCompetitorTargets(rawUrls: string[], niche: string, city: string, limit = 10): string[] {
  const deduped = uniqueByKey(
    (rawUrls || [])
      .map((url) => ({ original: url, url: normalizeResearchUrl(url) }))
      .filter((item) => item.url && !isBannedResearchUrl(item.url)),
    (item) => item.url,
  );

  const scored = deduped
    .map((item) => ({
      ...item,
      score: scoreHost(item.url) + scoreContentMatch(item.url, niche, city),
    }))
    .filter((item) => item.score > -10)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.url);
}

export function scoreOrganicResult(result: any, niche: string, city: string): number {
  const link = normalizeResearchUrl(result?.link || '');
  const title = String(result?.title || '');
  const snippet = String(result?.snippet || '');
  if (!link || isBannedResearchUrl(link)) return -100;

  let score = 0;
  score += scoreHost(link);
  score += scoreContentMatch(`${title} ${snippet}`, niche, city);
  if (title && title.length >= 6) score += 4;
  if (snippet && snippet.length >= 30) score += 3;
  if (/^resultado sdi/i.test(title.trim())) score -= 6;
  return score;
}

export function filterUsefulOrganicResults(results: any[], niche: string, city: string, limit = 10): ResearchDecision<any> {
  const scored = uniqueByKey((results || []).map((result) => {
    const link = normalizeResearchUrl(result?.link || '');
    return { ...result, link, research_score: scoreOrganicResult({ ...result, link }, niche, city) };
  }).filter((result) => result.link), (result) => result.link)
    .sort((a, b) => Number(b.research_score || 0) - Number(a.research_score || 0));

  const accepted = scored.filter((result) => Number(result.research_score || 0) >= -4).slice(0, limit);
  const rejected = scored.filter((result) => !accepted.includes(result)).map((result) => ({
    ...result,
    research_reason: classifyResearchHost(result.link),
  }));
  return { accepted, rejected };
}

export function scoreCompetitorAudit(audit: any, niche: string, city: string): number {
  const url = normalizeResearchUrl(audit?.url || '');
  if (!url || isBannedResearchUrl(url)) return -100;

  const title = String(audit?.title || '');
  const headings = [
    ...(Array.isArray(audit?.h1s) ? audit.h1s : []),
    ...(Array.isArray(audit?.h2s) ? audit.h2s : []),
    ...(Array.isArray(audit?.h3s) ? audit.h3s : []),
  ].join(' ');
  const wordCount = Number(audit?.wordCount || 0);

  let score = 0;
  score += scoreHost(url);
  score += scoreContentMatch(`${title} ${headings} ${url}`, niche, city);
  if (wordCount >= 1400) score += 16;
  else if (wordCount >= 700) score += 10;
  else if (wordCount >= 350) score += 4;
  else if (wordCount > 0) score -= 12;
  if ((audit?.h1s || []).length > 0) score += 4;
  if ((audit?.h2s || []).length >= 2) score += 4;
  if ((audit?.internalLinks || 0) > 0) score += 2;
  if (/(compartir en whatsapp|whatsapp|chat)/i.test(`${title} ${headings}`)) score -= 25;
  return score;
}

export function filterUsefulCompetitorAudits(audits: any[], niche: string, city: string, limit = 4): ResearchDecision<any> {
  const scored = uniqueByKey((audits || []).map((audit) => {
    const url = normalizeResearchUrl(audit?.url || '');
    const score = scoreCompetitorAudit({ ...audit, url }, niche, city);
    return { ...audit, url, research_score: score, research_reason: classifyResearchHost(url) };
  }).filter((audit) => audit.url), (audit) => audit.url)
    .sort((a, b) => Number(b.research_score || 0) - Number(a.research_score || 0));

  const accepted = scored.filter((audit) => Number(audit.research_score || 0) >= 10).slice(0, limit);
  const rejected = scored.filter((audit) => !accepted.includes(audit));
  return {
    accepted: accepted.length ? accepted : scored.slice(0, Math.min(limit, scored.length)).filter((audit) => Number(audit.research_score || 0) > -30),
    rejected,
  };
}

export function extractLocalSignalsFromGeo(geoData: any): string[] {
  const items = [
    ...((geoData?.neighborhoods || []) as string[]),
    ...((geoData?.sub_locations || []) as Array<{ name?: string }>).map((item) => item?.name || ''),
  ].map((item) => String(item || '').trim()).filter(Boolean);
  return uniqueByKey(items, (item) => normalizeResearchText(item)).slice(0, 12);
}

export function buildResearchQualitySummary(input: {
  acceptedOrganic: any[];
  rejectedOrganic?: any[];
  acceptedAudits: any[];
  rejectedAudits?: any[];
  geoSignals?: string[];
}): ResearchQualitySummary {
  const acceptedOrganicCount = (input.acceptedOrganic || []).length;
  const acceptedAuditCount = (input.acceptedAudits || []).length;
  const rejectedOrganicCount = (input.rejectedOrganic || []).length;
  const rejectedAuditCount = (input.rejectedAudits || []).length;
  const geoSignalCount = (input.geoSignals || []).length;

  let qualityConfidence: 'low' | 'medium' | 'high' = 'low';
  if (acceptedOrganicCount >= 5 && acceptedAuditCount >= 3 && geoSignalCount >= 3) qualityConfidence = 'high';
  else if (acceptedOrganicCount >= 3 && acceptedAuditCount >= 2) qualityConfidence = 'medium';

  const notes: string[] = [];
  if (acceptedAuditCount < 3) notes.push('RESEARCH_THIN_AUDITS');
  if (geoSignalCount === 0) notes.push('GEO_SIGNALS_MISSING');
  if (rejectedOrganicCount > acceptedOrganicCount) notes.push('SERP_NOISE_HIGH');
  if (rejectedAuditCount > acceptedAuditCount) notes.push('AUDIT_REJECTION_HIGH');

  return {
    qualityConfidence,
    acceptedOrganicCount,
    acceptedAuditCount,
    rejectedOrganicCount,
    rejectedAuditCount,
    geoSignalCount,
    notes,
  };
}
