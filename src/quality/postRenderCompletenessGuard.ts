import * as cheerio from 'cheerio';

export interface CompletenessIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface CompletenessResult {
  passed: boolean;
  score: number;
  issues: CompletenessIssue[];
}

const EMPTY_BLOCK_SELECTORS: Array<{ selector: string; code: string; message: string }> = [
  { selector: '.services-grid__cards:empty', code: 'EMPTY_SERVICES_GRID', message: 'services_grid rendered without cards.' },
  { selector: '.process-steps__timeline:empty', code: 'EMPTY_PROCESS_STEPS', message: 'process_steps rendered without steps.' },
  { selector: '.local-proof__grid:empty', code: 'EMPTY_LOCAL_PROOF', message: 'local_proof rendered without local evidence.' },
  { selector: '.faq-block__editorial-list:empty', code: 'EMPTY_FAQ', message: 'faq rendered without faqItems.' },
  { selector: '.trust-band__items:empty, .trust-band__icons:empty', code: 'EMPTY_TRUST_BAND', message: 'trust_band rendered without trust labels.' }
];

const PLACEHOLDER_PATTERNS = [
  { code: 'MAP_PLACEHOLDER', regex: /Inserta aquí el embed controlado/i, message: 'Map placeholder leaked into production HTML.' },
  { code: 'DEBUG_PLACEHOLDER', regex: /pendiente de hidratar/i, message: 'Debug placeholder found in production HTML.' },
  { code: 'EMPTY_BREADCRUMB_NAME', regex: /itemprop="name"\s*>\s*<\/span>/i, message: 'Breadcrumb visual renderer emitted empty names.' },
  { code: 'ROGUE_BLOCK_CLASS', regex: /\bblock-sectionheader\b|\bblocktitle\b|\bfaq-blockeditorial-list\b/i, message: 'Collapsed or rogue classes detected in rendered HTML.' },
  { code: 'BROKEN_TAG_SOUP', regex: /<span[^>]*>[^<]*<\/h[1-6]>|<a[^>]*>\s*<li\b|<style[^>]*>[^<]*<\/a>/i, message: 'Rendered HTML contains broken tag soup.' }
];

export function validateRenderCompleteness(html: string): CompletenessResult {
  const $ = cheerio.load(html);
  const issues: CompletenessIssue[] = [];
  let score = 100;

  for (const rule of EMPTY_BLOCK_SELECTORS) {
    if ($(rule.selector).length > 0) {
      issues.push({ code: rule.code, severity: 'error', message: rule.message });
      score -= 20;
    }
  }

  for (const rule of PLACEHOLDER_PATTERNS) {
    if (rule.regex.test(html)) {
      issues.push({ code: rule.code, severity: 'error', message: rule.message });
      score -= 20;
    }
  }

  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();
  if (visibleText.split(' ').length < 650) {
    issues.push({ code: 'LOW_VISIBLE_WORD_COUNT', severity: 'warning', message: 'Visible body text is too short for a BOFU/local service page.' });
    score -= 10;
  }

  return {
    passed: !issues.some((i) => i.severity === 'error') && score >= 70,
    score: Math.max(0, score),
    issues
  };
}