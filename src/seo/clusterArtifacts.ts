import { buildRobotsTxt } from './robots.js';
import { buildSitemapIndexXml, buildSitemapXml } from './sitemap.js';
import type { ClusterSeoArtifactBundle, RenderedSeoContract } from './types.js';

function slugify(value: string): string {
  return String(value || 'default')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildClusterSeoArtifacts(
  pages: Array<RenderedSeoContract & { updatedAt?: string; cluster?: string }>,
  baseUrl: string,
): ClusterSeoArtifactBundle {
  const groups = new Map<string, Array<RenderedSeoContract & { updatedAt?: string; cluster?: string }>>();

  for (const page of pages) {
    const cluster = slugify(page.cluster || page.indexationPolicy?.cluster || 'default');
    if (!groups.has(cluster)) groups.set(cluster, []);
    groups.get(cluster)!.push(page);
  }

  const files: Record<string, string> = {};
  const sitemapEntries: Array<{ url: string; lastmod?: string }> = [];

  for (const [cluster, items] of groups.entries()) {
    const sitemapFilename = `sitemap-${cluster}.xml`;
    const sitemapUrl = `${String(baseUrl).replace(/\/$/, '')}/${sitemapFilename}`;

    files[sitemapFilename] = buildSitemapXml(
      items.map((item) => ({
        url: item.canonical,
        lastmod: item.updatedAt,
        changefreq: 'weekly',
        priority: item.indexationPolicy?.mode === 'index' ? 0.8 : 0.2,
        cluster,
        allowIndexation: item.indexationPolicy?.allowInSitemap,
      })),
    );

    files[`robots-${cluster}.txt`] = buildRobotsTxt({
      sitemaps: [sitemapUrl],
      allow: ['/'],
      disallow: items.some((item) => item.indexationPolicy?.mode === 'noindex') ? ['/tmp/'] : [],
    });

    sitemapEntries.push({ url: sitemapUrl, lastmod: items[0]?.updatedAt });
  }

  files['sitemap.xml'] = buildSitemapIndexXml(sitemapEntries);
  files['robots.txt'] = buildRobotsTxt({
    sitemaps: sitemapEntries.map((entry) => entry.url),
    allow: ['/'],
  });

  return {
    files,
    clusters: Array.from(groups.keys()),
  };
}