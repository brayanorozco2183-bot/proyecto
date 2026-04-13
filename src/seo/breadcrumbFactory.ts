export interface BreadcrumbItem {
  url: string;
  name: string;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

export function buildPageBreadcrumbs(args: {
  baseUrl: string;
  city: string;
  niche: string;
  pageTitle: string;
  pageType?: string;
}): BreadcrumbItem[] {
  const baseUrl = args.baseUrl.replace(/\/$/, '');
  const citySlug = trimSlashes(args.city.toLowerCase());
  const nicheSlug = trimSlashes(args.niche.toLowerCase());

  const cityUrl = `${baseUrl}/${citySlug}/`;
  const pageUrl = `${baseUrl}/${nicheSlug}/${citySlug}/`;

  return [
    { url: `${baseUrl}/`, name: 'Inicio' },
    { url: cityUrl, name: args.city },
    { url: pageUrl, name: args.pageTitle }
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
    item: item.url
  }));
}