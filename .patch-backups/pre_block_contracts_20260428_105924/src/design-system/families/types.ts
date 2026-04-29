export interface FamilyDefinition {
    id: string;
    typography: {
        heroTitleScale: string;
        h2Scale: string;
        bodyScale: string;
        measure: string;
        letterSpacingPolicy: string;
    };
    spacing: {
        sectionY: string;
        cardGap: string;
        contentGap: string;
    };
    surfaces: {
        sectionShells: Record<string, string>;
        defaultCardStyle: string;
        allowedCardStyles: string[];
    };
    layoutRules: {
        preferredFlowsByBlockType: Record<string, string[]>;
        forbiddenCombinations: Array<{ blockType: string; flow: string }>;
        cadenceBehavior: Record<string, any>;
    };
    ornament: {
        eyebrowStyle: string;
        dividerStyle: string;
        backgroundAccentPolicy: string;
    };
}