import { ContentWriterAgent } from '../../agents/contentWriterAgent.js';
import { NicheCoherenceAgent } from '../../agents/nicheCoherenceAgent.js';
import { SpanishCorrectorAgent } from '../../agents/spanishCorrectorAgent.js';
import { SectionIntegrityRefiner } from '../../utils/sectionIntegrityRefiner.js';
import { IntegrityGuard } from '../../utils/integrityGuard.js';
import { detectCrossNicheContamination } from '../../niches/crossNicheDetector.js';
import { validateContentAgainstNichePlaybook } from '../../niches/technicalValidation.js';
import { refinePremiumBlockCopy } from '../../utils/premiumCopyGuard.js';
import { buildSectionQualityContract, guardContentBlock, createSemanticFallbackBlock, enforceDraftSemanticCoherence } from '../../utils/semanticContentGuard.js';
import { buildPremiumFallbackContentBlock } from '../../utils/fallbackQuality.js';
import { injectAutomaticLinkBlocks } from '../../internal-linking/index.js';
import { requireNichePlaybook } from '../../niches/playbookLoader.js';
import { sanitizeLegalRiskClaims } from '../../utils/legalClaimSanitizer.js';
import { SeoPremiumGuard } from '../../utils/seoPremiumGuard.js';
import { GeoLinkFallbackFactory } from '../../fallbacks/geo/geoLinkFallbackFactory.js';
import { polishPlanningLabel, polishPremiumHtml, polishPremiumText } from '../../utils/premiumNicheGuard.js';
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
        plan.h1 = polishPlanningLabel(plan.h1 || '', { niche: research.niche, city: research.city });
        plan.meta_title = polishPremiumText(plan.meta_title || plan.h1 || '', { niche: research.niche, city: research.city });
        plan.meta_description = polishPremiumText(plan.meta_description || '', { niche: research.niche, city: research.city });
        if (Array.isArray(plan.sections)) {
            plan.sections = plan.sections.map((section: any) => ({
                ...section,
                h2: polishPlanningLabel(section.h2 || '', { niche: research.niche, city: research.city }),
                h3s: Array.isArray(section.h3s) ? section.h3s.map((h: any) => polishPlanningLabel(String(h || ''), { niche: research.niche, city: research.city })) : [],
                objective: polishPremiumText(section.objective || '', { niche: research.niche, city: research.city }),
            }));
        }

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
                contextual_data: {
                    ...(mission.contextual_data || {}),
                    serpInsights: research.serpInsights,
                    serpEvidence: research.serp_evidence,
                    researchMode: research.researchConfig?.mode
                },
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
                    ...(resolvedSectionContract?.mobilePattern && ['stack', 'split-collapse', 'cards'].includes(resolvedSectionContract.mobilePattern) ? { mobilePattern: resolvedSectionContract.mobilePattern } : {})
                } as any,
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
                    serpInsights: research.serpInsights,
                    serpGuidance: "Usa la SERP solo para cubrir intención, servicios frecuentes y FAQs; no copies textos ni inventes datos de negocio."
                },
                targetWords: section.target_words,
                expansion_mode: (section.depth_mode === 'deep' || section.depth_mode === 'compact') ? section.depth_mode : 'balanced',
                pageSkeleton: plan.layoutContract?.pageSkeleton,
                heroTemplate: plan.layoutContract?.heroTemplate,
                cadencePattern: plan.layoutContract?.cadencePattern,
                proofStrategy: plan.layoutContract?.proofStrategy,
                ctaStrategy: plan.layoutContract?.ctaStrategy,
                sectionPattern: layoutSpec.pattern,
                sectionContract: { ...(resolvedSectionContract || {}), qualityContract } as any
            });

            const duration = Date.now() - writerStart;
            obs.durations[`WriterBlock-${i}`] = duration;

            if (writerResponse.success && writerResponse.data) {
                const block: ContentBlock = {
                    id: sectionId,
                    type: section.block_type || 'unspecified',
                    h2: section.h2,
                    html: polishPremiumHtml(sanitizeLegalRiskClaims(writerResponse.data.html || '', (mission as any).nicheProfile || research.niche).html, { niche: research.niche, city: research.city }),
                    wordCount: writerResponse.data.wordCount || 0,
                    score: 0,
                    metadata: {
                        block_type: section.block_type,
                        sectionIndex: i,
                        semantic: writerResponse.data.semantic,
                        duration,
                        model: (writerResponse as any).observability?.model,
                        tokens: (writerResponse as any).observability?.tokenUsage || 0
                    }
                };
                const guarded = guardContentBlock({ block, contract: { ...qualityContract, profile: (mission as any).nicheProfile }, fallbackSection: section });
                if (guarded.issues.length) obs.agent_logs.push(`[semantic-guard:${sectionId}] ${guarded.issues.map(issue => issue.code).join(',')}`);
                blocks.push({
                    ...guarded.block,
                    metadata: { ...guarded.block.metadata, sectionIndex: i, semantic_guard_fallback: guarded.fallback, semantic_guard_repaired: guarded.repaired }
                });
                obs.tokenUsage += (block.metadata.tokens || 0);
            } else {
                console.warn(`[Phase 4] Writer failure in block ${i}. Usando fallback semántico controlado.`);
                const semanticFallbackBlock = createSemanticFallbackBlock({ section, contract: qualityContract, reason: writerResponse.error || 'writer_response_failed' });
                const fallbackBlock = buildPremiumFallbackContentBlock({
                    niche: research.niche,
                    city: research.city,
                    sectionTitle: section.h2,
                    blockType: section.block_type || section.blockType,
                    technicalTerms: qualityContract.requiredTerms,
                    phone: research.clean_nap?.phone,
                    businessName: research.clean_nap?.business_name,
                    pageType: plan.intentModel?.pageType,
                    primaryIntent: plan.intentModel?.primaryIntent,
                    contextualData: mission.contextual_data || {},
                    sectionId,
                    reason: writerResponse.error || 'writer_response_failed',
                    seedHint: `writer:${sectionId}:${i}:${plan.variant || ''}`,
                });
                blocks.push({
                    ...fallbackBlock,
                    id: sectionId,
                    h2: section.h2 || semanticFallbackBlock.h2,
                    metadata: {
                        ...fallbackBlock.metadata,
                        block_type: section.block_type || section.blockType || fallbackBlock.metadata.block_type,
                        sectionIndex: i,
                        semantic_fallback_html_available: Boolean(semanticFallbackBlock.html),
                    }
                });
                obs.agent_logs.push(`[writer-fallback:${sectionId}] ${writerResponse.error || 'writer_response_failed'}`);
            }
        }

        const draft: ContentDraft = {
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

        const seoRefined = SeoPremiumGuard.refine(draft, research, plan, mission);
        
        return {
            ...draft,
            h1: seoRefined.h1,
            meta_title: seoRefined.meta_title,
            meta_description: seoRefined.meta_description,
            metadata: {
                ...draft.metadata,
                seo: {
                    jsonLd: seoRefined.jsonLd,
                    fallbackUsed: seoRefined.fallbackUsed,
                    seoGroupId: seoRefined.groupId
                }
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

            let refinedHtml = refineResponse.success && refineResponse.data ? refineResponse.data.html : rawHtml;
            refinedHtml = sanitizeLegalRiskClaims(refinedHtml, (draft as any).nicheProfile || (context as any).nicheProfile || context.niche).html;
            refinedHtml = SectionIntegrityRefiner.refine(refinedHtml, context.niche, context.city);

            const correccionesResponse = await this.spanishCorrector.execute({
                html: refinedHtml,
                niche: context.niche,
                city: context.city,
                businessName: context.clean_nap?.business_name,
                phone: context.clean_nap?.phone
            });

            let correctedHtml = correccionesResponse.success && correccionesResponse.data ? correccionesResponse.data.html : refinedHtml;
            correctedHtml = polishPremiumHtml(sanitizeLegalRiskClaims(correctedHtml, (draft as any).nicheProfile || (context as any).nicheProfile || context.niche).html, { niche: context.niche, city: context.city });

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
        }, context, undefined, (draft as any).nicheProfile || (context as any).nicheProfile);
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

    async runEnrichment(draft: ContentDraft, context: NormalizedContext, plan: PagePlan, mission?: GenerationMission): Promise<ContentDraft> {
        const phaseStartedAt = Date.now();
        console.log(`[Phase 7] START Content enrichment (SEO/Trust/Internal Linking)...`);

        const safeMission = this.resolveEnrichmentMission(draft, context, plan, mission);
        const nicheProfile = (safeMission as any).nicheProfile || (draft as any).nicheProfile || (context as any).nicheProfile;

        try {
            const enrichedDraft: ContentDraft = {
                ...draft,
                metadata: {
                    ...((draft as any).metadata || {}),
                    enrichment: {
                        ...(((draft as any).metadata || {}).enrichment || {}),
                        status: 'running',
                        mode: 'safe',
                        city: context.city || safeMission.city,
                        niche: context.niche || safeMission.niche,
                    },
                } as any,
                blocks: (Array.isArray(draft.blocks) ? draft.blocks : []).map((block) => {
                    try {
                        let enrichedHtml = sanitizeLegalRiskClaims(block.html || '', nicheProfile || context.niche || safeMission.niche).html;
                        enrichedHtml = refinePremiumBlockCopy(enrichedHtml, {
                            blockType: (block as any).type || block.metadata?.block_type,
                            niche: context.niche || safeMission.niche,
                            city: context.city || safeMission.city,
                        });
                        enrichedHtml = polishPremiumHtml(enrichedHtml, { niche: context.niche || safeMission.niche, city: context.city || safeMission.city });
                        return { ...block, html: enrichedHtml };
                    } catch (error) {
                        console.warn(`[Phase 7] Block enrichment degraded for ${block.id || block.metadata?.block_type || 'unknown'}: ${this.errorMessage(error)}`);
                        return {
                            ...block,
                            metadata: {
                                ...(block.metadata || {}),
                                enrichment_degraded: true,
                                enrichment_error: this.errorMessage(error),
                            },
                        };
                    }
                }),
            };

            const withLinks = this.safeInjectAutomaticLinks(enrichedDraft, plan);
            
            // Garantía de Enlazado Geográfico (Nivel 3)
            if (!this.hasEnoughInternalLinks(withLinks)) {
                console.log(`[Phase 7] Low link density detected. Injecting Surgical Geo Cluster Fallback.`);
                const geoData = GeoLinkFallbackFactory.build(context, safeMission, plan);
                if (geoData.links.length > 0) {
                    const geoBlock: ContentBlock = {
                        id: 'geo-fallback-links',
                        h2: geoData.h2,
                        html: this.renderGeoLinkBlock(geoData.intro, geoData.links),
                        wordCount: 60,
                        metadata: {
                            block_type: 'internal_links',
                            sectionIndex: 99,
                            is_geo_fallback: true
                        }
                    };
                    withLinks.blocks.push(geoBlock);
                }
            }

            const coherent = enforceDraftSemanticCoherence(withLinks as any, context, plan, nicheProfile) as ContentDraft;
            const finalDraft: ContentDraft = {
                ...coherent,
                metadata: {
                    ...((coherent as any).metadata || {}),
                    enrichment: {
                        ...(((coherent as any).metadata || {}).enrichment || {}),
                        status: 'success',
                        durationMs: Date.now() - phaseStartedAt,
                    },
                } as any,
            };
            console.log(`[Phase 7] END Content enrichment in ${Date.now() - phaseStartedAt}ms`);
            return finalDraft;
        } catch (error) {
            console.warn(`[Phase 7] ENRICHMENT_DEGRADED ${this.errorMessage(error)}. Continuing with corrected draft.`);
            return {
                ...draft,
                metadata: {
                    ...((draft as any).metadata || {}),
                    enrichment: {
                        status: 'degraded',
                        error: this.errorMessage(error),
                        durationMs: Date.now() - phaseStartedAt,
                    },
                } as any,
            };
        }
    }

    private resolveEnrichmentMission(draft: ContentDraft, context: NormalizedContext, plan: PagePlan, mission?: GenerationMission): GenerationMission {
        const fallbackMission = {
            niche: context.niche || (plan as any)?.niche || (draft as any)?.niche || 'servicio',
            city: context.city || (plan as any)?.city || (draft as any)?.city || 'tu ciudad',
            contextual_data: {},
            cluster_data: {},
            local_nap: {},
        } as GenerationMission;

        const provided = (mission || {}) as any;
        return {
            ...fallbackMission,
            ...provided,
            niche: provided.niche || fallbackMission.niche,
            city: provided.city || fallbackMission.city,
            contextual_data: {
                ...((fallbackMission as any).contextual_data || {}),
                ...(provided.contextual_data || {}),
            },
            cluster_data: {
                ...((fallbackMission as any).cluster_data || {}),
                ...(provided.cluster_data || {}),
            },
            local_nap: {
                ...((fallbackMission as any).local_nap || {}),
                ...(provided.local_nap || {}),
            },
        } as GenerationMission;
    }

    private safeInjectAutomaticLinks(draft: ContentDraft, plan: PagePlan): ContentDraft {
        try {
            const autoBlocks = Array.isArray(plan.internalLinking?.autoBlocks) ? plan.internalLinking?.autoBlocks || [] : [];
            if (!autoBlocks.length) return draft;
            return injectAutomaticLinkBlocks(draft as any, autoBlocks) as any;
        } catch (error) {
            console.warn(`[Phase 7] Internal link enrichment skipped: ${this.errorMessage(error)}`);
            return {
                ...draft,
                metadata: {
                    ...((draft as any).metadata || {}),
                    internal_link_enrichment_degraded: true,
                    internal_link_enrichment_error: this.errorMessage(error),
                } as any,
            };
        }
    }

    private errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error || 'Unknown error');
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

    private hasEnoughInternalLinks(draft: ContentDraft): boolean {
        const html = draft.blocks.map(b => b.html).join(' ');
        // BLE V2.3: Catch relative links (./, ../) and standard root links (/)
        const linkCount = (html.match(/<a\s+href=["'](?:\/|\.\/|\.\.\/)/gi) || []).length;
        return linkCount >= 2;
    }

    private renderGeoLinkBlock(intro: string, links: any[]): string {
        const listItems = links.map(l => `
            <li class="internal-links-item internal-links-item--geo">
                <strong class="internal-links-item__title">${l.anchor}</strong>
                <a href="${l.url}" class="internal-links-item__anchor">Abrir página</a>
            </li>
        `).join('');
        
        return `
        <div class="internal-links-hub">
            <div class="internal-links-hub__header">
                <p class="block__description">${intro}</p>
            </div>
            <ul class="internal-links-grid">
                ${listItems}
            </ul>
        </div>`;
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
