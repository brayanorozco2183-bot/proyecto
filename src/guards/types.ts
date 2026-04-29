import { z } from 'zod';

export const GuardDomainSchema = z.enum([
  'seo',
  'legal',
  'html',
  'layout',
  'copy',
  'links',
  'nap',
  'schema'
]);

export type GuardDomain = z.infer<typeof GuardDomainSchema>;

export const GuardSeveritySchema = z.enum(['info', 'warning', 'error', 'critical']);
export type GuardSeverity = z.infer<typeof GuardSeveritySchema>;

export const GuardContextSchema = z.object({
  city: z.string().optional(),
  niche: z.string().optional(),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  canonical: z.string().optional(),
  pageId: z.string().optional()
}).passthrough();

export type GuardContext = z.infer<typeof GuardContextSchema>;

export const GuardIssueSchema = z.object({
  domain: GuardDomainSchema,
  code: z.string(),
  severity: GuardSeveritySchema.default('warning'),
  message: z.string(),
  evidence: z.array(z.string()).optional()
});

export type GuardIssue = z.infer<typeof GuardIssueSchema>;

export interface HtmlGuardResult {
  html: string;
  issues: GuardIssue[];
}

export interface HtmlGuard {
  domain: GuardDomain;
  run(html: string, context: GuardContext): HtmlGuardResult;
}

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(record: UnknownRecord | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function parseGuardContext(value: unknown): GuardContext {
  return GuardContextSchema.parse(value ?? {});
}

function normalizeIssueCode(value: unknown, fallback = 'UNKNOWN_GUARD_ISSUE'): string {
  const raw = String(value ?? '').trim();
  const normalized = raw
    .replace(/[^A-Za-z0-9_:-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized || fallback;
}

function normalizeIssueMessage(value: unknown, fallback: string): string {
  const message = String(value ?? '').replace(/\s+/g, ' ').trim();
  return message || fallback;
}

function normalizeSeverity(value: unknown): GuardSeverity {
  const parsed = GuardSeveritySchema.safeParse(value);
  return parsed.success ? parsed.data : 'warning';
}

export function createIssue(
  domain: GuardDomain,
  code: unknown,
  message: unknown,
  severity: unknown = 'warning',
  evidence?: string[],
): GuardIssue {
  const safeCode = normalizeIssueCode(code);
  return GuardIssueSchema.parse({
    domain,
    code: safeCode,
    severity: normalizeSeverity(severity),
    message: normalizeIssueMessage(message, safeCode),
    evidence,
  });
}
