import type { ObservabilityMetadata, PipelineResult } from '../types/pipeline_v2.js';
import { assertPipelinePhaseContract } from '../validators/pipelineContractValidator.js';
import { QualityPolicyEngine } from '../quality/policy/qualityPolicyEngine.js';
import { createEmptyQualityLedger, type PipelineQualityLedger } from '../types/pipeline/quality.js';
import { appendMissionEvent, formatHumanEvent, type MissionEvent } from '../observability/missionEvents.js';
import { classifyPipelineError } from '../observability/errorClassifier.js';
import { writeMissionSummary } from '../observability/missionSummary.js';
import {
  CANONICAL_PIPELINE_LABELS,
  CANONICAL_PIPELINE_PHASES,
  type CanonicalPipelinePhaseId,
} from '../types/pipeline/contracts.js';
import type {
  PipelineHostAdapter,
  PipelinePhaseExecutionRecord,
  PipelinePhaseStatus,
  PipelineRunOptions,
  PipelineState,
  PipelineStateMachineRunResult,
} from '../types/pipeline/state.js';
import {
  createInitialPipelineState,
  ensurePipelineStateArtifactsDir,
  getLastStablePhase,
  loadPipelineState,
  savePipelineState,
  writePhaseArtifacts,
} from './pipelineStateStore.js';

function nowIso(): string {
  return new Date().toISOString();
}

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function phaseIndex(phase: CanonicalPipelinePhaseId): number {
  return CANONICAL_PIPELINE_PHASES.indexOf(phase);
}

function phaseRange(fromPhase: CanonicalPipelinePhaseId, toPhase?: CanonicalPipelinePhaseId): CanonicalPipelinePhaseId[] {
  const from = phaseIndex(fromPhase);
  if (from === -1) throw new Error(`Fase inválida: ${fromPhase}`);

  if (!toPhase) return CANONICAL_PIPELINE_PHASES.slice(from);

  const to = phaseIndex(toPhase);
  if (to === -1) throw new Error(`Fase inválida: ${toPhase}`);
  if (from > to) throw new Error(`Rango inválido de fases: ${fromPhase} -> ${toPhase}`);

  return CANONICAL_PIPELINE_PHASES.slice(from, to + 1);
}

function nextPhaseAfter(phase?: CanonicalPipelinePhaseId): CanonicalPipelinePhaseId | undefined {
  if (!phase) return CANONICAL_PIPELINE_PHASES[0];
  const index = phaseIndex(phase);
  if (index === -1) return CANONICAL_PIPELINE_PHASES[0];
  return CANONICAL_PIPELINE_PHASES[index + 1];
}

function attemptForPhase(state: PipelineState, phase: CanonicalPipelinePhaseId): number {
  return state.phases.filter((item) => item.phase === phase).length + 1;
}

function summarizeMetrics(phase: CanonicalPipelinePhaseId, state: PipelineState): Record<string, string | number | boolean | null> {
  switch (phase) {
    case 'research':
      return {
        competitors: state.data.researchContext?.competitors?.length || 0,
        entities: state.data.researchContext?.entities?.length || 0,
        intent: state.data.researchContext?.intentModel?.primaryIntent || null,
      };
    case 'normalization':
      return {
        phoneNormalized: state.data.normalizedContext?.clean_nap?.phone_normalized || null,
        clusteredKeywords: state.data.normalizedContext?.clustered_keywords?.length || 0,
      };
    case 'planning':
      return {
        sections: state.data.pagePlan?.sections?.length || 0,
        h1: state.data.pagePlan?.h1 || null,
        pageType: state.data.pagePlan?.intentModel?.pageType || null,
      };
    case 'render-plan':
      return {
        orderedSections: state.data.resolvedPlan?.sections?.length || 0,
        theme: (state.data.resolvedPlan as any)?.theme?.id || null,
      };
    case 'writing':
      return {
        blocks: state.data.contentDraft?.blocks?.length || 0,
        totalWords: state.data.contentDraft?.totalWords || 0,
      };
    case 'correction':
      return {
        blocks: state.data.correctedDraft?.blocks?.length || 0,
        totalWords: state.data.correctedDraft?.totalWords || 0,
      };
    case 'enrichment':
    case 'seo-contract':
      return {
        blocks: state.data.enrichedDraft?.blocks?.length || 0,
        totalWords: state.data.enrichedDraft?.totalWords || 0,
      };
    case 'assembly':
      return {
        htmlLength: state.data.renderedPage?.html?.length || 0,
      };
    case 'technical-validation':
      return {
        technicalPassed: state.data.renderedPage?.metadata?.technical_passed || false,
        issues: state.data.renderedPage?.metadata?.validation_errors?.length || 0,
      };
    case 'quality-gate':
      return {
        score: state.data.qualityGateResult?.score || 0,
        passed: state.data.qualityGateResult?.passed || false,
        issues: state.data.qualityGateResult?.issues?.length || 0,
      };
    case 'editorial-validation':
      return {
        editorialScore: state.data.editorialAudit?.score || 0,
        editorialPassed: state.data.renderedPage?.metadata?.editorial_passed || false,
      };
    default:
      return {};
  }
}

