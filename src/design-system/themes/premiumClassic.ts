
import type { DesignSystemTheme } from '../types.js';
import {
    DEFAULT_BREAKPOINTS,
    OFFICIAL_SHELL_TOKENS,
    SECTION_VERTICAL_SPACING,
    classicRadius,
    premiumShadow,
    calmMotion,
    neutralInk,
    premiumTypography
} from '../tokens/index.js';

export const premiumClassic: DesignSystemTheme = {
    id: 'premiumClassic',
    name: 'Premium Classic',
    description: 'Sistema premium con navegación oscura, hero inmersiva y superficies editoriales elegantes.',
    tokens: {
        colors: neutralInk,
        typography: premiumTypography,
        spacing: SECTION_VERTICAL_SPACING,
        shells: OFFICIAL_SHELL_TOKENS,
        radius: classicRadius,
        shadow: premiumShadow,
        breakpoints: DEFAULT_BREAKPOINTS,
        motion: calmMotion
    },
    rules: {
        buttonSystem: {
            radiusToken: 'button',
            shadowToken: 'soft',
            borderWidth: '1px',
            fontCase: 'normal',
            fontWeight: 700,
            primaryFill: 'accent',
            secondaryFill: 'surface',
            ghostUnderline: true
        },
        cards: {
            variant: 'elevated',
            radiusToken: 'card',
            shadowToken: 'soft',
            borderWidth: '1px',
            mediaRatio: '4 / 3',
            headerGap: '0.75rem'
        },
        shadowPolicy: 'soft',
        verticalRhythm: 'spacious',
        hero: {
            template: 'grid',
            disposition: 'content_center',
            maxTrustBullets: 3,
            maxPrimaryCtas: 1,
            allowSecondaryCta: true,
            eyebrowStyle: 'chip',
            emphasis: 'brand'
        },
        allowedShells: ['plain', 'feature', 'panel', 'comparison'],
        shellUsage: {
            hero: 'feature',
            trust: 'panel',
            faq: 'plain',
            comparison: 'comparison',
            default: 'plain'
        }
    },
    compatibility: {
        recommendedFamilies: ['asymmetric_premium'],
        pageCompositions: ['conversion', 'editorial', 'trust_first'],
        cadencePatterns: ['cinematic', 'contrast-bursts'],
        preferredHeroTreatments: ['split', 'proof_first'],
        densityBias: 'standard'
    }
};