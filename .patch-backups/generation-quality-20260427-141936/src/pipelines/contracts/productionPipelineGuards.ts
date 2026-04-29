import * as cheerio from 'cheerio';
import type { PhaseIssue } from './pipelinePhaseContract.js';

const PLACEHOLDER_RE = /\[(?:ciudad|nicho|servicio|nombre|empresa|phone|telefono|placeholder|url|title|h1)[^\]]*\]/i;
const INDEX_LINK_RE = /href=["']\/index\.html["']/i;
const VISUAL_PLACEHOLDER_RE = /(placeholder|image-placeholder|data:image\/svg\+xml|via\.placeholder|picsum\.photos|loremflickr)/i;

export function validateProductionHtml(html: string): PhaseIssue[] {
  const issues: PhaseIssue[] = [];
  const $ = cheerio.load(html || '');
  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();

  if (!$('meta[name="viewport"]').length) {
    issues.push({ code: 'MOBILE_VIEWPORT_MISSING', severity: 'critical', message: 'Falta meta viewport en el head.' });
  }
  if (PLACEHOLDER_RE.test(visibleText)) {
    issues.push({ code: 'PLACEHOLDER_OR_BROKEN_COPY', severity: 'critical', message: 'Hay placeholders visibles sin resolver.' });
  }
  if (/\bEn\s*,/.test(visibleText)) {
    issues.push({ code: 'BROKEN_LOCAL_COPY', severity: 'error', message: 'Fragmento local roto detectado: En ,.' });
  }
  if (INDEX_LINK_RE.test(html)) {
    issues.push({ code: 'BROKEN_INTERNAL_LINK', severity: 'error', message: 'Hay enlaces internos a /index.html.' });
  }
  if (VISUAL_PLACEHOLDER_RE.test(html)) {
    issues.push({ code: 'PRODUCTION_PLACEHOLDER_VISUAL', severity: 'error', message: 'Hay visuales placeholder/no productivos.' });
  }

  const visibleFaqCount = $('[data-block="faq"] details, section.faq details, .faq details, .faq-item, [itemtype*="Question"]').length;
  const schemaFaqCount = extractFaqSchemaQuestionCount(html);
  if (schemaFaqCount > 0 && visibleFaqCount > 0 && schemaFaqCount !== visibleFaqCount) {
    issues.push({
      code: 'FAQ_SCHEMA_CONTENT_MISMATCH',
      severity: 'critical',
      message: `FAQ visible (${visibleFaqCount}) no coincide con FAQ schema (${schemaFaqCount}).`,
      evidence: [`visible=${visibleFaqCount}`, `schema=${schemaFaqCount}`]
    });
  }

  return issues;
}

export function repairProductionHtml(html: string, city?: string): string {
  const $ = cheerio.load(html || '', { decodeEntities: false });
  if (!$('head').length) $.root().prepend('<head></head>');
  if (!$('meta[name="viewport"]').length) {
    $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  $('a[href="/index.html"]').attr('href', '/');
  $('a[href$="/index.html"]').each((_, el) => {
    const href = String($(el).attr('href') || '');
    $(el).attr('href', href.replace(/\/index\.html$/, '/'));
  });

  $('body *').contents().each((_, node: any) => {
    if (node.type !== 'text') return;
    let text = String(node.data || '');
    text = text.replace(/^\s*¿\s*\d+\s*¿/g, '¿');
    text = text.replace(/(^|\s)\d+[.)-]\s+(?=¿)/g, '$1');
    text = text.replace(/\[(?:ciudad|nicho|servicio|nombre|empresa|phone|telefono|placeholder|url|title|h1)[^\]]*\]/gi, city || 'la zona');
    if (city) text = text.replace(/\bEn\s*,/g, `En ${city},`);
    node.data = text;
  });

  return $.html();
}

export function extractFaqSchemaQuestionCount(html: string): number {
  const $ = cheerio.load(html || '');
  let count = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [])];
      for (const node of nodes) {
        if (node?.['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) count += node.mainEntity.length;
      }
    } catch {
      // El technicalIntegrityGate debe reportar JSON-LD invalido; aqui solo contamos si es parseable.
    }
  });
  return count;
}
