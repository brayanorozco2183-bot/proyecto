import { QualityScoreAgent } from '../../agents/quality_score.js';
import { runPhaseWithRepair } from '../../repair/phaseRepairOrchestrator.js';
import { 
    validateRenderedPageForPhase, 
    repairRenderedPageForPhase 
} from '../../repair/pageRepairKit.js';
import { validateRenderCompleteness } from '../../quality/postRenderCompletenessGuard.js';
import { finalHtmlPolish } from '../../utils/finalHtmlPolish.js';
import { finalizePageImages } from '../../images/finalizePageImages.js';
import { vault } from '../../tools/vault.js';
import { 
    validateRenderedPageTechnically, 
    TechnicalSeoValidationInput 
} from '../../utils/technicalPageValidator.js';
import { UXValidator } from '../../validators/uxValidator.js';
import { 
    runAsyncQualityGate 
} from '../../validators/qualityGate.js';
import { 
    GenerationMission, 
    RenderedPage, 
    PagePlan, 
    NormalizedContext 
} from '../../types/pipeline_v2.js';
import { PageImageContext } from '../../images/types.js';
import { PhaseHostOutcome, PipelinePhaseStatus } from '../../types/pipeline/state.js';
import path from 'path';
import { finalizeRenderedPageSemantics, validateRenderedSemanticQuality } from '../../utils/semanticContentGuard.js';
import { sanitizeLegalRiskClaims } from '../../utils/legalClaimSanitizer.js';
import { validateBlockVisualCoverage } from '../../quality/blockVisualCoverageGuard.js';
import { validateDeterministicProductionHtml } from '../../quality/deterministicProductionGate.js';
import { applyDeterministicHtmlSanitizer } from '../../utils/deterministicHtmlSanitizer.js';
import { validateSimpleDeliveryQuality } from '../../quality/simpleDeliveryQualityGate.js';


const IMAGE_PHASE_OWNED_CODES = new Set([
    'PRODUCTION_PLACEHOLDER_VISUAL',
    'HTML_STRUCTURE_INCOMPLETE',
    'MOBILE_VIEWPORT_MISSING',
]);

const IMAGE_PHASE_DEFERRED_GLOBAL_CODES = new Set([
    'FAQ_SCHEMA_CONTENT_MISMATCH',
    'FAQ_NUMBERING_ARTIFACT',
    'PLACEHOLDER_OR_BROKEN_COPY',
    'SYSTEM_LEAK_VISIBLE',
    'SCHEMA_JSON_INVALID',
    'SCHEMA_MISSING',
    'BROKEN_INTERNAL_INDEX_LINK',
]);

function uniqueStrings(items: string[]): string[] {
    return Array.from(new Set(items.filter(Boolean)));
}

function validateRenderedPageForImagesOnly(page: RenderedPage): ReturnType<typeof validateRenderedPageForPhase> {
    const full = validateRenderedPageForPhase(page, 'images');
    const issues = full.issues || [];
    const imageIssues = issues.filter((issue) => IMAGE_PHASE_OWNED_CODES.has(issue.code));
    const deferredGlobalIssues = issues.filter((issue) => !IMAGE_PHASE_OWNED_CODES.has(issue.code));

    const hardBlock = imageIssues.some((issue) =>
        issue.severity === 'critical' || IMAGE_PHASE_OWNED_CODES.has(issue.code)
    );

    const deferredWarnings = deferredGlobalIssues
        .filter((issue) => IMAGE_PHASE_DEFERRED_GLOBAL_CODES.has(issue.code) || issue.severity === 'critical')
        .map((issue) => `DEFERRED_GLOBAL_INTEGRITY_${issue.code}`);

    return {
        passed: !hardBlock,
        hardBlock,
        issues: imageIssues,
        warnings: uniqueStrings([...(full.warnings || []), ...deferredWarnings]),
        summary: `phase=images imageScoped=${hardBlock ? 'failed' : 'passed'} deferredGlobal=${uniqueStrings(deferredGlobalIssues.map((issue) => issue.code)).join(',') || 'none'}`,
    };
}

export class QualityPhase {
    constructor(private qualityScoreAgent: QualityScoreAgent) {}

    private toHostStatus(status: string): PipelinePhaseStatus {
        if (status === 'failed') return 'failed';
        if (status === 'success') return 'success';
        return 'degraded';
    }

