import {
  ClusterItemInput,
  MissionLike,
  SiteGraph,
  SiteNode,
  SiteNodeType,
  SitePageSubtype,
} from './types.js';
import { buildHeuristicEdges, buildAdjacency } from './linkRules.js';

function normalize(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function slugify(input: string): string {
  return normalize(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function detectTopicalType(keyword: string): { type: SiteNodeType; subtype: SitePageSubtype; stage: 'TOFU' | 'MOFU' | 'BOFU' } {
  const k = normalize(keyword);
  if (/(precio|precios|tarifa|coste|cuanto cuesta|vs|versus|comparativa|comparacion)/.test(k)) {
    return { type: 'comparison', subtype: 'generic', stage: 'MOFU' };
  }
  if (/(preguntas frecuentes|faq|dudas|cuestiones)/.test(k)) {
    return { type: 'faq', subtype: 'generic', stage: 'MOFU' };
  }
  if (/(como|qué es|que es|guia|guía|pasos|consejos|errores)/.test(k)) {
    return { type: 'guide', subtype: 'generic', stage: 'TOFU' };
  }
  if (/(urgencia|urgencias|24h|urgente|rapido|rápido|inmediato)/.test(k)) {
    return { type: 'service', subtype: 'urgent', stage: 'BOFU' };
  }
  return { type: 'service', subtype: 'subservice', stage: 'BOFU' };
}

function defaultSlugForNode(node: Pick<SiteNode, 'type' | 'pageSubtype' | 'keyword' | 'city' | 'areaName'>): string {
  const city = slugify(node.city || '');
  const keyword = slugify(node.keyword || '');
  const area = slugify(node.areaName || node.keyword || '');

  if (node.type === 'home_local') return `/${city}/`;
  if (node.type === 'service_area') return `/${keyword}/${area}/${city}/`;
  if (node.type === 'guide') return `/guia/${keyword}/${city}/`;
  if (node.type === 'faq') return `/faq/${keyword}/${city}/`;
  if (node.type === 'comparison') return `/comparativa/${keyword}/${city}/`;
  if (node.pageSubtype === 'urgent') return `/urgencias/${keyword}/${city}/`;
  return `/${keyword}/${city}/`;
}

function makeNode(input: Partial<SiteNode> & Pick<SiteNode, 'id' | 'type' | 'keyword'>): SiteNode {
  const nodeBase = {
    city: input.city,
    parent: input.parent,
    pageSubtype: input.pageSubtype || 'generic',
    title: input.title || input.keyword,
    areaName: input.areaName,
    serviceName: input.serviceName || input.keyword,
    funnelStage: input.funnelStage || 'BOFU',
    clusterSource: input.clusterSource || 'derived',
    priority: input.priority || 50,
    ...input,
  };

  return {
    ...nodeBase,
    slug: input.slug || defaultSlugForNode(nodeBase as SiteNode),
  } as SiteNode;
}

function clusterItemToNode(
  item: ClusterItemInput,
  mission: MissionLike,
  primaryServiceId: string,
): SiteNode {
  const detected = detectTopicalType(item.name);
  const keyword = item.name;
  const id = `${detected.type}:${detected.subtype}:${slugify(item.name)}:${slugify(mission.city)}`;
  const base = makeNode({
    id,
    type: item.kind || detected.type,
    keyword,
    city: mission.city,
    parent: primaryServiceId,
    pageSubtype: detected.subtype,
    clusterSource: 'topical',
    funnelStage: detected.stage,
    slug: item.sub_path ? `/${item.sub_path.replace(/^\/+|\/+$/g, '')}/` : undefined,
  });

  if (base.type === 'service') {
    base.serviceName = keyword;
  }

  return base;
}

function geoItemToNode(item: ClusterItemInput, mission: MissionLike, primaryServiceId: string): SiteNode {
  const normalizedCity = normalize(mission.city);
  const normalizedArea = normalize(item.name);
  const looksLikeCity = normalizedCity === normalizedArea;

  if (looksLikeCity) {
    return makeNode({
      id: `home:${slugify(mission.city)}`,
      type: 'home_local',
      keyword: mission.city,
      city: mission.city,
      title: mission.city,
      clusterSource: 'geo',
      pageSubtype: 'city_hub',
      funnelStage: 'BOFU',
      slug: item.sub_path ? `/${item.sub_path.replace(/^\/+|\/+$/g, '')}/` : undefined,
      priority: 100,
    });
  }

  return makeNode({
    id: `area:${slugify(mission.niche)}:${slugify(item.name)}:${slugify(mission.city)}`,
    type: 'service_area',
    keyword: mission.niche,
    city: mission.city,
    parent: primaryServiceId,
    areaName: item.name,
    serviceName: mission.niche,
    clusterSource: 'geo',
    funnelStage: 'BOFU',
    title: `${mission.niche} en ${item.name}`,
    slug: item.sub_path ? `/${item.sub_path.replace(/^\/+|\/+$/g, '')}/` : undefined,
    priority: 70,
  });
}

export function buildSiteNodes(mission: MissionLike): SiteNode[] {
  const cityHomeId = `home:${slugify(mission.city)}`;
  const primaryServiceId = `service:primary:${slugify(mission.niche)}:${slugify(mission.city)}`;

  const nodes: SiteNode[] = [
    makeNode({
      id: cityHomeId,
      type: 'home_local',
      keyword: mission.city,
      city: mission.city,
      title: `Inicio local ${mission.city}`,
      pageSubtype: 'city_hub',
      clusterSource: 'seed',
      funnelStage: 'BOFU',
      priority: 100,
      slug: mission.subPath ? `/${mission.subPath.replace(/^\/+|\/+$/g, '')}/` : undefined,
    }),
    makeNode({
      id: primaryServiceId,
      type: 'service',
      keyword: mission.niche,
      city: mission.city,
      parent: cityHomeId,
      title: `${mission.niche} en ${mission.city}`,
      pageSubtype: 'primary',
      clusterSource: 'seed',
      funnelStage: 'BOFU',
      priority: 95,
      serviceName: mission.niche,
    }),
    makeNode({
      id: `service:urgent:${slugify(mission.niche)}:${slugify(mission.city)}`,
      type: 'service',
      keyword: mission.niche,
      city: mission.city,
      parent: primaryServiceId,
      title: `Urgencias de ${mission.niche} en ${mission.city}`,
      pageSubtype: 'urgent',
      clusterSource: 'seed',
      funnelStage: 'BOFU',
      priority: 90,
      serviceName: mission.niche,
    }),
    makeNode({
      id: `faq:${slugify(mission.niche)}:${slugify(mission.city)}`,
      type: 'faq',
      keyword: mission.niche,
      city: mission.city,
      parent: primaryServiceId,
      title: `FAQ de ${mission.niche} en ${mission.city}`,
      pageSubtype: 'generic',
      clusterSource: 'seed',
      funnelStage: 'MOFU',
      priority: 80,
    }),
    makeNode({
      id: `comparison:${slugify(mission.niche)}:${slugify(mission.city)}`,
      type: 'comparison',
      keyword: mission.niche,
      city: mission.city,
      parent: primaryServiceId,
      title: `Comparativa de ${mission.niche} en ${mission.city}`,
      pageSubtype: 'generic',
      clusterSource: 'seed',
      funnelStage: 'MOFU',
      priority: 82,
    }),
  ];

  for (const geo of mission.cluster_data?.geo || []) {
    nodes.push(geoItemToNode(geo, mission, primaryServiceId));
  }

  for (const topical of mission.cluster_data?.topical || []) {
    nodes.push(clusterItemToNode(topical, mission, primaryServiceId));
  }

  return uniqueById(nodes);
}

export function buildSiteGraph(mission: MissionLike): SiteGraph {
  const nodes = buildSiteNodes(mission);
  const edges = buildHeuristicEdges(nodes);
  const adjacency = buildAdjacency(edges);
  return { nodes, edges, adjacency };
}

export function findBestCurrentNodeId(
  graph: SiteGraph,
  pageType: string,
  keyword: string,
  city: string,
): string {
  const key = normalize(keyword);
  const mappedType: Record<string, SiteNodeType> = {
    service: 'service',
    urgent: 'service',
    service_area: 'service_area',
    guide: 'guide',
    faq: 'faq',
    comparison: 'comparison',
    home_local: 'home_local',
    category: 'service',
  };

  const desiredType = mappedType[pageType] || 'service';
  const desiredSubtype = pageType === 'urgent' ? 'urgent' : undefined;

  const matchesNodeForCurrentPage = (node: SiteNode): boolean => {
    if (node.type !== desiredType) return false;
    if (desiredSubtype && node.pageSubtype !== desiredSubtype) return false;

    const candidates = desiredType === 'service_area'
      ? [node.areaName, node.title, node.slug, node.keyword]
      : [node.keyword, node.title, node.slug];

    return candidates
      .map((value) => normalize(String(value || '')))
      .some((value) => value && (value.includes(key) || key.includes(value)));
  };

  const exact = graph.nodes.find((node) =>
    normalize(node.city || '') === normalize(city) &&
    matchesNodeForCurrentPage(node)
  );

  if (exact) return exact.id;

  const fallback = graph.nodes.find((node) =>
    node.type === desiredType && normalize(node.city || '') === normalize(city)
  );

  return fallback?.id || graph.nodes[0]?.id || '';
}