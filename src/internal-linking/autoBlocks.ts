import fs from 'fs';
import path from 'path';
import { InternalLinkPlan, MissionLike, SimpleContentBlock, SiteGraph, SiteNode } from './types.js';
import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';

type LinkRelation = 'money' | 'supporting' | 'lateral' | 'upward';

interface GeneratedRoute {
  filePath: string;
  publicHref: string;
  relativeDir: string;
  parts: string[];
  label: string;
}

interface HubLink {
  text: string;
  url: string;
  relation: LinkRelation;
  description: string;
  badge: string;
}

function normalizeText(value: any): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value: any): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'pagina';
}

function escapeHtml(value = ''): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countWords(html: string): number {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function clusterFolderFromMission(mission?: MissionLike): string {
  const explicit =
    (mission as any)?.clusterFolderName ||
    (mission as any)?.cluster_folder_name ||
    (mission as any)?.clusterFolder ||
    '';
  if (normalizeText(explicit)) return slugify(explicit);

  const niche = slugify((mission as any)?.niche || '');
  const city = slugify((mission as any)?.city || '');
  if (niche && city) return `${niche}-${city}`;
  return niche || city || 'sitio';
}

function normalizeMissionSubPath(value: any): string {
  const raw = normalizeText(value || '').replace(/\\/g, '/');
  if (!raw || raw === 'index.html' || raw === './index.html') return '';
  return raw.replace(/^\/+|\/+$/g, '').replace(/\/index\.html$/i, '');
}

function currentPublicHrefFromMission(mission?: MissionLike): string {
  const folder = clusterFolderFromMission(mission);
  const subPath = normalizeMissionSubPath((mission as any)?.subPath || (mission as any)?.sub_path || '');
  const base = `/${folder}${subPath ? `/${subPath}` : ''}/index.html`.replace(/\/{2,}/g, '/');
  return base;
}

function resolveOutputRoot(): string {
  return path.join(process.cwd(), 'output_sites');
}

function normalizeHumanLabel(value: string): string {
  const cleaned = normalizeText(value)
    .replace(/\bde de\b/gi, 'de')
    .replace(/\bde\s+(cerrajeros|fontaneros|electricistas|carpinteros|pintores)\b/gi, '$1')
    .replace(/\bservicios?\b/gi, '')
    .replace(/\bt[eé]cnicos?\b/gi, '')
    .replace(/\bdelegaci[oó]n\b/gi, '')
    .replace(/\bpagina\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const titled = cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (['de', 'en', 'y', 'la', 'el', 'los', 'las', 'del'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .trim();

  return titled;
}

function scanGeneratedRoutes(root = resolveOutputRoot()): GeneratedRoute[] {
  if (!fs.existsSync(root)) return [];

  const routes: GeneratedRoute[] = [];

  const visit = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
        continue;
      }
      if (!entry.isFile() || entry.name.toLowerCase() !== 'index.html') continue;

      const relative = path.relative(root, full).replace(/\\/g, '/');
      const relativeDir = path.dirname(relative).replace(/\\/g, '/');
      const publicHref = `/${relativeDir.replace(/\/+$/g, '')}/index.html`.replace(/\/{2,}/g, '/');
      const parts = publicHref.split('/').filter(Boolean);
      const source = parts[parts.length - 2] || parts[0] || publicHref;

      routes.push({
        filePath: full,
        publicHref,
        relativeDir,
        parts,
        label: normalizeHumanLabel(source.replace(/-/g, ' ')) || 'Página relacionada',
      });
    }
  };

  visit(root);

  const dedup = new Map<string, GeneratedRoute>();
  for (const route of routes) {
    if (!dedup.has(route.publicHref)) dedup.set(route.publicHref, route);
  }
  return [...dedup.values()];
}

function calculateRelativePath(fromHref: string, toHref: string): string {
  if (!toHref || toHref.startsWith('#') || toHref.startsWith('http')) return toHref;

  const fromParts = fromHref.split('/').filter(Boolean);
  const toParts = toHref.split('/').filter(Boolean);
  const fromDirParts = fromParts.slice(0, -1);

  let common = 0;
  while (common < fromDirParts.length && common < toParts.length && fromDirParts[common] === toParts[common]) {
    common += 1;
  }

  const up = Math.max(0, fromDirParts.length - common);
  const down = toParts.slice(common).join('/');
  const prefix = up === 0 ? './' : '../'.repeat(up);
  return `${prefix}${down}`.replace(/([^:])\/\/+?/g, '$1/').replace(/\/index\.html\/+$/i, '/index.html');
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function sameHref(a?: string, b?: string): boolean {
  return normalizeText(a || '').replace(/\/+$/g, '') === normalizeText(b || '').replace(/\/+$/g, '');
}

function findCurrentNode(plan: InternalLinkPlan, graph?: SiteGraph): SiteNode | undefined {
  return graph?.nodes?.find((node) => node.id === plan.currentNodeId);
}

function filterRoutesForCluster(routes: GeneratedRoute[], mission?: MissionLike): GeneratedRoute[] {
  const folder = clusterFolderFromMission(mission);
  return routes.filter((route) => route.parts[0] === folder);
}

function buildHubLink(text: string, url: string, relation: LinkRelation, description: string, badge: string, currentHref: string): HubLink {
  let finalUrl = url;
  if (finalUrl && !finalUrl.startsWith('#') && !finalUrl.startsWith('http')) {
    const normalized = finalUrl.endsWith('index.html') ? finalUrl : `${finalUrl.replace(/\/+$/g, '')}/index.html`;
    finalUrl = calculateRelativePath(currentHref, normalized);
  }

  return {
    text: normalizeHumanLabel(text) || 'Página relacionada',
    url: finalUrl,
    relation,
    description,
    badge,
  };
}

function buildLinksFromCluster(plan: InternalLinkPlan, graph?: SiteGraph, mission?: MissionLike): HubLink[] {
  const currentNode = findCurrentNode(plan, graph);
  const currentHref = currentPublicHrefFromMission(mission);
  const routes = filterRoutesForCluster(scanGeneratedRoutes(), mission);
  const nicheLabel = normalizeText(getCanonicalNicheLabel((mission as any)?.niche || currentNode?.keyword || 'servicio'));
  const city = normalizeText((mission as any)?.city || currentNode?.city || 'tu zona');

  const rootMoneyHref = `/${clusterFolderFromMission(mission)}/index.html`;
  const moneyRoute = routes
    .sort((a, b) => a.parts.length - b.parts.length || a.publicHref.localeCompare(b.publicHref))
    .find((route) => sameHref(route.publicHref, rootMoneyHref)) || routes
      .sort((a, b) => a.parts.length - b.parts.length || a.publicHref.localeCompare(b.publicHref))[0];

  const links: HubLink[] = [];

  if (moneyRoute || mission) {
    const moneyHref = moneyRoute?.publicHref || rootMoneyHref || currentHref;
    links.push(
      buildHubLink(
        `Página principal de ${nicheLabel} en ${city}`,
        moneyHref,
        'money',
        `Abre la página principal para ver la referencia general del servicio, la cobertura y el contexto base del proyecto en ${city}.`,
        'Página principal',
        currentHref,
      )
    );
  }

  const siblingRoutes = routes
    .filter((route) => !sameHref(route.publicHref, currentHref) && !sameHref(route.publicHref, moneyRoute?.publicHref))
    .slice(0, 2);

  siblingRoutes.forEach((route, index) => {
    links.push(
      buildHubLink(
        route.label,
        route.publicHref,
        index === 0 ? 'supporting' : 'lateral',
        index === 0
          ? `Consulta otra página ya generada del mismo proyecto para ampliar contexto y revisar una variante útil relacionada con este servicio en ${city}.`
          : `Continúa la navegación con otra página del mismo proyecto para profundizar en un caso complementario o en otra cobertura útil en ${city}.`,
        index === 0 ? 'Página relacionada' : 'Navegación adicional',
        currentHref,
      )
    );
  });

  if (!links.length) {
    const fallbackMoneyHref = `/${clusterFolderFromMission(mission)}/index.html`;
    links.push(
      buildHubLink(
        `Página principal de ${nicheLabel} en ${city}`,
        fallbackMoneyHref,
        'money',
        `Accede a la página de referencia principal del proyecto para mantener una navegación clara y coherente en ${city}.`,
        'Referencia',
        currentHref,
      )
    );
  }

  return uniqueBy(links, (link) => `${link.url}|${link.text.toLowerCase()}`).slice(0, 3);
}

function renderHubHtml(title: string, intro: string, links: HubLink[]): string {
  const isSingle = links.length === 1;
  const cards = links.map((link) => {
    const safeUrl = link.url || '#';
    const isMoney = link.relation === 'money';
    return `
    <li class="internal-links-item internal-links-item--${link.relation} ${link.relation === 'money' ? 'internal-links-item--priority' : ''}">
      <span class="internal-links-item__kicker">${escapeHtml(link.badge)}</span>
      <h3 class="internal-links-item__title">${escapeHtml(link.text)}</h3>
      <p class="internal-links-item__description">${escapeHtml(link.description)}</p>
      <a href="${escapeHtml(safeUrl)}" class="internal-links-item__anchor" aria-label="Navegar a ${escapeHtml(link.text)}">
        <span class="internal-links-item__cta">Abrir página <span aria-hidden="true">→</span></span>
      </a>
    </li>`;
  }).join('');

  return `
    <section class="internal-links-hub internal-links-hub--premium section-shell" aria-labelledby="internal-links-title">
      <div class="el-container">
        <header class="block__header internal-links-hub__header">
          <span class="block__eyebrow">Red de soporte</span>
          <h2 id="internal-links-title" class="block__title">${escapeHtml(title)}</h2>
          <p class="block__subtitle">${escapeHtml(intro)}</p>
        </header>
        <div class="internal-links-grid-wrapper">
          <ul class="internal-links-grid ${isSingle ? 'internal-links-grid--single' : ''}" role="list">
            ${cards}
          </ul>
        </div>
      </div>
    </section>
  `;
}

function buildBlock(id: string, h2: string, html: string, links: HubLink[]): SimpleContentBlock {
  return {
    id,
    h2,
    html,
    wordCount: countWords(html),
    type: 'internal_linking',
    blockType: 'internal_linking',
    metadata: {
      block_type: 'internal_linking',
      section_id: id,
      internal_link_block: true,
      internalLinks: links.map((link) => ({
        text: link.text,
        url: link.url,
        relation: link.relation,
        description: link.description,
        badge: link.badge,
      })),
    },
  };
}

export function buildAutomaticInternalLinkBlocks(
  plan: InternalLinkPlan,
  graph?: SiteGraph,
  mission?: MissionLike,
): SimpleContentBlock[] {
  const currentNode = findCurrentNode(plan, graph);
  if (!currentNode && !mission) return [];

  let city = normalizeText((mission as any)?.city || currentNode?.city || '');
  if (!city || city.length < 2) city = 'tu zona';

  let niche = normalizeText(getCanonicalNicheLabel((mission as any)?.niche || currentNode?.keyword || 'servicio'));
  if (!niche || niche.length < 2) niche = 'servicio especializado';
  const links = buildLinksFromCluster(plan, graph, mission);
  if (!links.length) return [];

  const title = links.length >= 3 ? 'Páginas recomendadas dentro del proyecto' : 'Página principal y navegación relacionada';
  const intro = links.length >= 3
    ? `Aquí puedes abrir la página principal y otras páginas ya generadas del mismo proyecto para moverte con contexto y sin perder el hilo de navegación en ${city}.`
    : `Aquí tienes la página principal del proyecto para mantener una navegación clara y siempre disponible en ${city}.`;

  return [buildBlock('internal-links-contextual', title, renderHubHtml(title, intro, links), links)];
}
