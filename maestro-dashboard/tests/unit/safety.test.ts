import { describe, it, expect } from 'vitest';

// Simulación de lógica de cálculo de estadísticas
function calculateSuccessRate(success: number, total: number): number {
    if (total === 0) return 0;
    const rate = (success / total) * 100;
    return isNaN(rate) ? 0 : Math.round(rate);
}

// Simulación de sanitización de inputs (XSS)
function sanitizeInput(input: string): string {
    return input.replace(/<[^>]*>?/gm, '');
}

describe('UNIT_06: Stats Calculator Safety', () => {
    it('should return 0 when total is zero to avoid division by zero', () => {
        expect(calculateSuccessRate(10, 0)).toBe(0);
    });

    it('should handle NaN values gracefully', () => {
        expect(calculateSuccessRate(NaN, 10)).toBe(0);
    });

    it('should calculate correct percentage', () => {
        expect(calculateSuccessRate(5, 10)).toBe(50);
    });
});

describe('UNIT_07: Security & XSS Protection', () => {
    it('should strip script tags from input', () => {
        const malicious = '<script>alert("xss")</script>Hello';
        expect(sanitizeInput(malicious)).toBe('alert("xss")Hello');
    });

    it('should strip html tags from input', () => {
        const html = '<b>Bold</b>';
        expect(sanitizeInput(html)).toBe('Bold');
    });
});