    async runImagePhase(renderedPage: RenderedPage, mission: GenerationMission, pagePlan: PagePlan, options: any): Promise<PhaseHostOutcome<RenderedPage>> {
        const repairOptions = {
            city: mission.city,
            niche: mission.niche,
            businessName: mission.local_nap?.business_name,
            phone: mission.local_nap?.phone,
            canonical: (renderedPage.metadata?.seo as any)?.canonical
        };

        const imagesRequested = Boolean(options?.withImages && vault.COMFY_ENABLED);
        const safeInitialPage = repairRenderedPageForPhase(renderedPage, 'images', repairOptions);
        safeInitialPage.metadata = safeInitialPage.metadata || {};

        if (!imagesRequested) {
            (safeInitialPage.metadata as any).images_phase = {
                schemaVersion: 'images-phase@1',
                status: 'skipped',
                images: [],
                warnings: ['Images disabled or COMFY not enabled; continuing without generated image assets.']
            };
            return {
                status: 'degraded',
                warnings: ['IMAGES_SKIPPED'],
                output: safeInitialPage,
                metrics: { imagesRequested: false, imagesGenerated: 0 }
            };
        }

        const outcome = await runPhaseWithRepair({
            phase: 'images', input: safeInitialPage, maxAttempts: 2,
            execute: async (page) => {
                try {
                    const imageContext: PageImageContext = {
                        pageId: mission.missionId || `${mission.niche}-${mission.city}`,
                        niche: mission.niche,
                        city: mission.city,
                        businessName: mission.local_nap?.business_name,
                        phone: mission.local_nap?.phone,
                        h1: pagePlan.h1,
                        heroSubtitle: pagePlan.meta_description,
                        canonical: (page.metadata?.seo as any)?.canonical,
                        outputSlug: this.resolveMissionOutputSlug(mission)
                    };
                    page.html = await finalizePageImages(page.html, imageContext);
                    page.html = finalHtmlPolish(page.html, { city: mission.city, niche: mission.niche });
                } catch (error: any) {
                    page.metadata = page.metadata || {};
                    page.metadata.image_generation_error = String(error?.message || error);
                }
                return repairRenderedPageForPhase(page, 'images', repairOptions);
            },
            validate: (page) => validateRenderedPageForImagesOnly(page),
            repair: ({ value }) => repairRenderedPageForPhase(value, 'images', repairOptions),
            fallback: ({ value }) => repairRenderedPageForPhase(value, 'images', repairOptions),
            allowFallbackOnHardBlock: true,
        });

        const finalPage = repairRenderedPageForPhase(outcome.output || safeInitialPage, 'images', repairOptions);
        finalPage.html = finalHtmlPolish(finalPage.html, { city: mission.city, niche: mission.niche });
        finalPage.metadata = finalPage.metadata || {};
        (finalPage.metadata as any).phaseRepairImages = outcome.history;
        (finalPage.metadata as any).images_phase_deferred_global_issues = uniqueStrings(
            (outcome.warnings || [])
                .filter((warning) => warning.startsWith('DEFERRED_GLOBAL_INTEGRITY_'))
                .map((warning) => warning.replace('DEFERRED_GLOBAL_INTEGRITY_', ''))
        );
        (finalPage.metadata as any).images_phase = {
            schemaVersion: 'images-phase@1',
            status: outcome.status === 'failed' ? 'degraded' : this.toHostStatus(outcome.status),
            images: [],
            warnings: outcome.warnings || [],
            error: outcome.error
        };

        const warnings = [...(outcome.warnings || [])];
        if (outcome.status === 'failed') warnings.push(outcome.error || 'IMAGES_DEGRADED');

        return {
            status: outcome.status === 'failed' ? 'degraded' : this.toHostStatus(outcome.status),
            warnings,
            output: finalPage,
            error: outcome.status === 'failed' ? undefined : outcome.error,
            metrics: { imagesRequested: true, imagesGenerated: 0, imagePhaseRecovered: outcome.status === 'failed' }
        };
    }

    async runCompletenessPhase(renderedPage: RenderedPage, mission: GenerationMission, softMode: boolean): Promise<PhaseHostOutcome<RenderedPage>> {
        const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone };
        const outcome = await runPhaseWithRepair({
            phase: 'completeness', input: renderedPage, maxAttempts: 3,
            execute: (page) => { page.html = finalHtmlPolish(page.html, { city: mission.city, niche: mission.niche }); return page; },
            validate: (page) => { 
                const c = validateRenderCompleteness(page.html); 
                const t = validateRenderedPageForPhase(page, 'completeness'); 
                return { passed: c.passed && t.passed, hardBlock: !c.passed || t.hardBlock, issues: [ ...((c.issues || []).map((i:any)=>({ code: `COMPLETENESS_${i.code || 'ISSUE'}`, severity: 'critical', message: i.message || i.code || 'Completeness issue' }))), ...((t.issues || []) as any) ] }; 
            },
            repair: ({ value }) => repairRenderedPageForPhase(value, 'completeness', repairOptions),
            fallback: ({ value }) => repairRenderedPageForPhase(value, 'completeness', repairOptions), 
            allowFallbackOnHardBlock: true,
        });
        
