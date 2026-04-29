import type { ShadowTokens } from '../types.js';

export const premiumShadow: ShadowTokens = Object.freeze({
    none: 'none',
    soft: '0 10px 30px rgba(17, 24, 39, 0.08)',
    lift: '0 20px 60px rgba(17, 24, 39, 0.14)',
    dramatic: '0 28px 80px rgba(17, 24, 39, 0.2)',
    focusRing: '0 0 0 4px rgba(31, 78, 216, 0.18)'
});

export const trustShadow: ShadowTokens = Object.freeze({
    none: 'none',
    soft: '0 8px 24px rgba(16, 32, 51, 0.08)',
    lift: '0 14px 34px rgba(16, 32, 51, 0.12)',
    dramatic: '0 22px 56px rgba(16, 32, 51, 0.16)',
    focusRing: '0 0 0 4px rgba(29, 78, 216, 0.18)'
});

export const flatShadow: ShadowTokens = Object.freeze({
    none: 'none',
    soft: 'none',
    lift: '0 1px 0 rgba(15, 23, 42, 0.1)',
    dramatic: '0 2px 0 rgba(15, 23, 42, 0.14)',
    focusRing: '0 0 0 4px rgba(37, 99, 235, 0.16)'
});

export const corporateShadow: ShadowTokens = Object.freeze({
    none: 'none',
    soft: '0 2px 8px rgba(10, 25, 47, 0.04)',
    lift: '0 4px 12px rgba(10, 25, 47, 0.08)',
    dramatic: '0 8px 24px rgba(10, 25, 47, 0.12)',
    focusRing: '0 0 0 4px rgba(212, 175, 55, 0.18)'
});