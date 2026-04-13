export type BlockType =
    | 'hero_trust'
    | 'services_grid'
    | 'urgency_panel'
    | 'local_proof'
    | 'faq'
    | 'cta_panel'
    | 'price_guidance'
    | 'process_steps'
    | 'trust_band'
    | 'case_story'
    | 'comparison_table'
    | 'micro_cta'
    | 'map';

export type LayoutHint =
    | 'split_feature'
    | 'boxed_content'
    | 'full_width_text'
    | 'minimal_centered'
    | 'two_column_trust';

export type PreferredFormat =
    | 'cards'
    | 'bullets'
    | 'prose'
    | 'faq'
    | 'trust_cards'
    | 'table';

export interface BlockVisualSpec {
    allowedLayouts: LayoutHint[];
    allowedFormats: PreferredFormat[];
    defaultLayout: LayoutHint;
    defaultFormat: PreferredFormat;
    spacingProfile: 'tight' | 'normal' | 'airy';
    emphasis: 'content' | 'trust' | 'cta';
    mobilePattern: 'stack' | 'split-collapse' | 'cards';
    decorativeLevel: 'none' | 'soft' | 'strong';
    densityBias: 'compact' | 'standard' | 'rich';
    allowedVisualVariants?: string[];
    defaultVisualVariant?: string;
    sectionShell?: 'plain' | 'panel' | 'band' | 'editorial';
    containerStyle?: 'narrow' | 'default' | 'wide';
    layoutBehavior?: 'static' | 'alternating' | 'hero-led';
}

