import { z } from 'zod';


const contextSchema = z.object({
  city: z.string().optional(),
  niche: z.string().optional(),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  mapEmbedUrl: z.string().optional(),
  ctaHref: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional()
}).partial();


export const HEROVARIANTS = ['split_premium', 'centered_clean', 'stacked_dark'] as const;
export type HeroVariant = typeof HEROVARIANTS[number];

const heroSchema = z.object({
  block_type: z.enum(['hero_trust', 'hero']).default('hero_trust'),
  h1: z.string().min(1),
  subtitle: z.string().optional(),
  trust_bullets: z.array(z.string()).default([]),
  cta_text: z.string().optional(),
  secondary_cta_text: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  niche: z.string().optional(),
  hero_eyebrow: z.string().optional(),
  hero_card_eyebrow: z.string().optional(),
  hero_card_title: z.string().optional(),
  hero_card_text: z.string().optional(),
  visual_variant: z.string().optional()
});

export const HeroPayloadSchema = z.object({
  hero: heroSchema,
  contract: z.any().optional(),
  context: contextSchema.optional()
});

export type HeroPayload = z.infer<typeof HeroPayloadSchema>;