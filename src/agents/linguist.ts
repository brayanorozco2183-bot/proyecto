import { BaseAgent, AgentResponse } from './base.js';

export interface LinguistInput {
  command: string;
}

export type ParsedScope = 'auto' | 'neighborhoods' | 'municipalities' | 'provinces' | 'autonomous_communities' | 'country';

export interface LinguistOutput {
  niche: string;
  locations: string[];
  is_cluster: boolean;
  scope: ParsedScope;
  publish_mode?: string;
  site_type?: string;
  archetype?: string;
  mode?: string;
  language: 'es';
  raw_command: string;
}

const SPANISH_CITIES = [
  'Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia','Palma','Bilbao','Alicante',
  'Córdoba','Valladolid','Vigo','Gijón','Hospitalet','A Coruña','Granada','Vitoria','Elche','Oviedo'
];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function detectScope(command: string): ParsedScope {
  const c = command.toLowerCase();
  if (/barrios|distritos|zonas|vecindarios/.test(c)) return 'neighborhoods';
  if (/municipios|pueblos|localidades/.test(c)) return 'municipalities';
  if (/provincias/.test(c)) return 'provinces';
  if (/comunidades\s+aut[oó]nomas/.test(c)) return 'autonomous_communities';
  if (/pais|pa[ií]s|nacional/.test(c)) return 'country';
  return 'auto';
}

function detectCluster(command: string): boolean {
  return /cluster|barrios|distritos|zonas|municipios|muchas\s+paginas|muchas\s+p[aá]ginas|varias\s+paginas|varias\s+p[aá]ginas/.test(command.toLowerCase());
}

function extractLocations(command: string): string[] {
  const matches: string[] = [];

  for (const city of SPANISH_CITIES) {
    const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(command)) matches.push(city);
  }

  const enMatch = command.match(/\ben\s+([A-ZÁÉÍÓÚÑ][\p{L}'’\-\s]{1,40}?)(?:\s+\b(?:familia|family|arquetipo|archetype|modo|mode|en|para|desde|con)\b|$)/iu);
  if (enMatch?.[1]) {
    const cleaned = enMatch[1].trim().replace(/[.,;:!?]+$/g, '');
    if (cleaned.length >= 2) matches.push(cleaned);
  }

  return unique(matches);
}

function extractNiche(command: string): string {
  const cleaned = command
    .replace(/^(quiero|necesito|crea|crear|genera|genera?me|haz|lanza|monta|produce)\s+/i, '')
    .replace(/\b(un|una|el|la)\b/gi, ' ')
    .replace(/\b(cluster|web|pagina|página|sitio|landing|lands|paginas|páginas)\b/gi, ' ')
    .replace(/\b(familia|family|modo|mode|archetype|arquetipo)\s+[\w_-]+\b/gi, ' ')
    .replace(/\b(en|para|desde)\b[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned) return cleaned;

  const fallback = command.match(/(?:de|sobre)\s+([\p{L}\s-]{3,40})/iu)?.[1]?.trim();
  return fallback || 'servicios locales';
}

export class LinguistAgent extends BaseAgent {
  constructor() {
    super(
      'Linguist_Interpreter_08',
      'Command Interpreter',
      'Lingüista Operativo',
      'Interpreta órdenes en lenguaje natural y las convierte en parámetros operativos para el orquestador.'
    );
  }

  async execute(input: LinguistInput): Promise<AgentResponse<LinguistOutput>> {
    const command = String(input?.command || '').trim();

    if (!command) {
      return {
        success: false,
        error: 'No se recibió ningún comando para interpretar.',
        thoughts: 'El lingüista no puede interpretar una orden vacía.'
      };
    }

    const locations = extractLocations(command);
    const output: LinguistOutput = {
      niche: extractNiche(command),
      locations: locations.length ? locations : ['Valencia'],
      is_cluster: detectCluster(command),
      scope: detectScope(command),
      language: 'es',
      raw_command: command,
      publish_mode: /borrador|draft/i.test(command) ? 'draft' : 'publish',
      site_type: /wordpress/i.test(command) ? 'wordpress' : 'static',
      archetype: command.match(/\b(?:familia|family|arquetipo|archetype)\s+([\w_-]+)\b/i)?.[1],
      mode: command.match(/\b(?:modo|mode)\s+([\w_-]+)\b/i)?.[1] || (/premium/i.test(command) ? 'premium' : 'standard')
    };

    await this.logThought(`Orden interpretada. Nicho=${output.niche}; ubicaciones=${output.locations.join(', ')}; cluster=${output.is_cluster}; scope=${output.scope}`);

    return {
      success: true,
      data: output,
      response: `Interpretación: nicho "${output.niche}" en ${output.locations.join(', ')}.` ,
      thoughts: 'Interpretación del comando completada con heurística local segura.'
    };
  }

  /**
   * Operative audit to detect linguistic hallucinations or semantic drift.
   */
  async auditContent(html: string, city: string): Promise<AgentResponse<{ passed: boolean, issues: string[] }>> {
    const issues: string[] = [];
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // Check 1: Mandatory city presence (case insensitive)
    const cityRegex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (!cityRegex.test(text)) {
      issues.push(`La ciudad "${city}" no aparece mencionada en el texto legible.`);
    }

    // Check 2: Hallucination detection: names of other major cities that shouldn't be here
    const otherCities = SPANISH_CITIES.filter(c => c.toLowerCase() !== city.toLowerCase());
    for (const other of otherCities) {
      const otherRegex = new RegExp(`\\b${other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (otherRegex.test(text)) {
        issues.push(`Posible alucinación: se menciona "${other}" en una página para "${city}".`);
      }
    }

    // Check 3: Technical trace leakage
    if (text.includes('{{') || text.includes('[[') || text.includes('__')) {
      issues.push('Se detectaron rastros de tokens de plantillas ({{, [[ o __).');
    }

    const passed = issues.length === 0;

    await this.logThought(`Auditoría lingüística para ${city}: ${passed ? 'PASSED' : 'FAILED (' + issues.length + ' issues)'}`);

    return {
      success: true,
      data: { passed, issues },
      thoughts: passed 
        ? 'El contenido cumple con los mínimos de integridad lingüística local.' 
        : `Se detectaron ${issues.length} problemas de integridad lingüística.`
    };
  }
}