export const BLOCK_VISUAL_SPECS: Record<BlockType, BlockVisualSpec> = {
    hero_trust: {
        allowedLayouts: ['split_feature', 'minimal_centered'],
        allowedFormats: ['prose', 'trust_cards'],
        defaultLayout: 'split_feature',
        defaultFormat: 'prose',
        spacingProfile: 'airy',
        emphasis: 'trust',
        mobilePattern: 'split-collapse',
        decorativeLevel: 'strong',
        densityBias: 'rich',
        allowedVisualVariants: ['split_premium', 'centered_clean', 'stacked_dark'],
        defaultVisualVariant: 'split_premium',
        sectionShell: 'panel',
        containerStyle: 'wide',
        layoutBehavior: 'hero-led'
    },
    services_grid: {
        allowedLayouts: ['boxed_content', 'two_column_trust'],
        allowedFormats: ['cards', 'bullets'],
        defaultLayout: 'boxed_content',
        defaultFormat: 'cards',
        spacingProfile: 'normal',
        emphasis: 'content',
        mobilePattern: 'cards',
        decorativeLevel: 'soft',
        densityBias: 'standard',
        allowedVisualVariants: ['clean_cards', 'icon_tiles', 'editorial_columns'],
        defaultVisualVariant: 'clean_cards',
        sectionShell: 'panel',
        containerStyle: 'wide',
        layoutBehavior: 'alternating'
    },
    urgency_panel: {
        allowedLayouts: ['split_feature', 'boxed_content'],
        allowedFormats: ['bullets', 'trust_cards'],
        defaultLayout: 'split_feature',
        defaultFormat: 'bullets',
        spacingProfile: 'normal',
        emphasis: 'cta',
        mobilePattern: 'stack',
        decorativeLevel: 'strong',
        densityBias: 'compact',
        allowedVisualVariants: ['sidebar_alert', 'status_banner', 'command_center'],
        defaultVisualVariant: 'status_banner',
        sectionShell: 'band',
        containerStyle: 'default',
        layoutBehavior: 'hero-led'
    },
    local_proof: {
        allowedLayouts: ['two_column_trust', 'boxed_content', 'full_width_text'],
        allowedFormats: ['trust_cards', 'bullets', 'prose'],
        defaultLayout: 'two_column_trust',
        defaultFormat: 'trust_cards',
        spacingProfile: 'normal',
        emphasis: 'trust',
        mobilePattern: 'cards',
        decorativeLevel: 'soft',
        densityBias: 'standard',
        allowedVisualVariants: ['grid_logos', 'list_detailed', 'cards_minimal'],
        defaultVisualVariant: 'list_detailed',
        sectionShell: 'panel',
        containerStyle: 'default',
        layoutBehavior: 'alternating'
    },
    case_story: {
        allowedFormats: ['prose', 'cards'],
        defaultFormat: 'prose',
        allowedLayouts: ['full_width_text', 'split_feature', 'boxed_content'],
        defaultLayout: 'split_feature',
        densityBias: 'rich',
        allowedVisualVariants: ['editorial_story', 'case_split'],
        defaultVisualVariant: 'editorial_story',
        spacingProfile: 'airy',
        emphasis: 'content',
        mobilePattern: 'stack',
        decorativeLevel: 'soft'
    },
    comparison_table: {
        allowedFormats: ['table', 'cards'],
        defaultFormat: 'table',
        allowedLayouts: ['boxed_content', 'full_width_text'],
        defaultLayout: 'boxed_content',
        densityBias: 'standard',
        allowedVisualVariants: ['matrix_clean', 'matrix_bold'],
        defaultVisualVariant: 'matrix_clean',
        spacingProfile: 'normal',
        emphasis: 'content',
        mobilePattern: 'cards',
        decorativeLevel: 'none'
    },
    micro_cta: {
        allowedFormats: ['prose', 'bullets'],
        defaultFormat: 'prose',
        allowedLayouts: ['minimal_centered', 'boxed_content'],
        defaultLayout: 'minimal_centered',
        densityBias: 'compact',
        allowedVisualVariants: ['inline_cta', 'soft_prompt'],
        defaultVisualVariant: 'inline_cta',
        spacingProfile: 'tight',
        emphasis: 'cta',
        mobilePattern: 'stack',
        decorativeLevel: 'soft'
    },
    faq: {
        allowedLayouts: ['minimal_centered', 'full_width_text'],
        allowedFormats: ['faq'],
        defaultLayout: 'minimal_centered',
        defaultFormat: 'faq',
        spacingProfile: 'normal',
        emphasis: 'content',
        mobilePattern: 'stack',
        decorativeLevel: 'none',
        densityBias: 'standard',
        allowedVisualVariants: ['accordion_clean', 'editorial_list'],
        defaultVisualVariant: 'editorial_list',
        sectionShell: 'panel',
        containerStyle: 'narrow',
        layoutBehavior: 'static'
    },
    cta_panel: {
        allowedLayouts: ['split_feature', 'minimal_centered'],
        allowedFormats: ['prose', 'bullets'],
        defaultLayout: 'minimal_centered',
        defaultFormat: 'prose',
        spacingProfile: 'airy',
        emphasis: 'cta',
        mobilePattern: 'stack',
        decorativeLevel: 'strong',
        densityBias: 'compact',
        allowedVisualVariants: ['minimal_phone_bar', 'luxury_banner'],
        defaultVisualVariant: 'luxury_banner',
        sectionShell: 'band',
        containerStyle: 'default',
        layoutBehavior: 'hero-led'
    },
    price_guidance: {
        allowedLayouts: ['boxed_content', 'full_width_text'],
        allowedFormats: ['table', 'bullets'],
        defaultLayout: 'boxed_content',
        defaultFormat: 'table',
        spacingProfile: 'normal',
        emphasis: 'trust',
        mobilePattern: 'stack',
        decorativeLevel: 'soft',
        densityBias: 'standard',
        allowedVisualVariants: ['table_simple', 'cards_price', 'list_transparent'],
        defaultVisualVariant: 'table_simple',
        sectionShell: 'panel',
        containerStyle: 'default',
        layoutBehavior: 'static'
    },
    process_steps: {
        allowedLayouts: ['full_width_text', 'boxed_content'],
        allowedFormats: ['bullets', 'cards'],
        defaultLayout: 'full_width_text',
        defaultFormat: 'bullets',
        spacingProfile: 'normal',
        emphasis: 'content',
        mobilePattern: 'stack',
        decorativeLevel: 'none',
        densityBias: 'standard',
        allowedVisualVariants: ['timeline_vertical', 'grid_steps', 'numbered_list'],
        defaultVisualVariant: 'grid_steps',
        sectionShell: 'panel',
        containerStyle: 'default',
        layoutBehavior: 'alternating'
    },
    trust_band: {
        allowedLayouts: ['two_column_trust', 'full_width_text'],
        allowedFormats: ['trust_cards', 'bullets'],
        defaultLayout: 'two_column_trust',
        defaultFormat: 'trust_cards',
        spacingProfile: 'tight',
        emphasis: 'trust',
        mobilePattern: 'cards',
        decorativeLevel: 'soft',
        densityBias: 'compact',
        allowedVisualVariants: ['scrolling_strip', 'static_pills', 'minimal_icons'],
        defaultVisualVariant: 'minimal_icons',
        sectionShell: 'band',
        containerStyle: 'wide',
        layoutBehavior: 'static'
    },
    map: {
        allowedLayouts: ['full_width_text'],
        allowedFormats: ['prose'],
        defaultLayout: 'full_width_text',
        defaultFormat: 'prose',
        spacingProfile: 'normal',
        emphasis: 'trust',
        mobilePattern: 'stack',
        decorativeLevel: 'soft',
        densityBias: 'compact',
        allowedVisualVariants: ['full_width', 'boxed_with_text', 'spotlight_card', 'minimal_embed'],
        defaultVisualVariant: 'boxed_with_text',
        sectionShell: 'panel',
        containerStyle: 'wide',
        layoutBehavior: 'static'
    }
};