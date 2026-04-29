export const editorialFamily = {
    id: 'editorial',
    typography: {
        heroTitleScale: 'display-xl',
        h2Scale: 'display-md',
        bodyScale: 'body-lg',
        measure: 'narrow',
        letterSpacingPolicy: 'tight-headings'
    },
    spacing: {
        sectionY: '2xl',
        cardGap: 'lg',
        contentGap: 'lg'
    },
    surfaces: {
        sectionShells: {
            narrative: 'editorial',
            proof: 'paper',
            faq: 'band',
            cta: 'band',
            default: 'editorial'
        },
        defaultCardStyle: 'editorial',
        allowedCardStyles: ['editorial', 'outlined', 'flat']
    },
    layoutRules: {
        preferredFlowsByBlockType: {
            intro: ['centered', 'stack'],
            narrative: ['zigzag', 'asymmetric', 'stack'],
            faq: ['stack'],
            trust: ['split', 'stack'],
            cta_panel: ['centered', 'stack']
        },
        forbiddenCombinations: [
            { blockType: 'faq', flow: 'zigzag' },
            { blockType: 'cta_panel', flow: 'asymmetric' }
        ],
        cadenceBehavior: {
            default: 'narrative_alternating',
            allowContrastBursts: true
        }
    },
    ornament: {
        eyebrowStyle: 'serif-soft',
        dividerStyle: 'editorial-rule',
        backgroundAccentPolicy: 'subtle-paper'
    }
};
