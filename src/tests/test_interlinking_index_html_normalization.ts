import { buildAutomaticInternalLinkBlocks } from '../internal-linking/autoBlocks.js';
import type { InternalLinkPlan, SiteGraph } from '../internal-linking/types.js';

const graph: SiteGraph = { nodes: [], edges: [], adjacency: {} };
const plan: InternalLinkPlan = {
  currentNodeId: 'current',
  selected: [],
  all: [],
  supporting: [],
  grouped: { relatedServices: [], relatedAreas: [], relatedGuides: [], relatedFaqs: [], moneyPages: [] }
};
const mission = { niche: 'cerrajeros', city: 'Getafe', clusterFolderName: 'cerrajeros-getafe', subPath: 'servicios-tecnicos/index.html' };
const blocks = buildAutomaticInternalLinkBlocks(plan, graph, mission as any);
const links = (blocks[0]?.metadata as any)?.internalLinks || [];
if (!links.length) throw new Error('Missing internal links.');
if (String(links[0].url || '').includes('index.html/')) throw new Error('Trailing slash after index.html detected.');
console.log('OK test_interlinking_index_html_normalization');
