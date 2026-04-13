import {
  ArchitectAvailableLink,
  ArchitectLinkContext,
  InternalLinkPlan,
  LinkCandidate,
  LinkDirection,
  SiteGraph,
  SiteNode,
} from './types.js';

function normalize(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function dedupeCandidates(candidates: LinkCandidate[]): LinkCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.targetId}::${candidate.direction}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toCandidate(graph: SiteGraph, edge: SiteGraph['edges'][number]): LinkCandidate | null {
  const target = graph.nodes.find((node) => node.id === edge.to);
  if (!target) return null;

  return {
    targetId: target.id,
    targetSlug: target.slug,
    targetKeyword: target.keyword,
    targetTitle: target.title || target.keyword,
    targetType: target.type,
    targetSubtype: target.pageSubtype,
    direction: edge.direction,
    score: edge.score,
    anchor: edge.anchor,
    reason: edge.rationale,
    rule: edge.rule,
  };
}

function sortCandidates(candidates: LinkCandidate[]): LinkCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.targetTitle.localeCompare(b.targetTitle);
  });
}

function pickFirst(candidates: LinkCandidate[], direction: LinkDirection): LinkCandidate | undefined {
  return candidates.find((candidate) => candidate.direction === direction);
}

function pickPreferredLateral(candidates: LinkCandidate[], currentNode: SiteNode): LinkCandidate | undefined {
  const laterals = candidates.filter((candidate) => candidate.direction === 'lateral');
  if (!laterals.length) return undefined;

  if (currentNode.type === 'service_area') {
    const sameAreaFamily = laterals.filter(
      (candidate) =>
        candidate.targetType === 'service_area' &&
        normalize(candidate.targetKeyword) === normalize(currentNode.keyword),
    );

    if (sameAreaFamily.length) return sameAreaFamily[0];

    const anyArea = laterals.find((candidate) => candidate.targetType === 'service_area');
    if (anyArea) return anyArea;
  }

  return laterals[0];
}

function findMoneyPage(graph: SiteGraph, currentNode: SiteNode): LinkCandidate | undefined {
  const outgoing = graph.adjacency[currentNode.id] || [];
  const candidate = outgoing
    .map((edge) => toCandidate(graph, edge))
    .filter((value): value is LinkCandidate => Boolean(value))
    .find((item) => item.direction === 'bofu');

  if (candidate) return candidate;

  const fallback = graph.nodes.find(
    (node) =>
      node.type === 'service' &&
      node.pageSubtype === 'primary' &&
      normalize(node.city || '') === normalize(currentNode.city || ''),
  );

  if (!fallback) return undefined;

  return {
    targetId: fallback.id,
    targetSlug: fallback.slug,
    targetKeyword: fallback.keyword,
    targetTitle: fallback.title || fallback.keyword,
    targetType: fallback.type,
    targetSubtype: fallback.pageSubtype,
    direction: 'bofu',
    score: 92,
    anchor: `${fallback.keyword} en ${fallback.city}`,
    reason: 'Fallback a money page principal por ciudad.',
    rule: 'guide_to_money_page',
  };
}

