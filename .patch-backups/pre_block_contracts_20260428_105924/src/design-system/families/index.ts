import { FamilyDefinition } from './types.js';
import { editorialFamily } from './editorialFamily.js';
import { conversionHeavyFamily } from './conversionHeavyFamily.js';
import { localTrustFamily } from './localTrustFamily.js';
import { technicalGridFamily } from './technicalGridFamily.js';
import { asymmetricPremiumFamily } from './asymmetricPremiumFamily.js';
import { minimalAuthorityFamily } from './minimalAuthorityFamily.js';

export const DEFAULT_FAMILY_ID = 'minimal_authority' as const;

export const FAMILY_IDS = [
    'editorial',
    'conversion_heavy',
    'local_trust',
    'technical_grid',
    'asymmetric_premium',
    'minimal_authority'
] as const;

export type FamilyId = typeof FAMILY_IDS[number];

function css(strings: TemplateStringsArray, ...values: Array<string | number>): string {
    return String.raw(strings, ...values).trim();
}

const registry = {
    editorial: editorialFamily,
    conversion_heavy: conversionHeavyFamily,
    local_trust: localTrustFamily,
    technical_grid: technicalGridFamily,
    asymmetric_premium: asymmetricPremiumFamily,
    minimal_authority: minimalAuthorityFamily
} satisfies Record<FamilyId, FamilyDefinition>;

export const FAMILY_LIBRARY: Readonly<Record<FamilyId, FamilyDefinition>> = Object.freeze(registry);

