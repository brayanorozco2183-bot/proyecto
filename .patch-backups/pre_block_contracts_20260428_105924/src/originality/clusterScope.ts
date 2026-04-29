import { MissionLike, OriginalityScope, PagePlanLike } from './types.js';

function normalizeText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean as any))];
}

function pickNearbyCities(mission: MissionLike): string[] {
  const geo = mission.cluster_data?.geo || {};
  const items = [
    ...(Array.isArray(geo.nearbyCities) ? geo.nearbyCities : []),
    ...(Array.isArray(geo.cities) ? geo.cities : []),
    ...(Array.isArray(geo.sub_locations) ? geo.sub_locations.map((x: any) => x?.name).filter(Boolean) : [])
  ];

  return unique([mission.city, ...items].map(item => normalizeText(String(item || ''))).filter(Boolean)).slice(0, 8);
}

function pickRelatedServices(mission: MissionLike): string[] {
  const topical = mission.cluster_data?.topical || {};
  const items = [
    ...(Array.isArray(topical.relatedServices) ? topical.relatedServices : []),
    ...(Array.isArray(topical.subservices) ? topical.subservices : []),
    ...(Array.isArray(topical.entities) ? topical.entities : [])
  ];

  return unique([mission.niche, ...items].map(item => normalizeText(String(item || ''))).filter(Boolean)).slice(0, 10);
}

export function deriveServiceKey(niche: string, mission?: MissionLike): string {
  const base = normalizeText(niche);
  const topicalRoot = normalizeText(mission?.cluster_data?.topical?.parentService || '');
  return topicalRoot || base;
}

export function deriveOriginalityScopes(mission: MissionLike, pagePlan?: PagePlanLike): OriginalityScope[] {
  const normalizedCity = normalizeText(mission.city);
  const serviceKey = deriveServiceKey(mission.niche, mission);
  const nearbyCities = pickNearbyCities(mission);
  const relatedServices = pickRelatedServices(mission);
  const pageType = pagePlan?.intentModel?.pageType || 'service';

  const scopes: OriginalityScope[] = [
    {
      key: `same_niche_nearby_cities::${serviceKey}::${nearbyCities.join('|')}`,
      type: 'same_niche_nearby_cities',
      label: `Mismo nicho en ciudades cercanas para ${serviceKey}`
    },
    {
      key: `same_city_related_services::${normalizedCity}::${relatedServices.join('|')}::${pageType}`,
      type: 'same_city_related_services',
      label: `Misma ciudad y servicios relacionados en ${mission.city}`
    }
  ];

  return scopes;
}