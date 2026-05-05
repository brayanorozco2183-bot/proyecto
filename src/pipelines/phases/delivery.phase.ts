import fs from 'fs/promises';
import path from 'path';
import { vault } from '../../tools/vault.js';
import { buildDeterministicSlug } from '../../seo/slugEngine.js';
import { AuditSentinel } from '../../utils/auditSentinel.js';
import { 
    GenerationMission, 
    RenderedPage, 
    PostDeployAuditResult 
} from '../../types/pipeline_v2.js';
import { PhaseHostOutcome } from '../../types/pipeline/state.js';
import { reconcileClusterInternalLinks } from '../../internal-linking/postClusterInterlinking.js';
import { applyPremiumContentDepth } from '../../utils/premiumContentDepth.js';
import { applyFinalTransmissionGuard } from '../../utils/finalTransmissionGuard.js';

export class DeliveryPhase {
    async run(page: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; delivery: any }>> {
        try {
            const outputRoot = this.resolveMissionOutputSlug(mission);
            const configuredOutputDir = (vault as any).OUTPUT_DIR || process.env.OUTPUT_DIR || path.join(process.cwd(), 'output_sites');
            const fullDir = path.join(configuredOutputDir, outputRoot);
            const fileName = mission.wordpress?.enabled ? 'content.txt' : 'index.html';
            const finalPath = path.join(fullDir, fileName);

            await fs.mkdir(fullDir, { recursive: true });
            if (!mission.wordpress?.enabled && fileName === 'index.html') {
                const deliveryContext = {
                    city: mission.city,
                    niche: mission.niche,
                    businessName: (mission as any).businessName || (mission as any).business_name,
                    phone: (mission as any).phone
                };
                page.html = applyFinalTransmissionGuard(applyPremiumContentDepth(page.html, deliveryContext), deliveryContext);
            }
            await fs.writeFile(finalPath, page.html, 'utf-8');
            page.metadata.output_path = finalPath;

            let interlinkingReconciliation: any = null;
            if (Array.isArray((mission as any)?.cluster_data?.geo) && (mission as any).cluster_data.geo.length > 1 && !mission.wordpress?.enabled) {
                try {
                    interlinkingReconciliation = await reconcileClusterInternalLinks(mission as any);
                    page.metadata.internal_linking_reconciliation = interlinkingReconciliation;
                    if (interlinkingReconciliation?.updated) {
                        console.log(`[Phase 11] Interlinking reconciled for ${interlinkingReconciliation.updated} cluster pages.`);
                    }
                } catch (error: any) {
                    interlinkingReconciliation = { attempted: true, completed: false, reason: error?.message || String(error) };
                    page.metadata.internal_linking_reconciliation = interlinkingReconciliation;
                    console.warn(`[Phase 11] Interlinking reconciliation skipped: ${interlinkingReconciliation.reason}`);
                }
            }

            console.log(`[Phase 11] Delivered to: ${finalPath}`);
            
            return {
                status: 'success',
                output: {
                    renderedPage: page,
                    delivery: { attempted: true, completed: true, path: finalPath, interlinkingReconciliation }
                }
            };
        } catch (error: any) {
            return {
                status: 'failed',
                error: `Delivery error: ${error.message}`,
                output: {
                    renderedPage: page,
                    delivery: { attempted: true, completed: false, reason: error.message }
                }
            };
        }
    }

    async runPostAudit(page: RenderedPage, mission: GenerationMission): Promise<PhaseHostOutcome<{ renderedPage: RenderedPage; postDeployAudit: PostDeployAuditResult }>> {
        const audit = await AuditSentinel.audit(page, mission);
        return {
            status: 'success',
            output: {
                renderedPage: page,
                postDeployAudit: audit
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
