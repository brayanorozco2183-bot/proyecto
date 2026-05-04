import * as cheerio from 'cheerio';
import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { IntentModel } from '../types/pipeline_v2.js';
import { persistOutputReview } from '../learning/learningService.js';

export interface QualityScoreInput {
  html: string;
  businessName: string;
  phone: string;
  city: string;
  niche: string;
  seo?: {
    title: string;
    metaDescription: string;
    canonical: string;
  };
  intentModel?: IntentModel;
  complianceChecklist?: string[];
}

export interface QualityScoreResult {
  score: number;
  reasoning: string;
  issues: string[];
  blockScores: { id: string; score: number }[];
  status: 'rejected' | 'fixable' | 'publishable' | 'premium';
}


interface DomEvidence {
  hasHtml: boolean;
  hasBody: boolean;
  hasTitle: boolean;
  titleText: string;
  hasMetaDescription: boolean;
  metaDescriptionContent?: string;
  hasH1: boolean;
  h1Text: string;
  hasJsonLd: boolean;
  jsonLdCount: number;
  sectionCount: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

function buildDomEvidence($: cheerio.CheerioAPI, html: string): DomEvidence {
  const raw = String(html || '');
  const warnings: string[] = [];
  const hasHtml = /<html[\s>]/i.test(raw) || $('html').length > 0;
  const hasBody = /<body[\s>]/i.test(raw) || $('body').length > 0;
  const titleText = $('title').first().text().replace(/\s+/g, ' ').trim().slice(0, 180);
  const metaDescriptionContent = String($('meta[name="description"]').first().attr('content') || '').replace(/\s+/g, ' ').trim().slice(0, 240);
  const h1Text = $('h1').first().text().replace(/\s+/g, ' ').trim().slice(0, 220);
  const jsonLdCount = $('script[type="application/ld+json"]').length;
  const sectionCount = $('section, .semantic-section, .block-section').length;

  if (!hasHtml) warnings.push('missing-html-wrapper');
  if (!hasBody) warnings.push('missing-body-wrapper');
  if (raw.includes('[object Object]') || /undefined|null/.test(raw)) warnings.push('placeholder-or-serialization-artifact');
  if (sectionCount === 0) warnings.push('no-rendered-sections-detected');
  if (raw.length < 1200) warnings.push('html-too-short-for-premium-audit');
  if ($('title').length > 1) warnings.push('multiple-title-tags');
  if ($('h1').length > 1) warnings.push('multiple-h1-tags');

  const confidence: DomEvidence['confidence'] = warnings.some((w) => ['missing-html-wrapper', 'missing-body-wrapper', 'placeholder-or-serialization-artifact', 'no-rendered-sections-detected'].includes(w))
    ? 'low'
    : warnings.length > 0
      ? 'medium'
      : 'high';

  return {
    hasHtml,
    hasBody,
    hasTitle: titleText.length > 0,
    titleText,
    hasMetaDescription: metaDescriptionContent.length > 0,
    metaDescriptionContent,
    hasH1: h1Text.length > 0,
    h1Text,
    hasJsonLd: jsonLdCount > 0,
    jsonLdCount,
    sectionCount,
    confidence,
    warnings
  };
}

function buildEvidencePrompt(evidence: DomEvidence): string {
  const label = evidence.confidence === 'high'
    ? 'EVIDENCIA TÉCNICA DOM - CONFIANZA ALTA'
    : evidence.confidence === 'medium'
      ? 'EVIDENCIA TÉCNICA DOM - CONFIANZA MEDIA'
      : 'EVIDENCIA TÉCNICA DOM - CONFIANZA BAJA';

  const instruction = evidence.confidence === 'high'
    ? 'Puedes usar estos datos para no penalizar ausencias que el DOM confirma como presentes.'
    : 'Usa estos datos solo como orientación. Si hay señales de HTML malformado, prioriza una incidencia de renderizado en vez de repetir reparaciones de contenido.';

  return ['!!! ' + label + ' !!!', instruction, JSON.stringify(evidence, null, 2), '!!! FIN DE EVIDENCIA TÉCNICA !!!'].join('\n');
}

export class QualityScoreAgent extends BaseAgent {
  constructor() {
    super(
      'Quality_Auditor_10',
      'Quality Auditor',
      'Auditor de Calidad',
      'Evalúa el contenido generado en base a criterios de EEAT, relevancia local y perfección técnica.',
      vault.OLLAMA_MODEL_PREMIUM
    );
  }

