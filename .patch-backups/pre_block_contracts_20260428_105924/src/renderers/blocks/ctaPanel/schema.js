import { z } from 'zod';
const sectionSchema = z.object({
    section_id: z.string().default('contacto'),
    block_type: z.literal('cta_panel'),
    h2: z.string().optional(),
    h3s: z.array(z.string()).default([]),
    preferred_format: z.string().optional(),
    layout_hint: z.string().optional(),
    visual_variant: z.string().optional(),
    content_density: z.enum(['compact', 'standard', 'rich']).optional(),
    emphasis: z.enum(['content', 'trust', 'cta']).optional(),
    target_words: z.number().optional(),
    visual_spec: z.object({
        spacingProfile: z.string().optional(),
        emphasis: z.string().optional(),
        mobilePattern: z.string().optional(),
        decorativeLevel: z.string().optional()
    }).partial().optional()
});
const contextSchema = z.object({
    city: z.string().optional(),
    niche: z.string().optional(),
    businessName: z.string().optional(),
    phone: z.string().optional(),
    mapEmbedUrl: z.string().optional(),
    ctaHref: z.string().optional(),
    labels: z.record(z.string(), z.string()).optional()
}).partial();
const ctaSchema = z.object({
    text: z.string().optional(),
    phone: z.string().optional(),
    note: z.string().optional()
}).partial();
const semanticSchema = z.object({
    intro: z.array(z.string()).default([]),
    bullets: z.array(z.string()).default([]),
    trustBullets: z.array(z.string()).default([]),
    cta: ctaSchema.optional()
});
export const CTAPANELVARIANTS = ['minimal_phone_bar', 'luxury_banner'];
export const CtaPanelPayloadSchema = z.object({
    section: sectionSchema,
    semantic: semanticSchema.default({ intro: [], bullets: [], trustBullets: [] }),
    contract: z.any().optional(),
    context: contextSchema.optional()
});
