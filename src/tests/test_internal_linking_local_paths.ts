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

const mission = {
  niche: 'cerrajeros',
  city: 'Getafe',
  clusterFolderName: 'cerrajeros-getafe',
  subPath: 'cambio-bombin'
};

const blocks = buildAutomaticInternalLinkBlocks(plan, graph, mission as any);
if (!blocks.length) throw new Error('No se generó bloque automático de interlinking.');
const links = (blocks[0].metadata as any).internalLinks || [];
if (!links.length) throw new Error('El bloque no contiene enlaces internos.');
if (!String(links[0].url || '').includes('index.html')) throw new Error('Los enlaces internos deben terminar en index.html en local.');
console.log('OK test_internal_linking_local_paths');
