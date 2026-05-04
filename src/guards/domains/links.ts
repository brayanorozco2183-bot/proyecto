import * as cheerio from 'cheerio';
import type { GuardContext, GuardIssue, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

function normalizeAnchorText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function runLinksGuard(html: string, _context: GuardContext): HtmlGuardResult {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  const issues: GuardIssue[] = [];
  const knownIds = new Set($('[id]').map((_i, el) => String($(el).attr('id') || '').trim()).get().filter(Boolean));

  $('a[href^="#"]').each((_i, el) => {
    const href = String($(el).attr('href') || '').replace(/^#/, '').trim();
    if (href && !knownIds.has(href)) {
      $(el).attr('href', '#contacto');
      issues.push(createIssue('links', 'BROKEN_INTERNAL_ANCHOR_REPAIRED', `Anchor interno roto redirigido a #contacto: ${href}`, 'warning'));
    }
  });

  $('a').each((_i, el) => {
    const text = normalizeAnchorText($(el).text());
    if (/^(ver más|más información|leer más|clic aquí|aquí)$/.test(text)) {
      issues.push(createIssue('links', 'GENERIC_ANCHOR_TEXT', 'Texto ancla genérico detectado; conviene hacerlo contextual al servicio o ciudad.', 'warning', [text]));
    }
  });

  return { html: $.html(), issues };
}
