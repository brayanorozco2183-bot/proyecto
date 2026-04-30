import type { SeoFallbackGroup } from './seoFallbackTypes.js';
import { CerrajerosSeoFallbackGroups } from './cerrajeros.seo.js';
import { FontanerosSeoFallbackGroups } from './fontaneros.seo.js';
import { ElectricistasSeoFallbackGroups } from './electricistas.seo.js';
import { CarpinterosSeoFallbackGroups } from './carpinteros.seo.js';
import { PintoresSeoFallbackGroups } from './pintores.seo.js';
import { ReformasSeoFallbackGroups } from './reformas.seo.js';
import { ClimatizacionSeoFallbackGroups } from './climatizacion.seo.js';
import { PersianistasSeoFallbackGroups } from './persianistas.seo.js';
import { AntenistasSeoFallbackGroups } from './antenistas.seo.js';
import { JardinerosSeoFallbackGroups } from './jardineros.seo.js';

export type { SeoFallbackGroup, SeoFallbackPick, SeoFallbackPickInput, SeoFaqSeed, SeoFallbackIntent, SeoPageType } from './seoFallbackTypes.js';

export const SEO_FALLBACK_GROUPS: SeoFallbackGroup[] = [
  ...CerrajerosSeoFallbackGroups,
  ...FontanerosSeoFallbackGroups,
  ...ElectricistasSeoFallbackGroups,
  ...CarpinterosSeoFallbackGroups,
  ...PintoresSeoFallbackGroups,
  ...ReformasSeoFallbackGroups,
  ...ClimatizacionSeoFallbackGroups,
  ...PersianistasSeoFallbackGroups,
  ...AntenistasSeoFallbackGroups,
  ...JardinerosSeoFallbackGroups
];

export const SEO_FALLBACK_GROUPS_BY_NICHE: Record<string, SeoFallbackGroup[]> = SEO_FALLBACK_GROUPS.reduce((acc, group) => {
  const key = group.niche.toLowerCase();
  acc[key] = acc[key] || [];
  acc[key].push(group);
  return acc;
}, {} as Record<string, SeoFallbackGroup[]>);
