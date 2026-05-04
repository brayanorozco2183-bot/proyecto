import fs from 'fs/promises';
import path from 'path';

import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import { resolvePlaybookForMission } from '../niches/agentAdapters.js';
import { attachMissionRuntimeContext } from '../runtime/missionContext.js';
import { buildSiteGraph } from '../internal-linking/index.js';
import { RenderPlanResolver } from '../renderers/renderPlanResolver.js';
import { buildSeoForPipeline, attachRenderedSeoToDraft } from '../seo/pipelineIntegration.js';
import { validateRenderCompleteness } from '../quality/postRenderCompletenessGuard.js';
import { validateRenderedPageTechnically, TechnicalSeoValidationInput } from '../utils/technicalPageValidator.js';
import { UXValidator } from '../validators/uxValidator.js';
import { runAsyncQualityGate, formatQualityGateIssues } from '../validators/qualityGate.js';
import { finalizePageImages } from '../images/finalizePageImages.js';
import type { PageImageContext } from '../images/types.js';
import { recordOriginalityAfterRender } from '../originality/index.js';
import { vault } from '../tools/vault.js';
import type {
  ContentDraft,
  GenerationMission,
  ObservabilityMetadata,
  PagePlan,
  RenderedPage,
} from '../types/pipeline_v2.js';
import type { ResolvedPageRenderPlan } from '../types/design.js';
import {
  DEBUG_PHASE_LABELS,
  DEBUG_PHASE_ORDER,
  type DebugPhaseId,
  type DebugPipelineState,
  type DebugRunnerOptions,
  type DebugRunnerResult,
} from './phaseDebugTypes.js';
import { ensureRunArtifactsDir, readStateFromReplay, savePhaseArtifact, consolidateRunJsonFiles } from './phaseArtifactStore.js';



function sanitizeOutputPathToken(value?: string): string {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function resolveMissionOutputSlug(mission: {
  niche?: string;
  city?: string;
  subPath?: string;
  clusterFolderName?: string;
  cluster_folder_name?: string;
}): string {
  const clusterFolder = sanitizeOutputPathToken(mission.cluster_folder_name || mission.clusterFolderName);
  const basePath = clusterFolder || `${sanitizeOutputPathToken(mission.niche)}-${sanitizeOutputPathToken(mission.city)}`;
  const subPath = sanitizeOutputPathToken(mission.subPath);

  return subPath ? path.posix.join(basePath, subPath) : basePath;
}

function createObservability(): ObservabilityMetadata {
  return {
    durations: {},
    scores: {},
    retries: {},
    agent_logs: [],
    tokenUsage: 0,
    tokenBudget: 50000,
    totalCost: 0,
    agentConfidence: {},
  };
}

function cloneMission<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

function phaseIndex(phase: DebugPhaseId): number {
  return DEBUG_PHASE_ORDER.indexOf(phase);
}

function phaseRange(fromPhase: DebugPhaseId, toPhase: DebugPhaseId): DebugPhaseId[] {
  const from = phaseIndex(fromPhase);
  const to = phaseIndex(toPhase);
  if (from === -1 || to === -1) {
    throw new Error(`Fase inválida. from=${fromPhase} to=${toPhase}`);
  }
  if (from > to) {
    throw new Error(`Rango de fases inválido. from=${fromPhase} no puede ser mayor que to=${toPhase}`);
  }
  return DEBUG_PHASE_ORDER.slice(from, to + 1);
}

function ensureState<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}

