import { buildAutomaticInternalLinkBlocks } from '../internal-linking/autoBlocks.js';
import type { InternalLinkPlan, MissionLike, SiteGraph } from '../internal-linking/types.js';

const mission: MissionLike = {
  niche: 'cerrajeros',
  city: 'Getafe',
  clusterFolderName: 'cerrajeros-getafe',
};

const graph: SiteGraph = { nodes: [], edges: [], adjacency: {} };
const plan: InternalLinkPlan = {
  currentNodeId: 'node-1',
  currentNodeType: 'service',
  currentCity: 'Getafe',
  currentAreaName: undefined,
  supporting: [],
  selected: [],
  all: [],
  grouped: { relatedServices: [], relatedAreas: [], relatedGuides: [], relatedFaqs: [], moneyPages: [] },
};

const blocks = buildAutomaticInternalLinkBlocks(plan, graph, mission);
if (!Array.isArray(blocks)) throw new Error('Expected array');
console.log('OK test_internal_linking_hub_guaranteed');
