import type { TypographyTokens, TypeScaleToken } from '../types.js';

type ScaleInput = {
    display: string;
    body: string;
    bodySize?: string;
};

function step(
    fontFamily: string,
    fontSize: string,
    lineHeight: number,
    fontWeight: number,
    letterSpacing = '0',
    textTransform: TypeScaleToken['textTransform'] = 'none'
): TypeScaleToken {
    return {
        fontFamily,
        fontSize,
        lineHeight,
        fontWeight,
        letterSpacing,
        textTransform
    };
}

export function createTypographyScale(input: ScaleInput): TypographyTokens {
    const bodySize = input.bodySize ?? '1rem';

    return Object.freeze({
        fontDisplay: input.display,
        fontBody: input.body,
        heroTitle: step(input.display, 'clamp(2.85rem, 6vw, 5.5rem)', 0.96, 800, '-0.04em'),
        h1: step(input.display, 'clamp(2.25rem, 4.8vw, 4rem)', 1.02, 780, '-0.03em'),
        h2: step(input.display, 'clamp(1.75rem, 3.5vw, 2.75rem)', 1.08, 720, '-0.025em'),
        h3: step(input.display, 'clamp(1.25rem, 2.3vw, 1.7rem)', 1.18, 680, '-0.015em'),
        bodyLg: step(input.body, '1.125rem', 1.7, 450, '-0.005em'),
        bodyMd: step(input.body, bodySize, 1.7, 420, '0'),
        caption: step(input.body, '0.875rem', 1.45, 560, '0.03em', 'uppercase'),
        button: step(input.body, '0.97rem', 1.1, 700, '-0.01em')
    });
}

export const premiumTypography = createTypographyScale({
    display: '"Cormorant Garamond", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif'
});

export const modernTypography = createTypographyScale({
    display: '"Sora", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif'
});

export const localTypography = createTypographyScale({
    display: '"Fraunces", Georgia, serif',
    body: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
});

export const editorialTypography = createTypographyScale({
    display: '"Playfair Display", Georgia, serif',
    body: '"Source Serif 4", Georgia, serif',
    bodySize: '1.03rem'
});

export const technicalTypography = createTypographyScale({
    display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
    body: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif'
});