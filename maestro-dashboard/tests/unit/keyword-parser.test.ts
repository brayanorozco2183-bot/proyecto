import { describe, it, expect } from 'vitest';

// Simulamos la lógica que falló (asumiendo que viene de una utilidad o componente)
function validateKeywordData(data: unknown) {
    if (!data || !Array.isArray(data)) {
        return [];
    }
    return data;
}

describe('UNIT_01 & UNIT_02: Keyword Data Integrity', () => {
    it('should handle correctly an array of keywords', () => {
        const raw = [{ id: 1, keyword: 'test' }];
        const result = validateKeywordData(raw);
        expect(result).toHaveLength(1);
        expect(result[0].keyword).toBe('test');
    });

    it('should return empty array if data is null (Prevention of .map error)', () => {
        const result = validateKeywordData(null);
        expect(result).toEqual([]);
        expect(() => result.map(() => { })).not.toThrow();
    });

    it('should return empty array if data is an object instead of array', () => {
        const result = validateKeywordData({ error: 'not found' });
        expect(result).toEqual([]);
    });
});
