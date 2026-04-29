import * as fs from 'fs';
import * as path from 'path';
import type { GenerationMission } from '../types/pipeline_v2.js';

function slugify(value: string): string {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'mission';
}

function safeWriteJson(filePath: string, data: unknown): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function resolveSerpEvidenceDir(mission: GenerationMission): string {
    const missionSlug = [mission.niche, mission.city, mission.missionId || mission.cluster_folder_name || 'serp']
        .map((part) => slugify(String(part || '')))
        .filter(Boolean)
        .join('__');
    return path.join(process.cwd(), 'debug_runs', 'serp_evidence', missionSlug);
}

export function saveSerpEvidence(mission: GenerationMission, payload: {
    raw?: unknown;
    summary: Record<string, unknown>;
    competitors?: unknown;
    researchMarkdown?: string;
}): { dir: string; files: string[] } {
    const dir = resolveSerpEvidenceDir(mission);
    const files: string[] = [];

    if (payload.raw !== undefined) {
        const rawPath = path.join(dir, 'serp_raw.json');
        safeWriteJson(rawPath, payload.raw);
        files.push(rawPath);
    }

    const summaryPath = path.join(dir, 'serp_summary.json');
    safeWriteJson(summaryPath, payload.summary);
    files.push(summaryPath);

    if (payload.competitors !== undefined) {
        const competitorsPath = path.join(dir, 'competitors_extracted.json');
        safeWriteJson(competitorsPath, payload.competitors);
        files.push(competitorsPath);
    }

    if (payload.researchMarkdown) {
        const mdPath = path.join(dir, 'research_evidence.md');
        fs.mkdirSync(path.dirname(mdPath), { recursive: true });
        fs.writeFileSync(mdPath, payload.researchMarkdown, 'utf8');
        files.push(mdPath);
    }

    return { dir, files };
}
