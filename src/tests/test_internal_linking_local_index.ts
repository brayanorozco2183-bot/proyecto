import { buildAutomaticInternalLinkBlocks } from '../internal-linking/autoBlocks.js';
import { InternalLinkPlan, SiteGraph } from '../internal-linking/types.js';

const graph: SiteGraph = {
  nodes: [
    { id: 'money', city: 'Getafe', keyword: 'cerrajeros', slug: 'cerrajeros/getafe', pageType: 'service', pathDepth: 1, isMoney: true, links: [] },
    { id: 'child-1', city: 'Getafe', keyword: 'cerrajeros cambio de bombin', slug: 'cerrajeros-cambio-bombin/getafe', pageType: 'service', pathDepth: 2, isMoney: false, links: [] },
  ],
  edges: []
};

const plan: InternalLinkPlan = { currentNodeId: 'child-1', money: [], supporting: [], lateral: [], upward: [], all: [] } as any;
const mission: any = { niche: 'cerrajeros', city: 'Getafe', cluster_folder_name: 'cerrajeros-getafe', subPath: 'cambio-bombin' };

const blocks = buildAutomaticInternalLinkBlocks(plan, graph, mission);
const html = blocks[0]?.html || '';
if (!/index\.html/i.test(html)) throw new Error('El hub no emite rutas locales con index.html.');
if (!/P[aá]gina principal/i.test(html)) throw new Error('Falta enlace a money page.');

console.log('OK: internal linking local index');
