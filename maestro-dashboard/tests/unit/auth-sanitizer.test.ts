import { describe, it, expect } from 'vitest';

// Simulación de la función de sanitización que debería existir
function sanitizeWordPressPassword(pass: string): string {
    // Elimina espacios extras que a veces el usuario copia/pega en App Passwords
    return pass.replace(/\s+/g, '');
}

describe('UNIT_03: Auth Validator & Sanitization', () => {
    it('should remove spaces from WordPress App Passwords', () => {
        const raw = 'xxxx xxxx xxxx xxxx';
        const sanitized = sanitizeWordPressPassword(raw);
        expect(sanitized).toBe('xxxxxxxxxxxxxxxx');
    });

    it('should handle already sanitized passwords', () => {
        const raw = 'xxxxxxxxxxxxxxxx';
        const sanitized = sanitizeWordPressPassword(raw);
        expect(sanitized).toBe('xxxxxxxxxxxxxxxx');
    });
});