  private nicheProfile?: any;

  public setNicheProfile(profile: any) {
    this.nicheProfile = profile;
  }

  private computeBlockScores(html: string): { id: string; score: number }[] {
    if (typeof html !== 'string' || !html) return [];
    try {
      const $ = cheerio.load(html);
      const cityCandidates = Array.from(new Set(($('body').text().match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2}\b/g) || [])
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate.length >= 4 && !/^(El|La|Los|Las|Un|Una|Servicio|Servicios|Diagnóstico|Criterio|Presupuesto|Garantía)$/i.test(candidate))));
      const hasLocalSignal = (text: string) =>
        /\b(barrio|zona|calle|avenida|municipio|distrito|cobertura|desplazamiento|local|cerca|centro|ensanche|sector|polígono)\b/i.test(text)
        || cityCandidates.some((candidate) => text.includes(candidate));

      const technicalSignal = /\b(diagn[oó]stico|criterio|revisi[oó]n|comprobaci[oó]n|alcance|materiales|compatibilidad|normativa|presupuesto|garant[ií]a|proceso|riesgo|estado previo|decisi[oó]n)\b/i;
      const trustSignal = /\b(diagn[oó]stico previo|garant[ií]a por escrito|factura|justificante|presupuesto previo|transparencia|comprobaci[oó]n final|alcance claro)\b/i;
      const ctaSignal = /\b(diagn[oó]stico|valoraci[oó]n|orientaci[oó]n|presupuesto|consulta|llamar|contactar|solicitar|pedir)\b/i;

      const blocks = $('section[id], .semantic-section[id], .block-section[id]')
        .map((_, el) => {
          const id = $(el).attr('id') || `block-${_}`;
          const blockType = $(el).attr('data-block-type') || id;
          const text = $(el).text().replace(/\s+/g, ' ').trim();
          let score = 60;

          if (text.length > 350) score += 15;
          else if (text.length > 220) score += 8;
          else if (text.length < 120) score -= 12;

          if (/En\s*,|placeholder|undefined|null|factor\s*\d+|criterio\s*\d+|object object/i.test(text)) score -= 25;
          if (hasLocalSignal(text)) score += 7;
          if (technicalSignal.test(text)) score += 8;

          if (/services_grid|servicios/i.test(blockType)) {
            if (technicalSignal.test(text)) score += 10;
            if (/\b(antes de|depende de|conviene|se revisa|se valida|criterio de decisi[oó]n|compatibilidad|alcance)\b/i.test(text)) score += 10;
          }

          if (/local_proof|proof|testimonio|reseña|cobertura/i.test(blockType)) {
            if (hasLocalSignal(text)) score += 12;
            if (/\b(caso|referencia|aviso|intervenci[oó]n|coordinaci[oó]n|diagn[oó]stico|revisi[oó]n|cobertura real)\b/i.test(text)) score += 10;
          }

          if (/trust|senales-confianza|confianza/i.test(blockType)) {
            if (trustSignal.test(text)) score += 15;
            if (/\b(calidad garantizada|profesionales cualificados|confianza total|los mejores)\b/i.test(text)) score -= 10;
          }

          if (/cta|conversion/i.test(blockType)) {
            if (ctaSignal.test(text)) score += 10;
          }

          if (/internal-links|internal_link/i.test(blockType) || /internal-links/i.test(id)) {
            if (/\b(si el caso|para ampliar|antes de|relacionad|contexto|página principal|proyecto)\b/i.test(text)) score += 10;
            if (/\b(más información|ver página|abrir página)\b/i.test(text) && text.length < 250) score -= 8;
          }

          return { id, score: Math.max(0, Math.min(100, Math.round(score))) };
        })
        .get();

