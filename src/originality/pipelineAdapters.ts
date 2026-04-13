import { dbManager } from '../db/index.js';
import { recordEditorialMemory } from './editorialMemory.js';
import { recordSiteStructureMemory } from './siteStructureMemory.js';
import { buildSnapshotFromPlan, firstWordsSignature, getParagraphSignaturesFromHtml } from './signatures.js';
import { installOriginalitySchema } from './schema.js';
import { recordVisualMemory } from './visualMemory.js';
import { assessOriginalityBeforeRender, buildOriginalityDirective } from './originalityPlanner.js';
import { MissionLike, PagePlanLike } from './types.js';

export async function ensureOriginalitySchema(): Promise<void> {
  const db = await dbManager.getDB();
  await installOriginalitySchema(db as any);
}

export async function prepareOriginalityConstraints(input: {
  mission: MissionLike;
  pagePlan: PagePlanLike;
  pageId?: string;
}) {
  const db = await dbManager.getDB();
  const result = await assessOriginalityBeforeRender({
    db: db as any,
    mission: input.mission,
    pagePlan: input.pagePlan,
    pageId: input.pageId
  });

  return {
    ...result,
    architectDirective: buildOriginalityDirective(result)
  };
}

export async function recordOriginalityAfterRender(input: {
  mission: MissionLike;
  pagePlan: PagePlanLike;
  html: string;
  pageId?: string;
}) {
  const db = await dbManager.getDB();
  const snapshot = buildSnapshotFromPlan({
    mission: input.mission,
    pagePlan: input.pagePlan,
    pageId: input.pageId
  });

  const paragraphSignatures = getParagraphSignaturesFromHtml(input.html);

  await Promise.all([
    recordVisualMemory(db as any, {
      pageId: snapshot.pageId,
      clusterScopes: snapshot.scopes.map(scope => scope.key),
      city: snapshot.city,
      niche: snapshot.niche,
      pageType: snapshot.pageType,
      serviceKey: snapshot.serviceKey,
      family: input.pagePlan.design?.dna?.family,
      heroSignature: snapshot.heroSignature,
      blockSequenceSignature: snapshot.blockSequenceSignature,
      blockVariantsSignature: snapshot.blockVariantsSignature,
      navPatternSignature: snapshot.navPatternSignature,
      ctaPatternSignature: snapshot.ctaPatternSignature
    }),
    recordEditorialMemory(db as any, {
      pageId: snapshot.pageId,
      clusterScopes: snapshot.scopes.map(scope => scope.key),
      city: snapshot.city,
      niche: snapshot.niche,
      pageType: snapshot.pageType,
      serviceKey: snapshot.serviceKey,
      h2Openings: snapshot.h2Openings,
      paragraphSignatures,
      faqOpenings: snapshot.faqOpenings,
      localProofOpenings: snapshot.localProofOpenings,
      ctaOpenings: [firstWordsSignature(input.pagePlan.hero?.cta_text || '', 4)].filter(Boolean)
    }),
    recordSiteStructureMemory(db as any, {
      pageId: snapshot.pageId,
      clusterScopes: snapshot.scopes.map(scope => scope.key),
      city: snapshot.city,
      niche: snapshot.niche,
      pageType: snapshot.pageType,
      serviceKey: snapshot.serviceKey,
      blockSequence: snapshot.blockSequence,
      blockVariants: snapshot.blockVariants,
      heroSignature: snapshot.heroSignature,
      navSignature: snapshot.navPatternSignature,
      ctaSignature: snapshot.ctaPatternSignature,
      faqStructureSignature: snapshot.faqStructureSignature,
      structural: snapshot.structural
    })
  ]);
}