function mergeObservability(base: ObservabilityMetadata, patch?: Partial<ObservabilityMetadata>): ObservabilityMetadata {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    durations: { ...(base.durations || {}), ...(patch.durations || {}) },
    scores: { ...(base.scores || {}), ...(patch.scores || {}) },
    retries: { ...(base.retries || {}), ...(patch.retries || {}) },
    agent_logs: [...(base.agent_logs || []), ...((patch.agent_logs || []) as string[])],
    agentConfidence: { ...(base.agentConfidence || {}), ...(patch.agentConfidence || {}) },
  };
}

export class ContentPipelineStateMachine {
  private readonly qualityPolicy = new QualityPolicyEngine();

  constructor(private readonly host: PipelineHostAdapter) {}

  private async emitMissionEvent(state: PipelineState, event: MissionEvent): Promise<void> {
    const enriched: MissionEvent = {
      missionId: state.runId,
      ...event,
      data: {
        ...(event.data || {}),
        niche: state.mission?.niche,
        city: state.mission?.city,
      },
    };
    const line = formatHumanEvent(enriched);
    if (event.level === 'error') console.error(line);
    else if (event.level === 'warn') console.warn(line);
    else console.log(line);
    await appendMissionEvent(state.artifactsDir, enriched);
  }

  private resolveQualityLedger(state: PipelineState, options: PipelineRunOptions): PipelineQualityLedger {
    const profile = this.qualityPolicy.resolveProfile({
      softMode: this.host.shouldUseSoftMode(state.mission),
      deliver: options.deliver,
    });

    return state.data.qualityLedger || createEmptyQualityLedger(profile.id);
  }

  private attachQualityAssessment(
    state: PipelineState,
    phase: CanonicalPipelinePhaseId,
    status: PipelinePhaseStatus,
    warnings: string[],
    options: PipelineRunOptions,
  ): PipelineState {
    const profile = this.qualityPolicy.resolveProfile({
      softMode: this.host.shouldUseSoftMode(state.mission),
      deliver: options.deliver,
    });

    const assessment = this.qualityPolicy.assessPhase({
      phase,
      state,
      outcomeStatus: status,
      warnings,
      profile,
    });

    state.data.qualityLedger = this.qualityPolicy.applyAssessment(state.data.qualityLedger, assessment);
    return state;
  }

  private maybeBlockDelivery(state: PipelineState, phase: CanonicalPipelinePhaseId, options: PipelineRunOptions): {
    blocked: boolean;
    degraded: boolean;
    reason?: string;
    state: PipelineState;
  } {
    const profile = this.qualityPolicy.resolveProfile({
      softMode: this.host.shouldUseSoftMode(state.mission),
      deliver: options.deliver,
    });
    const ledger = this.resolveQualityLedger(state, options);
    const policyDecision = this.qualityPolicy.evaluateDeliveryPolicy({
      ledger,
      profile,
      phase,
    });

    if (!policyDecision.blocked) {
      state.data.qualityLedger = ledger;
      return { blocked: false, degraded: false, state };
    }

    if (this.host.shouldUseSoftMode(state.mission)) {
      state.data.qualityLedger = this.qualityPolicy.applyAssessment(ledger, {
        phase,
        profile: profile.id,
        generatedAt: new Date().toISOString(),
        issues: policyDecision.issue ? [policyDecision.issue] : [],
        counts: { fatal: 0, major: policyDecision.issue ? 1 : 0, minor: 0, warning: 0 },
        decision: 'degraded',
        summary: policyDecision.summary,
      });
      state.data.delivery = { attempted: false, completed: false, skipped: true, reason: policyDecision.summary };
      return { blocked: false, degraded: true, reason: policyDecision.summary, state };
    }

    state.data.qualityLedger = this.qualityPolicy.applyAssessment(ledger, {
      phase,
      profile: profile.id,
      generatedAt: new Date().toISOString(),
      issues: policyDecision.issue ? [policyDecision.issue] : [],
      counts: { fatal: 0, major: policyDecision.issue ? 1 : 0, minor: 0, warning: 0 },
      decision: 'blocked',
      summary: policyDecision.summary,
    });
    return { blocked: true, degraded: false, reason: policyDecision.summary, state };
  }

