import { EdgeHeuristic, LinkDirection, SiteEdge, SiteGraph, SiteNode } from './types.js';

function normalize(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function byId(nodes: SiteNode[]): Map<string, SiteNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function pushEdge(edges: SiteEdge[], candidate: SiteEdge): void {
  const exists = edges.some(
    (edge) => edge.from === candidate.from && edge.to === candidate.to && edge.rule === candidate.rule,
  );
  if (!exists) edges.push(candidate);
}

function makeEdge(
  from: string,
  to: string,
  rule: EdgeHeuristic,
  direction: LinkDirection,
  score: number,
  anchor: string,
  rationale: string,
): SiteEdge {
  return { from, to, rule, direction, score, anchor, rationale };
}

export function buildHeuristicEdges(nodes: SiteNode[]): SiteEdge[] {
  const edges: SiteEdge[] = [];
  const map = byId(nodes);

  const homeNodes = nodes.filter((node) => node.type === 'home_local');
  const serviceNodes = nodes.filter((node) => node.type === 'service');
  const areaNodes = nodes.filter((node) => node.type === 'service_area');
  const guideNodes = nodes.filter((node) => node.type === 'guide');
  const faqNodes = nodes.filter((node) => node.type === 'faq');
  const comparisonNodes = nodes.filter((node) => node.type === 'comparison');

  // service -> subservices and service -> city
  for (const service of serviceNodes) {
    if (service.pageSubtype === 'primary') {
      const siblings = serviceNodes.filter(
        (node) => node.id !== service.id && node.city === service.city && node.parent === service.id,
      );
      for (const sub of siblings) {
        pushEdge(
          edges,
          makeEdge(
            service.id,
            sub.id,
            'service_to_subservices',
            sub.pageSubtype === 'urgent' ? 'bofu' : 'downward',
            sub.pageSubtype === 'urgent' ? 97 : 88,
            sub.pageSubtype === 'urgent'
              ? `Urgencias de ${service.keyword} en ${service.city}`
              : `${sub.keyword} en ${service.city}`,
            'El servicio principal debe alimentar subservicios y versiones de alta intención.',
          ),
        );
      }

      const home = homeNodes.find((node) => node.city === service.city);
      if (home) {
        pushEdge(
          edges,
          makeEdge(
            service.id,
            home.id,
            'service_to_city',
            'upward',
            85,
            `${service.city}`,
            'La página de servicio principal debe enlazar a la home local de su ciudad.',
          ),
        );
      }
    }
  }

  // city -> areas
  for (const home of homeNodes) {
    const areas = areaNodes.filter((node) => node.city === home.city);
    for (const area of areas) {
      pushEdge(
        edges,
        makeEdge(
          home.id,
          area.id,
          'city_to_areas',
          'downward',
          84,
          `${area.areaName || area.keyword} en ${home.city}`,
          'La home local debe bajar a barrios y zonas de servicio.',
        ),
      );
    }
  }

  // area -> primary service (same niche, same city)
  for (const area of areaNodes) {
    const parent = area.parent ? map.get(area.parent) : undefined;
    if (parent) {
      pushEdge(
        edges,
        makeEdge(
          area.id,
          parent.id,
          'area_to_service',
          'upward',
          96,
          `${parent.keyword} en ${parent.city}`,
          'Cada página de barrio debe enlazar a la página principal del servicio en la misma ciudad.',
        ),
      );
    }
  }

  // urgent -> service principal
  for (const urgent of serviceNodes.filter((node) => node.pageSubtype === 'urgent')) {
    const parent = urgent.parent ? map.get(urgent.parent) : undefined;
    if (parent) {
      pushEdge(
        edges,
        makeEdge(
          urgent.id,
          parent.id,
          'urgent_to_service',
          'upward',
          99,
          `${parent.keyword} en ${parent.city}`,
          'La urgencia debe devolver autoridad al servicio principal.',
        ),
      );
    }
  }

  // guide -> money page
  for (const guide of guideNodes) {
    const parent = guide.parent ? map.get(guide.parent) : undefined;
    if (parent) {
      pushEdge(
        edges,
        makeEdge(
          guide.id,
          parent.id,
          'guide_to_money_page',
          'bofu',
          100,
          `${parent.keyword} en ${parent.city}`,
          'Toda guía debe empujar a una money page transaccional.',
        ),
      );
    }
  }

  // faq -> service
  for (const faq of faqNodes) {
    const parent = faq.parent ? map.get(faq.parent) : undefined;
    if (parent) {
      pushEdge(
        edges,
        makeEdge(
          faq.id,
          parent.id,
          'faq_to_service',
          'bofu',
          98,
          `${parent.keyword} en ${parent.city}`,
          'Las FAQ deben llevar a una página BOFU de contratación.',
        ),
      );
    }
  }

  // comparison -> service
  for (const comparison of comparisonNodes) {
    const parent = comparison.parent ? map.get(comparison.parent) : undefined;
    if (parent) {
      pushEdge(
        edges,
        makeEdge(
          comparison.id,
          parent.id,
          'comparison_to_service',
          'bofu',
          99,
          `${parent.keyword} en ${parent.city}`,
          'Las comparativas deben cerrar hacia la página de servicio.',
        ),
      );
    }
  }

  // same service nearby areas
  for (const area of areaNodes) {
    const nearby = areaNodes.filter(
      (node) => node.id !== area.id && node.city === area.city && normalize(node.keyword) === normalize(area.keyword),
    );
    for (const sibling of nearby.slice(0, 4)) {
      pushEdge(
        edges,
        makeEdge(
          area.id,
          sibling.id,
          'same_service_nearby_areas',
          'lateral',
          76,
          `${sibling.areaName || sibling.keyword}`,
          'Las zonas hermanas del mismo servicio deben enlazarse lateralmente.',
        ),
      );
    }
  }

  // same city related services
  /*
  for (const service of serviceNodes) {
    const related = serviceNodes.filter(
      (node) =>
        node.id !== service.id &&
        node.city === service.city &&
        node.pageSubtype !== 'urgent' &&
        service.pageSubtype !== 'urgent',
    );

    for (const rel of related.slice(0, 4)) {
      pushEdge(
        edges,
        makeEdge(
          service.id,
          rel.id,
          'same_city_related_services',
          'lateral',
          74,
          `${rel.keyword} en ${rel.city}`,
          'Servicios relacionados dentro de la misma ciudad deben compartir autoridad lateral.',
        ),
      );
    }
  }
  */

  return edges.sort((a, b) => b.score - a.score);
}

export function buildAdjacency(edges: SiteEdge[]): Record<string, SiteEdge[]> {
  return edges.reduce<Record<string, SiteEdge[]>>((acc, edge) => {
    if (!acc[edge.from]) acc[edge.from] = [];
    acc[edge.from].push(edge);
    return acc;
  }, {});
}

export function graphFromNodes(nodes: SiteNode[]): SiteGraph {
  const edges = buildHeuristicEdges(nodes);
  return {
    nodes,
    edges,
    adjacency: buildAdjacency(edges),
  };
}