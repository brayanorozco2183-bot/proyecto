import { BaseAgent, AgentResponse } from './base.js';

export interface SentinelReport {
  timestamp: string;
  degraded: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
}

export class SentinelAgent extends BaseAgent {
  constructor() {
    super(
      'Sentinel_Observer_14',
      'Runtime Sentinel',
      'Centinela Operativo',
      'Supervisa el estado general del sistema sin interrumpir el orquestador.'
    );
  }

  async execute(input?: any): Promise<AgentResponse<SentinelReport>> {
    const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
    let degraded = false;

    try {
      const { dbManager } = await import('../db/index.js');
      const db = await dbManager.getDB();

      try {
        const missions = await db.get('SELECT COUNT(*) as total FROM missions');
        checks.push({ name: 'missions_table', ok: true, detail: `Tabla missions accesible (${missions?.total ?? 0} filas).` });
      } catch (error: any) {
        degraded = true;
        checks.push({ name: 'missions_table', ok: false, detail: `No se pudo consultar missions: ${error.message}` });
      }

      try {
        const cityData = await db.get('SELECT COUNT(*) as total FROM city_data');
        checks.push({ name: 'city_data_table', ok: true, detail: `Tabla city_data accesible (${cityData?.total ?? 0} filas).` });
      } catch (error: any) {
        degraded = true;
        checks.push({ name: 'city_data_table', ok: false, detail: `No se pudo consultar city_data: ${error.message}` });
      }
    } catch (error: any) {
      degraded = true;
      checks.push({ name: 'db_bootstrap', ok: false, detail: `Fallo al inicializar DB: ${error.message}` });
    }

    await this.logThought(`Sentinel beat ejecutado. Degraded=${degraded}.`);

    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        degraded,
        checks
      },
      thoughts: degraded
        ? 'Centinela ejecutado en modo degradado, pero sin interrumpir el sistema.'
        : 'Centinela ejecutado correctamente.'
    };
  }
}
