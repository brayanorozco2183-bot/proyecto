import * as cheerio from 'cheerio';
import { z } from 'zod';
import type { GuardContext, GuardIssue, HtmlGuardResult } from '../types.js';
import { createIssue, isRecord } from '../types.js';

const JsonLdNodeSchema = z.record(z.string(), z.unknown());

function normalizeJsonLdNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonLdNode);
  if (!isRecord(value)) return value;

  const parsed = JsonLdNodeSchema.safeParse(value);
  if (!parsed.success) return value;

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(parsed.data)) {
    if (typeof raw === 'string') {
      output[key] = raw.replace(/\s+/g, ' ').trim();
    } else {
      output[key] = normalizeJsonLdNode(raw);
    }
  }
  return output;
}

export function runSchemaGuard(html: string, _context: GuardContext): HtmlGuardResult {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  const issues: GuardIssue[] = [];

  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text();
    try {
      const parsed: unknown = JSON.parse(raw);
      $(el).text(JSON.stringify(normalizeJsonLdNode(parsed)));
    } catch {
      issues.push(createIssue('schema', 'SCHEMA_JSON_INVALID', 'JSON-LD inválido detectado en script application/ld+json.', 'critical'));
    }
  });

  if ($('script[type="application/ld+json"]').length === 0) {
    issues.push(createIssue('schema', 'SCHEMA_MISSING', 'No se detecta JSON-LD en la página.', 'error'));
  }

  return { html: $.html(), issues };
}
