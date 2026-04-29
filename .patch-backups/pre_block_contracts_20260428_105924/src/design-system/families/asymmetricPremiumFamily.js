export const asymmetricPremiumFamily = {
    id: 'asymmetric_premium',
    typography: {
        heroTitleScale: 'display-2xl',
        h2Scale: 'display-md',
        bodyScale: 'body-lg',
        measure: 'medium',
        letterSpacingPolicy: 'luxury-tight'
    },
    spacing: {
        sectionY: '3xl',
        cardGap: 'lg',
        contentGap: 'xl'
    },
    surfaces: {
        sectionShells: {
            hero: 'hero_bridge',
            narrative: 'editorial',
            trust: 'plain',
            cta: 'band',
            default: 'plain'
        },
        defaultCardStyle: 'flat',
        allowedCardStyles: ['flat', 'editorial', 'outlined']
    },
    layoutRules: {
        preferredFlowsByBlockType: {
            hero: ['asymmetric', 'split'],
            narrative: ['asymmetric', 'zigzag'],
            trust: ['split', 'stack'],
            cta_panel: ['centered', 'split']
        },
        forbiddenCombinations: [
            { blockType: 'faq', flow: 'asymmetric' },
            { blockType: 'table', flow: 'asymmetric' }
        ],
        cadenceBehavior: {
            default: 'offset_breathing',
            allowLargeWhitespace: true
        }
    },
    ornament: {
        eyebrowStyle: 'refined-label',
        dividerStyle: 'fade-line',
        backgroundAccentPolicy: 'soft-offset-shapes'
    }
};
