export type DesignSystemThemeId =
    | 'premiumClassic'
    | 'modernTrust'
    | 'localAuthority'
    | 'editorialLuxury'
    | 'technicalClean';

export type SectionSpacingMode = 'compact' | 'standard' | 'spacious' | 'editorial';
export type OfficialShell = 'plain' | 'panel' | 'band' | 'feature' | 'editorial' | 'comparison';
export type DensityBias = 'compact' | 'standard' | 'rich';

export type SectionBlockType =
    | 'hero_trust'
    | 'services_grid'
    | 'urgency_panel'
    | 'local_proof'
    | 'trust_band'
    | 'process_steps'
    | 'price_guidance'
    | 'faq'
    | 'cta_panel'
    | 'comparison_table'
    | 'map'
    | 'authority_note'
    | 'internal_linking';

export interface GeneratedSection {
    sectionId?: string;
    id?: string;
    blockType?: SectionBlockType | string;
    type?: SectionBlockType | string;
    h2: string;
    h3s?: string[];
    html: string;
    metadata?: any;
    pattern?: string;
}

export interface ColorTokens {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
    success: string;
    warning: string;
    border: string;
    inverse: string;
}

export interface TypeScaleToken {
    fontFamily: string;
    fontSize: string;
    lineHeight: number;
    fontWeight: number;
    letterSpacing: string;
    textTransform?: 'none' | 'uppercase';
}

export interface TypographyTokens {
    fontDisplay: string;
    fontBody: string;
    heroTitle: TypeScaleToken;
    h1: TypeScaleToken;
    h2: TypeScaleToken;
    h3: TypeScaleToken;
    bodyLg: TypeScaleToken;
    bodyMd: TypeScaleToken;
    caption: TypeScaleToken;
    button: TypeScaleToken;
}

export interface SectionSpacingToken {
    sectionY: string;
    contentGap: string;
    cardGap: string;
    clusterGap: string;
}

export type SectionSpacingTokens = Record<SectionSpacingMode, SectionSpacingToken>;

export interface ShellToken {
    shell: OfficialShell;
    paddingY: string;
    paddingX: string;
    maxWidth: string;
    usesSurface: boolean;
    hasBorder: boolean;
    accentTreatment: 'none' | 'top-rule' | 'left-bar';
}

export type ShellTokens = Record<OfficialShell, ShellToken>;

export interface RadiusTokens {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    pill: string;
    section: string;
    card: string;
    button: string;
}

export interface ShadowTokens {
    none: string;
    soft: string;
    lift: string;
    dramatic: string;
    focusRing: string;
}

export interface BreakpointsTokens {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
}

export interface MotionTokens {
    surfaceStyle?: string;
    durationInstant: string;
    durationFast: string;
    durationStandard: string;
    durationSlow: string;
    easeStandard: string;
    easeEntrance: string;
    easeExit: string;
    hoverLiftDistance: string;
}

export interface ButtonRecipe {
    radiusToken: keyof RadiusTokens;
    shadowToken: keyof ShadowTokens;
    borderWidth: string;
    fontCase: 'normal' | 'uppercase';
    fontWeight: number;
    primaryFill: 'primary' | 'text' | 'accent';
    secondaryFill: 'surface' | 'transparent';
    ghostUnderline: boolean;
}

export interface CardRecipe {
    variant: 'outlined' | 'elevated' | 'tonal' | 'editorial_rule' | 'technical_panel';
    radiusToken: keyof RadiusTokens;
    shadowToken: keyof ShadowTokens;
    borderWidth: string;
    mediaRatio: '4 / 3' | '16 / 9' | 'auto';
    headerGap: string;
}

export interface HeroRule {
    template: 'split' | 'centered' | 'stacked' | 'proof_first' | 'grid';
    disposition: 'content_left' | 'content_center' | 'content_right';
    maxTrustBullets: number;
    maxPrimaryCtas: number;
    allowSecondaryCta: boolean;
    eyebrowStyle: 'chip' | 'kicker' | 'plain';
    emphasis: 'brand' | 'proof' | 'narrative' | 'technical';
}

export interface DesignSystemTheme {
    id: DesignSystemThemeId;
    name: string;
    description: string;
    tokens: {
        colors: ColorTokens;
        typography: TypographyTokens;
        spacing: SectionSpacingTokens;
        shells: ShellTokens;
        radius: RadiusTokens;
        shadow: ShadowTokens;
        breakpoints: BreakpointsTokens;
        motion: MotionTokens;
    };
    rules: {
        buttonSystem: ButtonRecipe;
        cards: CardRecipe;
        shadowPolicy: keyof ShadowTokens;
        verticalRhythm: SectionSpacingMode;
        hero: HeroRule;
        allowedShells: OfficialShell[];
        shellUsage: {
            hero: OfficialShell;
            trust: OfficialShell;
            faq: OfficialShell;
            comparison: OfficialShell;
            default: OfficialShell;
        };
    };
    compatibility: {
        recommendedFamilies: string[];
        pageCompositions: string[];
        cadencePatterns: string[];
        preferredHeroTreatments: string[];
        densityBias: DensityBias;
    };
}

export type RenderFn = (input: {
    content: any;
    id?: string;
    visualVariant?: string;
    heroLayout?: string;
    [key: string]: any;
}) => string;