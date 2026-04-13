export function stableHash(input: string): number {
    let hash = 2166136261;

    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

export function buildSeed(...parts: Array<string | number | undefined | null>): string {
    return parts
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
        .map((v) => String(v).trim())
        .join('::');
}

export function pickSeeded<T>(items: T[], seed: string): T {
    if (!items.length) {
        throw new Error('pickSeeded recibió un array vacío.');
    }

    const index = stableHash(seed) % items.length;
    return items[index];
}

export function rotateSeeded<T>(items: T[], seed: string): T[] {
    if (!items.length) return [];

    const offset = stableHash(seed) % items.length;
    return items.slice(offset).concat(items.slice(0, offset));
}

export function uniqueStrings(values: Array<string | undefined | null>): string[] {
    return [...new Set(values.filter((v): v is string => !!v && !!String(v).trim()).map((v) => String(v).trim()))];
}