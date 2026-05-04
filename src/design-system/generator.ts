import { ArtDirection, ProceduralVariant, DesignTokens, LayoutFamily } from './types.js';
import { Random, generateHarmoniousPalette } from './generators/colors.js';
import { generateTokens } from './generators/tokens.js';

/**
 * Main Design Generator with Art Direction and Procedural Grammar
 */
export class DesignGenerator {
    private rng: Random;
    private seed: string;

    constructor(seed: string) {
        this.seed = seed;
        this.rng = new Random(seed);
    }

    generate(): ProceduralVariant {
        // 1. Select an Art Direction (The High-Level Intent)
        const artDirection = this.selectArtDirection();

        // 2. Generate Fluid Tokens based on Art Direction
        const tokens = generateTokens(this.rng, artDirection);

        // 3. Generate Harmony-based Palette with Art Direction constraints
        const colors = generateHarmoniousPalette(this.rng, artDirection);
        tokens.colors = colors;

        // 4. Component Directional Selection
        const componentSelection = this.selectArtDirectedComponents(artDirection);

        return {
            seed: this.seed,
            artDirection,
            tokens,
            sectionsOrder: this.generateCoherentSectionOrder(artDirection),
            componentSelection,
            family: artDirection // Legacy support
        };
    }

    private selectArtDirection(): ArtDirection {
        const directions: ArtDirection[] = [
            'premium_split', 'editorial_dark', 'local_trust',
            'conversion_clean', 'minimal_luxury', 'technical_grid',
            'service_magazine', 'authority_modern'
        ] as any;
        return this.rng.pick(directions);
    }

    private selectArtDirectedComponents(direction: ArtDirection): Record<string, string> {
        // Map Art Direction to the most compatible legacy families for now
        // This can be expanded as new premium components are added
        const legacyFamilyMap: Record<string, LayoutFamily> = {
            premium_split: 'premium',
            editorial_dark: 'minimal',
            local_trust: 'classic',
            conversion_clean: 'modern',
            minimal_luxury: 'minimal',
            technical_grid: 'modern',
            service_magazine: 'minimal',
            authority_modern: 'premium'
        };

        const family = legacyFamilyMap[direction];

        return {
            hero: `${family}_hero_v1`,
            services: `${family}_services_v1`,
            about: `${family}_about_v1`,
            faq: `${family}_faq_v1`,
            contact: `${family}_contact_v1`
        };
    }

    private generateCoherentSectionOrder(direction: ArtDirection): string[] {
        // Rhythmic structures based on intent
        const rhythms: Record<string, string[]> = {
            editorial_dark: ['experiencia', 'servicios', 'about', 'faq', 'cobertura'],
            premium_split: ['servicios', 'experiencia', 'about', 'faq', 'cobertura'],
            technical_grid: ['servicios', 'cobertura', 'experiencia', 'about', 'faq'],
            local_trust: ['cobertura', 'servicios', 'experiencia', 'about', 'faq'],
            conversion_clean: ['servicios', 'experiencia', 'faq', 'about', 'cobertura'],
            minimal_luxury: ['about', 'servicios', 'experiencia', 'faq', 'cobertura'],
            service_magazine: ['servicios', 'experiencia', 'about', 'faq', 'cobertura'],
            authority_modern: ['servicios', 'experiencia', 'about', 'faq', 'cobertura']
        };

        const base = rhythms[direction] || rhythms.minimal_trust;

        // Add a slight shuffle but keep the focus
        if (this.rng.next() > 0.7) {
            const mid = base.slice(1, -1).sort(() => this.rng.next() - 0.5);
            return [base[0], ...mid, base[base.length - 1]];
        }

        return base;
    }
}
