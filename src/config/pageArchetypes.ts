export interface PageArchetype {
    id: string;
    heroTemplate: 'split' | 'centered' | 'proof_first' | 'cta_heavy' | 'stacked';
    pageSkeleton: 'editorial-longform' | 'conversion-funnel' | 'local-directory' | 'premium-showcase' | 'technical-comparison';
    pageComposition: 'editorial' | 'conversion' | 'local_dense' | 'trust_first';
    cadencePattern: 'alternating' | 'stacked' | 'contrast-bursts' | 'cinematic' | 'calm';
    proofStrategy: 'early' | 'mid' | 'distributed' | 'none';
    ctaStrategy: 'terminal' | 'distributed' | 'hero-heavy' | 'minimal';
    orderedBlockTypes: string[];
}

export const PAGE_ARCHETYPES: Record<string, PageArchetype[]> = {
    service: [
        {
            id: 'authority_grid',
            heroTemplate: 'proof_first',
            pageSkeleton: 'conversion-funnel',
            pageComposition: 'conversion',
            cadencePattern: 'alternating',
            proofStrategy: 'distributed',
            ctaStrategy: 'terminal',
            orderedBlockTypes: [
                'services_grid',
                'trust_band',
                'process_steps',
                'local_proof',
                'map',
                'price_guidance',
                'faq',
                'cta_panel'
            ]
        },
        {
            id: 'editorial_story',
            heroTemplate: 'centered',
            pageSkeleton: 'editorial-longform',
            pageComposition: 'editorial',
            cadencePattern: 'cinematic',
            proofStrategy: 'mid',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'case_story',
                'services_grid',
                'process_steps',
                'objections',
                'local_proof',
                'map',
                'faq',
                'micro_cta',
                'cta_panel'
            ]
        },
        {
            id: 'local_trust_band',
            heroTemplate: 'proof_first',
            pageSkeleton: 'local-directory',
            pageComposition: 'trust_first',
            cadencePattern: 'calm',
            proofStrategy: 'early',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'local_proof',
                'map',
                'trust_band',
                'services_grid',
                'process_steps',
                'price_guidance',
                'faq',
                'cta_panel'
            ]
        },
        {
            id: 'cluster_compass',
            heroTemplate: 'centered',
            pageSkeleton: 'local-directory',
            pageComposition: 'trust_first',
            cadencePattern: 'calm',
            proofStrategy: 'early',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'local_proof',
                'map',
                'services_grid',
                'faq',
                'process_steps',
                'trust_band',
                'price_guidance',
                'cta_panel'
            ]
        },
        {
            id: 'urgent_split',
            heroTemplate: 'cta_heavy',
            pageSkeleton: 'premium-showcase',
            pageComposition: 'conversion',
            cadencePattern: 'contrast-bursts',
            proofStrategy: 'distributed',
            ctaStrategy: 'hero-heavy',
            orderedBlockTypes: [
                'urgency_panel',
                'services_grid',
                'process_steps',
                'local_proof',
                'map',
                'trust_band',
                'faq',
                'cta_panel'
            ]
        }
    ],

    urgent: [
        {
            id: 'immediate_response',
            heroTemplate: 'proof_first',
            pageSkeleton: 'conversion-funnel',
            pageComposition: 'conversion',
            cadencePattern: 'contrast-bursts',
            proofStrategy: 'early',
            ctaStrategy: 'hero-heavy',
            orderedBlockTypes: [
                'urgency_panel',
                'local_proof',
                'map',
                'process_steps',
                'trust_band',
                'faq',
                'cta_panel'
            ]
        },
        {
            id: 'proof_then_action',
            heroTemplate: 'proof_first',
            pageSkeleton: 'premium-showcase',
            pageComposition: 'trust_first',
            cadencePattern: 'alternating',
            proofStrategy: 'distributed',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'local_proof',
                'map',
                'urgency_panel',
                'process_steps',
                'price_guidance',
                'faq',
                'cta_panel'
            ]
        }
    ],

    service_area: [
        {
            id: 'coverage_first',
            heroTemplate: 'centered',
            pageSkeleton: 'local-directory',
            pageComposition: 'local_dense',
            cadencePattern: 'calm',
            proofStrategy: 'early',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'local_proof',
                'map',
                'services_grid',
                'trust_band',
                'faq',
                'cta_panel'
            ]
        },
        {
            id: 'cluster_hub_local',
            heroTemplate: 'proof_first',
            pageSkeleton: 'local-directory',
            pageComposition: 'trust_first',
            cadencePattern: 'calm',
            proofStrategy: 'distributed',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'local_proof',
                'map',
                'trust_band',
                'faq',
                'services_grid',
                'cta_panel'
            ]
        },
        {
            id: 'services_then_coverage',
            heroTemplate: 'split',
            pageSkeleton: 'conversion-funnel',
            pageComposition: 'conversion',
            cadencePattern: 'alternating',
            proofStrategy: 'mid',
            ctaStrategy: 'terminal',
            orderedBlockTypes: [
                'services_grid',
                'local_proof',
                'map',
                'process_steps',
                'faq',
                'cta_panel'
            ]
        }
    ],

    comparison: [
        {
            id: 'decision_matrix',
            heroTemplate: 'centered',
            pageSkeleton: 'technical-comparison',
            pageComposition: 'editorial',
            cadencePattern: 'stacked',
            proofStrategy: 'mid',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'comparison_table',
                'price_guidance',
                'services_grid',
                'objections',
                'faq',
                'cta_panel'
            ]
        },
        {
            id: 'conversion_comparison',
            heroTemplate: 'split',
            pageSkeleton: 'conversion-funnel',
            pageComposition: 'conversion',
            cadencePattern: 'alternating',
            proofStrategy: 'distributed',
            ctaStrategy: 'terminal',
            orderedBlockTypes: [
                'price_guidance',
                'comparison_table',
                'services_grid',
                'trust_band',
                'faq',
                'cta_panel'
            ]
        }
    ],

    guide: [
        {
            id: 'deep_guide',
            heroTemplate: 'centered',
            pageSkeleton: 'editorial-longform',
            pageComposition: 'editorial',
            cadencePattern: 'cinematic',
            proofStrategy: 'mid',
            ctaStrategy: 'minimal',
            orderedBlockTypes: [
                'process_steps',
                'checklist',
                'authority_note',
                'objections',
                'faq',
                'micro_cta',
                'cta_panel'
            ]
        },
        {
            id: 'practical_guide',
            heroTemplate: 'stacked',
            pageSkeleton: 'premium-showcase',
            pageComposition: 'editorial',
            cadencePattern: 'stacked',
            proofStrategy: 'distributed',
            ctaStrategy: 'distributed',
            orderedBlockTypes: [
                'checklist',
                'process_steps',
                'authority_note',
                'faq',
                'micro_cta',
                'cta_panel'
            ]
        }
    ]
};