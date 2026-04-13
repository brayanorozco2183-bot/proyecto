import { BaseAgent, AgentResponse } from './base.js';

export interface ROIAuditorInput {
  niche?: string;
  city?: string;
  pageType?: string;
  wordCount?: number;
}

export interface ROIAuditorOutput {
  priority: 'low' | 'medium' | 'high';
  opportunityLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  quickWins: string[];
}

export class ROIAuditorAgent extends BaseAgent {
  constructor() {
    super(
      'ROI_Auditor_15',
      'ROI Auditor',
      'Auditor de ROI',
      'Evalúa el potencial de retorno editorial y prioriza quick wins antes de desplegar.'
    );
  }

  async execute(input: ROIAuditorInput): Promise<AgentResponse<ROIAuditorOutput>> {
    const niche = input?.niche || 'servicios locales';
    const city = input?.city || 'Valencia';
    const pageType = input?.pageType || 'service';

    const highIntent = ['service', 'urgent', 'service_area', 'comparison', 'home_local', 'category'].includes(pageType);
    const priority: 'low' | 'medium' | 'high' = highIntent ? 'high' : 'medium';

    const data: ROIAuditorOutput = {
      priority,
      opportunityLevel: highIntent ? 'high' : 'medium',
      reasoning: `La combinación ${niche} + ${city} con tipo ${pageType} apunta a una intención comercial suficientemente clara para justificar despliegue y pruebas.`,
      quickWins: [
        'reforzar CTA y teléfono visible',
        'asegurar coherencia de nicho en FAQ y mapas',
        'validar interlinking entre páginas del mismo cluster'
      ]
    };

    await this.logThought(`ROI audit completado para ${niche} en ${city}.`);

    return {
      success: true,
      data,
      thoughts: 'Auditoría de ROI completada con una priorización inicial segura.'
    };
  }
}
