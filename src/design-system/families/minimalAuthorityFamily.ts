import { FamilyDefinition } from './types.js';

export const minimalAuthorityFamily: FamilyDefinition = {
    id: 'minimal_authority',
    typography: {
        heroTitleScale: 'display-lg',
        h2Scale: 'heading-lg',
        bodyScale: 'body-md',
        measure: 'medium',
        letterSpacingPolicy: 'clean'
    },
    spacing: {
        sectionY: 'xl',
        cardGap: 'md',
        contentGap: 'lg'
    },
    surfaces: {
        sectionShells: {
            intro: 'plain',
            trust: 'plain',
            faq: 'plain',
            cta: 'plain',
            default: 'plain'
        },
        defaultCardStyle: 'flat',
        allowedCardStyles: ['flat', 'outlined']
    },
    layoutRules: {
        preferredFlowsByBlockType: {
            intro: ['centered', 'stack'],
            faq: ['stack', 'accordion'],
            trust: ['stack', 'split'],
            cta_panel: ['centered']
        },
        forbiddenCombinations: [
            { blockType: 'cta_panel', flow: 'zigzag' },
            { blockType: 'hero', flow: 'zigzag' }
        ],
        cadenceBehavior: {
            default: 'calm_authority',
            visualNoise: 'low'
        }
    },
    ornament: {
        eyebrowStyle: 'text-only',
        dividerStyle: 'hairline',
        backgroundAccentPolicy: 'none'
    }
};