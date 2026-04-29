import { z } from 'zod';
const sectionSchema = z.object({
    section_id: z.string().default('comparativa-servicios'),
    block_type: z.literal('comparison_table'),
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
const itemSchema = z.object({
    title: z.string(),
    body: z.string(),
    meta: z.array(z.string()).default([])
});
const tableSchema = z.object({
    columns: z.array(z.string()).default([]),
    rows: z.array(z.array(z.string())).default([])
});
const semanticSchema = z.object({
    intro: z.array(z.string()).default([]),
    table: tableSchema.optional(),
    items: z.array(itemSchema).default([]),
    bullets: z.array(z.string()).default([]),
    cta: ctaSchema.optional()
});
export const COMPARISONTABLEVARIANTS = ['matrix_clean', 'matrix_bold'];
export const ComparisonTablePayloadSchema = z.object({
    section: sectionSchema,
    semantic: semanticSchema.default({ intro: [], items: [], bullets: [] }),
    contract: z.any().optional(),
    context: contextSchema.optional()
});
