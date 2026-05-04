import fs from 'fs/promises';
import path from 'path';
import { vault } from '../tools/vault.js';
import {
  buildAutomaticInternalLinkBlocks,
  INTERNAL_LINKS_END_MARKER,
  INTERNAL_LINKS_START_MARKER,
} from './autoBlocks.js';
import type { InternalLinkPlan, MissionLike } from './types.js';

interface ReconcileResult {
  attempted: boolean;
  clusterFolder: string;
  scanned: number;
  updated: number;
  skipped: number;
  paths: string[];
  reason?: string;
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

function sanitizePathSegment(value: any): string {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function clusterFolderFromMission(mission: MissionLike): string {
  const explicit = sanitizePathSegment((mission as any).cluster_folder_name || (mission as any).clusterFolderName || (mission as any).clusterFolder);
  if (explicit) return explicit;
  return `${slugify((mission as any).niche)}-${slugify((mission as any).city)}`;
}

function outputBaseDir(): string {
  return (vault as any).OUTPUT_DIR || process.env.OUTPUT_DIR || path.join(process.cwd(), 'output_sites');
}

function subPathToMissionSubPath(subPath: string): string | undefined {
  const cleaned = sanitizePathSegment(subPath || 'index.html').replace(/\/index\.html$/i, '').replace(/^index\.html$/i, '');
  return cleaned || undefined;
}

function subPathToFile(clusterDir: string, subPath: string): string {
  const cleaned = sanitizePathSegment(subPath || 'index.html') || 'index.html';
  return path.join(clusterDir, ...cleaned.split('/'));
}

function insertInternalLinksBeforeTerminal(html: string, wrappedBlock: string): string {
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${wrappedBlock}\n</main>`);
  if (/<footer\b/i.test(html)) return html.replace(/<footer\b/i, `${wrappedBlock}\n<footer`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${wrappedBlock}\n</body>`);
  return `${html}\n${wrappedBlock}`;
}

function replaceInternalLinksBlock(html: string, newBlock: string): string {
  const wrappedBlock = newBlock.includes(INTERNAL_LINKS_START_MARKER)
    ? newBlock
    : `${INTERNAL_LINKS_START_MARKER}\n${newBlock}\n${INTERNAL_LINKS_END_MARKER}`;

  const markerRegex = new RegExp(
    `${escapeRegExp(INTERNAL_LINKS_START_MARKER)}[\\s\\S]*?${escapeRegExp(INTERNAL_LINKS_END_MARKER)}`,
    'ig',
  );
  const withoutMarkedBlocks = html.replace(markerRegex, '').trimEnd();

  const legacySectionRegex = /<section\s+class=["'][^"']*internal-links-hub[^"']*["'][\s\S]*?<\/section>/ig;
  const withoutLegacyBlocks = withoutMarkedBlocks.replace(legacySectionRegex, '').trimEnd();

  return insertInternalLinksBeforeTerminal(withoutLegacyBlocks, wrappedBlock);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPageMission(baseMission: MissionLike, geo: { name: string; sub_path?: string }, clusterFolder: string): MissionLike {
  return {
    ...(baseMission as any),
    city: geo.name,
    subPath: subPathToMissionSubPath(geo.sub_path || `${slugify(geo.name)}/index.html`),
    cluster_folder_name: clusterFolder,
    clusterFolderName: clusterFolder,
    cluster_data: (baseMission as any).cluster_data,
  } as MissionLike;
}

export async function reconcileClusterInternalLinks(mission: MissionLike): Promise<ReconcileResult> {
  const geoItems = (mission as any)?.cluster_data?.geo || [];
  const clusterFolder = clusterFolderFromMission(mission);
  const clusterDir = path.join(outputBaseDir(), clusterFolder);
  const result: ReconcileResult = {
    attempted: true,
    clusterFolder,
    scanned: 0,
    updated: 0,
    skipped: 0,
    paths: [],
  };

  if (!Array.isArray(geoItems) || geoItems.length < 2) {
    return { ...result, attempted: false, reason: 'No hay cluster_data.geo suficiente para reconciliar.' };
  }

  const dummyPlan: InternalLinkPlan = {
    currentNodeId: '',
    supporting: [],
    selected: [],
    all: [],
    grouped: {
      relatedServices: [],
      relatedAreas: [],
      relatedGuides: [],
      relatedFaqs: [],
      moneyPages: [],
    },
  };

  for (const geo of geoItems) {
    if (!geo?.name) {
      result.skipped += 1;
      continue;
    }

    const filePath = subPathToFile(clusterDir, geo.sub_path || `${slugify(geo.name)}/index.html`);
    result.scanned += 1;

    let html: string;
    try {
      html = await fs.readFile(filePath, 'utf-8');
    } catch {
      result.skipped += 1;
      continue;
    }

    const pageMission = buildPageMission(mission, geo, clusterFolder);
    const blocks = buildAutomaticInternalLinkBlocks(dummyPlan, undefined, pageMission);
    const nextBlock = blocks[0]?.html;
    if (!nextBlock) {
      result.skipped += 1;
      continue;
    }

    const nextHtml = replaceInternalLinksBlock(html, nextBlock);
    if (nextHtml !== html) {
      await fs.writeFile(filePath, nextHtml, 'utf-8');
      result.updated += 1;
      result.paths.push(filePath);
    } else {
      result.skipped += 1;
    }
  }

  return result;
}