function summarizePhaseMetrics(phase: DebugPhaseId, state: DebugPipelineState): Record<string, string | number | boolean | null> {
  switch (phase) {
    case '1':
      return {
        competitors: state.researchContext?.competitors?.length || 0,
        entities: state.researchContext?.entities?.length || 0,
        intent: state.researchContext?.intentModel?.primaryIntent || null,
      };
    case '2':
      return {
        phoneNormalized: state.normalizedContext?.clean_nap?.phone_normalized || null,
        clusteredKeywords: state.normalizedContext?.clustered_keywords?.length || 0,
      };
    case '3':
      return {
        sections: state.pagePlan?.sections?.length || 0,
        h1: state.pagePlan?.h1 || null,
        pageType: state.pagePlan?.intentModel?.pageType || null,
      };
    case '3.5':
      return {
        orderedSections: state.resolvedPlan?.sections?.length || 0,
        theme: (state.resolvedPlan as any)?.theme?.id || null,
      };
    case '4':
    case '5':
    case '7':
      return {
        blocks: (phase === '4' ? state.contentDraft : phase === '5' ? state.correctedDraft : state.enrichedDraft)?.blocks?.length || 0,
        totalWords: (phase === '4' ? state.contentDraft : phase === '5' ? state.correctedDraft : state.enrichedDraft)?.totalWords || 0,
      };
    case '8':
      return {
        htmlLength: state.renderedPage?.html?.length || 0,
      };
    case '9':
      return {
        technicalPassed: state.renderedPage?.metadata?.technical_passed || false,
        issues: state.renderedPage?.metadata?.validation_errors?.length || 0,
      };
    case '9.5':
      return {
        score: state.qualityGateResult?.score || 0,
        passed: state.qualityGateResult?.passed || false,
        issues: state.qualityGateResult?.issues?.length || 0,
      };
    case '10':
      return {
        editorialScore: state.editorialAudit?.score || 0,
        editorialPassed: state.renderedPage?.metadata?.editorial_passed || false,
      };
    default:
      return {};
  }
}

export class ContentPipelinePhaseRunner {
  private readonly pipeline: ContentGenerationPipeline;
  private readonly internals: any;

  constructor() {
    this.pipeline = new ContentGenerationPipeline();
    this.internals = this.pipeline as any;
  }

  private applyDebugEnv(options: DebugRunnerOptions): void {
    if (options.realQualityGate) {
      process.env.PIPELINE_FAST_DEBUG = 'false';
      process.env.QUALITY_GATE_FORCE_PASS = 'false';
      return;
    }

    if (process.env.PIPELINE_FAST_DEBUG === undefined) {
      process.env.PIPELINE_FAST_DEBUG = 'true';
    }
    if (process.env.QUALITY_GATE_FORCE_PASS === undefined) {
      process.env.QUALITY_GATE_FORCE_PASS = 'true';
    }
  }

  private async createInitialState(options: DebugRunnerOptions): Promise<DebugPipelineState> {
    if (options.replayFile) {
      const replayState = await readStateFromReplay(options.replayFile);
      return {
        ...replayState,
        mission: cloneMission(replayState.mission),
        updatedAt: nowIso(),
        phaseSummaries: Array.isArray(replayState.phaseSummaries) ? replayState.phaseSummaries : [],
        observability: replayState.observability || createObservability(),
      };
    }

    const runSeed = await ensureRunArtifactsDir(options.mission, options.baseArtifactsDir);
    return {
      mission: cloneMission(options.mission),
      runId: runSeed.runId,
      artifactsDir: runSeed.dir,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      phaseSummaries: [],
      observability: createObservability(),
    };
  }

  private async ensureArtifactsDir(state: DebugPipelineState, options: DebugRunnerOptions): Promise<string> {
    if (state.artifactsDir) return state.artifactsDir;
    const runSeed = await ensureRunArtifactsDir(state.mission, options.baseArtifactsDir);
    state.runId = state.runId || runSeed.runId;
    state.artifactsDir = runSeed.dir;
    return runSeed.dir;
  }

