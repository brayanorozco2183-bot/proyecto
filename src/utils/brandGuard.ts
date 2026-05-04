import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';

export interface BrandGuardOptions {
  niche?: string;
  city?: string;
  fallbackSuffix?: string;
  allowRawBrand?: boolean;
}

export function normalizeBrandText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeRegex(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function titleCaseBrand(value: string): string {
  return normalizeBrandText(value)
    .split(' ')
    .filter(Boolean)
    .map((token) => {
      const lower = token.toLowerCase();
      if (['de', 'del', 'en', 'y', 'la', 'el', 'los', 'las'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function buildCanonicalBrandName(opts: BrandGuardOptions = {}): string {
  const city = normalizeBrandText(opts.city || 'tu zona');
  const niche = titleCaseBrand(
    String(getCanonicalNicheLabel(opts.niche || 'Servicio profesional') || 'Servicio profesional')
      .replace(/^De\s+/i, '')
      .trim(),
  );
  const suffix = normalizeBrandText(opts.fallbackSuffix || 'Pro');
  return `${niche} ${city}${suffix ? ` ${suffix}` : ''}`.replace(/\s{2,}/g, ' ').trim();
}

export function dedupeCityTokens(value: string, city?: string): string {
  const safeCity = normalizeBrandText(city || '');
  let out = normalizeBrandText(value);
  if (!safeCity) return out;
  const cityRx = escapeRegex(safeCity);
  out = out
    .replace(new RegExp(`\\b${cityRx}\\s+${cityRx}\\b`, 'gi'), safeCity)
    .replace(new RegExp(`\\ben\\s+${cityRx}\\s+en\\s+${cityRx}\\b`, 'gi'), `en ${safeCity}`)
    .replace(new RegExp(`\\b${cityRx}\\s+en\\s+${cityRx}\\b`, 'gi'), safeCity)
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}

function looksSeoSyntheticBrand(value: string, nicheLabel: string, city: string): boolean {
  const raw = normalizeBrandText(value);
  if (!raw) return true;

  const comparable = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const comparableNiche = normalizeBrandText(nicheLabel)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const comparableCity = normalizeBrandText(city)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const seoLike =
    comparable.startsWith('de ') ||
    comparable.startsWith('del ') ||
    comparable.includes(' en ') ||
    comparable === comparableNiche ||
    comparable === `${comparableNiche} ${comparableCity}` ||
    comparable.includes(`${comparableCity} en ${comparableCity}`) ||
    /^servicio\b/.test(comparable) ||
    /\b(local|express|master|elite|perfect|seguridad)\b/.test(comparable) && comparable.includes(comparableCity);

  return seoLike;
}

export function sanitizeBrandName(value: string, opts: BrandGuardOptions = {}): string {
  const city = normalizeBrandText(opts.city || '');
  const nicheLabel = titleCaseBrand(String(getCanonicalNicheLabel(opts.niche || 'Servicio profesional') || 'Servicio profesional').replace(/^De\s+/i, '').trim());

  let out = normalizeBrandText(value)
    .replace(/^(?:de|del)\s+/i, '')
    .replace(new RegExp(`\\b(?:en\\s+)?${escapeRegex(city)}\\b`, 'gi'), city ? city : '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  out = dedupeCityTokens(out, city);

  if (!opts.allowRawBrand && looksSeoSyntheticBrand(out, nicheLabel, city)) {
    return buildCanonicalBrandName({ niche: opts.niche, city, fallbackSuffix: opts.fallbackSuffix || 'Pro' });
  }

  out = out
    .replace(new RegExp(`\\b${escapeRegex(city)}\\b`, 'gi'), city)
    .replace(/\s{2,}/g, ' ')
    .trim();

  return titleCaseBrand(out || buildCanonicalBrandName({ niche: opts.niche, city, fallbackSuffix: opts.fallbackSuffix || 'Pro' }));
}

export function repairBrokenLocalFragments(value: string, city?: string): string {
  const safeCity = normalizeBrandText(city || '');
  if (!safeCity) return normalizeBrandText(value);
  let out = normalizeBrandText(value)
    .replace(/\bEn\s*,/g, `En ${safeCity},`)
    .replace(/\ben\s+compensa\b/gi, `en ${safeCity} compensa`)
    .replace(/\bCobertura real en\b(?!\s+[A-ZÁÉÍÓÚÑa-záéíóúñ])/g, `Cobertura real en ${safeCity}`)
    .replace(/\bidentidad visible de\s*,/gi, `identidad visible de ${safeCity},`)
    .replace(/\breputaci[oó]n s[oó]lida en\s*\./gi, `reputación sólida en ${safeCity}.`);

  const majorCities = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Zaragoza', 'Malaga', 'Granada', 'Alicante', 'Murcia'];
  majorCities.forEach(c => {
    if (safeCity.toLowerCase() !== c.toLowerCase()) {
      out = out.replace(new RegExp(`\\b${c}\\b`, 'gi'), safeCity);
    }
  });

  return out.replace(/\s{2,}/g, ' ').trim();
}
