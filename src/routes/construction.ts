import { Elysia } from 'elysia';
import { z } from 'zod';
import { ConstructionAgent } from '../agents/ConstructionAgent';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { ChatRequestSchema, ToolExecutionRequestSchema } from '../utils/validators';
import { AgentRegistry } from '../agents/AgentRegistry'; // Added import for AgentRegistry

const constructionRouter = new Elysia();

/**
 * GET /api/construction/projects
 * Returns active and pending construction projects.
 */
constructionRouter.get('/projects', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const agent = registry.getAgent('construction');

        if (!agent) {
            c.set.status = 500;
            return { error: 'Construction Agent not found' };
        }

        const result = await agent.executeTool('project_tracker', {
            action: 'list'
        });

        if (!result.success) {
            c.set.status = 400;
            return { error: result.error };
        }

        // Map to frontend format
        const projects = result.data.projects.map((p: any) => ({
            id: p.projectId,
            name: p.name,
            location: p.location || 'Site A',
            budget: `$${(p.budget / 1000000).toFixed(1)}M`,
            progress: p.progress || 0,
            status: p.status === 'active' ? 'On Track' : p.status === 'completed' ? 'Finished' : 'Planned'
        }));

        return { projects };
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/construction/projects');
        c.set.status = 500;
        return { error: 'Internal server error' };
    }
});

const agent = new ConstructionAgent();

// --- Endpoints ---

/**
 * Main chat endpoint for the Construction Agent.
 */
constructionRouter.post('/chat', async (c) => {
    try {
        const body = await c.request.json();
        const {
            message,
            sessionId,
            context
        } = ChatRequestSchema.parse(body);

        const response = await agent.processMessage(
            message,
            sessionId || randomUUID(),
            context
        );

        return response;
    } catch (error) {
        logger.error({
            error
        }, 'Error in construction chat endpoint');
        if (error instanceof z.ZodError) {
            c.set.status = 400;
            return {
                error: 'Validation failed',
                details: error.flatten()
            };
        }
        c.set.status = 500;
        return {
            error: 'An internal error occurred'
        };
    }
});

/**
 * Provides a detailed list of the agent's capabilities.
 */
constructionRouter.get('/capabilities', (c) => {
    return {
        department: agent.name,
        description: agent.description,
        tools: agent.getTools().map(tool => ({
            name: tool.name,
            description: tool.description,
        })),
    };
});

/**
 * Allows for direct execution of a specific tool by name.
 */
constructionRouter.post('/tools/:toolName', async (c) => {
    try {
        const toolName = c.params.toolName;
        const params = await c.request.json();

        const {
            params: validatedParams
        } = ToolExecutionRequestSchema.parse({
            toolName,
            params
        });

        const result = await agent.executeTool(toolName, validatedParams);

        if (!result.success) {
            c.set.status = 400;
            return result;
        }
        return result;
    } catch (error) {
        logger.error({
            error
        }, 'Error executing tool directly');
        if (error instanceof z.ZodError) {
            c.set.status = 400;
            return {
                error: 'Validation failed',
                details: error.flatten()
            };
        }
        c.set.status = 500;
        return {
            success: false,
            error: 'An internal error occurred'
        };
    }
});

export default constructionRouter;
