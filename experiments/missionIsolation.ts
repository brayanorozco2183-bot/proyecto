import { agentMemoryStore } from '../ai/agentMemory.js';
import { getPremiumNicheContract, buildPremiumContractBrief } from '../niches/premiumContracts.js';

export interface MissionIsolationContext { missionId: string; niche: string; city: string; previousNiches?: string[]; }

export function buildForbiddenLexiconForMission(niche: string, previousNiches: string[] = []): string[] {
  const base: Record<string, string[]> = {
    cerrajeros: ['tubería','fuga de agua','grifo','bajante','rodillo','pintura plástica','cuadro eléctrico'],
    fontaneros: ['cerradura','bombín','cilindro','antibumping','ganzúa','llaves','rodillo','pintura plástica'],
    pintores: ['cerradura','bombín','antibumping','tubería','fuga de agua','grifo','bajante','cuadro eléctrico'],
    electricistas: ['cerradura','bombín','antibumping','tubería','fuga de agua','rodillo','pintura plástica'],
    carpinteros: ['antibumping','ganzúa','fuga de agua','cuadro eléctrico','pintura plástica']
  };
  return Array.from(new Set(base[niche.toLowerCase()] || []));
}

export async function prepareIsolatedMission(ctx: MissionIsolationContext): Promise<{ forbiddenTerms: string[]; premiumContractBrief: string }> {
  const forbiddenTerms = buildForbiddenLexiconForMission(ctx.niche, ctx.previousNiches || []);
  process.env.GRAVITY_CURRENT_MISSION_ID = ctx.missionId;
  process.env.GRAVITY_CURRENT_NICHE = ctx.niche;
  process.env.GRAVITY_CURRENT_CITY = ctx.city;
  const contract = getPremiumNicheContract(ctx.niche);
  process.env.GRAVITY_FORBIDDEN_TERMS = forbiddenTerms.join('|');
  process.env.GRAVITY_PREMIUM_CONTRACT = buildPremiumContractBrief(ctx.niche);
  process.env.GRAVITY_PREMIUM_SCORE_FLOOR = String(contract?.scoreFloor || 85);
  if (typeof (agentMemoryStore as any).beginMissionScope === 'function') {
    await (agentMemoryStore as any).beginMissionScope({ missionId: ctx.missionId, niche: ctx.niche, city: ctx.city, forbiddenTerms });
  }
  return { forbiddenTerms, premiumContractBrief: process.env.GRAVITY_PREMIUM_CONTRACT || '' };
}
