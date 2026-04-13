import type { ColorTokens } from '../types.js';

export const REQUIRED_COLOR_SLOTS = Object.freeze([
    'bg',
    'surface',
    'text',
    'muted',
    'primary',
    'accent',
    'success',
    'warning'
] as const);

export function createColorTokens(tokens: ColorTokens): ColorTokens {
    return Object.freeze({ ...tokens });
}

export function assertColorTokens(tokens: Partial<ColorTokens>): asserts tokens is ColorTokens {
    for (const key of REQUIRED_COLOR_SLOTS) {
        if (!tokens[key]) {
            throw new Error(`[design-system/colors] Missing required color token "${key}".`);
        }
    }
}

export const neutralInk = createColorTokens({
    bg: '#F7F5F1',
    surface: '#FFFFFF',
    text: '#111827',
    muted: '#6B7280',
    primary: '#1F4ED8',
    accent: '#C08B2C',
    success: '#0F766E',
    warning: '#B45309',
    border: '#D1D5DB',
    inverse: '#F9FAFB'
});

export const trustSlate = createColorTokens({
    bg: '#F5F7FB',
    surface: '#FFFFFF',
    text: '#102033',
    muted: '#5B6B7C',
    primary: '#1D4ED8',
    accent: '#14B8A6',
    success: '#15803D',
    warning: '#D97706',
    border: '#D6DFEA',
    inverse: '#F8FAFC'
});

export const warmAuthority = createColorTokens({
    bg: '#F7F3EE',
    surface: '#FFFDFC',
    text: '#1F2937',
    muted: '#6B7280',
    primary: '#8B5E3C',
    accent: '#2563EB',
    success: '#3F7D58',
    warning: '#C2410C',
    border: '#DDD1C5',
    inverse: '#FAFAF9'
});

export const editorialNoir = createColorTokens({
    bg: '#F3EFE8',
    surface: '#FFFDF8',
    text: '#171717',
    muted: '#57534E',
    primary: '#7C2D12',
    accent: '#A16207',
    success: '#166534',
    warning: '#B45309',
    border: '#D6D3D1',
    inverse: '#FAFAF9'
});

export const technicalBlue = createColorTokens({
    bg: '#F4F7FA',
    surface: '#FCFEFF',
    text: '#0F172A',
    muted: '#475569',
    primary: '#0F766E',
    accent: '#2563EB',
    success: '#15803D',
    warning: '#CA8A04',
    border: '#CBD5E1',
    inverse: '#E2E8F0'
});