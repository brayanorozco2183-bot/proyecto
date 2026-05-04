export function normalizeForNicheMatch(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s-]/g, ' ')
    .replace(/[\s-]+/g, ' ')
    .trim();
}

export function uniqueClean(values: readonly unknown[], limit = 24): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const key = normalizeForNicheMatch(text);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= limit) break;
  }

  return output;
}

export function containsAny(source: string, needles: readonly string[]): boolean {
  const normalizedSource = normalizeForNicheMatch(source);
  return needles.some((needle) => {
    const normalizedNeedle = normalizeForNicheMatch(needle);
    return normalizedNeedle.length >= 3 && normalizedSource.includes(normalizedNeedle);
  });
}
