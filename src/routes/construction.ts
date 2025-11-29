import {Hono} from 'hono';
import {z} from 'zod';
import {ConstructionAgent} from '../agents/ConstructionAgent';
import {logger} from '../config/logger';
import {randomUUID} from 'crypto';
import {ChatRequestSchema, ToolExecutionRequestSchema} from '../utils/validators';

const constructionRouter = new Hono();
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
