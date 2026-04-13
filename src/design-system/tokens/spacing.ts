import type { OfficialShell, SectionSpacingTokens, ShellTokens } from '../types.js';

export const SECTION_VERTICAL_SPACING: SectionSpacingTokens = Object.freeze({
    compact: {
        sectionY: 'clamp(2.5rem, 4vw, 4rem)',
        contentGap: '1rem',
        cardGap: '0.875rem',
        clusterGap: '1.25rem'
    },
    standard: {
        sectionY: 'clamp(3.5rem, 5vw, 5.5rem)',
        contentGap: '1.25rem',
        cardGap: '1rem',
        clusterGap: '1.5rem'
    },
    spacious: {
        sectionY: 'clamp(4.5rem, 6vw, 7rem)',
        contentGap: '1.5rem',
        cardGap: '1.25rem',
        clusterGap: '1.75rem'
    },
    editorial: {
        sectionY: 'clamp(5rem, 7vw, 8.5rem)',
        contentGap: '1.75rem',
        cardGap: '1.5rem',
        clusterGap: '2rem'
    }
});

export const OFFICIAL_SHELLS = Object.freeze([
    'plain',
    'panel',
    'band',
    'feature',
    'editorial',
    'comparison'
] as const satisfies readonly OfficialShell[]);

export const OFFICIAL_SHELL_TOKENS: ShellTokens = Object.freeze({
    plain: {
        shell: 'plain',
        paddingY: '0',
        paddingX: '0',
        maxWidth: '72rem',
        usesSurface: false,
        hasBorder: false,
        accentTreatment: 'none'
    },
    panel: {
        shell: 'panel',
        paddingY: 'clamp(1.5rem, 2vw, 2rem)',
        paddingX: 'clamp(1rem, 2vw, 1.5rem)',
        maxWidth: '74rem',
        usesSurface: true,
        hasBorder: true,
        accentTreatment: 'none'
    },
    band: {
        shell: 'band',
        paddingY: 'clamp(2rem, 3vw, 3rem)',
        paddingX: 'clamp(1rem, 2.2vw, 1.75rem)',
        maxWidth: '100%',
        usesSurface: true,
        hasBorder: false,
        accentTreatment: 'top-rule'
    },
    feature: {
        shell: 'feature',
        paddingY: 'clamp(2.25rem, 3vw, 3.25rem)',
        paddingX: 'clamp(1.25rem, 2.5vw, 2rem)',
        maxWidth: '80rem',
        usesSurface: true,
        hasBorder: false,
        accentTreatment: 'left-bar'
    },
    editorial: {
        shell: 'editorial',
        paddingY: 'clamp(2.5rem, 3vw, 3.5rem)',
        paddingX: '0',
        maxWidth: '68rem',
        usesSurface: false,
        hasBorder: false,
        accentTreatment: 'top-rule'
    },
    comparison: {
        shell: 'comparison',
        paddingY: 'clamp(2rem, 3vw, 3rem)',
        paddingX: 'clamp(1rem, 2vw, 1.5rem)',
        maxWidth: '78rem',
        usesSurface: true,
        hasBorder: true,
        accentTreatment: 'top-rule'
    }
});