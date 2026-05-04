import type { ContentDraft } from '../types/pipeline_v2.js';

export interface BlockDiagnostic {
  blockId: string;
  blockType: string;
  h2?: string;
  wordCount: number;
  score: number;
  status: 'success' | 'warning' | 'degraded';
  issues: string[];
  examples: string[];
}

function stripHtml(html: string): string {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstMatches(text: string, patterns: Array<{ code: string; re: RegExp }>): { issues: string[]; examples: string[] } {
  const issues: string[] = [];
  const examples: string[] = [];
  for (const item of patterns) {
    const match = text.match(item.re);
    if (match) {
      issues.push(item.code);
      examples.push(match[0].slice(0, 160));
    }
  }
  return { issues, examples };
}

export function buildBlockDiagnostics(draft?: ContentDraft): BlockDiagnostic[] {
  if (!draft?.blocks?.length) return [];
  return draft.blocks.map((block) => {
    const blockType = String(block.metadata?.block_type || 'unknown');
    const text = stripHtml(block.html || '');
    const checks = firstMatches(text, [
      { code: 'generic_heading_prueba_local', re: /\bprueba local\b/i },
      { code: 'unverified_experience_claim', re: /\b(m[aá]s de\s+\d{2}\s+años|\d{2}\s+años de experiencia)\b/i },
      { code: 'absolute_guarantee_claim', re: /\b(garantizad[oa]|100%\s+asegurad[oa]|sin riesgos|resultado asegurado|cura definitiva|ganamos tu caso)\b/i },
      { code: 'generic_copy_cliche', re: /\b(servicio profesional|m[aá]xima calidad|soluciones a medida|r[aá]pido y eficaz|equipo experto)\b/i },
      { code: 'decision_criteria_as_copy', re: /\b(utilizan?\s+protecci[oó]n que salta|herramientas como\s+protecci[oó]n que salta)\b/i },
    ]);

    let score = 100;
    score -= checks.issues.length * 12;
    if ((block.wordCount || 0) < 45) {
      checks.issues.push('low_word_count');
      score -= 10;
    }
    if (blockType === 'local_proof' && !/\b(zona|barrio|calle|distrito|centro|norte|sur|este|oeste)\b/i.test(text)) {
      checks.issues.push('low_local_specificity');
      score -= 12;
    }
    if (blockType === 'services_grid' && !/\b(diagn[oó]stico|revisi[oó]n|comprobaci[oó]n|criterio|antes de|seg[uú]n el caso)\b/i.test(text)) {
      checks.issues.push('low_decision_depth');
      score -= 10;
    }

    const boundedScore = Math.max(0, Math.min(100, score));
    return {
      blockId: block.id || blockType,
      blockType,
      h2: block.h2,
      wordCount: block.wordCount || 0,
      score: boundedScore,
      status: boundedScore >= 80 ? 'success' : boundedScore >= 65 ? 'warning' : 'degraded',
      issues: [...new Set(checks.issues)],
      examples: [...new Set(checks.examples)].slice(0, 5),
    };
  });
}