  private async runPhase(phase: DebugPhaseId, state: DebugPipelineState, options: DebugRunnerOptions): Promise<void> {
    const startedAt = Date.now();
    const notes: string[] = [];
    console.log(`[Phase ${phase}] START ${DEBUG_PHASE_LABELS[phase]}`);

    try {
    switch (phase) {
      case '0.1': {
        state.mission = attachMissionRuntimeContext(this.internals.sanitizeMission(cloneMission(state.mission)));
        let playbookContext: any = null;
        try {
          playbookContext = resolvePlaybookForMission(state.mission.niche);
          state.mission.contextual_data = {
            ...(state.mission.contextual_data || {}),
            nichePlaybook: playbookContext,
          };
          state.playbookContext = playbookContext;

          if (playbookContext) {
            this.internals.analyst.setNicheBrief(playbookContext.analystBrief);
            this.internals.architect.setNicheBrief(playbookContext.architectBrief);
            this.internals.writer.setNicheBrief(playbookContext.writerBrief);
            this.internals.writer.setTechnicalBrief(playbookContext.technicalBrief);
            this.internals.nicheCoherenceAgent.setTechnicalBrief(playbookContext.technicalBrief);
            this.internals.spanishCorrector.setTechnicalBrief(playbookContext.technicalBrief);
            this.internals.qualityScoreAgent.setTechnicalBrief(playbookContext.technicalBrief);
          }
        } catch (error: any) {
          notes.push(`Playbook genérico usado: ${error.message}`);
        }
        break;
      }

      case '0.5': {
        state.siteGraph = buildSiteGraph(state.mission);
        break;
      }

      case '1': {
        state.researchContext = await this.internals.runResearchPhase(state.mission);
        break;
      }

      case '2': {
        const researchContext = ensureState(state.researchContext, 'Replay incompleto: falta researchContext para Fase 2.');
        state.normalizedContext = await this.internals.runNormalizationPhase(researchContext);
        await this.internals.validateNormalizationGate(state.normalizedContext);
        break;
      }

      case '3': {
        const normalizedContext = ensureState(state.normalizedContext, 'Replay incompleto: falta normalizedContext para Fase 3.');
        state.pagePlan = await this.internals.runPlanningPhase(normalizedContext, state.mission);
        await this.internals.validatePlanningGate(state.pagePlan, state.mission);
        break;
      }

      case '3.5': {
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 3.5.');
        if (!pagePlan.pageProfile) {
          pagePlan.pageProfile = pagePlan.pageVariety?.profile || pagePlan.pageVariety;
        }
        if (!pagePlan.layoutContract) {
          throw new Error('Planning Gate Failure: missing layoutContract before RenderPlanResolver.');
        }
        state.resolvedPlan = RenderPlanResolver.resolve(
          state.mission.missionId || `${state.mission.niche}-${state.mission.city}`,
          pagePlan,
          pagePlan.intentModel,
          pagePlan.pageVariety || {
            h1: pagePlan.h1,
            profile: pagePlan.pageProfile,
            sections: pagePlan.sections || [],
          },
          pagePlan.layoutContract,
          state.mission.wordpress?.enabled ? 'wordpress' : 'web',
        );
        break;
      }

      case '4': {
        const normalizedContext = ensureState(state.normalizedContext, 'Replay incompleto: falta normalizedContext para Fase 4.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 4.');
        const resolvedPlan = ensureState(state.resolvedPlan, 'Replay incompleto: falta resolvedPlan para Fase 4.');
        state.contentDraft = await this.internals.runWritingPhase(
          normalizedContext,
          pagePlan,
          state.mission,
          state.observability,
          resolvedPlan,
        );
        break;
      }

      case '5': {
        const contentDraft = ensureState(state.contentDraft, 'Replay incompleto: falta contentDraft para Fase 5.');
        const normalizedContext = ensureState(state.normalizedContext, 'Replay incompleto: falta normalizedContext para Fase 5.');
        state.correctedDraft = await this.internals.runCorrectionPhase(contentDraft, normalizedContext);
        break;
      }

      case '6': {
        const correctedDraft = ensureState(state.correctedDraft, 'Replay incompleto: falta correctedDraft para Fase 6.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 6.');
        this.internals.validateWordBudget(
          correctedDraft,
          state.mission.contextual_data?.wordCountTarget || pagePlan.intentModel?.wordCountTarget || 2100,
        );
        await this.internals.validatePreAssemblyIntegrityGate(correctedDraft);
        break;
      }

      case '7': {
        const correctedDraft = ensureState(state.correctedDraft, 'Replay incompleto: falta correctedDraft para Fase 7.');
        const normalizedContext = ensureState(state.normalizedContext, 'Replay incompleto: falta normalizedContext para Fase 7.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 7.');
        state.enrichedDraft = await this.internals.runEnrichmentPhase(correctedDraft, normalizedContext, pagePlan, state.mission);
        break;
      }

      case '7.5': {
        const enrichedDraft = ensureState(state.enrichedDraft, 'Replay incompleto: falta enrichedDraft para Fase 7.5.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 7.5.');
        const faqs = (enrichedDraft.blocks || [])
          .filter((b: any) => b.metadata?.block_type === 'faq')
          .flatMap((b: any) => {
            const meta = b.metadata || {};
            const semantic = meta.semantic || {};
            return (semantic.faqItems || meta.faqItems || meta.items || []).filter((f: any) => f.question && f.answer);
          });

        const seoResult = buildSeoForPipeline(pagePlan, state.mission, faqs);
        const internalLinks = (pagePlan.internalLinking?.linkPlan?.all || []).map((candidate: any) => ({
          url: candidate.targetSlug.startsWith('/') ? candidate.targetSlug : `/${candidate.targetSlug}/`,
          text: candidate.anchor,
          relation: candidate.direction,
        }));

        state.enrichedDraft = attachRenderedSeoToDraft(enrichedDraft, seoResult.renderedSeo);
        (pagePlan as any).seoBrief = seoResult.seoBrief;
        (pagePlan as any).internalLinks = internalLinks;
        state.seoResult = seoResult;
        break;
      }

      case '8': {
        const enrichedDraft = ensureState(state.enrichedDraft, 'Replay incompleto: falta enrichedDraft para Fase 8.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 8.');
        const normalizedContext = ensureState(state.normalizedContext, 'Replay incompleto: falta normalizedContext para Fase 8.');
        state.renderedPage = await this.internals.runAssemblyPhase(
          enrichedDraft,
          pagePlan,
          normalizedContext,
          state.mission,
          state.resolvedPlan,
        );
        break;
      }

      case '8.2': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 8.2.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 8.2.');
        if (!options.withImages || !vault.COMFY_ENABLED) {
          notes.push('Fase 8.2 omitida: withImages=false o COMFY desactivado.');
          break;
        }

        const imageContext: PageImageContext = {
          pageId: state.mission.missionId || `${state.mission.niche}-${state.mission.city}`,
          niche: state.mission.niche,
          city: state.mission.city,
          businessName: state.mission.local_nap?.business_name,
          phone: state.mission.local_nap?.phone,
          h1: pagePlan.h1,
          heroSubtitle: pagePlan.meta_description,
          canonical: (renderedPage.metadata.seo as any)?.canonical,
          outputSlug: resolveMissionOutputSlug(state.mission as any),
        };

        renderedPage.html = await finalizePageImages(renderedPage.html, imageContext);
        state.renderedPage = renderedPage;
        break;
      }

      case '8.5': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 8.5.');
        const completeness = validateRenderCompleteness(renderedPage.html);
        if (!completeness.passed) {
          const completenessErrors = completeness.issues.map((issue: any) => `[COMPLETENESS:${issue.code}] ${issue.message}`);
          renderedPage.metadata.validation_errors.push(...completenessErrors);
          throw new Error(`Render completeness failed: ${completeness.issues.map((issue: any) => issue.code).join(', ')}`);
        }
        break;
      }

      case '9': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 9.');
        const seoResult = ensureState(state.seoResult, 'Replay incompleto: falta seoResult para Fase 9.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 9.');
        const validationInput: TechnicalSeoValidationInput = {
          expectedPhone: state.mission.local_nap?.phone || '',
          expectedCanonicalBase: state.mission.siteConfig?.baseUrl || 'https://serviciosprofesionales.pro',
          pageType: state.resolvedPlan?.pageType || pagePlan.intentModel?.pageType,
          requireFaq: seoResult.seoBrief?.faqEligible,
          expectedBusinessName: state.mission.local_nap?.business_name,
          expectedAddress: state.mission.local_nap?.address,
          pagePlan,
          mission: state.mission,
          renderedSeo: seoResult.renderedSeo,
        };
        const techIssues = validateRenderedPageTechnically(renderedPage, validationInput);
        renderedPage.metadata.technical_passed = techIssues.length === 0;
        renderedPage.metadata.validation_errors.push(...techIssues);
        break;
      }

