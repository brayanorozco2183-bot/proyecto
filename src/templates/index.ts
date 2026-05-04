import * as premium from './template_premium.js';
import * as classic from './template_classic.js';
import * as local from './template_local.js';
import * as modern from './template_modern.js';

export interface TemplateSet {
    id: 'premium' | 'classic' | 'local' | 'modern';
    base: string;
    benefit: string;
    table_row: string;
    seo_section: string;
    faq_item: string;
}

const registry: Record<string, TemplateSet[]> = {
    'default': [
        {
            id: 'premium',
            base: premium.template_premium,
            benefit: premium.template_benefit_item,
            table_row: premium.template_table_row,
            seo_section: premium.template_seo_section,
            faq_item: premium.template_faq_item
        },
        {
            id: 'classic',
            base: classic.template_classic,
            benefit: classic.classic_benefit_item,
            table_row: premium.template_table_row,
            seo_section: premium.template_seo_section,
            faq_item: classic.classic_faq_item
        },
        {
            id: 'local',
            base: local.template_local,
            benefit: local.local_benefit_item,
            table_row: premium.template_table_row,
            seo_section: premium.template_seo_section,
            faq_item: local.local_faq_item
        },
        {
            id: 'modern',
            base: modern.template_modern,
            benefit: modern.modern_benefit_item,
            table_row: premium.template_table_row,
            seo_section: premium.template_seo_section,
            faq_item: modern.modern_faq_item
        }
    ]
};

export function getTemplatesByNiche(niche: string): TemplateSet[] {
    // Dynamic routing can be added here. Currently routing to generic 'default'
    return registry['default'] || [];
}
