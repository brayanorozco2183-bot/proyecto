import fs from 'fs';
import path from 'path';
import { InternalLinkPlan, LinkCandidate, MissionLike, SimpleContentBlock, SiteGraph, SiteNode } from './types.js';

interface GeneratedRoute {
  publicHref: string;
  filePath: string;
  relativeDir: string;
  parts: string[];
}

interface OutputContext {
  currentFilePath: string;
  currentPublicHref: string;
  clusterFolder?: string;
}

function dedupeLinks(links: LinkCandidate[]): LinkCandidate[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${String(link.targetId || '').trim()}::${String(link.targetSlug || '').trim()}`;
    if (!String(link.targetSlug || '').trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function sanitizePathToken(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-');
}

function humanizeSlug(value: string): string {
  return String(value || '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .filter(Boolean)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ')
    )
    .join(' / ');
}

function normalizeInternalHref(href: string): string | null {
  const raw = String(href || '').trim();
  if (!raw || raw.startsWith('#')) return null;

  const normalizePath = (value: string): string | null => {
    let out = String(value || '').trim();
    if (!out) return null;

    out = out
      .replace(/\/index\.html\/?$/i, '/')
      .replace(/([^:])\/\/+?/g, '$1/')
      .replace(/\s+/g, '');

    if (out.startsWith('./')) out = out.slice(1);
    if (out.startsWith('/..')) out = out.slice(1);
    if (!out.startsWith('/') && !out.startsWith('.')) out = `/${out}`;

    const hashOrQuery = out.search(/[?#]/);
    if (hashOrQuery !== -1) out = out.slice(0, hashOrQuery);

    if (!out.endsWith('/')) out = `${out}/`;

    if (/^\/[A-ZÁÉÍÓÚÑ][^?#]*-expertos\/?$/i.test(out)) return null;
    if (/^\/[A-ZÁÉÍÓÚÑ][^?#]*-urgente\/?$/i.test(out)) return null;

    return out;
  };

  if (/^(\/|\.\/|\.\.\/)/.test(raw)) {
    return normalizePath(raw);
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return normalizePath(url.pathname || '/');
    } catch {
      return null;
    }
  }

  return null;
}

function outputRoot(): string {
  return path.join(process.cwd(), 'output_sites');
}

function getClusterFolder(mission?: MissionLike): string | undefined {
  const raw = mission?.cluster_folder_name || mission?.clusterFolderName;
  const normalized = sanitizePathToken(raw || '');
  return normalized || undefined;
}

function buildOutputContext(mission?: MissionLike): OutputContext | null {
  if (!mission?.niche || !mission?.city) return null;

  const clusterFolder = getClusterFolder(mission);
  const basePath = clusterFolder || `${sanitizePathToken(mission.niche)}-${sanitizePathToken(mission.city)}`;
  const subPath = sanitizePathToken(mission.subPath || '');
  const finalPath = subPath ? path.posix.join(basePath, subPath) : basePath;

  return {
    currentFilePath: path.join(outputRoot(), finalPath, 'index.html'),
    currentPublicHref: `/${finalPath.replace(/^\/+|\/+$/g, '')}/`,
    clusterFolder,
  };
}

function scanGeneratedRoutes(clusterFolder?: string): GeneratedRoute[] {
  const root = outputRoot();
  if (!fs.existsSync(root)) return [];

  const found: GeneratedRoute[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (!entry.isFile() || entry.name.toLowerCase() !== 'index.html') continue;

      const relDir = path.relative(root, path.dirname(full)).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
      const publicHref = relDir ? `/${relDir}/` : '/';
      const parts = relDir ? relDir.split('/').filter(Boolean) : [];

      if (clusterFolder && parts[0] !== clusterFolder) {
        continue;
      }

      found.push({
        publicHref,
        filePath: full,
        relativeDir: relDir,
        parts,
      });
    }
  };

  walk(root);

  return found.sort((a, b) => a.publicHref.localeCompare(b.publicHref));
}

function routeTailParts(route: GeneratedRoute, clusterFolder?: string): string[] {
  if (clusterFolder && route.parts[0] === clusterFolder) {
    return route.parts.slice(1);
  }
  return route.parts;
}

function buildHrefAliases(targetHref: string, clusterFolder?: string): string[] {
  const normalized = normalizeInternalHref(targetHref);
  if (!normalized) return [];

  if (normalized === '/') return ['/'];

  const rel = normalized.replace(/^\/+|\/+$/g, '');
  const parts = rel.split('/').filter(Boolean);
  const aliases = new Set<string>([normalized]);

  if (clusterFolder) {
    aliases.add(`/${path.posix.join(clusterFolder, rel)}/`);
  }

  if (parts.length > 1) {
    aliases.add(`/${parts.join('-')}/`);
    aliases.add(`/${parts[parts.length - 1]}/`);

    if (clusterFolder) {
      aliases.add(`/${path.posix.join(clusterFolder, parts.join('-'))}/`);
      aliases.add(`/${path.posix.join(clusterFolder, parts[parts.length - 1])}/`);
    }
  }

  return Array.from(aliases)
    .map((value) => normalizeInternalHref(value))
    .filter((value): value is string => Boolean(value));
}

function scoreRouteMatch(route: GeneratedRoute, targetHref: string, clusterFolder?: string): number {
  const normalized = normalizeInternalHref(targetHref);
  if (!normalized) return 0;

  const targetParts = normalized.split('/').filter(Boolean);
  const tail = routeTailParts(route, clusterFolder);

  let score = 0;

  if (route.publicHref === normalized) score += 50;
  if (clusterFolder && route.parts[0] === clusterFolder) score += 8;
  if (tail.join('/') === targetParts.join('/')) score += 40;
  if (tail.join('-') === targetParts.join('-')) score += 24;

  const targetLast = targetParts[targetParts.length - 1];
  const tailLast = tail[tail.length - 1];

  if (targetLast && tailLast && targetLast === tailLast) score += 12;
  if (tail.length === 1 && targetParts.length > 1 && tail[0] === targetLast) score += 10;

  return score;
}

function resolveGeneratedRoute(targetHref: string, routes: GeneratedRoute[], mission?: MissionLike): GeneratedRoute | null {
  const clusterFolder = getClusterFolder(mission);
  const aliases = buildHrefAliases(targetHref, clusterFolder);
  if (!aliases.length) return null;

  const exact = routes.filter((route) => aliases.includes(route.publicHref));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    exact.sort((a, b) => scoreRouteMatch(b, targetHref, clusterFolder) - scoreRouteMatch(a, targetHref, clusterFolder));
    return exact[0];
  }

  const ranked = routes
    .map((route) => ({
      route,
      score: scoreRouteMatch(route, targetHref, clusterFolder),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.route.publicHref.localeCompare(b.route.publicHref));

  return ranked[0]?.route || null;
}

function countWords(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildBlock(id: string, h2: string, html: string, blockType: string): SimpleContentBlock {
  return {
    id,
    h2,
    html,
    wordCount: countWords(html),
    metadata: {
      block_type: blockType,
      section_id: id,
      internal_link_block: true,
    },
  };
}

function getCurrentNode(plan: InternalLinkPlan, graph?: SiteGraph): SiteNode | undefined {
  return graph?.nodes.find((node) => node.id === plan.currentNodeId);
}

function toRelativeHref(targetFilePath: string, currentFilePath: string): string {
  const currentDir = path.dirname(currentFilePath);
  const targetDir = path.dirname(targetFilePath);

  let relative = path.relative(currentDir, targetDir).replace(/\\/g, '/');
  if (!relative) return './';

  if (!relative.endsWith('/')) {
    relative = `${relative}/`;
  }

  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }

  return relative;
}

function toAreaLink(
  currentNode: SiteNode,
  candidate: SiteNode,
  routes: GeneratedRoute[],
  currentFilePath: string,
  mission?: MissionLike,
): LinkCandidate | null {
  const targetRoute = resolveGeneratedRoute(candidate.slug || '', routes, mission);
  if (!targetRoute) return null;

  const areaName = String(candidate.areaName || '').trim();
  if (!areaName) return null;

  return {
    targetId: candidate.id,
    targetSlug: toRelativeHref(targetRoute.filePath, currentFilePath),
    targetKeyword: String(candidate.keyword || currentNode.keyword || ''),
    targetTitle: String(candidate.title || `${currentNode.keyword} en ${areaName}`),
    direction: 'lateral',
    score: 100,
    anchor: `${currentNode.keyword} en ${areaName}`,
    reason: 'Solo se enlazan barrios hermanos cuando la ruta de destino ya existe físicamente en output_sites.',
    rule: 'same_service_nearby_areas',
    targetType: 'service_area',
    targetSubtype: candidate.pageSubtype,
  };
}

function buildAreaSiblingLinks(
  currentNode: SiteNode,
  graph: SiteGraph | undefined,
  routes: GeneratedRoute[],
  currentFilePath: string,
  mission?: MissionLike,
): LinkCandidate[] {
  if (!graph || currentNode.type !== 'service_area') return [];

  const city = normalizeText(currentNode.city || '');
  const keyword = normalizeText(currentNode.keyword || '');

  const siblings = graph.nodes.filter((node) =>
    node.id !== currentNode.id &&
    node.type === 'service_area' &&
    normalizeText(node.city || '') === city &&
    normalizeText(node.keyword || '') === keyword
  );

  return dedupeLinks(
    siblings
      .map((node) => toAreaLink(currentNode, node, routes, currentFilePath, mission))
      .filter((value): value is LinkCandidate => Boolean(value))
  ).slice(0, 4);
}

function buildClusterImmediateChildRoutes(
  routes: GeneratedRoute[],
  currentPublicHref: string,
  clusterFolder?: string,
): GeneratedRoute[] {
  if (!clusterFolder) return [];

  return routes
    .filter((route) => route.parts[0] === clusterFolder && route.parts.length === 2)
    .filter((route) => route.publicHref !== currentPublicHref)
    .slice(0, 12);
}

function buildHomeCityLinks(
  currentNode: SiteNode,
  routes: GeneratedRoute[],
  currentPublicHref: string,
  mission?: MissionLike,
): LinkCandidate[] {
  const clusterFolder = getClusterFolder(mission);
  const clusterChildren = buildClusterImmediateChildRoutes(routes, currentPublicHref, clusterFolder);

  if (clusterChildren.length > 0) {
    return dedupeLinks(
      clusterChildren.map((route) => {
        const citySegment = route.parts[1];
        const cityLabel = humanizeSlug(citySegment);
        return {
          targetId: `generated:city:${citySegment}`,
          targetSlug: route.publicHref,
          targetKeyword: cityLabel,
          targetTitle: cityLabel,
          direction: 'lateral' as const,
          score: 100,
          anchor: cityLabel,
          reason: 'Se muestran únicamente hubs locales ya generados y resueltos desde la ruta real del cluster.',
          rule: 'service_to_city',
          targetType: 'home_local' as const,
          targetSubtype: 'city_hub' as const,
        };
      }),
    ).slice(0, 4);
  }

  const currentSlug = normalizeInternalHref(currentNode.slug || '');
  if (!currentSlug) return [];

  const currentParts = currentSlug.split('/').filter(Boolean);
  if (currentParts.length !== 1) return [];

  const currentCity = currentParts[0];

  return dedupeLinks(
    routes
      .filter((route) => route.parts.length === 1 && route.parts[0] !== currentCity)
      .map((route) => {
        const cityLabel = humanizeSlug(route.parts[0]);
        return {
          targetId: `generated:city:${route.parts[0]}`,
          targetSlug: route.publicHref,
          targetKeyword: cityLabel,
          targetTitle: cityLabel,
          direction: 'lateral' as const,
          score: 100,
          anchor: cityLabel,
          reason: 'Se muestran únicamente hubs locales ya generados y disponibles en producción.',
          rule: 'service_to_city',
          targetType: 'home_local' as const,
          targetSubtype: 'city_hub' as const,
        };
      }),
  ).slice(0, 4);
}

function buildCrossCityServiceLinks(
  currentNode: SiteNode,
  routes: GeneratedRoute[],
  currentPublicHref: string,
  mission?: MissionLike,
): LinkCandidate[] {
  const clusterFolder = getClusterFolder(mission);
  const clusterChildren = buildClusterImmediateChildRoutes(routes, currentPublicHref, clusterFolder);

  if (clusterChildren.length > 0) {
    return dedupeLinks(
      clusterChildren.map((route) => {
        const citySegment = route.parts[1];
        const cityLabel = humanizeSlug(citySegment);
        return {
          targetId: `generated:service:${sanitizePathToken(currentNode.keyword)}:${citySegment}`,
          targetSlug: route.publicHref,
          targetKeyword: String(currentNode.keyword || ''),
          targetTitle: `${currentNode.keyword} en ${cityLabel}`,
          direction: 'lateral' as const,
          score: 100,
          anchor: `${currentNode.keyword} en ${cityLabel}`,
          reason: 'Solo se enlazan landings ya generadas y detectadas en la estructura real del cluster.',
          rule: 'same_city_related_services',
          targetType: 'service' as const,
          targetSubtype: 'primary' as const,
        };
      }),
    ).slice(0, 4);
  }

  const currentSlug = normalizeInternalHref(currentNode.slug || '');
  if (!currentSlug) return [];

  const currentParts = currentSlug.split('/').filter(Boolean);
  const normCurrent = (currentParts.length === 1 && currentParts[0].includes('-'))
    ? currentParts[0].split('-')
    : currentParts;

  if (normCurrent.length !== 2) return [];

  const [serviceSegment, currentCitySegment] = normCurrent;

  return dedupeLinks(
    routes
      .filter((route) => {
        const tail = routeTailParts(route);
        const normFound = (tail.length === 1 && tail[0].includes('-'))
          ? tail[0].split('-')
          : tail;

        return normFound.length === 2 && normFound[0] === serviceSegment && normFound[1] !== currentCitySegment;
      })
      .map((route) => {
        const tail = routeTailParts(route);
        const normFound = (tail.length === 1 && tail[0].includes('-'))
          ? tail[0].split('-')
          : tail;
        const cityLabel = humanizeSlug(normFound[1]);
        return {
          targetId: `generated:service:${serviceSegment}:${normFound[1]}`,
          targetSlug: route.publicHref,
          targetKeyword: String(currentNode.keyword || ''),
          targetTitle: `${currentNode.keyword} en ${cityLabel}`,
          direction: 'lateral' as const,
          score: 100,
          anchor: `${currentNode.keyword} en ${cityLabel}`,
          reason: 'Solo se enlazan landings del mismo servicio cuando la página de destino ya existe físicamente.',
          rule: 'same_city_related_services',
          targetType: 'service' as const,
          targetSubtype: 'primary' as const,
        };
      }),
  ).slice(0, 4);
}

function absolutizedLinksToRelative(
  links: LinkCandidate[],
  routes: GeneratedRoute[],
  currentFilePath: string,
  mission?: MissionLike,
): LinkCandidate[] {
  return dedupeLinks(
    links
      .map((link) => {
        const targetRoute = resolveGeneratedRoute(link.targetSlug, routes, mission);
        if (!targetRoute) return null;

        return {
          ...link,
          targetSlug: toRelativeHref(targetRoute.filePath, currentFilePath),
        };
      })
      .filter((value): value is LinkCandidate => Boolean(value)),
  );
}

function renderBandHtml(title: string, intro: string, links: LinkCandidate[], bandClass: string): string {
  const linksHtml = links.map(link => `
    <li class="internal-links-item">
      <a href="${escapeHtml(link.targetSlug)}" class="link-card" title="${escapeHtml(link.reason)}">
        <div class="link-card__content">
          <span class="link-card__title">${escapeHtml(link.anchor)}</span>
          <span class="link-card__desc">Ver delegación técnica</span>
        </div>
        <span class="link-card__icon" aria-hidden="true">→</span>
      </a>
    </li>
  `).join('');

  return `
    <div class="internal-links-hub ${bandClass}">
      <header class="block__header">
        <span class="block__eyebrow">Presencia Nacional</span>
        <h2 class="block__title">${escapeHtml(title)}</h2>
        <p class="block__subtitle">${escapeHtml(intro)}</p>
      </header>

      <ul class="internal-links-grid">
        ${linksHtml}
      </ul>

      <style>
        .internal-links-hub {
          padding: 4rem 2rem;
          background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.03) 0%, rgba(var(--primary-rgb), 0.01) 100%);
          border-radius: 2rem;
          border: 1px solid rgba(var(--primary-rgb), 0.08);
          margin: 4rem 0;
        }
        .block__header { margin-bottom: 3rem; text-align: center; }
        .block__eyebrow { 
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }
        .block__title { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: var(--text); }
        .block__subtitle { color: var(--muted); font-size: 1.1rem; max-width: 700px; margin: 0 auto; }

        .internal-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          list-style: none;
          padding: 0;
        }

        .link-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 1.25rem;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .link-card:hover {
          transform: translateY(-5px) scale(1.02);
          background: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .link-card__title {
          display: block;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.25rem;
        }

        .link-card__desc {
          display: block;
          font-size: 0.85rem;
          color: var(--muted);
          font-weight: 500;
        }

        .link-card__icon {
          font-size: 1.5rem;
          color: var(--primary);
          transition: transform 0.3s ease;
        }

        .link-card:hover .link-card__icon {
          transform: translateX(5px);
        }

        @media (max-width: 768px) {
          .block__title { font-size: 2rem; }
          .internal-links-hub { padding: 2rem 1rem; }
        }
      </style>
    </div>
  `.trim();
}

export function buildAutomaticInternalLinkBlocks(
  plan: InternalLinkPlan,
  graph?: SiteGraph,
  mission?: MissionLike,
): SimpleContentBlock[] {
  const currentNode = getCurrentNode(plan, graph);
  if (!currentNode) return [];

  const outputContext = buildOutputContext(mission);
  const routes = scanGeneratedRoutes(outputContext?.clusterFolder);
  if (!routes.length || !outputContext) return [];

  if (currentNode.type === 'service_area') {
    const siblingAreaLinks = buildAreaSiblingLinks(currentNode, graph, routes, outputContext.currentFilePath, mission);
    if (!siblingAreaLinks.length) return [];

    const city = String(currentNode.city || plan.currentCity || 'la ciudad');
    return [
      buildBlock(
        'internal-links-contextual',
        `Otros barrios de ${city}`,
        renderBandHtml(
          `Cobertura Extendida en ${city}`,
          'Contamos con técnicos distribuidos estratégicamente para enlazar solo páginas de zonas que ya existen dentro del cluster publicado.',
          siblingAreaLinks,
          'internal-links-hub--areas'
        ),
        'authority_note',
      ),
    ];
  }

  if (currentNode.type === 'home_local') {
    const cityLinks = absolutizedLinksToRelative(
      buildHomeCityLinks(currentNode, routes, outputContext.currentPublicHref, mission),
      routes,
      outputContext.currentFilePath,
      mission,
    );
    if (!cityLinks.length) return [];

    return [
      buildBlock(
        'internal-links-contextual',
        'Nuestras sedes principales',
        renderBandHtml(
          'Centros de Operaciones Regionales',
          'Este bloque solo aparece cuando el sistema encuentra otras rutas reales ya generadas dentro de la estructura publicada.',
          cityLinks,
          'internal-links-hub--cities'
        ),
        'authority_note',
      ),
    ];
  }

  if (currentNode.type === 'service' && currentNode.pageSubtype === 'primary') {
    const crossCityLinks = absolutizedLinksToRelative(
      buildCrossCityServiceLinks(currentNode, routes, outputContext.currentPublicHref, mission),
      routes,
      outputContext.currentFilePath,
      mission,
    );
    if (!crossCityLinks.length) return [];

    return [
      buildBlock(
        'internal-links-contextual',
        'Expertos en otras ciudades',
        renderBandHtml(
          `Disponibilidad de ${currentNode.keyword} por Región`,
          `Los enlaces de esta banda se resuelven contra rutas existentes en output_sites para evitar slugs inventados o destinos rotos.`,
          crossCityLinks,
          'internal-links-hub--cross-city'
        ),
        'authority_note',
      ),
    ];
  }

  return [];
}