      return blocks.slice(0, 12);
    } catch (e) {
      return [];
    }
  }

  private buildAuditPrompt(input: QualityScoreInput, text: string): string {
    return `
Eres un auditor editorial extremo. Evalúa esta página local y devuelve SOLO JSON.

NICHO: ${input.niche}
CIUDAD: ${input.city}
MARCA: ${input.businessName}
TELÉFONO: ${input.phone}
TITLE: ${input.seo?.title || ''}
META DESCRIPTION: ${input.seo?.metaDescription || ''}

CHECKLIST DE CUMPLIMIENTO (MANDATORIO):
${(input.complianceChecklist || []).map(c => `- [ ] ${c}`).join('\n')}
${this.nicheProfile?.copyBrief ? `\nESTRATEGIA EDITORIAL:\n${this.nicheProfile.copyBrief}` : ''}

TEXTO VISIBLE:
${text.slice(0, 12000)}

Devuelve:
{
  "score": 0,
  "reasoning": "explicación corta",
  "issues": ["issue 1", "issue 2"],
  "status": "rejected|fixable|publishable|premium"
}
`.trim();
  }

  async execute(input: QualityScoreInput): Promise<AgentResponse<QualityScoreResult>> {
    try {
      if (typeof input?.html !== 'string' || !input.html) {
        throw new Error('Input HTML must be a non-empty string.');
      }
      const $ = cheerio.load(input.html);
      const bodyContent = $('body').clone();
      bodyContent.find('script, style, .el-scripts-container, .internal-links-hub').remove();
      const text = bodyContent.text().replace(/\s+/g, ' ').trim();

      let llmScore = 0;
      let llmReasoning = '';
      let llmIssues: string[] = [];

      try {
        const metadataEvidence = buildDomEvidence($, input.html);
        const evidenceBlock = buildEvidencePrompt(metadataEvidence);
        const auditPrompt = evidenceBlock + "\n\n" + this.buildAuditPrompt(input, text) + `\n\nIMPORTANTE:
1. Si la evidencia DOM tiene confianza alta y confirma que Title, Meta, H1 o JSON-LD existen, no penalices por ausencia de esos elementos.
2. Si la evidencia DOM tiene confianza media o baja, no la trates como verdad absoluta: marca el problema como render/HTML malformado y evita bucles de reparación de copy.
3. No critiques el formato de la evidencia; úsala solo para separar problemas reales de SEO de problemas de renderizado.`;




        const raw = await this.callModel(auditPrompt, this.model, {
          json: true,
          timeoutMs: vault.QUALITY_TIMEOUT_MS,
          temperature: 0.1,
          maxRetries: 0,
          fallbackResponse: () => JSON.stringify({
            score: 70,
            reasoning: 'Fallback conservador del auditor.',
            issues: [],
            status: 'fixable'
          })
        });
        const parsed = safeJsonParse<any>(raw, { score: 70, reasoning: '', issues: [], status: 'fixable' });
        llmScore = Number(parsed?.score || 0);
        llmReasoning = String(parsed?.reasoning || '').trim();
        llmIssues = Array.isArray(parsed?.issues) ? parsed.issues.map((x: any) => String(x)) : [];
      } catch {
        llmScore = 0;
        llmReasoning = '';
        llmIssues = [];
      }

      const review = await persistOutputReview({
        missionId: this.missionId,
        agentName: this.name,
        niche: input.niche,
        city: input.city,
        pageType: input.intentModel?.pageType,
        html: input.html,
        businessName: input.businessName,
        phone: input.phone,
        seo: input.seo,
        llmScore,
        llmReasoning,
        llmIssues
      });

      const result: QualityScoreResult = {
        score: review.score,
        reasoning: llmReasoning || review.strengths.join(' · ') || 'Score heurístico + memoria curada.',
        issues: review.issues,
        blockScores: this.computeBlockScores(input.html),
        status: review.status
      };

      return {
        success: true,
        data: result,
        thoughts: `Quality audit completado. Score=${result.score}. Status=${result.status}.`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        thoughts: 'Fallo en el QualityScoreAgent.'
      };
    }
  }
}
