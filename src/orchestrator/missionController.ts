import fs from 'fs/promises';
import path from 'path';
import {
    GenerationMission,
    ResearchContext,
    NormalizedContext,
    PagePlan,
    ContentDraft,
    RenderedPage,
    PipelineResult
} from '../types/pipeline_v2.js';

export interface PipelineStepState {
    mission: GenerationMission;
    research?: ResearchContext;
    normalization?: NormalizedContext;
    plan?: PagePlan;
    draft?: ContentDraft;
    rendered?: RenderedPage;
    result?: PipelineResult;
    currentPhase: number;
    timestamp: string;
}

interface MissionStatePointer {
    lastStateFile: string;
    phase: number;
    timestamp: string;
}

async function atomicWriteFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
    await fs.writeFile(tmpPath, content, 'utf8');
    await fs.rename(tmpPath, filePath);
}

async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
    await atomicWriteFile(filePath, JSON.stringify(value, null, 2));
}

function isValidPointer(value: unknown): value is MissionStatePointer {
    const pointer = value as Partial<MissionStatePointer> | null;
    return Boolean(
        pointer
        && typeof pointer.lastStateFile === 'string'
        && pointer.lastStateFile.startsWith('state_')
        && pointer.lastStateFile.endsWith('.json')
        && Number.isFinite(pointer.phase)
    );
}

function isSafeStateFileName(fileName: string): boolean {
    return /^state_\d{2}_[a-zA-Z0-9_-]+\.json$/.test(fileName);
}

export class MissionController {
    private statePath: string;

    constructor(missionDir: string, missionId: string) {
        this.statePath = path.join(missionDir, `mission_state_${missionId}.json`);
    }

    async saveState(state: PipelineStepState, phaseName: string): Promise<string> {
        const safePhaseName = String(phaseName || 'phase').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80);
        const fileName = `state_${String(state.currentPhase).padStart(2, '0')}_${safePhaseName}.json`;
        const dir = path.dirname(this.statePath);
        const filePath = path.join(dir, fileName);
        const stampedState: PipelineStepState = { ...state, timestamp: new Date().toISOString() };

        // Both files are written through temp files + rename. If a process dies mid-write,
        // loadLastState can still recover from the previous pointer or latest valid state file.
        await atomicWriteJson(filePath, stampedState);
        await atomicWriteJson(this.statePath, {
            lastStateFile: fileName,
            phase: stampedState.currentPhase,
            timestamp: stampedState.timestamp
        } satisfies MissionStatePointer);

        return filePath;
    }

    private async loadStateFile(fileName: string): Promise<PipelineStepState | null> {
        if (!isSafeStateFileName(fileName)) return null;
        try {
            const dir = path.dirname(this.statePath);
            const stateContent = await fs.readFile(path.join(dir, fileName), 'utf8');
            const parsed = JSON.parse(stateContent) as PipelineStepState;
            if (!parsed?.mission || !Number.isFinite(parsed.currentPhase)) return null;
            return parsed;
        } catch {
            return null;
        }
    }

    private async loadLatestRecoverableState(): Promise<PipelineStepState | null> {
        try {
            const dir = path.dirname(this.statePath);
            const entries = await fs.readdir(dir);
            const candidates = entries
                .filter(isSafeStateFileName)
                .sort()
                .reverse();

            for (const fileName of candidates) {
                const state = await this.loadStateFile(fileName);
                if (state) return state;
            }
        } catch {
            return null;
        }
        return null;
    }

    async loadLastState(): Promise<PipelineStepState | null> {
        try {
            const pointerContent = await fs.readFile(this.statePath, 'utf8');
            const pointer = JSON.parse(pointerContent);
            if (isValidPointer(pointer)) {
                const pointedState = await this.loadStateFile(pointer.lastStateFile);
                if (pointedState) return pointedState;
            }
        } catch {
            // Pointer can be absent/corrupt if the process was interrupted; recover below.
        }
        return this.loadLatestRecoverableState();
    }

    static async initMission(mission: GenerationMission, missionDir: string): Promise<PipelineStepState> {
        await fs.mkdir(missionDir, { recursive: true });
        return {
            mission,
            currentPhase: 0,
            timestamp: new Date().toISOString()
        };
    }
}
