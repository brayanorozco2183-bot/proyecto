import { BaseAgent, AgentResponse } from './base.js';
import { serpManager, CompetitorAudit } from '../tools/scraper.js';
import { vault } from '../tools/vault.js';

/**
 * CompetitorAuditAgent - The Reconnaissance Specialist.
 * Visits competitor sites to extract real structural and content data.
 */
export class CompetitorAuditAgent extends BaseAgent {
    constructor() {
        super('Competitor_Audit_Agent', 'Competitor Audit', 'Auditor de Competencia', 'Espía digital que desglosa la estrategia de contenidos y enlaces de tus competidores más fuertes.');
    }

    async execute(input: { targetLinks: string[] }): Promise<AgentResponse<CompetitorAudit[]>> {
        const auditLimit = Number(process.env.COMPETITOR_AUDIT_LIMIT) || 3;
        await this.logThought(`Iniciando auditoría profunda de competidores. Objetivos: ${Math.min(input.targetLinks.length, auditLimit)} sitios.`);

        const audits: CompetitorAudit[] = [];

        for (const url of input.targetLinks.slice(0, auditLimit)) { // Limit to top X for stability
            try {
                this.logThought(`Auditing competitor at: ${url}`);
                const siteData = await serpManager.auditCompetitorSite(url);

                if (siteData) {
                    this.logThought(`Successful audit of ${url}. WordCount: ${siteData.wordCount}.`);
                    audits.push(siteData);
                } else {
                    this.logThought(`Could not audit ${url} (Likely blocked or CAPTCHA).`);
                }
            } catch (error: any) {
                this.logThought(`Failed to audit ${url}: ${error.message}`);
            }
        }

        if (audits.length === 0) {
            return {
                success: false,
                data: [],
                thoughts: "No se pudo auditar ningún competidor real. Activando modo resiliencia (Inteligencia Heurística)."
            };
        }

        return {
            success: true,
            data: audits,
            thoughts: `Auditoría completada para ${audits.length} competidores. Datos estructurales listos para Gap Analysis.`
        };
    }
}