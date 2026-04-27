import { BaseAgent, AgentResponse } from './base.js';
import { serpManager, CompetitorAudit } from '../tools/scraper.js';
import { prepareCompetitorTargets, filterUsefulCompetitorAudits } from '../utils/researchQuality.js';

/**
 * CompetitorAuditAgent - The Reconnaissance Specialist.
 * Visits competitor sites to extract real structural and content data.
 */
export class CompetitorAuditAgent extends BaseAgent {
    constructor() {
        super('Competitor_Audit_Agent', 'Competitor Audit', 'Auditor de Competencia', 'Espía digital que desglosa la estrategia de contenidos y enlaces de tus competidores más fuertes.');
    }

    private normalizeTargetUrl(raw: string): string | null {
        try {
            const url = new URL(String(raw || '').trim().replace(/[).,;]+$/, ''));
            url.hash = '';
            const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
            return `${url.protocol}//${url.host}${pathname}${url.search}`;
        } catch {
            return null;
        }
    }

    
    async execute(input: { targetLinks: string[]; niche?: string; city?: string }): Promise<AgentResponse<CompetitorAudit[]>> {
        const requestedLimit = Number(process.env.COMPETITOR_AUDIT_LIMIT) || 6;
        const auditLimit = Math.max(5, requestedLimit);
        const targetWindow = Math.max(auditLimit * 4, 18);

        const rawTargets = Array.from(new Set(
            (input.targetLinks || [])
                .map((url) => this.normalizeTargetUrl(url))
                .filter((url): url is string => Boolean(url))
        ));

        const preparedTargets = prepareCompetitorTargets(rawTargets, input.niche || '', input.city || '', targetWindow)
            .slice(0, targetWindow);

        const dedupedByHost = new Set<string>();
        const targets = preparedTargets.filter((url) => {
            try {
                const parsed = new URL(url);
                const hostKey = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
                if (dedupedByHost.has(hostKey)) return false;
                dedupedByHost.add(hostKey);
                return true;
            } catch {
                return false;
            }
        });

        await this.logThought(`Iniciando auditoría profunda de competidores. Candidatos limpios: ${targets.length} de ${rawTargets.length}.`);

        if (!targets.length) {
            return {
                success: false,
                data: [],
                thoughts: 'No hay objetivos de auditoría válidos tras limpiar directorios, mensajería y URLs irrelevantes.'
            };
        }

        const rawResults = await Promise.all(targets.map(async (url) => {
            try {
                await this.logThought(`Auditing competitor at: ${url}`);
                const audit = await serpManager.auditCompetitor(url);
                return audit;
            } catch (error: any) {
                console.warn(`[WARN] Auditoría fallida para ${url}: ${error.message}`);
                return null;
            }
        }));

        const cleaned = rawResults.filter((audit): audit is CompetitorAudit => Boolean(audit))
            .map((audit) => ({
                ...audit,
                title: String(audit.title || '').trim(),
                description: String(audit.description || '').trim(),
                h1s: Array.isArray(audit.h1s) ? audit.h1s.filter(Boolean).slice(0, 8) : [],
                h2s: Array.isArray(audit.h2s) ? audit.h2s.filter(Boolean).slice(0, 16) : [],
                h3s: Array.isArray(audit.h3s) ? audit.h3s.filter(Boolean).slice(0, 24) : [],
                wordCount: Number(audit.wordCount || 0),
            }))
            .filter((audit) => {
                const titleAndHeadings = `${audit.title} ${(audit.h1s || []).join(' ')} ${(audit.h2s || []).join(' ')}`.toLowerCase();
                if (!titleAndHeadings.trim()) return false;
                if (Number(audit.wordCount || 0) < 180) return false;
                if (/(404|not found|error|acceso denegado|forbidden)/i.test(titleAndHeadings)) return false;
                return true;
            });

        const filtered = filterUsefulCompetitorAudits(cleaned, input.niche || '', input.city || '', auditLimit);

        await this.logThought(`Auditoría útil: ${filtered.accepted.length} aceptadas, ${filtered.rejected.length} rechazadas por baja relevancia o baja señal local.`);
        return {
            success: filtered.accepted.length > 0,
            data: filtered.accepted.slice(0, auditLimit),
            thoughts: `Se obtuvieron ${filtered.accepted.slice(0, auditLimit).length} auditorías útiles listas para estrategia.`,
        };
    }
}

