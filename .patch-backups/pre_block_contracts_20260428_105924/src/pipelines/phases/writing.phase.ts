import { ContentWriterAgent } from '../../agents/contentWriterAgent.js';
import { NicheCoherenceAgent } from '../../agents/nicheCoherenceAgent.js';
import { SpanishCorrectorAgent } from '../../agents/spanishCorrectorAgent.js';
import { SectionIntegrityRefiner } from '../../utils/sectionIntegrityRefiner.js';
import { IntegrityGuard } from '../../utils/integrityGuard.js';
import { detectCrossNicheContamination } from '../../niches/crossNicheDetector.js';
import { validateContentAgainstNichePlaybook } from '../../niches/technicalValidation.js';
import { refinePremiumBlockCopy } from '../../utils/premiumCopyGuard.js';
import { buildSectionQualityContract, guardContentBlock, createSemanticFallbackBlock, enforceDraftSemanticCoherence } from '../../utils/semanticContentGuard.js';
import { injectAutomaticLinkBlocks } from '../../internal-linking/index.js';
import { requireNichePlaybook } from '../../niches/playbookLoader.js';
import { sanitizeLegalRiskClaims } from '../../utils/legalClaimSanitizer.js';
import { 
    GenerationMission, 
    NormalizedContext, 
    PagePlan, 
    ContentDraft, 
    ContentBlock,
    ObservabilityMetadata
} from '../../types/pipeline_v2.js';
import { ResolvedPageRenderPlan } from '../../types/design.js';

export class WritingPhase {
    constructor(
        private writer: ContentWriterAgent,
        private nicheCoherenceAgent: NicheCoherenceAgent,
        private spanishCorrector: SpanishCorrectorAgent
    ) {}

