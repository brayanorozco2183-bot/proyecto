import {
  ArchitectLinkContext,
  InternalLinkPlan,
  MissionLike,
  SimpleContentBlock,
  SiteGraph,
} from './types.js';
import { buildAutomaticInternalLinkBlocks } from './autoBlocks.js';
import { buildArchitectLinkContext, resolveInternalLinkPlan } from './linkPlanner.js';
import { buildSiteGraph, findBestCurrentNodeId } from './siteGraph.js';
import { validateInternalLinkCoverage } from './validator.js';

export interface PlanLike {
  intentModel?: {
    pageType?: string;
    primaryKeyword?: string;
  };
  internalLinking?: {
    graph?: SiteGraph;
    currentNodeId?: string;
    architectContext?: ArchitectLinkContext;
    linkPlan?: InternalLinkPlan;
    autoBlocks?: SimpleContentBlock[];
  };
}

export interface DraftLike {
  blocks: SimpleContentBlock[];
  metadata?: Record<string, unknown>;
}

export interface PrepareClusterArtifactsResult {
  graph: SiteGraph;
  currentNodeId: string;
  architectContext: ArchitectLinkContext;
  linkPlan: InternalLinkPlan;
  autoBlocks: SimpleContentBlock[];
}

export function prepareClusterArtifacts(
  mission: MissionLike,
  pageType: string,
  primaryKeyword: string,
  analystTargets: string[] = [],
): PrepareClusterArtifactsResult {
  const graph = buildSiteGraph(mission);
  const currentNodeId = findBestCurrentNodeId(graph, pageType, primaryKeyword, mission.city);
  const architectContext = buildArchitectLinkContext(graph, currentNodeId, analystTargets);
  const linkPlan = resolveInternalLinkPlan(graph, currentNodeId, analystTargets);
  const autoBlocks = buildAutomaticInternalLinkBlocks(linkPlan, graph, mission);
  linkPlan.autoBlocks = autoBlocks;

  if (!autoBlocks.length) {
    linkPlan.upward = undefined;
    linkPlan.lateral = undefined;
    linkPlan.bofu = undefined;
    linkPlan.supporting = [];
    linkPlan.selected = [];
    linkPlan.all = [];
    linkPlan.grouped = {
      relatedServices: [],
      relatedAreas: [],
      relatedGuides: [],
      relatedFaqs: [],
      moneyPages: [],
    };
  }

  return {
    graph,
    currentNodeId,
    architectContext,
    linkPlan,
    autoBlocks,
  };
}

export function attachInternalLinkingToPlan<T extends PlanLike>(
  plan: T,
  cluster: PrepareClusterArtifactsResult,
): T {
  return {
    ...plan,
    internalLinking: {
      graph: cluster.graph,
      currentNodeId: cluster.currentNodeId,
      architectContext: cluster.architectContext,
      linkPlan: cluster.linkPlan,
      autoBlocks: cluster.autoBlocks,
    },
  };
}

export function injectAutomaticLinkBlocks<T extends DraftLike>(draft: T, autoBlocks: SimpleContentBlock[]): T {
  if (!autoBlocks.length) return draft;

  const existingAutoBlockIds = new Set(
    draft.blocks
      .filter((block) => Boolean(block.metadata?.internal_link_block))
      .map((block) => String(block.id)),
  );

  const blocksToInject = autoBlocks.filter((block) => !existingAutoBlockIds.has(String(block.id)));
  if (!blocksToInject.length) return draft;

  const blocks = [...draft.blocks];
  const firstCtaIndex = blocks.findIndex((block) => String(block.metadata?.block_type || '') === 'cta_panel');

  if (firstCtaIndex === -1) {
    blocks.push(...blocksToInject);
  } else {
    blocks.splice(firstCtaIndex, 0, ...blocksToInject);
  }

  return {
    ...draft,
    blocks,
  };
}

export function validatePlanInternalLinking(plan: PlanLike, html?: string): string[] {
  const graph = plan.internalLinking?.graph;
  const currentNodeId = plan.internalLinking?.currentNodeId;
  const linkPlan = plan.internalLinking?.linkPlan;
  if (!graph || !currentNodeId || !linkPlan) return ['Internal linking no inicializado en el plan.'];

  const currentNode = graph.nodes.find((node) => node.id === currentNodeId);
  if (!currentNode) return ['No se encontró el nodo actual dentro del grafo.'];

  return validateInternalLinkCoverage(linkPlan, currentNode, html).issues;
}