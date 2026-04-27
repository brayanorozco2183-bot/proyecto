import { BaseAgent, AgentResponse } from './base.js';
import { resolveVerticalPack } from '../knowledge-packs/base.js';

export interface AuthorityWeaverInput {
  niche?: string;
  city?: string;
  pageType?: string;
}

export interface AuthorityWeaverOutput {
  trustSignals: string[];
  supportAngles: string[];
  schemaHints: string[];
}

export class AuthorityWeaverAgent extends BaseAgent {
  constructor() {
    super(
      'Authority_Weaver_13',
      'Authority Weaver',
      'Tejedor de Autoridad',
      'Define señales de confianza y soportes editoriales para reforzar EEAT y conversión.'
    );
  }

  async execute(input: AuthorityWeaverInput): Promise<AgentResponse<AuthorityWeaverOutput>> {
    const niche = input?.niche || 'servicios locales';
    const city = input?.city || 'Valencia';
    const pageType = input?.pageType || 'service';
    const pack = resolveVerticalPack(niche);

    const trustSignals = Array.from(new Set([
      ...(pack.trustSignals || []),
      'presupuesto desglosado',
      'proceso explicado',
      city ? `cobertura real en ${city}` : 'cobertura local'
    ])).slice(0, 4);

    const supportAngles = [
      `cómo elegir ${niche} sin improvisar en ${city}`,
      `casos habituales de ${niche} que se resuelven en ${city}`,
      pageType === 'guide'
        ? `errores frecuentes antes de contratar ${niche}`
        : `señales de confianza antes de contratar ${niche}`
    ];

    const schemaHints = ['Organization', 'WebPage', 'BreadcrumbList', 'LocalBusiness'];
    if (pageType === 'guide') schemaHints.push('Article');
    if (pageType === 'service' || pageType === 'urgent' || pageType === 'service_area') schemaHints.push('Service');

    const data: AuthorityWeaverOutput = {
      trustSignals,
      supportAngles,
      schemaHints
    };

    await this.logThought(`Authority weaving preparado para ${niche} en ${city}.`);

    return {
      success: true,
      data,
      thoughts: 'Señales de autoridad construidas con un paquete base reutilizable.'
    };
  }
}