    async run(research: NormalizedContext, plan: PagePlan, mission: GenerationMission, obs: ObservabilityMetadata, resolvedPlan: ResolvedPageRenderPlan): Promise<ContentDraft> {
        console.log(`[Phase 4] Multi-Agent semantic writing for H1: ${plan.h1}`);

        const blocks: ContentBlock[] = [];
        const allowedLocalEntities = this.deriveAllowedLocalEntities(research, mission, plan);
        const playbook = requireNichePlaybook(research.niche);
        const prohibitedClaims = playbook.legalRiskPolicy?.prohibitedClaims || [];

        const internalLinksToMention = (plan.internalLinking?.linkPlan?.all || [])
            .map((c: any) => c.anchor)
            .filter(Boolean);

        for (let i = 0; i < plan.sections.length; i++) {
            const section = plan.sections[i];
            const sectionId = section.section_id || `section-${i}`;
            const resolvedSectionContract = this.getResolvedSectionContract(resolvedPlan, sectionId, section, i);
            const qualityContract = buildSectionQualityContract({ section, sectionId, index: i, totalSections: plan.sections.length, context: research, resolvedSectionContract });
            const layoutSpec = {
                shell: resolvedSectionContract?.shell || 'plain',
                density: resolvedSectionContract?.density || section.content_density || 'standard',
                pattern: resolvedSectionContract?.sectionPattern || section.pattern_hint || 'stack',
                layout: section.layout_hint || 'full_width_text'
            };

            const writerStart = Date.now();
            const writerResponse = await this.writer.execute({
                niche: research.niche,
                city: research.city,
                section_h2: section.h2,
                subsections_h3: section.h3s || [],
                local_nap: research.clean_nap,
                contextual_data: mission.contextual_data,
                entities: research.deduplicated_entities || [],
                pageProfile: plan.pageProfile,
                sectionIndex: i,
                totalSections: plan.sections.length,
                blockType: section.block_type || section.blockType,
                preferred_format: section.preferred_format,
                content_density: layoutSpec.density,
                layout_hint: layoutSpec.layout,
                visual_variant: section.visual_variant,
                visual_spec: {
                    ...(section.visual_spec || {}),
                    ...(resolvedSectionContract?.mobilePattern ? { mobilePattern: resolvedSectionContract.mobilePattern } : {})
                },
                factuality_level: section.factuality_level,
                mobile_priority: section.mobile_priority,
                section_id: sectionId,
                allowedLocalEntities,
                intentModel: research.intentModel!,
                sectionBrief: {
                    objective: section.objective || '',
                    userQuestion: '',
                    internalLinksToMention: Array.from(new Set([...internalLinksToMention])),
                    qualityContract,
                    prohibitedClaims,
                },
                targetWords: section.target_words,
                expansion_mode: section.depth_mode || 'standard',
                pageSkeleton: plan.layoutContract?.pageSkeleton,
                heroTemplate: plan.layoutContract?.heroTemplate,
                cadencePattern: plan.layoutContract?.cadencePattern,
                proofStrategy: plan.layoutContract?.proofStrategy,
                ctaStrategy: plan.layoutContract?.ctaStrategy,
                sectionPattern: layoutSpec.pattern,
                sectionContract: { ...(resolvedSectionContract || {}), qualityContract }
            });

            const duration = Date.now() - writerStart;
            obs.durations[`WriterBlock-${i}`] = duration;

            if (writerResponse.success && writerResponse.data) {
                const block: ContentBlock = {
                    id: sectionId,
                    type: section.block_type || 'unspecified',
                    h2: section.h2,
                    html: sanitizeLegalRiskClaims(writerResponse.data.html || '', research.niche).html,
                    wordCount: writerResponse.data.wordCount || 0,
                    score: 0,
                    metadata: {
                        block_type: section.block_type,
                        semantic: writerResponse.data.semantic,
                        duration,
                        model: writerResponse.observability?.model,
                        tokens: writerResponse.observability?.tokenUsage || 0
                    }
                };
                const guarded = guardContentBlock({ block, contract: qualityContract, fallbackSection: section });
                if (guarded.issues.length) obs.agent_logs.push(`[semantic-guard:${sectionId}] ${guarded.issues.map(issue => issue.code).join(',')}`);
                blocks.push({
                    ...guarded.block,
                    metadata: { ...guarded.block.metadata, sectionIndex: i, semantic_guard_fallback: guarded.fallback, semantic_guard_repaired: guarded.repaired }
                });
                obs.tokenUsage += (block.metadata.tokens || 0);
            } else {
                console.warn(`[Phase 4] Writer failure in block ${i}. Usando fallback semántico controlado.`);
                const fallbackBlock = createSemanticFallbackBlock({ section, contract: qualityContract, reason: writerResponse.error || 'writer_response_failed' });
                blocks.push({ ...fallbackBlock, metadata: { ...fallbackBlock.metadata, sectionIndex: i } });
                obs.agent_logs.push(`[writer-fallback:${sectionId}] ${writerResponse.error || 'writer_response_failed'}`);
            }
        }

        return {
            h1: plan.h1,
            meta_title: plan.meta_title,
            meta_description: plan.meta_description,
            blocks,
            totalWords: blocks.reduce((acc, b) => acc + b.wordCount, 0),
            pageProfile: plan.pageProfile,
            metadata: {
                blocks_generated: blocks.length,
                plan_sections: plan.sections.length
            }
        };
    }

    async runCorrection(draft: ContentDraft, context: NormalizedContext): Promise<ContentDraft> {
        console.log(`[Phase 5] Global coherence and linguistic correction...`);

        const correctedBlocks: ContentBlock[] = [];
        for (const block of draft.blocks) {
            const rawHtml = block.html;
            
            const refineResponse = await this.nicheCoherenceAgent.execute({
                html: rawHtml,
                niche: context.niche,
                city: context.city,
                blockType: block.type
            });

            let refinedHtml = refineResponse.success ? refineResponse.data.html : rawHtml;
            refinedHtml = sanitizeLegalRiskClaims(refinedHtml, context.niche).html;
            refinedHtml = SectionIntegrityRefiner.refine(refinedHtml, context.niche, context.city);

            const correccionesResponse = await this.spanishCorrector.execute({
                html: refinedHtml,
                niche: context.niche,
                city: context.city,
                businessName: context.clean_nap?.business_name,
                phone: context.clean_nap?.phone
            });

            let correctedHtml = correccionesResponse.success ? correccionesResponse.data.html : refinedHtml;
            correctedHtml = sanitizeLegalRiskClaims(correctedHtml, context.niche).html;

            // NICHE ISOLATION GATE
            const crossNicheReport = detectCrossNicheContamination({
                niche: context.niche,
                city: context.city,
                blockType: block.type,
                html: correctedHtml
            });

            if (crossNicheReport.severity === 'major' || crossNicheReport.severity === 'fatal') {
                console.warn(`[Niche Isolation] Contaminación detectada tras corrección en bloque ${block.id}. Revirtiendo.`);
                correctedHtml = refinedHtml;
            }

            correctedBlocks.push({
                ...block,
                html: correctedHtml
            });
        }

        return enforceDraftSemanticCoherence({
            ...draft,
            blocks: correctedBlocks
        }, context);
    }