const cssOverrides = {
    editorial: css`
        :root {
            --font-display: 'Playfair Display', serif;
            --font-body: 'Crimson Text', serif;
        }

        .family-editorial .el-section { padding: 12rem 0; }
        .family-editorial .shell-editorial { border-left: 1px solid var(--border); padding-left: 4rem; }
        .family-editorial .rich-content { max-width: 720px; margin: 0 auto; letter-spacing: -0.01em; }
        .family-editorial .hero__eyebrow {
            font-family: var(--font-body);
            font-style: italic;
            text-transform: none;
            border-bottom: 1px solid var(--primary);
            border-radius: 0;
            background: none;
            padding: 0 0 4px 0;
        }
        .family-editorial .semantic-card {
            border: none !important;
            border-bottom: 1px solid var(--border) !important;
            border-radius: 0 !important;
            padding: 2rem 0 !important;
            box-shadow: none !important;
        }
        .family-editorial .site-header { border-bottom: 4px double var(--border); }
        .family-editorial .map-block__frame,
        .family-editorial .map-wrapper,
        .family-editorial .map-boxed-wrapper {
            border-radius: 0;
            box-shadow: none;
            border-left: 3px solid var(--primary);
        }
        .family-editorial .urgency-banner,
        .family-editorial .section-cta--terminal {
            border-radius: 0;
            box-shadow: none;
            border-left: 3px solid var(--primary);
        }
    `,

    conversion_heavy: css`
        .family-conversion_heavy {
            --font-display: 'Inter', sans-serif;
            --font-body: 'Inter', sans-serif;
            --radius: 1rem;
            --radius-btn: 999px;
        }

        .family-conversion_heavy .hero__minimal,
        .family-conversion_heavy .hero__shell,
        .family-conversion_heavy .hero__shell--centered {
            color: var(--text);
        }
        .family-conversion_heavy .hero__eyebrow {
            background: rgba(var(--primary-rgb), 0.10);
            color: var(--primary);
            transform: none;
            border: 1px solid rgba(var(--primary-rgb), 0.18);
        }
        .family-conversion_heavy .cta-primary {
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
            border-radius: var(--radius-btn);
        }
        .family-conversion_heavy .nav__cta,
        .family-conversion_heavy .cta-row .cta-primary,
        .family-conversion_heavy .block__cta-group .cta-primary {
            width: auto;
            min-width: min(100%, 15rem);
        }
        .family-conversion_heavy .shell-band {
            background: linear-gradient(45deg, var(--surface), var(--surface-alt));
            border-left: 4px solid var(--primary);
        }
        .family-conversion_heavy .semantic-card {
            background: var(--surface);
            border: 1px solid rgba(var(--primary-rgb), 0.12);
            box-shadow: var(--shadow-soft);
        }
        .family-conversion_heavy .site-header { border-bottom: none; }
        .family-conversion_heavy .urgency-banner,
        .family-conversion_heavy .section-cta--terminal {
            border: 1px solid rgba(var(--primary-rgb), 0.16);
            border-radius: calc(var(--radius-card) + 0.15rem);
            box-shadow: var(--shadow-lift);
        }
        .family-conversion_heavy .map-block__frame,
        .family-conversion_heavy .map-wrapper,
        .family-conversion_heavy .map-boxed-wrapper {
            border: 1px solid rgba(var(--primary-rgb), 0.14);
            border-radius: calc(var(--radius-card) + 0.15rem);
            box-shadow: var(--shadow-lift);
        }
    `,

    local_trust: css`
        :root {
            --font-display: 'Space Grotesk', sans-serif;
            --font-body: 'IBM Plex Sans', sans-serif;
            --radius: 24px;
            --radius-btn: 99px;
        }

        .family-local_trust .el-section { padding: 7rem 0; }
        .family-local_trust .hero__eyebrow {
            background: rgba(var(--primary-rgb), 0.08);
            color: var(--primary);
            border: 1px solid rgba(var(--primary-rgb), 0.16);
        }
        .family-local_trust .semantic-card {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-soft);
            text-align: left;
        }
        .family-local_trust .semantic-card:hover {
            border-color: rgba(var(--primary-rgb), 0.22);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
        }
        .family-local_trust .shell-panel { border-radius: 40px; border-style: solid; }
        .family-local_trust .site-header {
            margin: 0;
            border-radius: 0;
            box-shadow: none;
        }
        .family-local_trust .service-card, .family-local_trust .proof-card, .family-local_trust .step-card {
            border-radius: 1.35rem;
            padding: clamp(1.15rem, 2vw, 1.45rem);
        }
        .family-local_trust .services-grid__cards,
        .family-local_trust .local-proof__grid,
        .family-local_trust .process-steps__timeline,
        .family-local_trust .semantic-items {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: clamp(1rem, 2vw, 1.5rem);
        }
        .family-local_trust .faq-block__accordion,
        .family-local_trust .faq-block__editorial-list {
            max-width: 980px;
        }
        .family-local_trust .urgency-banner,
        .family-local_trust .section-cta--terminal,
        .family-local_trust .map-block__frame,
        .family-local_trust .map-wrapper,
        .family-local_trust .map-boxed-wrapper {
            border-radius: 1.6rem;
            border-color: rgba(var(--primary-rgb), 0.16);
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94));
        }
        @media (max-width: 960px) {
            .family-local_trust .services-grid__cards,
            .family-local_trust .local-proof__grid,
            .family-local_trust .process-steps__timeline,
            .family-local_trust .semantic-items {
                grid-template-columns: 1fr;
            }
        }
    `,
    technical_grid: css`
        body.family-technical_grid {
            background:
                radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.08), transparent 30%),
                radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 24%),
                linear-gradient(180deg, #f8fafc 0%, #eef3f8 100%);
        }

        body.family-technical_grid::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(255,255,255,0));
            z-index: -1;
        }

        .family-technical_grid .site-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            padding: 1rem 0;
            background: rgba(255,255,255,0.58);
            backdrop-filter: blur(18px);
            box-shadow: 0 8px 30px rgba(15,23,42,0.05);
            border-bottom: none;
        }

        .family-technical_grid .site-header__inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            padding: 0.8rem 1rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.72);
            border: 1px solid rgba(255,255,255,0.75);
            box-shadow: 0 10px 30px rgba(15,23,42,0.06);
        }

        .family-technical_grid .nav {
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .family-technical_grid .nav__link {
            padding: 0.7rem 0.95rem;
            border-radius: 999px;
        }

        .family-technical_grid .nav__link:hover {
            background: rgba(15,23,42,0.05);
        }

        .family-technical_grid .hero {
            padding: 1.25rem 0 0;
            background: transparent;
        }

        .family-technical_grid .services-grid__cards,
        .family-technical_grid .local-proof__grid,
        .family-technical_grid .process-steps__timeline,
        .family-technical_grid .semantic-items {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: clamp(1rem, 2vw, 1.35rem);
        }
        .family-technical_grid .cta-panel__banner {
            border-radius: calc(var(--radius-card) + 0.25rem);
        }


        .family-technical_grid .hero__minimal,
        .family-technical_grid .semantic-section__container,
        .family-technical_grid .block-section > .el-container,
        .family-technical_grid .el-section.vibe-premium > .el-container {
            position: relative;
            overflow: hidden;
            background: rgba(255,255,255,0.76);
            border: 1px solid rgba(255,255,255,0.82);
            box-shadow: var(--shadow-soft);
            border-radius: calc(var(--radius) + 0.2rem);
            backdrop-filter: blur(12px);
            padding: clamp(1.25rem, 3vw, 2rem);
        }

        .family-technical_grid .hero__minimal {
            max-width: 860px;
            padding: clamp(2rem, 4.5vw, 4rem);
            background:
                radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 28%),
                linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94));
            box-shadow: var(--shadow-lift);
        }

        .family-technical_grid .hero__eyebrow,
        .family-technical_grid .block__eyebrow,
        .family-technical_grid .card__eyebrow {
            display: inline-flex;
            align-items: center;
            padding: 0.58rem 0.95rem;
            border-radius: 999px;
            background: rgba(var(--primary-rgb), 0.08);
            border: 1px solid rgba(var(--primary-rgb), 0.16);
            color: var(--primary);
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-size: 0.82rem;
            margin-bottom: 1rem;
        }

        .family-technical_grid .el-breadcrumbs {
            padding: 1rem 0;
            background: transparent;
            border-bottom: none;
        }

        .family-technical_grid .el-breadcrumbs__list {
            background: rgba(255,255,255,0.72);
            border: 1px solid rgba(255,255,255,0.75);
            box-shadow: 0 10px 30px rgba(15,23,42,0.05);
            border-radius: 999px;
            padding: 0.7rem 1rem;
            width: max-content;
            max-width: 100%;
        }

        .family-technical_grid .semantic-card,
        .family-technical_grid .service-card,
        .family-technical_grid .proof-card,
        .family-technical_grid .step-card,
        .family-technical_grid .urgency-layout__copy,
        .family-technical_grid .faq-item {
            position: relative;
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94));
            border: 1px solid var(--border);
            border-radius: 1.3rem;
            box-shadow: 0 12px 32px rgba(15,23,42,0.06);
        }

        .family-technical_grid .semantic-card,
        .family-technical_grid .service-card,
        .family-technical_grid .proof-card,
        .family-technical_grid .step-card,
        .family-technical_grid .urgency-layout__copy {
            padding: 1.4rem;
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .family-technical_grid .semantic-card:hover,
        .family-technical_grid .service-card:hover,
        .family-technical_grid .proof-card:hover,
        .family-technical_grid .step-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 18px 40px rgba(15,23,42,0.10);
            border-color: rgba(var(--primary-rgb), 0.25);
        }

        .family-technical_grid .service-card__badge,
        .family-technical_grid .step-card__index {
            display: inline-grid;
            place-items: center;
            width: 2.45rem;
            height: 2.45rem;
            border-radius: 999px;
            background: rgba(var(--primary-rgb), 0.10);
            border: 1px solid rgba(var(--primary-rgb), 0.14);
            color: var(--primary);
            font-weight: 900;
            margin-bottom: 1rem;
        }

        .family-technical_grid .proof-card__label {
            display: block;
            font-family: var(--font-display);
            font-size: 1.08rem;
            font-weight: 800;
            margin-bottom: 0.8rem;
        }

        .family-technical_grid .services-grid__cards,
        .family-technical_grid .local-proof__grid,
        .family-technical_grid .process-steps__timeline,
        .family-technical_grid .semantic-items {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
            margin-top: 1.4rem;
        }

        .family-technical_grid .urgency-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(250px, 0.65fr);
            gap: 1rem;
            align-items: stretch;
            margin-top: 1rem;
        }

        .family-technical_grid .block__cta-group {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 1.5rem;
        }

        .family-technical_grid .block__cta-phone {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 3.2rem;
            padding: 0 1.1rem;
            border-radius: 999px;
            background: rgba(15,23,42,0.04);
            border: 1px solid var(--border);
            font-weight: 800;
        }

        .family-technical_grid .cta-primary,
        .family-technical_grid .cta-link--high {
            border-radius: 999px;
        }

        .family-technical_grid .urgency-banner,
        .family-technical_grid .section-cta--terminal,
        .family-technical_grid .map-block__frame,
        .family-technical_grid .map-wrapper,
        .family-technical_grid .map-boxed-wrapper {
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94));
            border: 1px solid rgba(255,255,255,0.82);
            box-shadow: 0 16px 38px rgba(15,23,42,0.08);
        }
    `,

    asymmetric_premium: css`
        .family-asymmetric_premium .hero .el-container,
        .family-asymmetric_premium .pattern-section_two_column_story {
            align-items: end;
        }

        .family-asymmetric_premium .hero__minimal {
            max-width: 760px;
            margin-left: auto;
        }

        .family-asymmetric_premium .semantic-card {
            border-radius: 32px 8px 32px 8px;
            box-shadow: var(--shadow-lg);
            border: 1px solid rgba(var(--primary-rgb), 0.16);
        }

        .family-asymmetric_premium .site-header {
            border: none;
            background: linear-gradient(to bottom, rgba(0,0,0,0.18), transparent);
        }

        .family-asymmetric_premium .hero__eyebrow {
            background: transparent;
            border: 1px solid rgba(var(--primary-rgb), 0.35);
            backdrop-filter: blur(10px);
        }
        .family-asymmetric_premium .urgency-banner,
        .family-asymmetric_premium .section-cta--terminal {
            border-radius: 32px 12px 32px 12px;
        }
        .family-asymmetric_premium .map-block__frame,
        .family-asymmetric_premium .map-wrapper,
        .family-asymmetric_premium .map-boxed-wrapper {
            border-radius: 36px 10px 36px 10px;
        }
    `,

    minimal_authority: css`
        .family-minimal_authority .site-header {
            border-bottom: 1px solid var(--border);
            box-shadow: none;
        }

        .family-minimal_authority .hero,
        .family-minimal_authority .shell-panel,
        .family-minimal_authority .shell-band {
            background: transparent;
        }

        .family-minimal_authority .semantic-card {
            border: none;
            border-top: 1px solid var(--border);
            border-radius: 0;
            padding-left: 0;
            padding-right: 0;
            box-shadow: none;
        }

        .family-minimal_authority .hero__eyebrow {
            background: none;
            border: none;
            padding: 0;
            color: var(--muted);
        }

        .family-minimal_authority .cta-primary {
            border-radius: 6px;
            box-shadow: none;
        }
        .family-minimal_authority .urgency-banner,
        .family-minimal_authority .section-cta--terminal,
        .family-minimal_authority .map-block__frame,
        .family-minimal_authority .map-wrapper,
        .family-minimal_authority .map-boxed-wrapper {
            border-radius: 0.9rem;
            box-shadow: none;
            background: #fff;
        }
    `
} satisfies Record<FamilyId, string>;

