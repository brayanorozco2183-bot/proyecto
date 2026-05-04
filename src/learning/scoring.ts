import * as cheerio from 'cheerio';
import { OutputReviewInput, OutputReviewResult } from './types.js';
import { excerptText, hashString, normalizeKey, stripHtml, uniqueStrings } from './utils.js';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';
import { scorePremiumOutput } from '../quality/premiumScore.js';
import { hasFaqNumberingArtifact } from '../utils/faqSanitizer.js';

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, pattern) => sum + ((text.match(pattern) || []).length), 0);
}

function hasExact(text: string, needle: string): boolean {
  if (!needle) return false;
  return normalizeKey(text).includes(normalizeKey(needle));
}

function visibleText($: cheerio.CheerioAPI, html: string): string {
  try {
    $('script,style,noscript,template,svg').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  } catch {
    return stripHtml(html);
  }
}

function detectIssueCodes(input: OutputReviewInput, html: string, text: string, $: cheerio.CheerioAPI): { codes: string[]; issues: string[]; metrics: Record<string, number>; strengths: string[] } {
  const codes: string[] = [];
  const issues: string[] = [];
  const strengths: string[] = [];
  const metrics: Record<string, number> = {};

  metrics.totalTextLength = text.length;
  metrics.paragraphCount = $('p').length;
  metrics.h2Count = $('h2').length;
  metrics.h3Count = $('h3').length;
  metrics.faqCount = $('[data-faq-item], .faq-item, .faq-card, .faq-entry').length;
  metrics.technicalInternalLeakCount = countMatches(html, [
    /\bcontract-[a-z0-9_-]+\b/gi,
    /\bskeleton-[a-z0-9_-]+\b/gi,
    /\bfamily-[a-z0-9_-]+\b/gi,
    /\bpattern-[a-z0-9_-]+\b/gi,
    /\bvariant-[a-z0-9_-]+\b/gi,
    /\blayout-hotfix-[a-z0-9_-]+\b/gi,
    /\b(section|block)__eyebrow\b/gi
  ]);
  metrics.internalLeakCount = countMatches(text, [
    /\bcontract-[a-z0-9_-]+\b/gi,
    /\bskeleton-[a-z0-9_-]+\b/gi,
    /\bfamily-[a-z0-9_-]+\b/gi,
    /\bpattern-[a-z0-9_-]+\b/gi,
    /\bvariant-[a-z0-9_-]+\b/gi,
    /\blayout-hotfix-[a-z0-9_-]+\b/gi,
    /\b(section|block)__eyebrow\b/gi,
    /AI Response:|Writing Phase:|Block Index:/gi
  ]);
  metrics.placeholderCount = countMatches(text, [
    /\bplaceholder\b/gi,
    /\bcriterio\s*\d+\b/gi,
    /\bfactor\s*\d+\b/gi,
    /\[[^\]]+\]/gi,
    /\{\{[^}]+\}\}/gi,
    /\ben\s*,/gi,
    /\ben\s+compensa\b/gi,
    /\bundefined\b/gi,
    /\bnull\b/gi,
    /\bobject object\b/gi
  ]);
  metrics.cityMentions = input.city ? (text.match(new RegExp(input.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0;
  metrics.phoneMentions = input.phone ? (html.match(new RegExp(input.phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;
  metrics.brandMentions = input.businessName ? (text.match(new RegExp(input.businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0;

  const cross = detectCrossNicheContamination({ niche: input.niche || '', html });
  metrics.crossNicheHints = cross.hits.length;
  metrics.crossNicheScore = cross.score;

  if (hasFaqNumberingArtifact(html) || hasFaqNumberingArtifact(text)) {
    codes.push('FAQ_NUMBERING_ARTIFACT');
    issues.push('El output contiene numeración residual de FAQ en pregunta visible o schema JSON-LD.');
  }
  if (metrics.placeholderCount > 0) {
    codes.push('PLACEHOLDER_OR_BROKEN_COPY');
    issues.push('El output contiene placeholders, huecos o expresiones rotas como “En ,”, corchetes o variables sin resolver.');
  }
  if (metrics.internalLeakCount > 0) {
    codes.push('SYSTEM_LEAK_VISIBLE');
    issues.push('El texto visible muestra rastros internos del sistema o labels de contrato/layout.');
  }
  if (cross.severity === 'fatal' || cross.severity === 'major') {
    codes.push('CROSS_NICHE_POLLUTION');
    issues.push(cross.summary);
  }
  if (input.city && metrics.cityMentions <= 0) {
    codes.push('CITY_MISSING');
    issues.push('La ciudad no aparece de forma visible en el contenido.');
  } else if (input.city && metrics.cityMentions >= 2) {
    strengths.push('La localidad aparece integrada de forma explícita.');
  }
  if (input.phone && metrics.phoneMentions <= 0) {
    codes.push('PHONE_MISSING');
    issues.push('El teléfono no aparece o fue alterado.');
  } else if (input.phone && metrics.phoneMentions >= 1) {
    strengths.push('El teléfono se mantiene visible.');
  }
  if (input.businessName && input.businessName.length > 2 && metrics.brandMentions >= 1) strengths.push('La marca o nombre comercial se conserva visible.');
  if (metrics.totalTextLength < 1100) {
    codes.push('CONTENT_TOO_THIN');
    issues.push('El contenido visible es demasiado corto para una money page local.');
  } else if (metrics.totalTextLength > 1800) strengths.push('La densidad textual es suficiente para sostener una página local completa.');
  if (metrics.paragraphCount < 6 && metrics.h3Count < 4) {
    codes.push('SECTION_DEPTH_LOW');
    issues.push('La estructura editorial parece demasiado superficial o comprimida.');
  }
  if (metrics.faqCount >= 4) strengths.push('La sección FAQ tiene densidad razonable.');
  if (hasExact(text, input.city) && metrics.placeholderCount === 0 && metrics.crossNicheHints === 0) strengths.push('No hay señales obvias de rotura contextual en la localidad.');

  return { codes: uniqueStrings(codes), issues: uniqueStrings(issues), metrics, strengths: uniqueStrings(strengths) };
}

export function scoreRenderedOutput(input: OutputReviewInput): OutputReviewResult & { htmlHash: string } {
  const html = String(input.html || '');
  const $ = cheerio.load(html);
  const text = visibleText($, html);
  const { codes, issues, metrics, strengths } = detectIssueCodes(input, html, text, $);
  const premium = scorePremiumOutput({ html, city: input.city || '', niche: input.niche || '', phone: input.phone, businessName: input.businessName });

  let score = 100;
  if (codes.includes('PLACEHOLDER_OR_BROKEN_COPY')) score -= 28;
  if (codes.includes('SYSTEM_LEAK_VISIBLE')) score -= 18;
  if (codes.includes('CROSS_NICHE_POLLUTION')) score -= 25;
  if (codes.includes('CITY_MISSING')) score -= 10;
  if (codes.includes('PHONE_MISSING')) score -= 14;
  if (codes.includes('CONTENT_TOO_THIN')) score -= 12;
  if (codes.includes('SECTION_DEPTH_LOW')) score -= 10;

  score = Math.round(score * 0.65 + premium.score * 0.35);
  if ((input.llmScore || 0) > 0) score = Math.round(score * 0.7 + Math.max(0, Math.min(100, input.llmScore || 0)) * 0.3);
  score = Math.max(0, Math.min(100, score));

  let status: OutputReviewResult['status'] = 'rejected';
  const hardBlocks = ['PLACEHOLDER_OR_BROKEN_COPY', 'SYSTEM_LEAK_VISIBLE', 'CROSS_NICHE_POLLUTION', 'PHONE_MISSING', 'FAQ_NUMBERING_ARTIFACT', 'NICHE_CONTRACT_FORBIDDEN_TERM'];
  if (score >= 88 && premium.score >= 88 && !codes.some(code => hardBlocks.includes(code))) status = 'premium';
  else if (score >= 75 && !codes.some(code => ['PLACEHOLDER_OR_BROKEN_COPY', 'CROSS_NICHE_POLLUTION'].includes(code))) status = 'publishable';
  else if (score >= 55) status = 'fixable';

  return {
    score,
    status,
    issues: uniqueStrings([...issues, ...premium.issueCodes.map(code => `Premium: ${code}`)]),
    issueCodes: uniqueStrings([...codes, ...premium.issueCodes]),
    strengths,
    metrics: { ...metrics, premiumScore: premium.score, ...Object.fromEntries(Object.entries(premium.breakdown).map(([k, v]) => [`premium_${k}`, v])) },
    excerpt: excerptText(html, 300),
    htmlHash: hashString(html)
  };
}
