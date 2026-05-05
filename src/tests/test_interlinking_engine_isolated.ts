import assert from 'node:assert/strict';
import { buildAutomaticInternalLinkBlocks } from '../internal-linking/autoBlocks.js';
import type { SiteGraph, SiteNode, InternalLinkPlan, MissionLike } from '../internal-linking/types.js';

const nodes: SiteNode[] = [
  { id: 'getafe-main', type: 'service', slug: 'cerrajeros/getafe', keyword: 'cerrajeros', city: 'Getafe', pageSubtype: 'primary' } as any,
];

const graph: SiteGraph = { nodes, edges: [], adjacency: {} } as any;
const mission: MissionLike = {
  niche: 'cambio de bombín de seguridad',
  city: 'Getafe',
  clusterFolderName: 'cerrajeros-getafe',
  subPath: 'cambio-bombin'
} as any;
const plan: InternalLinkPlan = {
  currentNodeId: 'getafe-main',
  all: [],
  selected: [],
  supporting: [],
  grouped: {
    relatedServices: [],
    relatedAreas: [],
    relatedGuides: [],
    relatedFaqs: [],
    moneyPages: [],
  },
} as any;

const blocks = buildAutomaticInternalLinkBlocks(plan, graph, mission);
assert.ok(blocks.length >= 1, 'Debe generarse al menos un bloque automático de interlinking.');
assert.equal((blocks[0] as any).metadata?.block_type, 'internal_linking');
assert.match(String(blocks[0].html || ''), /Money page|Páginas relacionadas|Red interna/i);

console.log('OK: interlinking automático garantizado y tipado como internal_linking.');
