import type { DesignSystemTheme } from '../types.js';
import {
    DEFAULT_BREAKPOINTS,
    OFFICIAL_SHELL_TOKENS,
    SECTION_VERTICAL_SPACING,
    editorialRadius,
    premiumShadow,
    calmMotion,
    editorialNoir,
    editorialTypography
} from '../tokens/index.js';

export const editorialLuxury: DesignSystemTheme = {
    id: 'editorialLuxury',
    name: 'Editorial Luxury',
    description: 'Sistema narrativo con tipografía protagonista, shells editoriales y ritmo largo.',
    tokens: {
        colors: editorialNoir,
        typography: editorialTypography,
        spacing: SECTION_VERTICAL_SPACING,
        shells: OFFICIAL_SHELL_TOKENS,
        radius: editorialRadius,
        shadow: premiumShadow,
        breakpoints: DEFAULT_BREAKPOINTS,
        motion: calmMotion
    },
    rules: {
        buttonSystem: {
            radiusToken: 'button',
            shadowToken: 'none',
            borderWidth: '1px',
            fontCase: 'uppercase',
            fontWeight: 700,
            primaryFill: 'text',
            secondaryFill: 'transparent',
            ghostUnderline: true
        },
        cards: {
            variant: 'editorial_rule',
            radiusToken: 'card',
            shadowToken: 'none',
            borderWidth: '1px',
            mediaRatio: 'auto',
            headerGap: '0.875rem'
        },
        shadowPolicy: 'none',
        verticalRhythm: 'editorial',
        hero: {
            template: 'stacked',
            disposition: 'content_left',
            maxTrustBullets: 2,
            maxPrimaryCtas: 1,
            allowSecondaryCta: true,
            eyebrowStyle: 'kicker',
            emphasis: 'narrative'
        },
        allowedShells: ['plain', 'editorial', 'feature', 'comparison'],
        shellUsage: {
            hero: 'editorial',
            trust: 'plain',
            faq: 'editorial',
            comparison: 'comparison',
            default: 'editorial'
        }
    },
    compatibility: {
        recommendedFamilies: ['editorial'],
        pageCompositions: ['editorial'],
        cadencePatterns: ['cinematic', 'calm'],
        preferredHeroTreatments: ['stacked', 'split'],
        densityBias: 'rich'
    }
};