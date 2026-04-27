import os from 'os';
import { vault } from '../tools/vault.js';

export type HardwareResourceTier = 'edge' | 'balanced' | 'workstation';

export interface HardwareProfile {
  platform: NodeJS.Platform;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalRamGb: number;
  freeRamGb: number;
  gpuVramGb: number;
  resourceTier: HardwareResourceTier;
  recommendedParallelLlmCalls: number;
}

function toRoundedGb(bytes: number): number {
  return Math.round((Number(bytes || 0) / 1024 / 1024 / 1024) * 10) / 10;
}

function parseNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function deriveResourceTier(totalRamGb: number, gpuVramGb: number): HardwareResourceTier {
  if (totalRamGb <= 16 || gpuVramGb <= 4) return 'edge';
  if (totalRamGb <= 32 || gpuVramGb <= 8) return 'balanced';
  return 'workstation';
}

function deriveParallelism(totalRamGb: number, gpuVramGb: number): number {
  if (totalRamGb <= 16 || gpuVramGb <= 4) return 1;
  if (totalRamGb <= 32 || gpuVramGb <= 8) return 2;
  return 3;
}

let cachedHardwareProfile: HardwareProfile | null = null;

export function getHardwareProfile(forceRefresh = false): HardwareProfile {
  if (cachedHardwareProfile && !forceRefresh) return cachedHardwareProfile;

  const totalRamGb = parseNumber(vault.TOTAL_RAM_GB_OVERRIDE, 0) || toRoundedGb(os.totalmem());
  const freeRamGb = toRoundedGb(os.freemem());
  const gpuVramGb = parseNumber(vault.GPU_VRAM_GB, 0);
  const cpuInfo = os.cpus?.() || [];
  const cpuModel = String(cpuInfo[0]?.model || 'unknown cpu').trim();
  const cpuCores = cpuInfo.length || 1;
  const resourceTier = deriveResourceTier(totalRamGb, gpuVramGb);
  const recommendedParallelLlmCalls = deriveParallelism(totalRamGb, gpuVramGb);

  cachedHardwareProfile = {
    platform: process.platform,
    arch: process.arch,
    cpuModel,
    cpuCores,
    totalRamGb,
    freeRamGb,
    gpuVramGb,
    resourceTier,
    recommendedParallelLlmCalls,
  };

  return cachedHardwareProfile;
}

export function formatHardwareProfile(profile = getHardwareProfile()): string {
  return [
    `platform=${profile.platform}`,
    `arch=${profile.arch}`,
    `cpu=${profile.cpuModel}`,
    `cores=${profile.cpuCores}`,
    `ram=${profile.totalRamGb}GB`,
    `free=${profile.freeRamGb}GB`,
    `gpu_vram=${profile.gpuVramGb}GB`,
    `tier=${profile.resourceTier}`,
    `parallel_llm=${profile.recommendedParallelLlmCalls}`,
  ].join(' | ');
}
