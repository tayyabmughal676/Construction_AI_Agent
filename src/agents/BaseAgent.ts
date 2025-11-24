import type { BaseTool, AgentMessage, AgentResponse } from './types';
import { logger } from '../config/logger';

export abstract class BaseAgent {
    protected tools: Map<string, BaseTool> = new Map();
    protected department: string;

    constructor(department: string) {
        this.department = department;
    }

    /**
     * Register a tool with the agent
     */
    registerTool(tool: BaseTool): void {
        this.tools.set(tool.name, tool);
        logger.info(`Registered tool: ${tool.name} for ${this.department} agent`);
    }

    /**
     * Get all available tools
     */
    getTools(): BaseTool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Execute a specific tool
     */
    async executeTool(toolName: string, params: any) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        logger.info({ toolName, params }, 'Executing tool');
        const result = await tool.execute(params);
        logger.info({ toolName, result }, 'Tool execution complete');

        return result;
    }

    /**
     * Process a user message and generate a response
     * This should be implemented by each specific agent
     */
    abstract processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>
    ): Promise<AgentResponse>;

    /**
     * Get agent capabilities description
     */
    getCapabilities(): string {
        const toolDescriptions = this.getTools()
            .map(tool => `- ${tool.name}: ${tool.description}`)
            .join('\n');

        return `${this.department} Agent Capabilities:\n${toolDescriptions}`;
    }
}
