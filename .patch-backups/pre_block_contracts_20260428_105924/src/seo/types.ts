export type PageType =
  | 'home_local'
  | 'service'
  | 'service_area'
  | 'urgent'
  | 'guide'
  | 'faq'
  | 'comparison'
  | 'category';

export type SearchIntent =
  | 'transactional'
  | 'commercial'
  | 'informational'
  | 'navigational';

export type SupportedSchemaType =
  | 'LocalBusiness'
  | 'Service'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'WebPage'
  | 'Organization'
  | 'Article';

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface SeoBrief {
  titleStrategy: string;
  metaDescriptionStrategy: string;
  canonicalSlug?: string;
  schemaTypes: SupportedSchemaType[];
  faqEligible: boolean;
  localModifiers: string[];
  indexationHint?: 'index' | 'noindex';
  reason?: string;
}

export interface OpenGraphContract {
  type: 'website' | 'article';
  title: string;
  description: string;
  url: string;
  image?: string;
  siteName?: string;
  locale?: string;
}

export interface TwitterCardContract {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  image?: string;
}

export interface IndexationPolicy {
  mode: 'index' | 'noindex';
  follow: boolean;
  allowInSitemap: boolean;
  reason: string;
  cluster: string;
}

export interface SchemaBuildResult {
  schemaTypes: SupportedSchemaType[];
  schemaList: Record<string, any>[];
  schemaJsonLd: Record<string, any>;
}

export interface RenderedSeoContract {
  slug: string;
  canonical: string;
  title: string;
  metaDescription: string;
  robots: string;
  breadcrumbs: BreadcrumbItem[];
  openGraph: OpenGraphContract;
  twitter: TwitterCardContract;
  schemaTypes: SupportedSchemaType[];
  schemaList: Record<string, any>[];
  schemaJsonLd: Record<string, any>;
  indexationPolicy: IndexationPolicy;
  metadata?: Record<string, any>;
}

export interface PageIdentity {
  pageType: PageType;
  intent: SearchIntent;
  primaryKeyword: string;
  city: string;
  serviceSlug: string;
  citySlug: string;
  zoneSlug?: string;
  topicSlug?: string;
  cluster: string;
}

export interface SeoBuildInput {
  pagePlan: any;
  mission: any;
  faqs?: Array<{ question: string; answer: string }>;
  baseUrl?: string;
  siteName?: string;
  locale?: string;
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface CanonicalBuildResult {
  slug: string;
  canonical: string;
  identity: PageIdentity;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
  cluster?: string;
  allowIndexation?: boolean;
}

export interface ClusterSeoArtifactBundle {
  files: Record<string, string>;
  clusters: string[];
}

export type SiteNodeType = 
  | 'home_local' 
  | 'service' 
  | 'service_area' 
  | 'urgent'
  | 'guide' 
  | 'faq' 
  | 'comparison' 
  | 'category';

export interface SiteNode {
  id: string;
  type: SiteNodeType;
  slug: string;
  keyword: string;
  city: string;
  parent?: string;
  metadata?: Record<string, any>;
}

export interface SiteEdge {
  from: string;
  to: string;
  relation: 'upward' | 'lateral' | 'downward' | 'bofu' | 'related_area';
  anchorText?: string;
}

export interface SiteGraphContract {
  nodes: SiteNode[];
  edges: SiteEdge[];
}