        return {
            status: this.toHostStatus(outcome.status),
            warnings: outcome.warnings,
            output: outcome.output || renderedPage,
            error: outcome.error
        };
    }

    async runTechnicalValidation(renderedPage: RenderedPage, mission: GenerationMission, pagePlan: PagePlan, _resolvedPlan?: any, _seoResult?: any, softMode = false): Promise<PhaseHostOutcome<RenderedPage>> {
        const validationInput: TechnicalSeoValidationInput = {
            expectedPhone: mission.local_nap?.phone,
            expectedBusinessName: mission.local_nap?.business_name,
            pageType: pagePlan.intentModel?.pageType,
            mission: mission,
            pagePlan: pagePlan
        };
        
        let semanticPage = finalizeRenderedPageSemantics(renderedPage, {
            mission,
            pagePlan,
            canonical: (renderedPage.metadata?.seo as any)?.canonical,
            profile: (mission as any).nicheProfile
        });

        // RE-SANITIZAR después de inyección semántica para máxima seguridad
        const profile = (mission as any).nicheProfile;
        semanticPage.html = sanitizeLegalRiskClaims(semanticPage.html, { profile, niche: mission.niche }).html;
        semanticPage.html = finalHtmlPolish(semanticPage.html, { city: mission.city, niche: mission.niche });
        semanticPage.html = applyDeterministicHtmlSanitizer(semanticPage.html, { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone });

        const technicalIssues = validateRenderedPageTechnically(semanticPage, validationInput);
        const semanticIssues = validateRenderedSemanticQuality(semanticPage.html, {
            city: mission.city,
            niche: mission.niche,
            phone: mission.local_nap?.phone,
            businessName: mission.local_nap?.business_name,
            canonical: (semanticPage.metadata?.seo as any)?.canonical
        });
        const visualCoverage = validateBlockVisualCoverage(semanticPage.html);
        const deterministicGate = validateDeterministicProductionHtml(semanticPage.html);
        const simpleDeliveryGate = validateSimpleDeliveryQuality(semanticPage.html, {
            city: mission.city,
            niche: mission.niche,
            phone: mission.local_nap?.phone,
            businessName: mission.local_nap?.business_name,
            canonical: (semanticPage.metadata?.seo as any)?.canonical
        });
        const issues = Array.from(new Set([
            ...technicalIssues,
            ...semanticIssues.map(issue => issue.code),
            ...visualCoverage.issues.map(issue => issue.code),
            ...deterministicGate.issues.map(issue => issue.code),
            ...simpleDeliveryGate.issues.map(issue => issue.code)
        ]));
        
        const hasCriticalVisualIssue = visualCoverage.issues.some(issue => issue.severity === 'critical');
        const hasCriticalDeterministicIssue = deterministicGate.issues.some(issue => issue.severity === 'critical');
        const hasCriticalSimpleDeliveryIssue = simpleDeliveryGate.issues.some(issue => issue.severity === 'critical');
        const simpleGateEnabled = process.env.GRAVITY_SIMPLE_DELIVERY_GATE !== 'false';
        const passed = (issues.length === 0 || !semanticIssues.some(issue => issue.severity === 'critical'))
            && !hasCriticalVisualIssue
            && !hasCriticalDeterministicIssue
            && (!simpleGateEnabled || !hasCriticalSimpleDeliveryIssue);
        semanticPage.metadata = semanticPage.metadata || {};
        semanticPage.metadata.technical_passed = passed;
        semanticPage.metadata.validation_errors = issues;
        (semanticPage.metadata as any).block_visual_coverage = visualCoverage;
        (semanticPage.metadata as any).deterministic_production_gate = deterministicGate;
        (semanticPage.metadata as any).simple_delivery_quality_gate = simpleDeliveryGate;

        return {
            status: passed ? (issues.length ? 'degraded' : 'success') : (softMode ? 'degraded' : 'failed'),
            output: semanticPage,
            warnings: issues
        };
    }

    async runUXValidation(renderedPage: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<RenderedPage>> {
        const uxResult = await UXValidator.validate(renderedPage.html, mission.missionId || `${mission.niche}-${mission.city}`);
        return {
            status: uxResult.passed ? 'success' : 'degraded',
            output: renderedPage,
            warnings: uxResult.issues.map(i => i.message)
        };
    }

    async runQualityGate(renderedPage: RenderedPage, mission: GenerationMission, pagePlan: PagePlan, softMode = false): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; qualityGateResult?: any }>> {
        const profile = (mission as any).nicheProfile;
        
        let semanticPage = finalizeRenderedPageSemantics(renderedPage, {
            mission,
            pagePlan,
            canonical: (renderedPage.metadata?.seo as any)?.canonical,
            profile: (mission as any).nicheProfile
        });
        
        // RE-SANITIZAR después de inyección semántica
        semanticPage.html = sanitizeLegalRiskClaims(semanticPage.html, { profile, niche: mission.niche }).html;
        semanticPage.html = finalHtmlPolish(semanticPage.html, { city: mission.city, niche: mission.niche });
        semanticPage.html = applyDeterministicHtmlSanitizer(semanticPage.html, { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone });

        const semanticIssues = validateRenderedSemanticQuality(semanticPage.html, {
            city: mission.city,
            niche: mission.niche,
            phone: mission.local_nap?.phone,
            businessName: mission.local_nap?.business_name,
            canonical: (semanticPage.metadata?.seo as any)?.canonical
        });
        const gateResult = await runAsyncQualityGate({
            html: semanticPage.html,
            niche: mission.niche,
            city: mission.city,
            phone: mission.local_nap?.phone,
            businessName: mission.local_nap?.business_name,
            pagePlan: pagePlan
        });

        const visualCoverage = validateBlockVisualCoverage(semanticPage.html);
        const deterministicGate = validateDeterministicProductionHtml(semanticPage.html);
        const simpleDeliveryGate = validateSimpleDeliveryQuality(semanticPage.html, {
            city: mission.city,
            niche: mission.niche,
            phone: mission.local_nap?.phone,
            businessName: mission.local_nap?.business_name,
            canonical: (semanticPage.metadata?.seo as any)?.canonical
        });
        const semanticWarnings = semanticIssues.map(issue => issue.message);
        const visualWarnings = visualCoverage.issues.map(issue => issue.message);
        const deterministicWarnings = deterministicGate.issues.map(issue => issue.message);
        const simpleDeliveryWarnings = simpleDeliveryGate.issues.map(issue => issue.message);
        const hasCriticalSemanticIssue = semanticIssues.some(issue => issue.severity === 'critical');
        const hasCriticalVisualIssue = visualCoverage.issues.some(issue => issue.severity === 'critical');
        const hasCriticalDeterministicIssue = deterministicGate.issues.some(issue => issue.severity === 'critical');
        const hasCriticalSimpleDeliveryIssue = simpleDeliveryGate.issues.some(issue => issue.severity === 'critical');
        const simpleGateEnabled = process.env.GRAVITY_SIMPLE_DELIVERY_GATE !== 'false';
        const passed = gateResult.passed
            && !hasCriticalSemanticIssue
            && !hasCriticalVisualIssue
            && !hasCriticalDeterministicIssue
            && (!simpleGateEnabled || !hasCriticalSimpleDeliveryIssue);

        return {
            status: passed ? 'success' : (softMode ? 'degraded' : 'failed'),
            output: {
                renderedPage: semanticPage,
                qualityGateResult: {
                    ...gateResult,
                    passed,
                    semanticIssues,
                    visualCoverage,
                    deterministicGate,
                    simpleDeliveryGate
                }
            },
            warnings: [...gateResult.issues.map((i: any) => i.message), ...semanticWarnings, ...visualWarnings, ...deterministicWarnings, ...simpleDeliveryWarnings]
        };
    }

    async runEditorialValidation(renderedPage: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; editorialAudit: any }>> {
        const profile = (mission as any).nicheProfile;
        const result = await this.qualityScoreAgent.execute({
            html: finalHtmlPolish(renderedPage.html, { city: mission.city, niche: mission.niche }),
            niche: mission.niche,
            city: mission.city,
            businessName: mission.local_nap?.business_name,
            phone: mission.local_nap?.phone,
            complianceChecklist: profile?.complianceChecklist || []
        });

        const audit = result.success && result.data ? result.data : { score: 65, status: 'needs_review', reasoning: 'Audit failure' };
        renderedPage.html = finalHtmlPolish(renderedPage.html, { city: mission.city, niche: mission.niche });
        renderedPage.metadata = renderedPage.metadata || {};
        renderedPage.metadata.editorial_passed = Number(audit.score || 0) >= 80;

        return {
            status: result.success ? 'success' : 'degraded',
            output: {
                renderedPage,
                editorialAudit: audit
            }
        };
    }

    private resolveMissionOutputSlug(mission: any): string {
        const sanitize = (val: string) => String(val || '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();
        const clusterFolder = sanitize(mission.cluster_folder_name || mission.clusterFolderName);
        const basePath = clusterFolder || `${sanitize(mission.niche)}-${sanitize(mission.city)}`;
        const subPath = sanitize(mission.subPath);
        return subPath ? path.posix.join(basePath, subPath) : basePath;
    }
}
