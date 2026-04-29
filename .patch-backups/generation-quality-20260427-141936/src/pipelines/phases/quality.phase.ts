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
import { PhaseHostOutcome } from '../../types/pipeline/state.js';
import path from 'path';

export class QualityPhase {
    constructor(private qualityScoreAgent: QualityScoreAgent) {}

    async runImagePhase(renderedPage: RenderedPage, mission: GenerationMission, pagePlan: PagePlan, options: any): Promise<PhaseHostOutcome<RenderedPage>> {
        const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone, canonical: (renderedPage.metadata.seo as any)?.canonical };
        const outcome = await runPhaseWithRepair({
            phase: 'images', input: renderedPage, maxAttempts: 3,
            execute: async (page) => {
                if (options.withImages && vault.COMFY_ENABLED) {
                    try {
                        const imageContext: PageImageContext = { 
                            pageId: mission.missionId || `${mission.niche}-${mission.city}`, 
                            niche: mission.niche, city: mission.city, 
                            businessName: mission.local_nap?.business_name, 
                            phone: mission.local_nap?.phone, h1: pagePlan.h1, 
                            heroSubtitle: pagePlan.meta_description, 
                            canonical: (page.metadata.seo as any)?.canonical, 
                            outputSlug: this.resolveMissionOutputSlug(mission) 
                        };
                        page.html = await finalizePageImages(page.html, imageContext);
                    } catch (error: any) { page.metadata = page.metadata || {}; page.metadata.image_generation_error = String(error?.message || error); }
                }
                return page;
            },
            validate: (page) => validateRenderedPageForPhase(page, 'images'),
            repair: ({ value }) => repairRenderedPageForPhase(value, 'images', repairOptions),
            fallback: ({ value }) => repairRenderedPageForPhase(value, 'images', repairOptions),
            allowFallbackOnHardBlock: true,
        });
        
        const finalPage = outcome.output || renderedPage;
        finalPage.metadata = finalPage.metadata || {};
        (finalPage.metadata as any).phaseRepairImages = outcome.history;
        
        return {
            status: outcome.status,
            warnings: outcome.warnings,
            output: finalPage,
            error: outcome.error
        };
    }

    async runCompletenessPhase(renderedPage: RenderedPage, mission: GenerationMission, softMode: boolean): Promise<PhaseHostOutcome<RenderedPage>> {
        const repairOptions = { city: mission.city, niche: mission.niche, businessName: mission.local_nap?.business_name, phone: mission.local_nap?.phone };
        const outcome = await runPhaseWithRepair({
            phase: 'completeness', input: renderedPage, maxAttempts: 3,
            execute: (page) => { const c = validateRenderCompleteness(page.html); if (!c.passed) page.html = finalHtmlPolish(page.html, { city: mission.city, niche: mission.niche }); return page; },
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
            status: outcome.status,
            warnings: outcome.warnings,
            output: outcome.output || renderedPage,
            error: outcome.error
        };
    }

    async runTechnicalValidation(renderedPage: RenderedPage, mission: GenerationMission, pagePlan: PagePlan): Promise<PhaseHostOutcome<RenderedPage>> {
        const validationInput: TechnicalSeoValidationInput = {
            expectedPhone: mission.local_nap?.phone,
            expectedBusinessName: mission.local_nap?.business_name,
            pageType: pagePlan.intentModel?.pageType,
            mission: mission,
            pagePlan: pagePlan
        };
        const issues = validateRenderedPageTechnically(renderedPage, validationInput);
        
        const passed = issues.length === 0;
        renderedPage.metadata.technical_passed = passed;
        renderedPage.metadata.validation_errors = issues;

        return {
            status: passed ? 'success' : 'degraded',
            output: renderedPage,
            warnings: issues
        };
    }

    async runUXValidation(renderedPage: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<RenderedPage>> {
        const uxResult = await UXValidator.validate(renderedPage.html);
        return {
            status: uxResult.passed ? 'success' : 'degraded',
            output: renderedPage,
            warnings: uxResult.issues.map(i => i.message)
        };
    }

    async runQualityGate(renderedPage: RenderedPage, mission: GenerationMission, pagePlan: PagePlan): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; qualityGateResult?: any }>> {
        const gateResult = await runAsyncQualityGate(renderedPage.html, {
            niche: mission.niche,
            city: mission.city,
            phone: mission.local_nap?.phone,
            businessName: mission.local_nap?.business_name,
            pagePlan: pagePlan
        });

        return {
            status: gateResult.passed ? 'success' : 'failed',
            output: {
                renderedPage,
                qualityGateResult: gateResult
            },
            warnings: gateResult.issues.map((i: any) => i.message)
        };
    }

    async runEditorialValidation(renderedPage: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; editorialAudit: any }>> {
        const result = await this.qualityScoreAgent.execute({
            html: renderedPage.html,
            niche: mission.niche,
            city: mission.city,
            businessName: mission.local_nap.business_name
        });

        const audit = result.success ? result.data : { score: 65, status: 'needs_review', reasoning: 'Audit failure' };
        renderedPage.metadata.editorial_passed = audit.score >= 80;

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
