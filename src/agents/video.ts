import { BaseAgent, AgentResponse } from './base.js';

export interface VideoArchitectInput {
  niche?: string;
  city?: string;
  pageType?: string;
  h1?: string;
}

export interface VideoArchitectOutput {
  title: string;
  hook: string;
  scenes: Array<{
    id: number;
    objective: string;
    visual: string;
    voiceover: string;
  }>;
  cta: string;
}

export class VideoArchitectAgent extends BaseAgent {
  constructor() {
    super(
      'Video_Architect_12',
      'Video Architect',
      'Arquitecto de Vídeo',
      'Diseña microguiones de vídeo vertical alineados con la landing y la intención de búsqueda local.'
    );
  }

  async execute(input: VideoArchitectInput): Promise<AgentResponse<VideoArchitectOutput>> {
    const niche = input?.niche || 'servicios locales';
    const city = input?.city || 'Valencia';
    const title = input?.h1 || `${niche} en ${city}`;

    const data: VideoArchitectOutput = {
      title: `Vídeo promocional: ${title}`,
      hook: `Si buscas ${niche} en ${city}, aquí tienes una propuesta clara, local y orientada a conversión.`,
      scenes: [
        {
          id: 1,
          objective: 'Presentar el problema o necesidad',
          visual: `Plano corto del entorno real de ${city} relacionado con ${niche}.`,
          voiceover: `Mostramos de forma directa qué situación suele activar la necesidad de ${niche} en ${city}.`
        },
        {
          id: 2,
          objective: 'Demostrar proceso y confianza',
          visual: 'Secuencia técnica del trabajo, herramientas and resultado parcial.',
          voiceover: 'Enfatizamos método, criterio técnico y una intervención limpia y entendible.'
        },
        {
          id: 3,
          objective: 'Cerrar con llamada a la acción',
          visual: 'Plano final con marca, teléfono o cierre editorial.',
          voiceover: `Terminamos con una llamada a la acción clara para captar demanda local en ${city}.`
        }
      ],
      cta: `Solicita información sobre ${niche} en ${city}.`
    };

    await this.logThought(`Plan de vídeo generado para ${niche} en ${city}.`);

    return {
      success: true,
      data,
      thoughts: 'Arquitectura de vídeo completada con un guion corto y reutilizable.'
    };
  }
}
