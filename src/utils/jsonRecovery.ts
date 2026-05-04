export function safeJsonParse<T>(raw: string, fallback: T): T {
    if (!raw || typeof raw !== 'string') return fallback;

    let clean = raw.trim();

    if (clean.includes('```json')) {
        clean = clean.split('```json')[1]?.split('```')[0]?.trim() || clean;
    } else if (clean.includes('```')) {
        clean = clean.split('```')[1]?.trim() || clean;
    }

    let parsed: any;
    try {
        parsed = JSON.parse(clean);
    } catch {
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const maybeJson = clean.slice(firstBrace, lastBrace + 1);
            try {
                parsed = JSON.parse(maybeJson);
            } catch {
                return fallback;
            }
        } else {
            return fallback;
        }
    }

    // --- AUTO UNWRAP ---
    // Some LLMs wrap the object in a root key matching the type name or 'data'
    const rootKeys = ['sectionSemanticData', 'data', 'response', 'content', 'section'];
    for (const key of rootKeys) {
        if (parsed && typeof parsed === 'object' && parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
            console.log(`[JSON_RECOVERY] Unwrapping root key: "${key}"`);
            parsed = parsed[key];
            break;
        }
    }

    return { ...fallback, ...parsed };
}

export function pickAllowed<T extends string>(val: any, allowed: readonly T[], fallback: T): T {
    if (typeof val === 'string' && (allowed as any).includes(val)) {
        return val as T;
    }
    return fallback;
}

export function pickBoolean(val: any, fallback: boolean): boolean {
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === '1') return true;
    if (val === 'false' || val === '0') return false;
    return fallback;
}