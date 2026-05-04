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

function isInternalLinkBlock(block: SimpleContentBlock): boolean {
  return Boolean(block?.metadata?.internal_link_block)
    || String(block?.metadata?.block_type || '').toLowerCase() === 'internal_linking'
    || String(block?.blockType || block?.type || '').toLowerCase() === 'internal_linking'
    || String(block?.id || '').includes('internal-links');
}

export function injectAutomaticLinkBlocks<T extends DraftLike>(draft: T, autoBlocks: SimpleContentBlock[]): T {
  if (!Array.isArray(draft?.blocks) || !autoBlocks.length) return draft;

  const existing = draft.blocks.filter(isInternalLinkBlock);
  const incoming = autoBlocks.filter(isInternalLinkBlock);
  if (!incoming.length) return draft;

  const withoutExisting = draft.blocks.filter((block) => !isInternalLinkBlock(block));
  const insertionIndex = withoutExisting.findIndex((block) => String(block?.metadata?.block_type || '') === 'cta_panel');
  const merged = insertionIndex === -1
    ? [...withoutExisting, ...incoming]
    : [
        ...withoutExisting.slice(0, insertionIndex),
        ...incoming,
        ...withoutExisting.slice(insertionIndex),
      ];

  return {
    ...draft,
    blocks: merged,
  };
}

export function validatePlanInternalLinking(plan: PlanLike, html?: string): string[] {
  const graph = plan.internalLinking?.graph;
  const currentNodeId = plan.internalLinking?.currentNodeId;
  const linkPlan = plan.internalLinking?.linkPlan;

  const issues: string[] = [];
  if (!graph || !currentNodeId || !linkPlan) {
    issues.push('Internal linking no inicializado en el plan.');
    return issues;
  }

  const currentNode = graph.nodes.find((node) => node.id === currentNodeId);
  if (!currentNode) issues.push('No se encontró el nodo actual dentro del grafo.');

  if (!plan.internalLinking?.autoBlocks?.length) {
    issues.push('No se generó bloque automático de interlinking.');
  }

  if (html) {
    if (!/internal-links-hub/i.test(html)) issues.push('El HTML final no contiene el hub de interlinking.');
    const itemCount = (html.match(/internal-links-item/gi) || []).length;
    if (itemCount < 1) issues.push('El hub de interlinking no contiene enlaces renderizados.');
    const moneyCount = (html.match(/internal-links-item--money/gi) || []).length;
    if (itemCount > 0 && moneyCount < 1) issues.push('El hub de interlinking no contiene enlace visible a la money page.');
  }

  const coverage = currentNode ? validateInternalLinkCoverage(linkPlan, currentNode, html) : { issues: [] as string[] };
  return [...issues, ...(coverage.issues || [])];
}