  private async loadOrCreateState(mission: any, options: PipelineRunOptions): Promise<PipelineState> {
    if (options.resumeFromStatePath) {
      const loaded = await loadPipelineState(options.resumeFromStatePath);
      return {
        ...loaded,
        updatedAt: nowIso(),
        lifecycle: {
          ...loaded.lifecycle,
          resumedFromPhase: nextPhaseAfter(getLastStablePhase(loaded)),
        },
      };
    }

    const persistState = options.persistState !== false;
    if (!persistState) {
      return createInitialPipelineState(mission, `${mission.niche}-${mission.city}-${Date.now()}`);
    }

    const seeded = await ensurePipelineStateArtifactsDir(
      { niche: mission.niche, city: mission.city },
      {
        baseDir: options.artifactsBaseDir,
        artifactsDir: options.artifactsDir,
      },
    );

    return createInitialPipelineState(mission, seeded.runId, seeded.dir);
  }

  private resolveStartPhase(state: PipelineState, options: PipelineRunOptions): CanonicalPipelinePhaseId {
    if (options.forceReexecuteFromPhase) return options.forceReexecuteFromPhase;
    if (options.startFromPhase) return options.startFromPhase;

    const resumed = nextPhaseAfter(getLastStablePhase(state));
    return resumed || CANONICAL_PIPELINE_PHASES[0];
  }

  private toFailureResult(state: PipelineState, error: Error): PipelineResult {
    return {
      success: false,
      error: error.message,
      observability: state.observability,
    };
  }

  private buildSuccessResult(state: PipelineState): PipelineResult {
    const renderedPage = state.data.renderedPage;
    const pagePlan = state.data.pagePlan;
    const enrichedDraft = state.data.enrichedDraft;
    const auditReport = state.data.postDeployAudit;

    if (!renderedPage || !pagePlan || !enrichedDraft) {
      return {
        success: false,
        error: 'PipelineState incompleto: falta renderedPage, pagePlan o enrichedDraft al construir el resultado final.',
        observability: state.observability,
      };
    }

    const allFaqs = this.host.extractFaqsFromRenderedHtml(renderedPage.html, state.mission);
    const finalH1 = this.host.extractPrimaryH1FromHtml(renderedPage.html) || pagePlan.h1;
    const finalWordCount = this.host.countWordsFromRenderedHtml(renderedPage.html) || enrichedDraft.totalWords || 0;
    const postAuditNotes = this.host.buildPostAuditNotes(auditReport as any);
    const finalIssues = Array.from(new Set([
      ...(Array.isArray(renderedPage.metadata.validation_errors) ? renderedPage.metadata.validation_errors : []),
      ...(Array.isArray(auditReport?.notes) ? auditReport?.notes : []),
    ]));

    return {
      success: true,
      data: {
        html: renderedPage.html,
        html_path: auditReport?.html_path || (renderedPage.metadata as any).output_path || '',
        word_count: finalWordCount,
        score: auditReport?.score || 0,
        notes: finalIssues,
        status: (auditReport as any)?.status || 'published',
        url: auditReport?.url || '',
        h1: finalH1,
        faqs: allFaqs,
        metadata: {
          ...renderedPage.metadata,
          internal_links: state.data.internalLinks || [],
          total_words: finalWordCount,
          audit_notes: postAuditNotes,
          observability: state.observability,
          quality_policy: state.data.qualityLedger || null,
        },
        observability: state.observability,
      },
    };
  }

