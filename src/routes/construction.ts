import { Hono } from 'hono';
import { z } from 'zod';
import { ConstructionAgent } from '../agents/ConstructionAgent';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { ChatRequestSchema, ToolExecutionRequestSchema } from '../utils/validators';
import { AgentRegistry } from '../agents/AgentRegistry'; // Added import for AgentRegistry

const constructionRouter = new Hono();

/**
 * GET /api/construction/projects
 * Returns active and pending construction projects.
 */
constructionRouter.get('/projects', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const agent = registry.getAgent('construction');

        if (!agent) {
            return c.json({ error: 'Construction Agent not found' }, 500);
        }

        const result = await agent.executeTool('project_tracker', {
            action: 'list'
        });

        if (!result.success) {
            return c.json({ error: result.error }, 400);
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

        return c.json({ projects });
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/construction/projects');
        return c.json({ error: 'Internal server error' }, 500);
    }
});

const agent = new ConstructionAgent();

// --- Endpoints ---

/**
 * Main chat endpoint for the Construction Agent.
 */
constructionRouter.post('/chat', async (c) => {
    try {
        const body = await c.req.json();
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

        return c.json(response);
    } catch (error) {
        logger.error({
            error
        }, 'Error in construction chat endpoint');
        if (error instanceof z.ZodError) {
            return c.json({
                error: 'Validation failed',
                details: error.flatten()
            }, 400);
        }
        return c.json({
            error: 'An internal error occurred'
        }, 500);
    }
});

/**
 * Provides a detailed list of the agent's capabilities.
 */
constructionRouter.get('/capabilities', (c) => {
    return c.json({
        department: agent.name,
        description: agent.description,
        tools: agent.getTools().map(tool => ({
            name: tool.name,
            description: tool.description,
        })),
    });
});

/**
 * Allows for direct execution of a specific tool by name.
 */
constructionRouter.post('/tools/:toolName', async (c) => {
    try {
        const toolName = c.req.param('toolName');
        const params = await c.req.json();

        const {
            params: validatedParams
        } = ToolExecutionRequestSchema.parse({
            toolName,
            params
        });

        const result = await agent.executeTool(toolName, validatedParams);

        if (!result.success) {
            return c.json(result, 400);
        }
        return c.json(result);
    } catch (error) {
        logger.error({
            error
        }, 'Error executing tool directly');
        if (error instanceof z.ZodError) {
            return c.json({
                error: 'Validation failed',
                details: error.flatten()
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An internal error occurred'
        }, 500);
    }
});

export default constructionRouter;
