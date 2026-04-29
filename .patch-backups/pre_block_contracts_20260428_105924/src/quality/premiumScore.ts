import * as cheerio from 'cheerio';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';
import { evaluatePremiumContractCoverage } from '../niches/premiumContracts.js';
import { hasFaqNumberingArtifact } from '../utils/faqSanitizer.js';
import { analyzeTechnicalIntegrity } from './technicalIntegrityGate.js';

export interface PremiumScoreInput { html: string; city: string; niche: string; phone?: string; businessName?: string; qualityGate?: unknown; }
export interface PremiumScoreResult { score: number; status: 'rejected'|'fixable'|'publishable'|'premium'|'premium_100_candidate'; issueCodes: string[]; breakdown: Record<string, number>; summary: string; }

function visibleText(html: string): string {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  $('script,style,noscript,template,svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}
function count(text: string, rx: RegExp): number { return (text.match(rx) || []).length; }
function clamp(n: number): number { return Math.max(0, Math.min(100, Math.round(n))); }
function escapeRx(value: string): string { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function collectSchemaIssues($: cheerio.CheerioAPI): string[] {
  const issues: string[] = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      for (const node of graph) {
        const type = node?.['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('FAQPage') && Array.isArray(node.mainEntity)) {
          for (const item of node.mainEntity) {
            if (hasFaqNumberingArtifact(item?.name)) issues.push('FAQ_NUMBERING_ARTIFACT');
            if (!String(item?.acceptedAnswer?.text || '').trim()) issues.push('FAQ_ANSWER_EMPTY');
          }
        }
      }
    } catch {
      issues.push('SCHEMA_JSON_INVALID');
    }
  });
  return Array.from(new Set(issues));
}


export function scorePremiumOutput(input: PremiumScoreInput): PremiumScoreResult {
  const html = String(input.html || '');
  const $ = cheerio.load(html, { decodeEntities: false });
  const text = visibleText(html);
  const cityRx = input.city ? new RegExp(escapeRx(input.city), 'i') : null;
  const cross = detectCrossNicheContamination({ niche: input.niche, html });
  const issueCodes: string[] = [];
  const technicalIntegrity = analyzeTechnicalIntegrity(html);
  issueCodes.push(...technicalIntegrity.issueCodes);
  const contractCoverage = evaluatePremiumContractCoverage(input.niche || '', text);
  const breakdown: Record<string, number> = { nicheSpecificity: 25, localProof: 15, conversion: 15, seoStructure: 15, uxMobile: 10, schema: 10, originality: 10 };
  if (cross.shouldBlockPublish || cross.severity === 'fatal') { issueCodes.push('CROSS_NICHE_POLLUTION'); breakdown.nicheSpecificity -= 25; }
  else if (cross.severity === 'major') { issueCodes.push('CROSS_NICHE_WARNING'); breakdown.nicheSpecificity -= 15; }
  else if (cross.severity === 'warning') breakdown.nicheSpecificity -= 6;
  if (contractCoverage.forbiddenHits.length > 0) { issueCodes.push('NICHE_CONTRACT_FORBIDDEN_TERM'); breakdown.nicheSpecificity -= 18; }
  if (contractCoverage.requiredCoverage < 50) { issueCodes.push('NICHE_SPECIFICITY_LOW'); breakdown.nicheSpecificity -= 10; }
  if (!cityRx || !cityRx.test(text)) { issueCodes.push('CITY_MISSING'); breakdown.localProof -= 10; }
  if (count(text, /\bplaceholder\b|\[[^\]]+\]|\{\{[^}]+\}\}|factor\s*\d+|criterio\s*\d+|undefined|null|object object/gi) > 0) { issueCodes.push('PLACEHOLDER_OR_BROKEN_COPY'); breakdown.originality -= 10; }
  if (count(text, /AI Response:|Writing Phase:|Block Index:|contract-|skeleton-|layout-hotfix-|generic-layout/gi) > 0) { issueCodes.push('SYSTEM_LEAK_VISIBLE'); breakdown.originality -= 10; }
  if (hasFaqNumberingArtifact(html) || hasFaqNumberingArtifact(text)) { issueCodes.push('FAQ_NUMBERING_ARTIFACT'); breakdown.schema -= 6; breakdown.originality -= 4; }
  if ($('h1').length !== 1) { issueCodes.push('H1_INVALID'); breakdown.seoStructure -= 4; }
  if ($('h2').length < 4) { issueCodes.push('SECTION_DEPTH_LOW'); breakdown.seoStructure -= 5; }
  if ($('[type="application/ld+json"]').length < 1) { issueCodes.push('SCHEMA_MISSING'); breakdown.schema -= 10; }
  const schemaIssues = collectSchemaIssues($);
  if (schemaIssues.length) { issueCodes.push(...schemaIssues); breakdown.schema -= Math.min(10, schemaIssues.length * 4); }
  const ctaCount = $('a[href^="tel:"], a.cta-primary, .block__cta-group a, .nav__cta, button, .cta, [data-cta]').length;
  if (ctaCount < 2) { issueCodes.push('CTA_WEAK'); breakdown.conversion -= 7; }
  const viewportContent = String($('meta[name="viewport"]').attr('content') || '').toLowerCase();
  if (!/width\s*=\s*device-width/.test(viewportContent) || !/initial-scale\s*=\s*1/.test(viewportContent)) { issueCodes.push('MOBILE_VIEWPORT_MISSING'); breakdown.uxMobile -= 6; }
  if (technicalIntegrity.hardBlock) { issueCodes.push('TECHNICAL_INTEGRITY_HARD_BLOCK'); breakdown.schema -= 10; breakdown.uxMobile -= 10; breakdown.originality -= 10; }
  const qScore = Number(input.qualityGate?.score);
  if (Number.isFinite(qScore) && qScore < 75) { issueCodes.push('QUALITY_GATE_LOW'); breakdown.originality -= Math.min(10, Math.round((75 - qScore) / 3)); }
  for (const key of Object.keys(breakdown)) breakdown[key] = Math.max(0, breakdown[key]);
  const score = clamp(Object.values(breakdown).reduce((a,b)=>a+b,0));
  const hardBlock = technicalIntegrity.hardBlock || issueCodes.some(c => ['CROSS_NICHE_POLLUTION','PLACEHOLDER_OR_BROKEN_COPY','SYSTEM_LEAK_VISIBLE','SCHEMA_MISSING','SCHEMA_JSON_INVALID','FAQ_SCHEMA_CONTENT_MISMATCH','MOBILE_VIEWPORT_MISSING','BROKEN_INTERNAL_INDEX_LINK','PRODUCTION_PLACEHOLDER_VISUAL'].includes(c));
  const status = score >= 95 && !hardBlock ? 'premium_100_candidate' : score >= 88 && !hardBlock ? 'premium' : score >= 75 && !hardBlock ? 'publishable' : score >= 55 ? 'fixable' : 'rejected';
  return { score, status, issueCodes: Array.from(new Set(issueCodes)), breakdown: { ...breakdown, contractCoverage: contractCoverage.requiredCoverage, contractTerms: contractCoverage.matchedAllowed.length, contractForbiddenHits: contractCoverage.forbiddenHits.length }, summary: `Premium Score ${score}/100 (${status}).` };
}