export const familyCSSOverrides: Readonly<Record<FamilyId, string>> = Object.freeze(cssOverrides);

function normalizeFamilyId(input?: string): FamilyId | null {
    if (!input) return null;

    const normalized = input.trim().toLowerCase().replace(/-/g, '_');
    return (normalized in FAMILY_LIBRARY ? normalized : null) as FamilyId | null;
}

export function hasFamilyDefinition(familyId?: string): boolean {
    return normalizeFamilyId(familyId) !== null;
}

export function getFamilyDefinition(familyId?: string): FamilyDefinition {
    const normalized = normalizeFamilyId(familyId);
    return FAMILY_LIBRARY[normalized ?? DEFAULT_FAMILY_ID];
}

export function getFamilyCSSOverride(familyId?: string): string {
    const normalized = normalizeFamilyId(familyId);
    return familyCSSOverrides[normalized ?? DEFAULT_FAMILY_ID];
}

export function getFamilyIds(): readonly FamilyId[] {
    return FAMILY_IDS;
}

function validateFamilyRegistry(): void {
    for (const id of FAMILY_IDS) {
        const definition = FAMILY_LIBRARY[id];

        if (definition.id !== id) {
            throw new Error(
                `[design-system/families] Family id mismatch: registry key "${id}" !== definition.id "${definition.id}".`
            );
        }

        if (!(id in familyCSSOverrides)) {
            throw new Error(
                `[design-system/families] Missing CSS override entry for family "${id}".`
            );
        }
    }
}

validateFamilyRegistry();

export type { FamilyDefinition };