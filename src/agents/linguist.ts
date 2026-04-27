import { BaseAgent, AgentResponse } from './base.js';
import * as cheerio from 'cheerio';
import { parseStrictServiceCommand } from '../input/strictCommandContract.js';

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
  command_focus?: string;
}

const SPANISH_CITIES = [
  'Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia','Palma','Bilbao','Alicante',
  'Córdoba','Valladolid','Vigo','Gijón','Hospitalet','A Coruña','Granada','Vitoria','Elche','Oviedo',
  'Getafe','Móstoles','Alcorcón','Leganés','Fuenlabrada','Parla','Alcobendas','Torrejón de Ardoz'
];

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
    const rawCommand = String(input?.command || '').trim();
    if (!rawCommand) {
      return {
        success: false,
        error: 'No se recibió ningún comando para interpretar.',
        thoughts: 'El lingüista no puede interpretar una orden vacía.'
      };
    }

    const strictMode = String(process.env.STRICT_COMMAND_MODE || 'true').toLowerCase() !== 'false';

    try {
      const parsed = parseStrictServiceCommand(rawCommand);
      const output: LinguistOutput = {
        niche: parsed.niche,
        locations: parsed.locations,
        is_cluster: parsed.is_cluster,
        scope: parsed.scope,
        language: 'es',
        raw_command: rawCommand,
        publish_mode: parsed.publish_mode,
        site_type: parsed.site_type,
        archetype: parsed.archetype,
        mode: parsed.mode,
        command_focus: parsed.topic,
      };

      await this.logThought(`Orden interpretada en modo estricto. Nicho=${output.niche}; ubicaciones=${output.locations.join(', ')}; focus=${output.command_focus || 'base'}; cluster=${output.is_cluster}; scope=${output.scope}`);

      return {
        success: true,
        data: output,
        response: `Interpretación: nicho "${output.niche}" en ${output.locations.join(', ')}${output.command_focus ? ` sobre ${output.command_focus}` : ''}.`,
        thoughts: 'Interpretación del comando completada con contrato estricto de entrada.'
      };
    } catch (error: any) {
      await this.logThought(`Orden rechazada por contrato estricto: ${error.message}`);
      if (strictMode) {
        return {
          success: false,
          error: error.message,
          thoughts: 'El comando fue rechazado para proteger la estabilidad del pipeline de producción.'
        };
      }

      return {
        success: false,
        error: error.message,
        thoughts: 'El comando no pasó el contrato estricto; activa un formato explícito.'
      };
    }
  }

  async auditContent(html: string, city: string): Promise<AgentResponse<{ passed: boolean; issues: string[] }>> {
    const issues: string[] = [];

    if (typeof html !== 'string' || !html) {
      return {
        success: false,
        error: 'Input HTML must be a non-empty string.',
        thoughts: 'El auditor lingüístico no pudo procesar la página: el contenido está vacío o no es una cadena.'
      };
    }

    const $ = cheerio.load(html);
    $('script, style, .el-scripts-container').remove();

    const hubs = $('.internal-links-hub, .footer-editorial, .site-header, .site-footer');
    const hubContent = hubs.text();
    hubs.remove();

    const cleanBody = $('body');
    const text = cleanBody.text().replace(/\s+/g, ' ').trim();
    const fullTextInclHubs = `${text} ${hubContent}`.trim();

    const cityRegex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (!cityRegex.test(fullTextInclHubs)) {
      issues.push(`La ciudad "${city}" no aparece mencionada en el texto legible.`);
    }

    const otherCities = SPANISH_CITIES.filter(c => c.toLowerCase() !== city.toLowerCase());
    for (const other of otherCities) {
      const otherRegex = new RegExp(`\\b${other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (otherRegex.test(text)) {
        issues.push(`Posible alucinación: se menciona "${other}" en una página para "${city}".`);
      }
    }

    if (text.includes('{{') || text.includes('[[') || text.includes('__')) {
      issues.push('Se detectaron rastros de tokens de plantillas ({{, [[ o __).');
    }

    const passed = issues.length === 0;
    await this.logThought(`Auditoría lingüística para ${city}: ${passed ? 'PASSED' : `FAILED (${issues.length} issues)`}`);

    return {
      success: true,
      data: { passed, issues },
      thoughts: passed
        ? 'El contenido cumple con los mínimos de integridad lingüística local.'
        : `Se detectaron ${issues.length} problemas de integridad lingüística.`
    };
  }
}
