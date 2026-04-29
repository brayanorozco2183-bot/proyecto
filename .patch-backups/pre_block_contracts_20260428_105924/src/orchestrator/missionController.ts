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

export class MissionController {
    private statePath: string;

    constructor(missionDir: string, missionId: string) {
        this.statePath = path.join(missionDir, `mission_state_${missionId}.json`);
    }

    async saveState(state: PipelineStepState, phaseName: string): Promise<string> {
        const fileName = `state_${String(state.currentPhase).padStart(2, '0')}_${phaseName}.json`;
        const dir = path.dirname(this.statePath);
        const filePath = path.join(dir, fileName);
        
        await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
        // Update the "current" pointer
        await fs.writeFile(this.statePath, JSON.stringify({ lastStateFile: fileName, phase: state.currentPhase }, null, 2), 'utf8');
        
        return filePath;
    }

    async loadLastState(): Promise<PipelineStepState | null> {
        try {
            const pointerContent = await fs.readFile(this.statePath, 'utf8');
            const pointer = JSON.parse(pointerContent);
            const dir = path.dirname(this.statePath);
            const stateContent = await fs.readFile(path.join(dir, pointer.lastStateFile), 'utf8');
            return JSON.parse(stateContent);
        } catch (e) {
            return null;
        }
    }

    static async initMission(mission: GenerationMission, missionDir: string): Promise<PipelineStepState> {
        return {
            mission,
            currentPhase: 0,
            timestamp: new Date().toISOString()
        };
    }
}
