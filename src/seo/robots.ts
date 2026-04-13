export interface RobotsBuildInput {
  sitemaps: string[];
  disallow?: string[];
  allow?: string[];
  crawlDelay?: number;
  userAgent?: string;
}

export function buildRobotsTxt(input: RobotsBuildInput): string {
  const userAgent = input.userAgent || '*';
  const lines: string[] = [`User-agent: ${userAgent}`];

  const allow = input.allow && input.allow.length > 0 ? input.allow : ['/'];
  const disallow = input.disallow || [];

  for (const value of allow) lines.push(`Allow: ${value}`);
  for (const value of disallow) lines.push(`Disallow: ${value}`);
  if (typeof input.crawlDelay === 'number') lines.push(`Crawl-delay: ${input.crawlDelay}`);
  lines.push('');
  for (const sitemap of input.sitemaps) lines.push(`Sitemap: ${sitemap}`);

  return lines.join('\n').trim() + '\n';
}