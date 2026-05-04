import fs from 'fs/promises';
import path from 'path';
import { vault } from '../tools/vault.js';

export interface AgentPromptBundle {
  skillMd: string;
  humanMd: string;
  skillPath: string;
  humanPath: string;
  exists: {
    skill: boolean;
    human: boolean;
  };
}

const cache = new Map<string, AgentPromptBundle>();

function resolvePromptRoot(): string {
  const configured = String(vault.AGENT_PROMPTS_DIR || '').trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), 'prompts', 'agents');
}

async function readFileIfExists(filePath: string): Promise<{ content: string; exists: boolean }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, exists: true };
  } catch {
    return { content: '', exists: false };
  }
}

function buildFallbackSkill(agentName: string): string {
  return [
    `# SKILL`,
    ``,
    `Agent: ${agentName}`,
    ``,
    `## Mission`,
    `Execute the assigned task with strict structural safety and production-ready outputs.`,
    ``,
    `## Non-negotiables`,
    `- Preserve data integrity.`,
    `- Prefer deterministic behavior when structure is at risk.`,
    `- Never invent business facts, locations, prices or certifications.`,
  ].join('\n');
}

function buildFallbackHuman(agentName: string): string {
  return [
    `# HUMAN`,
    ``,
    `Agent: ${agentName}`,
    ``,
    `## Business style`,
    `- Premium but clear.`,
    `- Spanish market / local SEO focus.`,
    `- Honest, technical, non-hype tone.`,
  ].join('\n');
}

export async function loadAgentPromptBundle(agentName: string): Promise<AgentPromptBundle> {
  if (cache.has(agentName)) return cache.get(agentName)!;

  const promptRoot = resolvePromptRoot();
  const skillPath = path.join(promptRoot, agentName, 'SKILL.md');
  const humanPath = path.join(promptRoot, agentName, 'HUMAN.md');

  const [skill, human] = await Promise.all([
    readFileIfExists(skillPath),
    readFileIfExists(humanPath),
  ]);

  const bundle: AgentPromptBundle = {
    skillMd: skill.content || buildFallbackSkill(agentName),
    humanMd: human.content || buildFallbackHuman(agentName),
    skillPath,
    humanPath,
    exists: {
      skill: skill.exists,
      human: human.exists,
    },
  };

  cache.set(agentName, bundle);
  return bundle;
}

export function formatAgentPromptBundle(bundle: AgentPromptBundle): string {
  return [
    '## AGENT SKILL CONTRACT',
    bundle.skillMd.trim(),
    '',
    '## HUMAN OPERATIONAL INSTRUCTIONS',
    bundle.humanMd.trim(),
  ].join('\n');
}
