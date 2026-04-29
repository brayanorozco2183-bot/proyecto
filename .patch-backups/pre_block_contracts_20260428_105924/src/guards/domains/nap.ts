import * as cheerio from 'cheerio';
import type { GuardContext, GuardIssue, HtmlGuardResult } from '../types.js';
import { createIssue } from '../types.js';

function escapeRx(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function runNapGuard(html: string, context: GuardContext): HtmlGuardResult {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const issues: GuardIssue[] = [];

  if (context.city && !new RegExp(escapeRx(context.city), 'i').test(text)) {
    issues.push(createIssue('nap', 'CITY_SIGNAL_MISSING', `No se detecta la ciudad esperada en el cuerpo: ${context.city}`, 'error'));
  }

  if (context.phone && !$(`a[href^="tel:"]`).length && !text.includes(context.phone)) {
    issues.push(createIssue('nap', 'PHONE_SIGNAL_MISSING', 'No se detecta teléfono visible ni enlace tel: en la página.', 'warning'));
  }

  if (context.businessName && !text.toLowerCase().includes(context.businessName.toLowerCase())) {
    issues.push(createIssue('nap', 'BUSINESS_NAME_SIGNAL_MISSING', 'El nombre comercial no aparece de forma visible.', 'warning'));
  }

  return { html: $.html(), issues };
}