  private async executePhase(phase: CanonicalPipelinePhaseId, state: PipelineState, options: PipelineRunOptions): Promise<{
    status: PipelinePhaseStatus;
    warnings: string[];
    error?: string;
    html?: string;
    state: PipelineState;
    metrics?: Record<string, string | number | boolean | null>;
  }> {
    const warnings: string[] = [];
    let nextState: PipelineState = safeClone(state);
    nextState.lifecycle.status = 'running';
    nextState.lifecycle.currentPhase = phase;

    switch (phase) {
      case 'playbook': {
        const applied = await this.host.applyPlaybookContext(nextState.mission);
        nextState.mission = safeClone(applied.mission);
        nextState.data.playbookContext = applied.playbookContext;
        return { status: 'success', warnings, state: nextState };
      }
      case 'site-graph': {
        nextState.data.siteGraph = this.host.buildSiteGraph(nextState.mission);
        return { status: 'success', warnings, state: nextState };
      }
      case 'research': {
        nextState.data.researchContext = await this.host.runResearchPhase(nextState.mission);
        return { status: 'success', warnings, state: nextState };
      }
      case 'normalization': {
        if (!nextState.data.researchContext) throw new Error('Falta researchContext antes de normalization.');
        nextState.data.normalizedContext = await this.host.runNormalizationPhase(nextState.data.researchContext);
        await this.host.validateNormalizationGate(nextState.data.normalizedContext);
        return { status: 'success', warnings, state: nextState };
      }
      case 'planning': {
        if (!nextState.data.normalizedContext) throw new Error('Falta normalizedContext antes de planning.');
        nextState.data.pagePlan = await this.host.runPlanningPhase(nextState.data.normalizedContext, nextState.mission);
        await this.host.validatePlanningGate(nextState.data.pagePlan, nextState.mission);
        return { status: 'success', warnings, state: nextState };
      }
      case 'render-plan': {
        if (!nextState.data.pagePlan) throw new Error('Falta pagePlan antes de render-plan.');
        console.log(`[Phase 3.5] Resolving render plan for ${nextState.mission.city}...`);
        nextState.data.resolvedPlan = this.host.resolveRenderPlan(nextState.mission, nextState.data.pagePlan);
        return { status: 'success', warnings, state: nextState };
      }
      case 'writing': {
        if (!nextState.data.normalizedContext || !nextState.data.pagePlan || !nextState.data.resolvedPlan) {
          throw new Error('Faltan normalizedContext, pagePlan o resolvedPlan antes de writing.');
        }
        nextState.data.contentDraft = await this.host.runWritingPhase(
          nextState.data.normalizedContext,
          nextState.data.pagePlan,
          nextState.mission,
          nextState.observability,
          nextState.data.resolvedPlan,
        );
        return { status: 'success', warnings, state: nextState };
      }
      case 'correction': {
        if (!nextState.data.contentDraft || !nextState.data.normalizedContext) {
          throw new Error('Faltan contentDraft o normalizedContext antes de correction.');
        }
        nextState.data.correctedDraft = await this.host.runCorrectionPhase(nextState.data.contentDraft, nextState.data.normalizedContext);
        return { status: 'success', warnings, state: nextState };
      }
      case 'integrity': {
        if (!nextState.data.correctedDraft || !nextState.data.pagePlan || !nextState.data.normalizedContext) {
          throw new Error('Faltan correctedDraft, pagePlan o normalizedContext antes de integrity.');
        }
        console.log(`[Phase 6] Validating content integrity for ${nextState.mission.city}...`);
        const targetTotal = nextState.mission.contextual_data?.wordCountTarget || nextState.data.pagePlan.intentModel?.wordCountTarget || 2100;
        this.host.validateWordBudget(nextState.data.correctedDraft, targetTotal);
        await this.host.validatePreAssemblyIntegrityGate(nextState.data.correctedDraft, {
          softMode: this.host.shouldUseSoftMode(nextState.mission),
          city: nextState.data.normalizedContext.city,
          niche: nextState.data.normalizedContext.niche,
          targetTotal,
        });
        return { status: 'success', warnings, state: nextState };
      }
      case 'enrichment': {
        if (!nextState.data.correctedDraft || !nextState.data.normalizedContext || !nextState.data.pagePlan) {
          throw new Error('Faltan correctedDraft, normalizedContext o pagePlan antes de enrichment.');
        }
        nextState.data.enrichedDraft = await this.host.runEnrichmentPhase(
          nextState.data.correctedDraft,
          nextState.data.normalizedContext,
          nextState.data.pagePlan,
          nextState.mission,
        );
        return { status: 'success', warnings, state: nextState };
      }
      case 'seo-contract': {
        if (!nextState.data.enrichedDraft || !nextState.data.pagePlan) {
          throw new Error('Faltan enrichedDraft o pagePlan antes de seo-contract.');
        }
        console.log(`[Phase 7.5] Building SEO contract and metadata...`);
        const seoPack = await this.host.buildSeoContract(nextState.data.enrichedDraft, nextState.data.pagePlan, nextState.mission);
        nextState.data.enrichedDraft = seoPack.enrichedDraft;
        nextState.data.pagePlan = seoPack.pagePlan;
        nextState.data.seoResult = seoPack.seoResult;
        nextState.data.internalLinks = seoPack.internalLinks;
        return { status: 'success', warnings, state: nextState };
      }
      case 'assembly': {
        if (!nextState.data.enrichedDraft || !nextState.data.pagePlan || !nextState.data.normalizedContext || !nextState.data.resolvedPlan) {
          throw new Error('Faltan enrichedDraft, pagePlan, normalizedContext o resolvedPlan antes de assembly.');
        }
        nextState.data.renderedPage = await this.host.runAssemblyPhase(
          nextState.data.enrichedDraft,
          nextState.data.pagePlan,
          nextState.data.normalizedContext,
          nextState.mission,
          nextState.data.resolvedPlan,
        );
        const assemblyMode = String((nextState.data.renderedPage.metadata as any)?.assembly_mode || 'procedural');
        if (assemblyMode === 'emergency_fallback') {
          warnings.push('ASSEMBLY_EMERGENCY_FALLBACK');
          return { status: 'degraded', warnings, state: nextState, html: nextState.data.renderedPage.html, metrics: { assemblyFallback: true } };
        }
        return { status: 'success', warnings, state: nextState, html: nextState.data.renderedPage.html, metrics: { assemblyFallback: false } };
      }
      case 'images': {
        if (!nextState.data.renderedPage || !nextState.data.pagePlan) {
          throw new Error('Faltan renderedPage o pagePlan antes de images.');
        }
        const outcome = await this.host.finalizeImages(nextState.data.renderedPage, nextState.mission, nextState.data.pagePlan, options);
        nextState.data.renderedPage = outcome.output || nextState.data.renderedPage;
        warnings.push(...(outcome.warnings || []));
        return {
          status: outcome.status,
          warnings,
          state: nextState,
          html: nextState.data.renderedPage.html,
          error: outcome.error,
        };
      }
      case 'completeness': {
        if (!nextState.data.renderedPage) throw new Error('Falta renderedPage antes de completeness.');
        const outcome = await this.host.validateCompleteness(nextState.data.renderedPage, nextState.mission, this.host.shouldUseSoftMode(nextState.mission));
        nextState.data.renderedPage = outcome.output || nextState.data.renderedPage;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage.html, error: outcome.error };
      }
      case 'technical-validation': {
        if (!nextState.data.renderedPage || !nextState.data.pagePlan || !nextState.data.resolvedPlan || !nextState.data.seoResult) {
          throw new Error('Faltan renderedPage, pagePlan, resolvedPlan o seoResult antes de technical-validation.');
        }
        const outcome = await this.host.validateTechnical(
          nextState.data.renderedPage,
          nextState.mission,
          nextState.data.pagePlan,
          nextState.data.resolvedPlan,
          nextState.data.seoResult,
          this.host.shouldUseSoftMode(nextState.mission),
        );
        nextState.data.renderedPage = outcome.output || nextState.data.renderedPage;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage.html, error: outcome.error };
      }
      case 'ux-validation': {
        if (!nextState.data.renderedPage) throw new Error('Falta renderedPage antes de ux-validation.');
        const outcome = await this.host.runUxValidation(nextState.data.renderedPage, nextState.mission);
        nextState.data.renderedPage = outcome.output || nextState.data.renderedPage;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage.html, error: outcome.error };
      }
      case 'quality-gate': {
        if (!nextState.data.renderedPage || !nextState.data.pagePlan) throw new Error('Faltan renderedPage o pagePlan antes de quality-gate.');
        const outcome = await this.host.runQualityGate(
          nextState.data.renderedPage,
          nextState.mission,
          nextState.data.pagePlan,
          this.host.shouldUseSoftMode(nextState.mission),
        );
        nextState.data.renderedPage = outcome.output?.renderedPage || nextState.data.renderedPage;
        nextState.data.qualityGateResult = outcome.output?.qualityGateResult || nextState.data.qualityGateResult;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage.html, error: outcome.error };
      }
      case 'editorial-validation': {
        if (!nextState.data.renderedPage) throw new Error('Falta renderedPage antes de editorial-validation.');
        const outcome = await this.host.runEditorialValidation(
          nextState.data.renderedPage,
          nextState.mission,
          this.host.shouldUseSoftMode(nextState.mission),
        );
        nextState.data.renderedPage = outcome.output?.renderedPage || nextState.data.renderedPage;
        nextState.data.editorialAudit = outcome.output?.editorialAudit || nextState.data.editorialAudit;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage.html, error: outcome.error };
      }
      case 'delivery': {
        if (!nextState.data.renderedPage) throw new Error('Falta renderedPage antes de delivery.');
        const deliveryPolicy = this.maybeBlockDelivery(nextState, phase, options);
        nextState = deliveryPolicy.state;
        if (deliveryPolicy.blocked) {
          return { status: 'failed', warnings, state: nextState, html: nextState.data.renderedPage?.html, error: deliveryPolicy.reason };
        }
        if (deliveryPolicy.degraded) {
          warnings.push(deliveryPolicy.reason || 'Delivery omitido por Quality Policy.');
          return { status: 'degraded', warnings, state: nextState, html: nextState.data.renderedPage?.html, error: deliveryPolicy.reason };
        }

        const pageForDelivery = nextState.data.renderedPage;
        if (!pageForDelivery) throw new Error('Falta renderedPage antes de delivery.');
        const outcome = await this.host.runDeliveryPhase(pageForDelivery, nextState.mission, options);
        nextState.data.renderedPage = outcome.output?.renderedPage || nextState.data.renderedPage;
        nextState.data.delivery = outcome.output?.delivery || nextState.data.delivery;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage?.html, error: outcome.error };
      }
      case 'post-audit': {
        if (!nextState.data.renderedPage) throw new Error('Falta renderedPage antes de post-audit.');
        if (nextState.data.delivery?.skipped) {
          warnings.push(`Post-audit omitido: ${nextState.data.delivery.reason || 'delivery skipped'}`);
          return { status: 'degraded', warnings, state: nextState, html: nextState.data.renderedPage?.html, error: nextState.data.delivery.reason };
        }
        const outcome = await this.host.runPostDeployAudit(nextState.data.renderedPage, nextState.mission, nextState.data.pagePlan);
        nextState.data.renderedPage = outcome.output?.renderedPage || nextState.data.renderedPage;
        nextState.data.postDeployAudit = outcome.output?.postDeployAudit || nextState.data.postDeployAudit;
        warnings.push(...(outcome.warnings || []));
        return { status: outcome.status, warnings, state: nextState, html: nextState.data.renderedPage?.html, error: outcome.error };
      }
      default:
        throw new Error(`Fase no soportada por la State Machine: ${phase}`);
    }
  }

  async run(missionInput: any, options: PipelineRunOptions = {}): Promise<PipelineStateMachineRunResult> {
    const persistState = options.persistState ?? Boolean(missionInput?.debugMode);
    const sanitizedMission = this.host.sanitizeMission(safeClone(missionInput));
    const initialState = await this.loadOrCreateState(sanitizedMission, { ...options, persistState });
    let state = safeClone(initialState);

    if (!options.resumeFromStatePath) {
      state.mission = sanitizedMission;
    }

    if (persistState && state.artifactsDir) {
      state.stateFilePath = await savePipelineState(state);
    }

    await this.emitMissionEvent(state, {
      level: 'info',
      event: 'MISSION_START',
      status: state.lifecycle.status,
      data: {
        persistState,
        resumeFromStatePath: Boolean(options.resumeFromStatePath),
        startFromPhase: options.startFromPhase || null,
        stopAfterPhase: options.stopAfterPhase || null,
      },
    });

    try {
      await this.host.ensureMissionEnrolledDB(state.mission);
      const startPhase = this.resolveStartPhase(state, options);
      const phases = phaseRange(startPhase, options.stopAfterPhase);

      for (const phase of phases) {
        const startedAt = Date.now();
        const phaseInput = safeClone({
          mission: state.mission,
          data: state.data,
          observability: state.observability,
          lifecycle: state.lifecycle,
        });

        await this.emitMissionEvent(state, {
          level: 'info',
          phase,
          event: 'PHASE_START',
          status: 'running',
          data: {
            attempt: attemptForPhase(state, phase),
            inputMetrics: summarizeMetrics(phase, state),
          },
        });

        let phaseState = safeClone(state);
        phaseState.lifecycle.status = 'running';
        phaseState.lifecycle.currentPhase = phase;
        phaseState.updatedAt = nowIso();

        if (persistState && phaseState.artifactsDir) {
          phaseState.stateFilePath = await savePipelineState(phaseState);
        }

        let executionRecord: PipelinePhaseExecutionRecord | undefined;
        const phaseAttempt = attemptForPhase(state, phase);
        try {
          assertPipelinePhaseContract(phase, 'input', phaseState);
          const outcome = await this.executePhase(phase, phaseState, options);
          state = safeClone(outcome.state);
          if (outcome.status !== 'failed') {
            assertPipelinePhaseContract(phase, 'output', state);
          }
          state.lifecycle.currentPhase = phase;
          state.lifecycle.lastStablePhase = phase;
          state.lifecycle.status = 'running';
          state.updatedAt = nowIso();

          const completedAt = Date.now();
          state = this.attachQualityAssessment(state, phase, outcome.status, outcome.warnings, options);
          const latestAssessment = state.data.qualityLedger?.assessments?.[phase];

          executionRecord = {
            phase,
            status: outcome.status,
            startedAt: new Date(startedAt).toISOString(),
            completedAt: new Date(completedAt).toISOString(),
            durationMs: completedAt - startedAt,
            warnings: outcome.warnings,
            error: outcome.error,
            metrics: summarizeMetrics(phase, state),
            qualitySummary: latestAssessment ? this.qualityPolicy.summarizeAssessment(latestAssessment) : undefined,
          };

          state.observability = mergeObservability(state.observability, {
            durations: {
              [CANONICAL_PIPELINE_LABELS[phase]]: executionRecord.durationMs,
            },
          });

          if (persistState && state.artifactsDir) {
            executionRecord.artifactPaths = await writePhaseArtifacts(
              state.artifactsDir,
              phase,
              phaseInput,
              {
                mission: state.mission,
                data: state.data,
                lifecycle: state.lifecycle,
                warnings: outcome.warnings,
              },
              executionRecord,
              phaseAttempt,
              { html: outcome.html },
            );
          }

          state.phases.push(executionRecord);

          await this.emitMissionEvent(state, {
            level: outcome.status === 'success' ? 'info' : outcome.status === 'degraded' ? 'warn' : 'error',
            phase,
            event: outcome.status === 'failed' ? 'PHASE_FAILED' : 'PHASE_END',
            status: outcome.status,
            durationMs: executionRecord.durationMs,
            message: outcome.error,
            data: {
              attempt: phaseAttempt,
              metrics: executionRecord.metrics || {},
              warningsCount: executionRecord.warnings?.length || 0,
              errorType: outcome.error ? classifyPipelineError(new Error(outcome.error), { phase }).type : undefined,
            },
          });

          if (outcome.status === 'failed') {
            state.lifecycle.status = 'failed';
            state.updatedAt = nowIso();
            if (persistState && state.artifactsDir) {
              state.stateFilePath = await savePipelineState(state);
            }
            const failureResult = this.toFailureResult(state, new Error(outcome.error || `La fase ${phase} falló.`));
            await writeMissionSummary(state, failureResult, new Error(outcome.error || `La fase ${phase} falló.`));
            await this.emitMissionEvent(state, {
              level: 'error',
              event: 'MISSION_FAILED',
              status: 'failed',
              message: failureResult.error,
              data: { failedPhase: phase, lastStablePhase: state.lifecycle.lastStablePhase || null },
            });
            return { result: failureResult, state };
          }

          if (this.host.saveLegacyDebugSnapshot) {
            await this.host.saveLegacyDebugSnapshot(phase, state, {
              html: outcome.html,
              summary: executionRecord.metrics,
              notes: outcome.warnings,
            });
          }

          if (persistState && state.artifactsDir) {
            state.stateFilePath = await savePipelineState(state);
          }
        } catch (error: any) {
          const completedAt = Date.now();
          state = this.attachQualityAssessment(state, phase, 'failed', [error.message], options);
          const latestAssessment = state.data.qualityLedger?.assessments?.[phase];

          executionRecord = {
            phase,
            status: 'failed',
            startedAt: new Date(startedAt).toISOString(),
            completedAt: new Date(completedAt).toISOString(),
            durationMs: completedAt - startedAt,
            warnings: [],
            error: error.message,
            metrics: summarizeMetrics(phase, state),
            qualitySummary: latestAssessment ? this.qualityPolicy.summarizeAssessment(latestAssessment) : undefined,
          };
          state.lifecycle.status = 'failed';
          state.lifecycle.currentPhase = phase;
          state.updatedAt = nowIso();

          if (persistState && state.artifactsDir) {
            executionRecord.artifactPaths = await writePhaseArtifacts(
              state.artifactsDir,
              phase,
              phaseInput,
              {
                error: error.message,
                lifecycle: state.lifecycle,
                data: state.data,
              },
              executionRecord,
              phaseAttempt,
            );
          }

          state.phases.push(executionRecord);

          await this.emitMissionEvent(state, {
            level: 'error',
            phase,
            event: 'PHASE_FAILED',
            status: 'failed',
            durationMs: executionRecord.durationMs,
            message: error.message,
            data: {
              attempt: phaseAttempt,
              errorType: classifyPipelineError(error, { phase }).type,
              errorHint: classifyPipelineError(error, { phase }).hint,
              metrics: executionRecord.metrics || {},
            },
          });

          if (persistState && state.artifactsDir) {
            state.stateFilePath = await savePipelineState(state);
          }

          if (state.data.renderedPage && this.host.shouldUseSoftMode(state.mission)) {
            const softModeResult = this.host.buildSoftModeResult(state.data.renderedPage, state.mission, error, state.observability);
            await writeMissionSummary(state, softModeResult, error);
            await this.emitMissionEvent(state, {
              level: 'error',
              event: 'MISSION_FAILED',
              status: 'failed',
              message: softModeResult.error || error.message,
              data: { failedPhase: phase, lastStablePhase: state.lifecycle.lastStablePhase || null, softMode: true },
            });
            return {
              result: softModeResult,
              state,
            };
          }

          const failureResult = this.toFailureResult(state, error);
          await writeMissionSummary(state, failureResult, error);
          await this.emitMissionEvent(state, {
            level: 'error',
            event: 'MISSION_FAILED',
            status: 'failed',
            message: failureResult.error,
            data: { failedPhase: phase, lastStablePhase: state.lifecycle.lastStablePhase || null },
          });
          return { result: failureResult, state };
        }
      }

      state.lifecycle.status = 'completed';
      state.lifecycle.currentPhase = undefined;
      state.updatedAt = nowIso();
      if (persistState && state.artifactsDir) {
        state.stateFilePath = await savePipelineState(state);
      }
      const successResult = this.buildSuccessResult(state);
      await writeMissionSummary(state, successResult);
      await this.emitMissionEvent(state, {
        level: successResult.success ? 'info' : 'error',
        event: successResult.success ? 'MISSION_SUCCESS' : 'MISSION_FAILED',
        status: successResult.success ? 'completed' : 'failed',
        message: successResult.error,
        data: { htmlPath: successResult.data?.html_path || null, score: successResult.data?.score || null },
      });
      return { result: successResult, state };
    } catch (error: any) {
      state.lifecycle.status = 'failed';
      state.updatedAt = nowIso();
      if (persistState && state.artifactsDir) {
        state.stateFilePath = await savePipelineState(state);
      }
      if (state.data.renderedPage && this.host.shouldUseSoftMode(state.mission)) {
        const outerSoftModeResult = this.host.buildSoftModeResult(state.data.renderedPage, state.mission, error, state.observability);
        await writeMissionSummary(state, outerSoftModeResult, error);
        await this.emitMissionEvent(state, {
          level: 'error',
          event: 'MISSION_FAILED',
          status: 'failed',
          message: outerSoftModeResult.error || error.message,
          data: { failedPhase: state.lifecycle.currentPhase || null, lastStablePhase: state.lifecycle.lastStablePhase || null, softMode: true },
        });
        return {
          result: outerSoftModeResult,
          state,
        };
      }
      const outerFailureResult = this.toFailureResult(state, error);
      await writeMissionSummary(state, outerFailureResult, error);
      await this.emitMissionEvent(state, {
        level: 'error',
        event: 'MISSION_FAILED',
        status: 'failed',
        message: outerFailureResult.error,
        data: { failedPhase: state.lifecycle.currentPhase || null, lastStablePhase: state.lifecycle.lastStablePhase || null },
      });
      return {
        result: outerFailureResult,
        state,
      };
    }
  }
}
