import type { AgentResponse, BaseTool, ToolResult, DepartmentDetection } from './types';
import { logger } from '../config/logger';

/**
 * Abstract base class for all agents. It provides the core functionality for
 * managing tools and processing messages.
 */
export abstract class BaseAgent {
    protected tools: Map<string, BaseTool> = new Map();
    public readonly name: string;
    public readonly description: string;

    protected constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }

    /**
     * Registers a tool with the agent, making it available for execution.
     * @param tool The tool instance to register.
     */
    registerTool(tool: BaseTool): void {
        if (this.tools.has(tool.name)) {
            logger.warn(`Tool "${tool.name}" is already registered for agent "${this.name}". Overwriting.`);
        }
        this.tools.set(tool.name, tool);
        logger.info(`Registered tool: "${tool.name}" for agent "${this.name}"`);
    }

    /**
     * Retrieves a list of all tools registered with the agent.
     * @returns An array of tool instances.
     */
    getTools(): BaseTool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Executes a registered tool by its name with the given parameters.
     * @param toolName The name of the tool to execute.
     * @param params The parameters to pass to the tool's execute method.
     * @returns A promise that resolves to the tool's result.
     */
    async executeTool(toolName: string, params: any): Promise<ToolResult> {
        const tool = this.tools.get(toolName);
        if (!tool) {
            logger.error(`Tool "${toolName}" not found for agent "${this.name}".`);
            return {
                success: false,
                error: `Tool "${toolName}" is not available.`
            };
        }

        logger.info({
            agent: this.name,
            toolName,
            params
        }, 'Executing tool');
        const result = await tool.execute(params);
        logger.info({
            toolName,
            result
        }, 'Tool execution completed');

        return result;
    }

    /**
     * Returns a summary of the agent's capabilities, including its description
     * and a list of its available tools.
     * @returns A string describing the agent's capabilities.
     */
    getCapabilities(): string {
        const toolDescriptions = this.getTools()
            .map(tool => `  - ${tool.name}: ${tool.description}`)
            .join('\n');

        return `${this.name} Agent: ${this.description}\n\nAvailable Tools:\n${toolDescriptions || '  (No tools registered)'}`;
    }

    /**
     * Returns a list of supported action identifiers for this agent.
     */
    abstract getSupportedActions(): string[];

    /**
     * The core logic of the agent. This method must be implemented by each
     * concrete agent class to handle incoming messages.
     *
     * @param message The user's input message.
     * @param sessionId A unique identifier for the conversation session.
     * @param context Optional additional data relevant to the conversation.
     * @param detection Optional result from the intent detection router.
     * @returns A promise that resolves to an agent response.
     */
    abstract processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>,
        detection?: DepartmentDetection
    ): Promise<AgentResponse>;
}
