export function normalizeText(input: any): string {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeKey(input: any): string {
  return normalizeText(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashString(input: string): string {
  let hash = 2166136261;
  const text = String(input || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export function firstWords(input: string, maxWords = 16): string {
  const normalized = normalizeText(input);
  if (!normalized) return '';
  return normalized.split(' ').slice(0, maxWords).join(' ');
}

export function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function uniqueStrings(items: any[], limit = 999): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items || []) {
    const text = normalizeText(item);
    if (!text) continue;
    const key = normalizeKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

export function excerptText(input: string, max = 260): string {
  const clean = stripHtml(input);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}