      case '9.25': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 9.25.');
        try {
          const uxResult = await UXValidator.validate(
            renderedPage.html,
            state.mission.missionId || `${state.mission.niche}-${state.mission.city}-${Date.now()}`,
          );
          (renderedPage.metadata as any).ux_audit = uxResult;
          if (!uxResult.passed) {
            const criticalIssues = uxResult.issues.filter((issue: any) => issue.severity === 'error');
            renderedPage.metadata.validation_errors.push(
              ...criticalIssues.map((issue: any) => `[UX:${issue.viewport}:${issue.type}] ${issue.message}`),
            );
          }
        } catch (error: any) {
          notes.push(`UX validation omitida: ${error.message}`);
        }
        break;
      }

      case '9.5': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 9.5.');
        const pagePlan = ensureState(state.pagePlan, 'Replay incompleto: falta pagePlan para Fase 9.5.');
        const qualityGateResult = await runAsyncQualityGate({
          html: renderedPage.html,
          city: state.mission.city,
          niche: state.mission.niche,
          businessName: state.mission.local_nap?.business_name,
          phone: state.mission.local_nap?.phone,
          mission: state.mission,
          pagePlan,
          pageId: state.mission.missionId,
        });
        state.qualityGateResult = qualityGateResult;
        renderedPage.metadata.validation_errors.push(
          ...qualityGateResult.issues.map((issue: any) => `[QUALITY:${issue.code}] ${issue.message}`),
        );
        state.observability.scores['QualityGate'] = qualityGateResult.score;
        if (!qualityGateResult.passed) {
          notes.push(`Quality Gate no superado: ${formatQualityGateIssues(qualityGateResult)}`);
        }
        break;
      }

      case '10': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 10.');
        const editorialAudit = await this.internals.runEditorialValidation(renderedPage, state.mission);
        state.editorialAudit = editorialAudit;
        renderedPage.metadata.qaScore = editorialAudit.score;
        renderedPage.metadata.editorial_passed = editorialAudit.score >= 35;
        state.observability.scores['QA'] = editorialAudit.score;
        break;
      }

      case '11': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 11.');
        if (!options.deliver) {
          state.delivery = {
            attempted: false,
            completed: false,
            skipped: true,
            reason: 'Entrega omitida por opción deliver=false.',
          };
          notes.push('Delivery omitido por configuración.');
          break;
        }
        await this.internals.runDeliveryPhase(renderedPage, state.mission);
        state.delivery = { attempted: true, completed: true };
        break;
      }

      case '12': {
        const renderedPage = ensureState(state.renderedPage, 'Replay incompleto: falta renderedPage para Fase 12.');
        state.postDeployAudit = await this.internals.runPostDeployAudit(renderedPage, state.mission);

        if (state.pagePlan) {
          try {
            await recordOriginalityAfterRender({
              mission: state.mission,
              pagePlan: state.pagePlan,
              html: renderedPage.html,
              pageId: state.mission.missionId,
            });
          } catch (error: any) {
            notes.push(`Originality record omitido: ${error.message}`);
          }
        }
        break;
      }
    }

    } catch (error: any) {
      const failedAt = Date.now();
      const durationMs = failedAt - startedAt;
      const message = error?.message || String(error);
      notes.push(`FAILED: ${message}`);
      state.updatedAt = nowIso();
      state.phaseSummaries.push({
        phase,
        label: DEBUG_PHASE_LABELS[phase],
        startedAt: new Date(startedAt).toISOString(),
        completedAt: new Date(failedAt).toISOString(),
        durationMs,
        notes,
        metrics: { ...summarizePhaseMetrics(phase, state), failed: true, error: message },
      });
      console.error(`[Phase ${phase}] MISSION_FAILED ${DEBUG_PHASE_LABELS[phase]} in ${durationMs}ms: ${message}`);
      if (error?.stack) console.error(error.stack);
      throw error;
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;
    state.lastCompletedPhase = phase;
    state.updatedAt = nowIso();
    state.phaseSummaries.push({
      phase,
      label: DEBUG_PHASE_LABELS[phase],
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationMs,
      notes,
      metrics: summarizePhaseMetrics(phase, state),
    });
    console.log(`[Phase ${phase}] END ${DEBUG_PHASE_LABELS[phase]} in ${durationMs}ms`);
  }

  async run(options: DebugRunnerOptions): Promise<DebugRunnerResult> {
    this.applyDebugEnv(options);

    const state = await this.createInitialState(options);
    const artifactsDir = await this.ensureArtifactsDir(state, options);
    state.artifactsDir = artifactsDir;
    state.mission = attachMissionRuntimeContext(this.internals.sanitizeMission(cloneMission(state.mission)));

    const fromPhase = options.fromPhase || '0.1';
    const toPhase = options.toPhase || '12';

    if (options.deliver === undefined && (toPhase === '11' || toPhase === '12')) {
      options.deliver = true;
    }


    try {
      for (const phase of phaseRange(fromPhase, toPhase)) {
        await this.runPhase(phase, state, options);
        await savePhaseArtifact(artifactsDir, phase, state, {
          html: state.renderedPage?.html,
          summary: state.phaseSummaries[state.phaseSummaries.length - 1],
        });
      }
    } catch (error: any) {
      const failedSummary = state.phaseSummaries[state.phaseSummaries.length - 1];
      await savePhaseArtifact(artifactsDir, failedSummary?.phase || fromPhase, state, {
        html: state.renderedPage?.html,
        summary: failedSummary,
        notes: [`ERROR: ${error?.message || String(error)}`, error?.stack || ''].filter(Boolean),
      });
      console.error(`[PhaseRunner] MISSION_FAILED artifactsDir=${artifactsDir} error=${error?.message || error}`);
      throw error;
    }
    
    console.log(`[PhaseRunner] Consolidated all JSONs into: ${path.join(artifactsDir, 'resultado_json.txt')}`);
    await consolidateRunJsonFiles(artifactsDir);

    if (state.renderedPage?.html) {
      const finalHtmlPath = path.join(artifactsDir, 'resultado_final.html');
      await fs.writeFile(finalHtmlPath, state.renderedPage.html, 'utf8');
      console.log(`[PhaseRunner] Final HTML saved to: ${finalHtmlPath}`);
      console.log(`[PhaseRunner] MISSION_SUCCESS html_path=${finalHtmlPath} duration_phases=${state.phaseSummaries.length}`);
    } else {
      console.warn(`[PhaseRunner] MISSION_COMPLETED_WITHOUT_HTML artifactsDir=${artifactsDir}`);
    }


    return {
      runId: state.runId,
      artifactsDir,
      state,
    };
  }
}
