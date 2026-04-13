export const DESIGN_FAMILIES = {
    service: [
        {
            id: 'service_authority',
            weight: 0.35,
            family: 'authority_modern',
            personality: 'modern_tech',
            heroTreatment: 'cta_heavy',
            heroDisposition: 'content_left',
            contrastModel: 'balanced',
            pageComposition: 'conversion',
            visualSystem: 'panelled',
            sectionCadence: 'contrast',
            surfaceStyle: 'tinted',
            cardTreatment: 'elevated'
        },
        {
            id: 'service_editorial',
            weight: 0.20,
            family: 'service_magazine',
            personality: 'editorial',
            heroTreatment: 'stacked',
            heroDisposition: 'content_center',
            contrastModel: 'soft',
            pageComposition: 'editorial',
            visualSystem: 'editorial',
            sectionCadence: 'flow',
            surfaceStyle: 'flat',
            cardTreatment: 'outlined'
        },
        {
            id: 'service_luxury',
            weight: 0.20,
            family: 'minimal_luxury',
            personality: 'luxury',
            heroTreatment: 'centered',
            heroDisposition: 'content_center',
            contrastModel: 'soft',
            pageComposition: 'trust_first',
            visualSystem: 'minimal',
            sectionCadence: 'breathing',
            surfaceStyle: 'plain',
            cardTreatment: 'ghost'
        },
        {
            id: 'service_split',
            weight: 0.25,
            family: 'premium_split',
            personality: 'modern_tech',
            heroTreatment: 'split',
            heroDisposition: 'split_media_right',
            contrastModel: 'dramatic',
            pageComposition: 'local_dense',
            visualSystem: 'grid',
            sectionCadence: 'tight',
            surfaceStyle: 'layered',
            cardTreatment: 'structured'
        }
    ],
    urgent: [
        {
            id: 'urgent_conversion',
            weight: 0.60,
            family: 'conversion_clean',
            personality: 'modern_tech',
            heroTreatment: 'cta_heavy',
            heroDisposition: 'content_left',
            contrastModel: 'dramatic',
            pageComposition: 'conversion',
            visualSystem: 'minimal',
            sectionCadence: 'contrast',
            surfaceStyle: 'plain',
            cardTreatment: 'outlined'
        },
        {
            id: 'urgent_dark',
            weight: 0.20,
            family: 'editorial_dark',
            personality: 'luxury',
            heroTreatment: 'stacked',
            heroDisposition: 'content_left',
            contrastModel: 'dramatic',
            pageComposition: 'editorial',
            visualSystem: 'panelled',
            sectionCadence: 'contrast',
            surfaceStyle: 'tinted',
            cardTreatment: 'elevated'
        },
        {
            id: 'urgent_minimal',
            weight: 0.20,
            family: 'minimal_luxury',
            personality: 'modern_tech',
            heroTreatment: 'centered',
            heroDisposition: 'content_center',
            contrastModel: 'soft',
            pageComposition: 'trust_first',
            visualSystem: 'minimal',
            sectionCadence: 'breathing',
            surfaceStyle: 'plain',
            cardTreatment: 'ghost'
        }
    ],
    guide: [
        {
            id: 'guide_editorial',
            weight: 0.50,
            family: 'service_magazine',
            personality: 'editorial',
            heroTreatment: 'stacked',
            heroDisposition: 'content_center',
            contrastModel: 'soft',
            pageComposition: 'editorial',
            visualSystem: 'editorial',
            sectionCadence: 'flow',
            surfaceStyle: 'flat',
            cardTreatment: 'outlined'
        },
        {
            id: 'guide_luxury',
            weight: 0.25,
            family: 'minimal_luxury',
            personality: 'luxury',
            heroTreatment: 'centered',
            heroDisposition: 'content_center',
            contrastModel: 'soft',
            pageComposition: 'trust_first',
            visualSystem: 'minimal',
            sectionCadence: 'breathing',
            surfaceStyle: 'plain',
            cardTreatment: 'ghost'
        },
        {
            id: 'guide_dark',
            weight: 0.25,
            family: 'editorial_dark',
            personality: 'luxury',
            heroTreatment: 'split',
            heroDisposition: 'split_media_right',
            contrastModel: 'dramatic',
            pageComposition: 'editorial',
            visualSystem: 'panelled',
            sectionCadence: 'contrast',
            surfaceStyle: 'tinted',
            cardTreatment: 'elevated'
        }
    ],
    service_area: [
        {
            id: 'area_split',
            weight: 0.40,
            family: 'premium_split',
            personality: 'modern_tech',
            heroTreatment: 'split',
            heroDisposition: 'split_media_right',
            contrastModel: 'balanced',
            pageComposition: 'local_dense',
            visualSystem: 'grid',
            sectionCadence: 'tight',
            surfaceStyle: 'layered',
            cardTreatment: 'structured'
        },
        {
            id: 'area_trust',
            weight: 0.30,
            family: 'local_trust',
            personality: 'organic',
            heroTreatment: 'proof_first',
            heroDisposition: 'content_left',
            contrastModel: 'soft',
            pageComposition: 'trust_first',
            visualSystem: 'stacked',
            sectionCadence: 'steady',
            surfaceStyle: 'warm',
            cardTreatment: 'soft'
        },
        {
            id: 'area_modern',
            weight: 0.30,
            family: 'authority_modern',
            personality: 'modern_tech',
            heroTreatment: 'cta_heavy',
            heroDisposition: 'content_left',
            contrastModel: 'balanced',
            pageComposition: 'conversion',
            visualSystem: 'panelled',
            sectionCadence: 'contrast',
            surfaceStyle: 'tinted',
            cardTreatment: 'elevated'
        }
    ]
};

export const PAGE_TYPE_DESIGN_PRESETS = {
    // Legacy support while transition is complete
    home_local: {
        art_direction: 'local_trust',
        section_cadence: 'contrast'
    },
    service: {
        art_direction: 'authority_modern',
        section_cadence: 'contrast'
    }
    // ... we will phase this out in favor of DESIGN_FAMILIES
} as any;