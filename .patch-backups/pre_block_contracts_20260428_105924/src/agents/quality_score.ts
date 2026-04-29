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
}

export interface QualityScoreResult {
  score: number;
  reasoning: string;
  issues: string[];
  blockScores: { id: string; score: number }[];
  status: 'rejected' | 'fixable' | 'publishable' | 'premium';
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
        const metadataEvidence = {
          hasTitle: $('title').length > 0,
          titleText: $('title').text(),
          hasMetaDescription: $('meta[name="description"]').length > 0,
          metaDescriptionContent: $('meta[name="description"]').attr('content'),
          hasH1: $('h1').length > 0,
          h1Text: $('h1').first().text(),
          hasJsonLd: $('script[type="application/ld+json"]').length > 0,
          jsonLdCount: $('script[type="application/ld+json"]').length
        };

        const evidenceBlock = `
!!! AVISO DE AUTOPSIA TÉCNICA - PRIORIDAD CRÍTICA !!!
El sistema ha extraído los siguientes datos directamente del DOM. 
ESTOS DATOS SON VERDADES ABSOLUTAS. Si aquí dice que UN CAMPO EXISTE, 
NO PUEDES DECIR QUE FALTA EN TU ANÁLISIS.

${JSON.stringify(metadataEvidence, null, 2)}
!!! FIN DE EVIDENCIA TÉCNICA !!!
`;

        const auditPrompt = evidenceBlock + "\n\n" + this.buildAuditPrompt(input, text) + "\n\n" + evidenceBlock + `\n\nIMPORTANTE: 
1. Si la evidencia de arriba confirma que un elemento (Title, Meta, H1 o JSON-LD) está presente, NO PUEDES penalizar por su ausencia.
2. NO CRITIQUES la forma en que el sistema te presenta la evidencia técnica. Tu trabajo es usarla para validar la calidad del HTML, no analizar el formato de los datos de autopsia.`;



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
