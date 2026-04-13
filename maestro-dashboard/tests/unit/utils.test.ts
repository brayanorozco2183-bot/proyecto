import { describe, it, expect } from 'vitest';

// Simulación de transiciones de estado de misión
function getNextState(current: string): string {
    const flow: Record<string, string> = {
        'idle': 'interpreting',
        'interpreting': 'extracting',
        'extracting': 'writing',
        'writing': 'completed'
    };
    return flow[current] || 'idle';
}

// Simulación de normalización de URLs
function normalizeURL(url: string): string {
    if (!url) return '';
    let normalized = url.trim().toLowerCase();
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    return normalized;
}

describe('UNIT_04: Mission State Transitions', () => {
    it('should transition correctly from idle to interpreting', () => {
        expect(getNextState('idle')).toBe('interpreting');
    });

    it('should return idle for unknown states', () => {
        expect(getNextState('unknown')).toBe('idle');
    });
});

describe('UNIT_05: URL Normalization Utils', () => {
    it('should add https if missing', () => {
        expect(normalizeURL('example.com')).toBe('https://example.com');
    });

    it('should remove trailing slashes', () => {
        expect(normalizeURL('https://example.com/')).toBe('https://example.com');
    });
});
