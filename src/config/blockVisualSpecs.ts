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
        defaultLayout: 'two_column_trust',
        defaultFormat: 'cards',
        spacingProfile: 'normal',
        emphasis: 'content',
        mobilePattern: 'cards',
        decorativeLevel: 'soft',
        densityBias: 'standard',
        allowedVisualVariants: ['magazine_panels', 'editorial_columns', 'clean_cards', 'icon_tiles'],
        defaultVisualVariant: 'magazine_panels',
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
        allowedVisualVariants: ['command_center', 'status_banner', 'sidebar_alert'],
        defaultVisualVariant: 'command_center',
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
        allowedVisualVariants: ['coverage_split', 'evidence_stack', 'list_detailed', 'cards_minimal', 'grid_logos'],
        defaultVisualVariant: 'coverage_split',
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
        defaultVisualVariant: 'accordion_clean',
        sectionShell: 'panel',
        containerStyle: 'narrow',
        layoutBehavior: 'static'
    },
    cta_panel: {
        allowedLayouts: ['split_feature', 'minimal_centered'],
        allowedFormats: ['prose', 'bullets'],
        defaultLayout: 'split_feature',
        defaultFormat: 'prose',
        spacingProfile: 'airy',
        emphasis: 'cta',
        mobilePattern: 'stack',
        decorativeLevel: 'strong',
        densityBias: 'compact',
        allowedVisualVariants: ['consultation_split', 'luxury_banner', 'minimal_phone_bar'],
        defaultVisualVariant: 'consultation_split',
        sectionShell: 'band',
        containerStyle: 'default',
        layoutBehavior: 'hero-led'
    },
    price_guidance: {
        allowedLayouts: ['boxed_content', 'full_width_text'],
        allowedFormats: ['table', 'bullets'],
        defaultLayout: 'boxed_content',
        defaultFormat: 'bullets',
        spacingProfile: 'normal',
        emphasis: 'trust',
        mobilePattern: 'stack',
        decorativeLevel: 'soft',
        densityBias: 'standard',
        allowedVisualVariants: ['insight_panels', 'cards_price', 'list_transparent', 'table_simple'],
        defaultVisualVariant: 'insight_panels',
        sectionShell: 'panel',
        containerStyle: 'default',
        layoutBehavior: 'static'
    },
    process_steps: {
        allowedLayouts: ['full_width_text', 'boxed_content'],
        allowedFormats: ['bullets', 'cards'],
        defaultLayout: 'full_width_text',
        defaultFormat: 'cards',
        spacingProfile: 'normal',
        emphasis: 'content',
        mobilePattern: 'stack',
        decorativeLevel: 'none',
        densityBias: 'standard',
        allowedVisualVariants: ['stepped_rail', 'grid_steps', 'timeline_vertical', 'numbered_list'],
        defaultVisualVariant: 'stepped_rail',
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
        allowedVisualVariants: ['signal_grid', 'static_pills', 'minimal_icons', 'scrolling_strip'],
        defaultVisualVariant: 'signal_grid',
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
        allowedVisualVariants: ['context_frame', 'spotlight_card', 'boxed_with_text', 'minimal_embed', 'full_width'],
        defaultVisualVariant: 'context_frame',
        sectionShell: 'panel',
        containerStyle: 'wide',
        layoutBehavior: 'static'
    }
};