export function resolveInternalLinkPlan(
  graph: SiteGraph,
  currentNodeId: string,
  analystTargets: string[] = [],
): InternalLinkPlan {
  const currentNode = graph.nodes.find((node) => node.id === currentNodeId);
  if (!currentNode) {
    throw new Error(`Current node not found in graph: ${currentNodeId}`);
  }

  const biasTerms = analystTargets.map(normalize).filter(Boolean);
  const outgoing = (graph.adjacency[currentNodeId] || [])
    .map((edge) => toCandidate(graph, edge))
    .filter((value): value is LinkCandidate => Boolean(value))
    .map((candidate) => {
      const matchesBias = biasTerms.some(
        (term) => normalize(candidate.targetKeyword).includes(term) || normalize(candidate.anchor).includes(term),
      );
      return {
        ...candidate,
        score: candidate.score + (matchesBias ? 8 : 0),
      };
    });

  const sorted = sortCandidates(dedupeCandidates(outgoing));
  const upward = pickFirst(sorted, 'upward');
  const lateral = pickPreferredLateral(sorted, currentNode);
  const bofu = currentNode.funnelStage === 'BOFU' ? undefined : findMoneyPage(graph, currentNode);

  const reserved = new Set([upward?.targetId, lateral?.targetId, bofu?.targetId].filter(Boolean));
  const preferredSupportingPool = currentNode.type === 'service_area'
    ? sorted.filter(
        (candidate) =>
          candidate.targetType === 'service_area' &&
          normalize(candidate.targetKeyword) === normalize(currentNode.keyword),
      )
    : sorted;

  const supporting = preferredSupportingPool
    .filter((candidate) => !reserved.has(candidate.targetId))
    .slice(0, currentNode.type === 'service_area' ? 2 : 6);

  const selected: LinkCandidate[] = [];
  const selectedIds = new Set<string>();
  const pushSelected = (candidate?: LinkCandidate) => {
    if (!candidate || selectedIds.has(candidate.targetId) || selected.length >= 3) return;
    selected.push(candidate);
    selectedIds.add(candidate.targetId);
  };

  pushSelected(upward);
  pushSelected(lateral);

  if (currentNode.funnelStage !== 'BOFU') {
    pushSelected(bofu);
  }

  for (const candidate of supporting) {
    if (selected.length >= 3) break;
    pushSelected(candidate);
  }

  if (selected.length < 2) {
    for (const candidate of sorted) {
      if (selected.length >= 2) break;
      pushSelected(candidate);
    }
  }

  const all = dedupeCandidates([
    ...(upward ? [upward] : []),
    ...(lateral ? [lateral] : []),
    ...(bofu ? [bofu] : []),
    ...supporting,
  ]);

  const grouped = {
    relatedServices: all.filter((candidate) => candidate.targetType === 'service' && candidate.targetSubtype !== 'urgent'),
    relatedAreas: all.filter((candidate) => candidate.targetType === 'service_area'),
    relatedGuides: all.filter((candidate) => candidate.targetType === 'guide' || candidate.targetType === 'comparison'),
    relatedFaqs: all.filter((candidate) => candidate.targetType === 'faq'),
    moneyPages: all.filter(
      (candidate) => candidate.direction === 'bofu' || candidate.targetSubtype === 'urgent' || candidate.targetSubtype === 'primary',
    ),
  };

  return {
    currentNodeId,
    currentNodeType: currentNode.type,
    currentCity: currentNode.city,
    currentAreaName: currentNode.areaName,
    upward,
    lateral,
    bofu,
    supporting,
    selected,
    all,
    grouped,
  };
}

export function buildArchitectLinkContext(
  graph: SiteGraph,
  currentNodeId: string,
  analystTargets: string[] = [],
): ArchitectLinkContext {
  const currentNode = graph.nodes.find((node) => node.id === currentNodeId);
  if (!currentNode) {
    throw new Error(`Current node not found in graph: ${currentNodeId}`);
  }

  const plan = resolveInternalLinkPlan(graph, currentNodeId, analystTargets);
  const availableLinks: ArchitectAvailableLink[] = plan.all.slice(0, 8).map((candidate) => ({
    slug: candidate.targetSlug,
    anchor: candidate.anchor,
    keyword: candidate.targetKeyword,
    targetType: candidate.targetType,
    direction: candidate.direction,
    reason: candidate.reason,
  }));

  const mandatoryLinkGoals = [
    'Incluir 2 o 3 enlaces internos útiles y contextuales.',
    'Incluir al menos 1 enlace ascendente hacia hub o página madre.',
    'Incluir al menos 1 enlace lateral dentro del mismo cluster.',
  ];

  if (currentNode.type === 'service_area') {
    mandatoryLinkGoals.unshift('Prioriza barrios o zonas de la misma ciudad y del mismo servicio.');
  }

  if (currentNode.funnelStage !== 'BOFU') {
    mandatoryLinkGoals.push('Incluir al menos 1 enlace BOFU hacia página transaccional.');
  }

  return {
    currentNodeId,
    currentNode,
    availableLinks,
    mandatoryLinkGoals,
    suggestedAnchors: availableLinks.map((link) => link.anchor),
  };
}