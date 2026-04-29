export type SiteNodeType = 'service' | 'service_area' | 'guide' | 'faq' | 'comparison' | 'home_local';
export type SitePageSubtype = 'primary' | 'subservice' | 'urgent' | 'city_hub' | 'generic';
export type LinkDirection = 'upward' | 'lateral' | 'downward' | 'bofu' | 'supporting';
export type EdgeHeuristic =
  | 'service_to_subservices'
  | 'service_to_city'
  | 'area_to_service'
  | 'city_to_areas'
  | 'urgent_to_service'
  | 'guide_to_money_page'
  | 'faq_to_service'
  | 'comparison_to_service'
  | 'same_service_nearby_areas'
  | 'same_city_related_services';

export interface ClusterItemInput {
  name: string;
  sub_path?: string;
  kind?: 'service' | 'service_area' | 'guide' | 'faq' | 'comparison';
}

export interface MissionLike {
  niche: string;
  city: string;
  subPath?: string;
  clusterFolderName?: string;
  cluster_folder_name?: string;
  cluster_data?: {
    geo?: ClusterItemInput[];
    topical?: ClusterItemInput[];
  };
}

export interface SiteNode {
  id: string;
  type: SiteNodeType;
  slug: string;
  keyword: string;
  city?: string;
  parent?: string;
  pageSubtype?: SitePageSubtype;
  title?: string;
  areaName?: string;
  serviceName?: string;
  funnelStage?: 'TOFU' | 'MOFU' | 'BOFU';
  clusterSource?: 'seed' | 'geo' | 'topical' | 'derived';
  priority?: number;
}

export interface SiteEdge {
  from: string;
  to: string;
  rule: EdgeHeuristic;
  direction: LinkDirection;
  score: number;
  anchor: string;
  rationale: string;
}

export interface SiteGraph {
  nodes: SiteNode[];
  edges: SiteEdge[];
  adjacency: Record<string, SiteEdge[]>;
}

export interface LinkCandidate {
  targetId: string;
  targetSlug: string;
  targetKeyword: string;
  targetTitle: string;
  direction: LinkDirection;
  score: number;
  anchor: string;
  reason: string;
  rule: EdgeHeuristic;
  targetType: SiteNodeType;
  targetSubtype?: SitePageSubtype;
}

export interface InternalLinkPlan {
  currentNodeId: string;
  currentNodeType?: SiteNodeType;
  currentCity?: string;
  currentAreaName?: string;
  upward?: LinkCandidate;
  lateral?: LinkCandidate;
  bofu?: LinkCandidate;
  supporting: LinkCandidate[];
  selected: LinkCandidate[];
  all: LinkCandidate[];
  autoBlocks?: SimpleContentBlock[];
  grouped: {
    relatedServices: LinkCandidate[];
    relatedAreas: LinkCandidate[];
    relatedGuides: LinkCandidate[];
    relatedFaqs: LinkCandidate[];
    moneyPages: LinkCandidate[];
  };
}

export interface ArchitectAvailableLink {
  slug: string;
  anchor: string;
  keyword: string;
  targetType: SiteNodeType;
  direction: LinkDirection;
  reason: string;
}

export interface ArchitectLinkContext {
  currentNodeId: string;
  currentNode: SiteNode;
  availableLinks: ArchitectAvailableLink[];
  mandatoryLinkGoals: string[];
  suggestedAnchors: string[];
  upwardLinks?: ArchitectAvailableLink[];
  lateralLinks?: ArchitectAvailableLink[];
  moneyLinks?: ArchitectAvailableLink[];
  relatedLinks?: ArchitectAvailableLink[];
  localAreas?: string[];
  relatedCities?: string[];
  clusterKeywords?: string[];
}

export interface SimpleContentBlock {
  id: string;
  h2: string;
  html: string;
  wordCount: number;
  type?: string;
  blockType?: string;
  metadata: Record<string, unknown>;
}

export interface InternalLinkValidationResult {
  passed: boolean;
  issues: string[];
  stats: {
    totalUsefulLinks: number;
    hasUpward: boolean;
    hasLateral: boolean;
    hasBofu: boolean;
  };
}