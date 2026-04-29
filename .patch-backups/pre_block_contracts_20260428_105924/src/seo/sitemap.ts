import type { SitemapEntry } from './types.js';

function escapeXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const indexable = entries.filter((entry) => entry.allowIndexation !== false);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexable.map((entry) => [
      '  <url>',
      `    <loc>${escapeXml(entry.url)}</loc>`,
      entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : '',
      typeof entry.priority === 'number' ? `    <priority>${entry.priority.toFixed(1)}</priority>` : '',
      '  </url>',
    ].filter(Boolean).join('\n')),
    '</urlset>',
  ].join('\n');
}

export function buildSitemapIndexXml(sitemaps: Array<{ url: string; lastmod?: string }>): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map((entry) => [
      '  <sitemap>',
      `    <loc>${escapeXml(entry.url)}</loc>`,
      entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
      '  </sitemap>',
    ].filter(Boolean).join('\n')),
    '</sitemapindex>',
  ].join('\n');
}