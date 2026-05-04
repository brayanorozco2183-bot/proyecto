export interface BreadcrumbItem {
  url: string;
  name: string;
}

function normalizePathSegment(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '');
}

function trimSlashes(value: string): string {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

export function buildPageBreadcrumbs(args: {
  baseUrl: string;
  city: string;
  niche: string;
  pageTitle: string;
  pageType?: string;
  pageUrlOverride?: string;
}): BreadcrumbItem[] {
  const baseUrl = String(args.baseUrl || '').replace(/\/$/, '');
  const citySlug = trimSlashes(normalizePathSegment(args.city));
  const nicheSlug = trimSlashes(normalizePathSegment(args.niche));

  const cityUrl = `${baseUrl}/${citySlug}/`;
  const pageUrl = String(args.pageUrlOverride || `${baseUrl}/${nicheSlug}/${citySlug}/`).replace(/([^:])\/\/+?/g, '$1/');

  return [
    { url: `${baseUrl}/`, name: 'Inicio' },
    { url: cityUrl, name: args.city },
    { url: pageUrl, name: args.pageTitle },
  ];
}

export function mapBreadcrumbsForRenderer(items: BreadcrumbItem[]) {
  return items.map((item) => ({ url: item.url, name: item.name }));
}

export function mapBreadcrumbsForSchema(items: BreadcrumbItem[]) {
  return items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  }));
}