    async validateIntegrity(draft: ContentDraft, options: { softMode?: boolean; city?: string; niche?: string; targetTotal?: number } = {}): Promise<void> {
        const { softMode = false, city, niche, targetTotal } = options;
        const issues = IntegrityGuard.validateDraft(draft, { city, niche, targetTotal });

        if (niche) {
            for (const block of draft.blocks) {
                const nicheCheck = validateContentAgainstNichePlaybook({ niche, html: block.html });
                if (!nicheCheck.ok) issues.push(`NICHE_PLAYBOOK_VIOLATION:${block.id}: ${nicheCheck.issues.join('; ')}`);
            }
        }

        if (issues.length > 0) {
            console.warn(`[Integrity Gate] Initial issues: ${issues.join(', ')}`);
            const criticalIssues = issues.filter((issue) => /CONTENT_VOLUME_TOO_LOW|PLACEHOLDER_DETECTED|EMPTY_BLOCK|VISIBLE_TEXT_TOO_LOW|UNSAFE_OR_CORRUPTED_HTML|DUPLICATE_BLOCK_COPY|EMPTY_DRAFT|NICHE_PLAYBOOK_VIOLATION/.test(issue));
            if (criticalIssues.length > 0 && !softMode) {
                throw new Error(`Integrity Gate Failed: ${criticalIssues.join(', ')}`);
            }
        }
    }

    async runEnrichment(draft: ContentDraft, context: NormalizedContext, plan: PagePlan): Promise<ContentDraft> {
        console.log(`[Phase 7] Content enrichment (SEO/Trust/Internal Linking)...`);

        const enrichedDraft: ContentDraft = {
            ...draft,
            blocks: draft.blocks.map(block => {
                let enrichedHtml = sanitizeLegalRiskClaims(block.html, context.niche).html;
                enrichedHtml = refinePremiumBlockCopy(enrichedHtml, {
                    blockType: (block as any).type || block.metadata?.block_type,
                    niche: context.niche,
                    city: context.city
                });
                return { ...block, html: enrichedHtml };
            })
        };

        return enforceDraftSemanticCoherence(injectAutomaticLinkBlocks(enrichedDraft as any, plan.internalLinking?.autoBlocks || []) as any, context, plan);
    }

    private deriveAllowedLocalEntities(research: NormalizedContext, mission: GenerationMission, plan: PagePlan): string[] {
        const cityKey = String(research.city || '').toLowerCase().trim();
        const raw = [
            ...((research.geoData?.neighborhoods || []) as string[]),
            ...((research.geoData?.sub_locations || []).map((item: any) => item?.name)),
            ...((mission.cluster_data?.geo || []).map((item: any) => item?.name)),
            ...(((plan as any)?.internalLinking?.architectContext?.localAreas || []) as string[]),
            ...((((plan as any)?.internalLinking?.linkPlan?.grouped?.relatedAreas || []) as any[]).map((item: any) => item?.targetTitle || item?.anchor)),
        ];

        const seen = new Set<string>();
        const out: string[] = [];
        for (const value of raw) {
            const cleaned = String(value || '').replace(/^.*?\ben\s+/i, '').replace(/\s+/g, ' ').trim();
            const key = cleaned.toLowerCase();
            if (!cleaned || key === cityKey || seen.has(key)) continue;
            seen.add(key);
            out.push(cleaned);
            if (out.length >= 8) break;
        }
        return out;
    }

    private getResolvedSectionContract(resolvedPlan: ResolvedPageRenderPlan | undefined, sectionId: string, section: any, index: number) {
        const resolvedSections = Array.isArray(resolvedPlan?.sections) ? resolvedPlan.sections : [];
        const directMatch = resolvedSections.find((item: any) => item?.sectionId === sectionId);
        if (directMatch) return directMatch;

        const blockType = String(section?.block_type || section?.blockType || '').toLowerCase().trim();
        if (!blockType) return undefined;

        const sameType = resolvedSections.filter((item: any) => String(item?.blockType || '').toLowerCase().trim() === blockType);
        return sameType[index] || sameType[0];
    }
}
