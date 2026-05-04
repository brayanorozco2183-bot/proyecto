import { BaseAgent } from '../agents/base.js';

/**
 * Professional Registry to keep track of all active agents.
 * Ensures we can communicate and resolve agents by role.
 */
export class AgentRegistry {
    private agents: Map<string, BaseAgent> = new Map();

    /**
     * Register a new agent into the system.
     */
    register(agent: BaseAgent): void {
        const role = (agent as any).role;
        this.agents.set(role, agent);
        console.log(`[Registry] Registered Agent: ${role}`);
    }

    /**
     * Retrieve an agent by their specialized role.
     */
    getAgent(role: string): BaseAgent | undefined {
        return this.agents.get(role);
    }

    /**
     * Status check of all operational units.
     */
    getHealthStatus(): string[] {
        return Array.from(this.agents.keys()).map(role => `${role}: ONLINE`);
    }

    /**
     * Return all registered agents.
     */
    getAllAgents(): BaseAgent[] {
        return Array.from(this.agents.values());
    }
}

export const registry = new AgentRegistry();