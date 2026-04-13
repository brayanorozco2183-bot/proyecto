import { z } from 'zod';

const sectionSchema = z.object({
  section_id: z.string().default('urgencia'),
  block_type: z.literal('urgency_panel'),
  h2: z.string().optional(),
  h3s: z.array(z.string()).default([]),
  preferred_format: z.string().optional(),
  layout_hint: z.string().optional(),
  visual_variant: z.string().optional(),
  content_density: z.enum(['compact', 'standard', 'rich']).optional(),
  emphasis: z.enum(['content', 'trust', 'cta']).optional(),
  target_words: z.number().optional()
});

const contextSchema = z.object({
  city: z.string().optional(),
  niche: z.string().optional(),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  ctaHref: z.string().optional(),
  labels: z.record(z.string()).optional()
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

export const URGENCYPANELVARIANTS = ['sidebar_alert', 'status_banner', 'command_center'] as const;
export type UrgencyPanelVariant = typeof URGENCYPANELVARIANTS[number];

export const UrgencyPanelPayloadSchema = z.object({
  section: sectionSchema,
  semantic: semanticSchema.default({ intro: [], bullets: [], trustBullets: [] }),
  contract: z.any().optional(),
  context: contextSchema.optional()
});

export type UrgencyPanelPayload = z.infer<typeof UrgencyPanelPayloadSchema>;
