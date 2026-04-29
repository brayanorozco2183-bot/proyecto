import { z } from 'zod';


const sectionSchema = z.object({
  section_id: z.string().default('faq'),
  block_type: z.literal('faq'),
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

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string()
});

const semanticSchema = z.object({
  intro: z.array(z.string()).default([]),
  faqItems: z.array(faqItemSchema).default([]),
  cta: ctaSchema.optional()
});


export const FAQVARIANTS = ['accordion_clean', 'editorial_list'] as const;
export type FaqVariant = typeof FAQVARIANTS[number];

export const FaqPayloadSchema = z.object({
  section: sectionSchema,
  semantic: semanticSchema.default({ intro: [], faqItems: [] }),
  contract: z.unknown().optional(),
  context: contextSchema.optional()
});

export type FaqPayload = z.infer<typeof FaqPayloadSchema>;