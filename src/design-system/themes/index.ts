import type { DesignSystemTheme, DesignSystemThemeId } from '../types.js';
import { editorialLuxury } from './editorialLuxury.js';
import { localAuthority } from './localAuthority.js';
import { modernTrust } from './modernTrust.js';
import { premiumClassic } from './premiumClassic.js';
import { technicalClean } from './technicalClean.js';

import { corporateGoldTheme } from './corporateGold.js';

export const DESIGN_SYSTEM_THEMES: Record<DesignSystemThemeId, DesignSystemTheme> = Object.freeze({
    premiumClassic,
    modernTrust,
    localAuthority,
    editorialLuxury,
    technicalClean,
    corporateGold: corporateGoldTheme
});


export const FAMILY_THEME_MAP = Object.freeze({
    editorial: 'editorialLuxury',
    conversion_heavy: 'corporateGold',
    local_trust: 'corporateGold',
    technical_grid: 'technicalClean',
    asymmetric_premium: 'premiumClassic',
    minimal_authority: 'editorialLuxury'
} as const satisfies Record<string, DesignSystemThemeId>);


function themeFromFamily(family?: string): DesignSystemTheme | null {
    const normalized = String(family || '').trim().toLowerCase();
    if (!normalized) return null;
    if (Object.prototype.hasOwnProperty.call(FAMILY_THEME_MAP, normalized)) {
        return getTheme(FAMILY_THEME_MAP[normalized as keyof typeof FAMILY_THEME_MAP]);
    }
    return null;
}

export function getTheme(themeId: DesignSystemThemeId): DesignSystemTheme {
    return DESIGN_SYSTEM_THEMES[themeId];
}

export function resolveThemeFromDna(dna?: {
    family?: string;
    personality?: string;
    pageComposition?: string;
    heroTreatment?: string;
    cadencePattern?: string;
}): DesignSystemTheme {
    const directFamilyTheme = themeFromFamily(dna?.family);
    if (directFamilyTheme) return directFamilyTheme;

    const personality = String(dna?.personality || '').trim().toLowerCase();
    const pageComposition = String(dna?.pageComposition || '').trim().toLowerCase();
    const heroTreatment = String(dna?.heroTreatment || '').trim().toLowerCase();
    const cadencePattern = String(dna?.cadencePattern || '').trim().toLowerCase();

    if (pageComposition === 'editorial' || personality === 'editorial') {
        return editorialLuxury;
    }

    if (personality === 'luxury') {
        return premiumClassic;
    }

    if (heroTreatment === 'proof_first' || heroTreatment === 'proof-first') {
        return localAuthority;
    }

    if (pageComposition === 'conversion') {
        return modernTrust;
    }

    if (cadencePattern === 'calm' && personality === 'organic') {
        return localAuthority;
    }

    return technicalClean;
}

export * from './premiumClassic.js';
export * from './modernTrust.js';
export * from './localAuthority.js';
export * from './editorialLuxury.js';
export * from './technicalClean.js';
export * from './corporateGold.js';

