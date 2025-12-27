import type { BaseAgent } from './BaseAgent';
import { logger } from '../config/logger';

/**
 * Central registry for all agents
 * Manages agent lifecycle and provides lookup functionality
 */
export class AgentRegistry {
    private static instance: AgentRegistry;
    private agents: Map<string, BaseAgent> = new Map();

    private constructor() {
    }

    /**
     * Get singleton instance
     */
    static getInstance(): AgentRegistry {
        if (!AgentRegistry.instance) {
            AgentRegistry.instance = new AgentRegistry();
        }
        return AgentRegistry.instance;
    }

    /**
     * Register an agent with the registry
     */
    registerAgent(department: string, agent: BaseAgent): void {
        this.agents.set(department.toLowerCase(), agent);
        logger.info(`Registered agent for department: ${department}`);
    }

    /**
     * Get agent by department name
     */
    getAgent(department: string): BaseAgent | undefined {
        return this.agents.get(department.toLowerCase());
    }

    /**
     * Get all registered agents
     */
    getAllAgents(): Map<string, BaseAgent> {
        return this.agents;
    }

    /**
     * Get list of all department names
     */
    getDepartments(): string[] {
        return Array.from(this.agents.keys());
    }

    /**
     * Check if department exists
     */
    hasDepartment(department: string): boolean {
        return this.agents.has(department.toLowerCase());
    }

    /**
     * Get summary of all agents (name, department, description)
     */
    getAgentSummaries(): { department: string; name: string; description: string; actions: string[] }[] {
        return Array.from(this.agents.entries()).map(([department, agent]) => ({
            department,
            name: agent.name,
            description: agent.description,
            actions: agent.getSupportedActions(),
        }));
    }

    /**
     * Get all capabilities across all agents
     */
    getAllCapabilities(): Record<string, string> {
        const capabilities: Record<string, string> = {};

        this.agents.forEach((agent, department) => {
            capabilities[department] = agent.getCapabilities();
        });

        return capabilities;
    }
}
