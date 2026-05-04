import type { GenerationMission } from '../types/pipeline_v2.js';
import { resolvePlaybookForMission } from '../niches/agentAdapters.js';

export interface MissionRuntimeContext {
  niche: string;
  city: string;
  missionId?: string;
  playbookContext?: ReturnType<typeof resolvePlaybookForMission>;
  createdAt: string;
}

const runtimeContextCache = new Map<string, MissionRuntimeContext>();

function missionRuntimeKey(mission: GenerationMission): string {
  return [mission.missionId || '', mission.niche || '', mission.city || ''].join('::').toLowerCase();
}

export function createMissionRuntimeContext(mission: GenerationMission): MissionRuntimeContext {
  const key = missionRuntimeKey(mission);
  if (runtimeContextCache.has(key)) {
    return runtimeContextCache.get(key)!;
  }

  let playbookContext: ReturnType<typeof resolvePlaybookForMission> | undefined;
  try {
    playbookContext = resolvePlaybookForMission(mission.niche);
  } catch {
    playbookContext = undefined;
  }

  const context: MissionRuntimeContext = {
    niche: mission.niche,
    city: mission.city,
    missionId: mission.missionId,
    playbookContext,
    createdAt: new Date().toISOString(),
  };
  runtimeContextCache.set(key, context);
  return context;
}

export function attachMissionRuntimeContext<T extends GenerationMission>(mission: T): T {
  const runtimeContext = createMissionRuntimeContext(mission);
  mission.contextual_data = {
    ...(mission.contextual_data || {}),
    missionRuntimeContext: runtimeContext,
    nichePlaybook: runtimeContext.playbookContext || mission.contextual_data?.nichePlaybook,
  } as any;
  return mission;
}
