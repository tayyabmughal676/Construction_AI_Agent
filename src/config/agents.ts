import { AgentRegistry } from '../agents/AgentRegistry';
import { ConstructionAgent } from '../agents/ConstructionAgent';
import { logger } from '../config/logger';

/**
 * Initialize all agents and register them with the AgentRegistry
 * This should be called during application startup
 */
export function initializeAgents(): void {
    const registry = AgentRegistry.getInstance();

    // Initialize Construction Agent
    const constructionAgent = new ConstructionAgent();
    registry.registerAgent('construction', constructionAgent);

    // TODO: Initialize Manufacturing Agent (Phase 3.1)
    // const manufacturingAgent = new ManufacturingAgent();
    // registry.registerAgent('manufacturing', manufacturingAgent);

    // TODO: Initialize HR Agent (Phase 3.2)
    // const hrAgent = new HRAgent();
    // registry.registerAgent('hr', hrAgent);

    logger.info({
        departments: registry.getDepartments(),
        totalAgents: registry.getDepartments().length
    }, 'All agents initialized');
}
